import { Injectable } from '@nestjs/common';
import { SampleNodeType } from '../enums/node-type.enum';
import { BaseWorkflowNode } from '../nodes/workflow-node.interface';
import { AddNode } from '../nodes/add.node';
import { SubtractNode } from '../nodes/subtract.node';
import { MultiplyNode } from '../nodes/multiply.node';
import { DivideNode } from '../nodes/divide.node';
import { InputNode } from '../nodes/input.node';

export interface NodeDefinition {
    type: string;
    name: string;
    description: string;
    category: string;
    inputs: number;
    outputs: number;
    configSchema?: Record<string, any>;
}

@Injectable()
export class NodeRegistryService {
    private nodeInstances: Map<string, BaseWorkflowNode> = new Map();
    private nodeDefinitions: Map<string, NodeDefinition> = new Map();

    constructor() {
        this.registerDefaultNodes();
    }

    private registerDefaultNodes(): void {
        // Register node instances
        this.nodeInstances.set(SampleNodeType.ADD, new AddNode());
        this.nodeInstances.set(SampleNodeType.SUBTRACT, new SubtractNode());
        this.nodeInstances.set(SampleNodeType.MULTIPLY, new MultiplyNode());
        this.nodeInstances.set(SampleNodeType.DIVIDE, new DivideNode());
        this.nodeInstances.set(SampleNodeType.INPUT, new InputNode());

        // Register node definitions
        this.nodeDefinitions.set(SampleNodeType.INPUT, {
            type: SampleNodeType.INPUT,
            name: 'Input',
            description: 'Provides a numeric input value',
            category: 'Input/Output',
            inputs: 0,
            outputs: 1,
            configSchema: {
                value: { type: 'number', required: true, description: 'The input value' }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.ADD, {
            type: SampleNodeType.ADD,
            name: 'Add',
            description: 'Adds all input values together',
            category: 'Math',
            inputs: -1, // -1 means variable inputs
            outputs: 1,
        });

        this.nodeDefinitions.set(SampleNodeType.SUBTRACT, {
            type: SampleNodeType.SUBTRACT,
            name: 'Subtract',
            description: 'Subtracts second input from first input',
            category: 'Math',
            inputs: 2,
            outputs: 1,
        });

        this.nodeDefinitions.set(SampleNodeType.MULTIPLY, {
            type: SampleNodeType.MULTIPLY,
            name: 'Multiply',
            description: 'Multiplies all input values together',
            category: 'Math',
            inputs: -1,
            outputs: 1,
        });

        this.nodeDefinitions.set(SampleNodeType.DIVIDE, {
            type: SampleNodeType.DIVIDE,
            name: 'Divide',
            description: 'Divides first input by second input',
            category: 'Math',
            inputs: 2,
            outputs: 1,
        });
    }

    getNode(type: string): BaseWorkflowNode | undefined {
        return this.nodeInstances.get(type);
    }

    getNodeDefinition(type: string): NodeDefinition | undefined {
        return this.nodeDefinitions.get(type);
    }

    getAllNodeDefinitions(): NodeDefinition[] {
        return Array.from(this.nodeDefinitions.values());
    }

    getNodesByCategory(): Record<string, NodeDefinition[]> {
        const categorized: Record<string, NodeDefinition[]> = {};

        for (const def of this.nodeDefinitions.values()) {
            if (!categorized[def.category]) {
                categorized[def.category] = [];
            }
            categorized[def.category].push(def);
        }

        return categorized;
    }

    hasNode(type: string): boolean {
        return this.nodeInstances.has(type);
    }
}
