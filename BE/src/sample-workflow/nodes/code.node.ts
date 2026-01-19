
import { Injectable, Logger } from '@nestjs/common';
import { BaseWorkflowNode, WorkflowNodeContext } from './workflow-node.interface';
import { NodeExecutionResult } from '../interfaces/execution-context.interface';
import * as vm from 'vm';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class CodeNodeStrategy extends BaseWorkflowNode {
    private readonly logger = new Logger(CodeNodeStrategy.name);

    constructor() {
        super();
    }

    execute(inputs: any[], data?: any): any {
        throw new Error('Method not implemented. Use executeWithContext instead.');
    }

    async executeWithContext(context: WorkflowNodeContext): Promise<NodeExecutionResult> {
        this.context = context;
        this.logs = [];
        const startTime = Date.now();

        try {
            this.log('INFO', `Starting Code Execution on node: ${context.nodeName}`);

            const config = context.data?.config || {};
            const language = config.language || 'javascript';
            const code = config.code || '';
            const argsConfig = config.args || {};
            const outputVar = config.outputVar || 'result';

            if (!code.trim()) {
                throw new Error('No code provided for execution.');
            }

            // 1. Resolve Arguments
            const resolvedArgs: Record<string, any> = {};
            for (const [argName, argValuePath] of Object.entries(argsConfig)) {
                // Use the standard resolveVariables from BaseWorkflowNode for consistency
                resolvedArgs[argName] = this.resolveVariables(argValuePath as string);
            }
            this.log('INFO', `Resolved Arguments: ${Object.keys(resolvedArgs).join(', ')}`);
            this.log('DEBUG', `Resolved Values: ${JSON.stringify(resolvedArgs)}`);


            let result: any;

            if (language === 'javascript') {
                result = await this.executeJavascript(code, resolvedArgs, outputVar);
            } else if (language === 'python3' || language === 'python') {
                result = await this.executePython(code, resolvedArgs, outputVar);
            } else {
                throw new Error(`Unsupported language: ${language}`);
            }

            this.log('INFO', `Execution Success. Result type: ${typeof result}`);

            return {
                success: true,
                output: {
                    [outputVar]: result,
                    status: 'SUCCESS'
                },
                logs: [...this.logs],
                metadata: {
                    executionTime: Date.now() - startTime,
                }
            };

        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log('ERROR', `Code Execution Failed: ${errorMessage}`);

            return {
                success: false,
                output: null,
                error: errorMessage,
                logs: [...this.logs],
            };
        }
    }


    private async executeJavascript(code: string, args: Record<string, any>, outputVar: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                // Filter environment variables to avoid leaking sensitive server info, 
                // but allow AI keys or common config if needed.
                const env = {
                    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
                    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
                };

                const sandbox = {
                    ...args,
                    env,
                    process: { env },
                    console: {
                        log: (...msgs: any[]) => this.log('INFO', msgs.map(m => typeof m === 'object' ? JSON.stringify(m, null, 2) : String(m)).join(' ')),
                        error: (...msgs: any[]) => this.log('ERROR', msgs.map(m => typeof m === 'object' ? JSON.stringify(m, null, 2) : String(m)).join(' ')),
                        warn: (...msgs: any[]) => this.log('WARN', msgs.map(m => typeof m === 'object' ? JSON.stringify(m, null, 2) : String(m)).join(' '))
                    },
                    result: undefined
                };

                vm.createContext(sandbox);

                const scriptCode = `
                    (async () => {
                        ${code}
                        
                        // Check if main exists and call it
                        if (typeof main === 'function') {
                            return await main(${Object.keys(args).join(', ')});
                        }
                        
                        // Fallback to explicit output variable check
                        if (typeof ${outputVar} !== 'undefined') {
                            return ${outputVar};
                        }
                        
                        return undefined;
                    })();
                `;

                const script = new vm.Script(scriptCode);
                const executionPromise = script.runInContext(sandbox, { timeout: 30000 }); // 30s timeout

                if (executionPromise instanceof Promise) {
                    executionPromise.then(resolve).catch(reject);
                } else {
                    resolve(executionPromise);
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    private async getPythonCommand(): Promise<string> {
        return new Promise((resolve) => {
            const checkPython = (cmd: string) => {
                return new Promise<boolean>((res) => {
                    const proc = spawn(cmd, ['--version']);
                    proc.on('error', () => res(false));
                    proc.on('close', (code) => res(code === 0));
                });
            };

            (async () => {
                if (await checkPython('python3')) resolve('python3');
                else if (await checkPython('python')) resolve('python');
                else resolve('python'); // Fallback to python and let it fail if missing
            })();
        });
    }

    private async executePython(code: string, args: Record<string, any>, outputVar: string): Promise<any> {
        const pythonCmd = await this.getPythonCommand();

        return new Promise((resolve, reject) => {
            const tempDir = os.tmpdir();
            const scriptPath = path.join(tempDir, `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.py`);

            // Serialize args to JSON to pass safely
            const argsJson = JSON.stringify(args).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            const pythonWrapper = `
import json
import sys
import os

# Filtered environment variables
os.environ['GEMINI_API_KEY'] = "${process.env.GEMINI_API_KEY || ''}"

# Load args
try:
    args = json.loads('${argsJson}')
except Exception as e:
    print(f"Error loading args: {e}", file=sys.stderr)
    args = {}

# Set local variables for each arg
for k, v in args.items():
    locals()[k] = v

# User Code Start
try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(f"User Code Error: {e}", file=sys.stderr)
    sys.exit(1)
# User Code End

# Capture Result
result_val = None
if 'main' in locals() and callable(locals()['main']):
    try:
        import inspect
        sig = inspect.signature(locals()['main'])
        # Try to call with keyword args if possible, or just positional if they match
        result_val = locals()['main'](**args)
    except Exception as e:
        print(f"Error calling main(): {e}", file=sys.stderr)
        sys.exit(1)
elif '${outputVar}' in locals():
    result_val = locals()['${outputVar}']

# Final output must be JSON on a marked line
print("---PYTHON_RESULT_START---")
try:
    print(json.dumps(result_val))
except:
    print(json.dumps(str(result_val)))
print("---PYTHON_RESULT_END---")
            `;

            fs.writeFileSync(scriptPath, pythonWrapper);

            const pyProcess = spawn(pythonCmd, [scriptPath]);

            let stdout = '';
            let stderr = '';

            pyProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                // Real-time logging for anything before the result markers
                const currentOutput = data.toString();
                if (!currentOutput.includes('---PYTHON_RESULT_START---')) {
                    this.log('INFO', `[Python]: ${currentOutput.trim()}`);
                }
            });

            pyProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                this.log('ERROR', `[Python Error]: ${data.toString().trim()}`);
            });

            pyProcess.on('close', (code) => {
                if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);

                if (code !== 0) {
                    reject(new Error(`Python script exited with code ${code}. ${stderr}`));
                } else {
                    try {
                        const resultMatch = stdout.match(/---PYTHON_RESULT_START---([\s\S]*?)---PYTHON_RESULT_END---/);
                        if (resultMatch && resultMatch[1]) {
                            resolve(JSON.parse(resultMatch[1].trim()));
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        this.log('ERROR', `Failed to parse Python result: ${e.message}`);
                        resolve(stdout.trim());
                    }
                }
            });
        });
    }
}

