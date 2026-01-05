
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
                resolvedArgs[argName] = this.resolveInput(argValuePath as string, context.inputs);
            }
            this.log('INFO', `Resolved Arguments: ${Object.keys(resolvedArgs).join(', ')}`);

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

    private resolveInput(pathString: string, inputs: any[]): any {
        if (!pathString) return undefined;
        const trimmed = pathString.trim();

        // Handle literal values (not starting with brackets/braces maybe? or just always treat as string if not {{}})
        // But for now assume {{Node.path}} for vars, else literal string.
        if (!trimmed.startsWith('{{') || !trimmed.endsWith('}}')) {
            // Attempt to parse if it looks like JSON? No, just string literal.
            return trimmed;
        }

        const variablePath = trimmed.replace(/^\{\{|\}\}$/g, '').trim();
        const parts = variablePath.split('.');
        const nodeName = parts.shift();

        let targetInput = inputs.find(i => i.nodeName === nodeName);

        // Fallback or specific logic (From SmartExtraction logic)
        // If nodeName matches nothing, maybe it's just a ref to the first input? 
        // Or if inputs has only 1 item and strict match fails.
        // But let's stick to strict match first.

        if (!targetInput) {
            // Try matching by id if nodeName is actually an ID? 
            // Usually inputs have nodeName.
            // If strictly not found, return undefined.
            this.log('WARN', `Input node '${nodeName}' not found in inputs.`);
            return undefined;
        }

        let val = targetInput.value;
        const dataPathParts = parts;

        // Traverse
        // Handle "output" prefix commonly used
        if (dataPathParts[0] === 'output') {
            dataPathParts.shift();
        }

        // Clean array accessors from "items[0]" to "items", "0"
        const cleanPath: string[] = [];
        for (const p of dataPathParts) {
            if (p.includes('[')) {
                const subParts = p.split(/\[|\]/).filter(Boolean);
                cleanPath.push(...subParts);
            } else {
                cleanPath.push(p);
            }
        }

        for (const key of cleanPath) {
            if (val && typeof val === 'object') {
                if (Array.isArray(val) && !isNaN(Number(key))) {
                    val = val[Number(key)];
                } else if (key in val) {
                    val = val[key];
                } else {
                    return undefined;
                }
            } else {
                return undefined;
            }
        }

        return val;
    }

    private async executeJavascript(code: string, args: Record<string, any>, outputVar: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                const sandbox = {
                    ...args,
                    console: {
                        log: (...msgs: any[]) => this.log('INFO', msgs.map(m => JSON.stringify(m)).join(' ')),
                        error: (...msgs: any[]) => this.log('ERROR', msgs.map(m => JSON.stringify(m)).join(' ')),
                        warn: (...msgs: any[]) => this.log('WARN', msgs.map(m => JSON.stringify(m)).join(' '))
                    },
                    result: undefined
                };

                // Wrap code to ensure it runs contextually
                // User code should set 'result' variable or return it?
                // The prompt says "Return the result variable defined above", implies setting a var or returning.
                // Let's assume the user writes code that sets the specific outputVar OR just returns valid JS.
                // We'll wrap it in an async function.

                vm.createContext(sandbox);

                // We do 'result = await (async function() { ...user code... return result; })();'
                // But user might not return. They might just set 'result = 5'.
                // If they set 'result' (or whatever outputVar is named), we capture it.

                // We will alias the outputVar to 'result' or just look for outputVar in sandbox after run.

                const scriptCode = `
                    (async () => {
                        ${code}
                        
                        // Check if main exists and call it
                        if (typeof main === 'function') {
                            try {
                                return await main(${Object.keys(args).join(', ')});
                            } catch (e) {
                                throw e;
                            }
                        }
                        
                        // Fallback to variable check
                        if (typeof ${outputVar} !== 'undefined') {
                            return ${outputVar};
                        }
                        
                        return undefined;
                    })();
                `;

                const script = new vm.Script(scriptCode);
                const executionPromise = script.runInContext(sandbox);

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

    private async executePython(code: string, args: Record<string, any>, outputVar: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const tempDir = os.tmpdir();
            const scriptPath = path.join(tempDir, `script_${Date.now()}.py`);

            // Serialize args to JSON to pass safely
            const argsJson = JSON.stringify(args);

            // Helper python code to load args and print result
            const pythonWrapper = `
import json
import sys

# Load args
args = json.loads('''${argsJson}''')
${Object.keys(args).map(k => `${k} = args.get('${k}')`).join('\n')}

# User Code Start
${code}
# User Code End

# Print result as JSON
result_val = None
if 'main' in locals() and callable(locals()['main']):
    try:
        # Call main with arguments
        # We need to pass args. If main expects args by name, we iterate.
        # Simplest: pass **args (which are dict)
        import inspect
        has_kwargs = False
        sig = inspect.signature(locals()['main'])
        
        # Simple call with spread dictionary of args
        result_val = locals()['main'](**args)
        
    except Exception as e:
        print(f"Error calling main: {e}", file=sys.stderr)
        exit(1)
elif '${outputVar}' in locals():
    result_val = locals()['${outputVar}']

if result_val is not None:
    try:
        print(json.dumps(result_val))
    except:
        print(str(result_val))
else:
    print("null")
            `;

            fs.writeFileSync(scriptPath, pythonWrapper);

            const process = spawn('python', [scriptPath]);

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
                this.log('ERROR', `[Python Legacy]: ${data.toString().trim()}`);
            });

            process.on('close', (code) => {
                fs.unlinkSync(scriptPath); // Clean up
                if (code !== 0) {
                    reject(new Error(`Python script exited with code ${code}. Error: ${stderr}`));
                } else {
                    try {
                        const lines = stdout.trim().split('\n');
                        const lastLine = lines[lines.length - 1]; // Result should be last line
                        // Filter out logs (hacky) - ideally script should only print result on specific channel or everything else to stderr
                        // For now assume last line is JSON.
                        if (lastLine) {
                            try {
                                resolve(JSON.parse(lastLine));
                            } catch { // If not JSON, return string
                                resolve(lastLine);
                            }
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        resolve(stdout.trim());
                    }
                }
            });
        });
    }
}
