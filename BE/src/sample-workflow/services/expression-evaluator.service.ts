import { Injectable } from '@nestjs/common';

/**
 * Expression Evaluator Service
 *
 * Evaluates n8n-style expressions for dynamic node input/output referencing.
 *
 * SUPPORTED EXPRESSION SYNTAX:
 *
 * Node References:
 * - {{NodeName.output}} - Get the entire output of a node
 * - {{NodeName.output.value}} - Get specific property from output
 * - {{NodeName.output.data.users}} - Deep nested property access
 * - {{NodeName.output.items[0]}} - Array index access
 * - {{NodeName.output.users[0].name}} - Combined nested and array access
 * - {{NodeName.input.fieldName}} - Get specific input field value
 * - {{NodeName.input.sources[0].value}} - Get first source input value
 *
 * Built-in Variables:
 * - {{$input}} - Current node's aggregated input
 * - {{$input.sources}} - Array of input sources
 * - {{$input.rawValues}} - Array of raw input values
 * - {{$input.resolved.fieldName}} - Resolved input field
 * - {{$output}} - Current node's output (if available)
 * - {{$output.value}} - Current node's output value
 * - {{$vars}} - Workflow variables
 * - {{$vars.apiKey}} - Specific workflow variable
 * - {{$json}} - All previous node outputs as JSON object
 * - {{$json.NodeName}} - Specific node's output from $json
 * - {{$now}} - Current timestamp as Date
 * - {{$timestamp}} - Current timestamp as milliseconds
 * - {{$executionId}} - Current execution ID
 * - {{$workflowId}} - Current workflow ID
 * - {{$nodeName}} - Current node name
 * - {{$nodeId}} - Current node ID
 * - {{$trigger}} - Trigger data (if workflow was triggered)
 * - {{$trigger.property}} - Specific trigger data property
 * - {{$env.VARIABLE}} - Environment variable (if enabled)
 *
 * String Interpolation:
 * - "Hello {{NodeName.output.name}}!" - Expressions within strings
 * - "{{Config.output.baseUrl}}/api/{{User.output.id}}" - Multiple expressions
 *
 * Complex Data Types Supported:
 * - Strings, Numbers, Booleans
 * - Arrays: {{NodeName.output.items}}, {{NodeName.output[0]}}
 * - Objects: {{NodeName.output.data}}, {{NodeName.output.user.profile}}
 * - Nested structures: {{NodeName.output.response.data.users[0].addresses[0].city}}
 */

/**
 * Node data structure for expression context
 * Stores input and output data for each node during execution
 */
export interface NodeData {
    input?: {
        sources: Array<{
            nodeId: string;
            nodeName: string;
            value: any;
            type?: string;
        }>;
        rawValues: any[];
        resolved?: Record<string, any>;
        expressions?: Record<string, string>;
    };
    output?: {
        value: any;
        type: string;
        timestamp: Date;
        originalValue?: any;
        schema?: Record<string, any>;
    };
}

/**
 * Context provided for expression evaluation
 */
export interface ExpressionContext {
    executionId: string;
    workflowId: string;
    currentNodeId: string;
    currentNodeName: string;
    nodeDataMap: Map<string, NodeData>; // nodeId -> NodeData
    nodeNameMap: Map<string, string>; // nodeName -> nodeId
    triggerData?: any;
    variables?: Record<string, any>; // Workflow-level variables
    env?: Record<string, string>; // Environment variables (if enabled)
}

@Injectable()
export class ExpressionEvaluatorService {
    // Pattern to match expressions like {{NodeName.output.value}}
    private readonly expressionPattern = /\{\{([^}]+)\}\}/g;

    /**
     * Evaluate all expressions in a value
     */
    evaluate(value: any, context: ExpressionContext): any {
        if (typeof value === 'string') {
            return this.evaluateString(value, context);
        }

        if (Array.isArray(value)) {
            return value.map(item => this.evaluate(item, context));
        }

        if (typeof value === 'object' && value !== null) {
            const result: Record<string, any> = {};
            for (const key of Object.keys(value)) {
                result[key] = this.evaluate(value[key], context);
            }
            return result;
        }

        return value;
    }

    /**
     * Evaluate expressions in a string
     */
    private evaluateString(str: string, context: ExpressionContext): any {
        // Check if the entire string is a single expression
        const fullMatch = str.match(/^\{\{([^}]+)\}\}$/);
        if (fullMatch) {
            // Return the actual value (not stringified)
            return this.resolveExpression(fullMatch[1].trim(), context);
        }

        // Replace multiple expressions in the string
        return str.replace(this.expressionPattern, (match, expression) => {
            const result = this.resolveExpression(expression.trim(), context);
            return this.stringify(result);
        });
    }

    /**
     * Resolve a single expression
     */
    private resolveExpression(expression: string, context: ExpressionContext): any {
        // Handle built-in variables
        if (expression.startsWith('$')) {
            return this.resolveBuiltIn(expression, context);
        }

        // Parse the expression: NodeName.output.property or NodeName.input.property
        const parts = this.parseExpression(expression);

        if (parts.length === 0) {
            return undefined;
        }

        const nodeName = parts[0];
        const nodeId = context.nodeNameMap.get(nodeName);

        if (!nodeId) {
            // Node not found, return undefined
            return undefined;
        }

        const nodeData = context.nodeDataMap.get(nodeId);
        if (!nodeData) {
            return undefined;
        }

        // Navigate to the requested property
        return this.getNestedValue(nodeData, parts.slice(1));
    }

    /**
     * Resolve built-in variables
     */
    private resolveBuiltIn(expression: string, context: ExpressionContext): any {
        const parts = this.parseExpression(expression);
        const varName = parts[0];

        switch (varName) {
            case '$input': {
                // Get current node's input
                const currentNodeData = context.nodeDataMap.get(context.currentNodeId);
                if (parts.length === 1) {
                    return currentNodeData?.input;
                }
                return this.getNestedValue(currentNodeData?.input, parts.slice(1));
            }

            case '$output': {
                // Get current node's output (if available)
                const currentNodeData = context.nodeDataMap.get(context.currentNodeId);
                if (parts.length === 1) {
                    return currentNodeData?.output?.value;
                }
                return this.getNestedValue(currentNodeData?.output, parts.slice(1));
            }

            case '$now':
                return new Date();

            case '$timestamp':
                return Date.now();

            case '$executionId':
                return context.executionId;

            case '$workflowId':
                return context.workflowId;

            case '$nodeName':
                return context.currentNodeName;

            case '$nodeId':
                return context.currentNodeId;

            case '$trigger':
                if (parts.length === 1) {
                    return context.triggerData;
                }
                return this.getNestedValue(context.triggerData, parts.slice(1));

            case '$json': {
                // Return all node outputs as JSON
                const allOutputs: Record<string, any> = {};
                context.nodeDataMap.forEach((data, nodeId) => {
                    const nodeName = this.findNodeNameById(nodeId, context.nodeNameMap);
                    if (nodeName && data.output) {
                        allOutputs[nodeName] = data.output.value;
                    }
                });
                if (parts.length === 1) {
                    return allOutputs;
                }
                // Support {{$json.NodeName}} or {{$json.NodeName.property}}
                return this.getNestedValue(allOutputs, parts.slice(1));
            }

            case '$vars': {
                // Workflow-level variables
                if (parts.length === 1) {
                    return context.variables;
                }
                return this.getNestedValue(context.variables, parts.slice(1));
            }

            case '$env': {
                // Environment variables (if enabled)
                if (parts.length === 1) {
                    return context.env;
                }
                return this.getNestedValue(context.env, parts.slice(1));
            }

            case '$item': {
                // For array processing - get current item (useful in loops/iterations)
                // This would need to be set in context when processing arrays
                const currentNodeData = context.nodeDataMap.get(context.currentNodeId);
                if (parts.length === 1) {
                    // Return first raw value as current item
                    return currentNodeData?.input?.rawValues?.[0];
                }
                return this.getNestedValue(currentNodeData?.input?.rawValues?.[0], parts.slice(1));
            }

            case '$items': {
                // Get all items from input (useful for batch processing)
                const currentNodeData = context.nodeDataMap.get(context.currentNodeId);
                if (parts.length === 1) {
                    return currentNodeData?.input?.rawValues;
                }
                return this.getNestedValue(currentNodeData?.input?.rawValues, parts.slice(1));
            }

            case '$first': {
                // Shortcut to get first input value
                const currentNodeData = context.nodeDataMap.get(context.currentNodeId);
                const firstValue = currentNodeData?.input?.rawValues?.[0];
                if (parts.length === 1) {
                    return firstValue;
                }
                return this.getNestedValue(firstValue, parts.slice(1));
            }

            case '$last': {
                // Shortcut to get last input value
                const currentNodeData = context.nodeDataMap.get(context.currentNodeId);
                const rawValues = currentNodeData?.input?.rawValues || [];
                const lastValue = rawValues[rawValues.length - 1];
                if (parts.length === 1) {
                    return lastValue;
                }
                return this.getNestedValue(lastValue, parts.slice(1));
            }

            default:
                return undefined;
        }
    }

    /**
     * Parse expression into parts, handling dot notation and array access
     */
    private parseExpression(expression: string): string[] {
        const parts: string[] = [];
        let current = '';
        let inBracket = false;

        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];

            if (char === '[') {
                if (current) {
                    parts.push(current);
                    current = '';
                }
                inBracket = true;
            } else if (char === ']') {
                if (current) {
                    parts.push(current);
                    current = '';
                }
                inBracket = false;
            } else if (char === '.' && !inBracket) {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current) {
            parts.push(current);
        }

        return parts;
    }

    /**
     * Get nested value from object using path parts
     */
    private getNestedValue(obj: any, parts: string[]): any {
        let current = obj;

        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }

            // Handle array index
            if (/^\d+$/.test(part)) {
                current = current[parseInt(part, 10)];
            } else {
                current = current[part];
            }
        }

        return current;
    }

    /**
     * Find node name by ID
     */
    private findNodeNameById(nodeId: string, nodeNameMap: Map<string, string>): string | undefined {
        for (const [name, id] of nodeNameMap.entries()) {
            if (id === nodeId) {
                return name;
            }
        }
        return undefined;
    }

    /**
     * Stringify value for string interpolation
     */
    private stringify(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }

    /**
     * Check if a string contains expressions
     */
    hasExpressions(value: any): boolean {
        if (typeof value === 'string') {
            return this.expressionPattern.test(value);
        }
        if (Array.isArray(value)) {
            return value.some(item => this.hasExpressions(item));
        }
        if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(v => this.hasExpressions(v));
        }
        return false;
    }

    /**
     * Extract all node references from expressions
     */
    extractNodeReferences(value: any): string[] {
        const references = new Set<string>();

        const extract = (v: any) => {
            if (typeof v === 'string') {
                const matches = v.matchAll(this.expressionPattern);
                for (const match of matches) {
                    const expression = match[1].trim();
                    if (!expression.startsWith('$')) {
                        const parts = this.parseExpression(expression);
                        if (parts.length > 0) {
                            references.add(parts[0]);
                        }
                    }
                }
            } else if (Array.isArray(v)) {
                v.forEach(extract);
            } else if (typeof v === 'object' && v !== null) {
                Object.values(v).forEach(extract);
            }
        };

        extract(value);
        return Array.from(references);
    }
}
