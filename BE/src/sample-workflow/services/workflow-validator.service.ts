import { Injectable, BadRequestException } from '@nestjs/common';
import { NodeRegistryService } from './node-registry.service';
import { SampleNodeType } from '../enums/node-type.enum';

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    code: string;
    message: string;
    nodeId?: string;
    edgeId?: string;
}

export interface ValidationWarning {
    code: string;
    message: string;
    nodeId?: string;
}

// Generic interface for workflow validation - works with both DTOs and Documents
export interface ValidatableWorkflow {
    name?: string;
    nodes?: ValidatableNode[];
    edges?: ValidatableEdge[];
}

export interface ValidatableNode {
    id: string;
    nodeName: string;
    type: string;
    data?: {
        value?: number;
        config?: Record<string, any>;
    };
}

export interface ValidatableEdge {
    id: string;
    source: string;
    target: string;
}

@Injectable()
export class WorkflowValidatorService {
    constructor(private nodeRegistry: NodeRegistryService) { }

    validate(workflow: ValidatableWorkflow): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Basic validation
        if (!workflow.name || workflow.name.trim() === '') {
            errors.push({
                code: 'MISSING_NAME',
                message: 'Workflow name is required',
            });
        }

        if (!workflow.nodes || workflow.nodes.length === 0) {
            errors.push({
                code: 'NO_NODES',
                message: 'Workflow must have at least one node',
            });
            return { valid: false, errors, warnings };
        }

        // Validate nodes
        const nodeIds = new Set<string>();
        for (const node of workflow.nodes) {
            // Check for duplicate node IDs
            if (nodeIds.has(node.id)) {
                errors.push({
                    code: 'DUPLICATE_NODE_ID',
                    message: `Duplicate node ID: ${node.id}`,
                    nodeId: node.id,
                });
            }
            nodeIds.add(node.id);

            // Check node type
            if (!this.nodeRegistry.hasNode(node.type)) {
                errors.push({
                    code: 'UNKNOWN_NODE_TYPE',
                    message: `Unknown node type: ${node.type}`,
                    nodeId: node.id,
                });
            }

            // Validate node name
            if (!node.nodeName || node.nodeName.trim() === '') {
                errors.push({
                    code: 'MISSING_NODE_NAME',
                    message: `Node ${node.id} is missing a name`,
                    nodeId: node.id,
                });
            }

            // Validate input nodes have values - Removed Legacy Input Check
        }

        // Validate edges
        const edges = workflow.edges || [];
        const edgeIds = new Set<string>();

        for (const edge of edges) {
            // Check for duplicate edge IDs
            if (edgeIds.has(edge.id)) {
                errors.push({
                    code: 'DUPLICATE_EDGE_ID',
                    message: `Duplicate edge ID: ${edge.id}`,
                    edgeId: edge.id,
                });
            }
            edgeIds.add(edge.id);

            // Check source node exists
            if (!nodeIds.has(edge.source)) {
                errors.push({
                    code: 'INVALID_EDGE_SOURCE',
                    message: `Edge ${edge.id} has invalid source node: ${edge.source}`,
                    edgeId: edge.id,
                });
            }

            // Check target node exists
            if (!nodeIds.has(edge.target)) {
                errors.push({
                    code: 'INVALID_EDGE_TARGET',
                    message: `Edge ${edge.id} has invalid target node: ${edge.target}`,
                    edgeId: edge.id,
                });
            }

            // Check for self-loops
            if (edge.source === edge.target) {
                errors.push({
                    code: 'SELF_LOOP',
                    message: `Edge ${edge.id} creates a self-loop on node ${edge.source}`,
                    edgeId: edge.id,
                });
            }
        }

        // Check for circular dependencies
        const circularCheck = this.detectCircularDependencies(workflow.nodes, edges);
        if (circularCheck.hasCircular) {
            errors.push({
                code: 'CIRCULAR_DEPENDENCY',
                message: `Circular dependency detected: ${circularCheck.cycle?.join(' -> ')}`,
            });
        }

        // Check for orphaned nodes
        for (const node of workflow.nodes) {


            const hasIncomingEdge = edges.some(e => e.target === node.id);
            if (!hasIncomingEdge) {
                // potential warning
            }
        }

        // Check for disconnected subgraphs
        const connectedComponents = this.findConnectedComponents(workflow.nodes, edges);
        if (connectedComponents > 1) {
            warnings.push({
                code: 'DISCONNECTED_GRAPH',
                message: `Workflow has ${connectedComponents} disconnected components`,
            });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }

    validateAndThrow(workflow: ValidatableWorkflow): void {
        const result = this.validate(workflow);
        if (!result.valid) {
            throw new BadRequestException({
                message: 'Workflow validation failed',
                errors: result.errors,
                warnings: result.warnings,
            });
        }
    }

    private detectCircularDependencies(
        nodes: ValidatableNode[],
        edges: ValidatableEdge[],
    ): { hasCircular: boolean; cycle?: string[] } {
        const adjacencyList = new Map<string, string[]>();

        // Build adjacency list
        for (const node of nodes) {
            adjacencyList.set(node.id, []);
        }
        for (const edge of edges) {
            const targets = adjacencyList.get(edge.source) || [];
            targets.push(edge.target);
            adjacencyList.set(edge.source, targets);
        }

        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const path: string[] = [];

        const dfs = (nodeId: string): string[] | null => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const neighbors = adjacencyList.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const cycle = dfs(neighbor);
                    if (cycle) return cycle;
                } else if (recursionStack.has(neighbor)) {
                    // Found cycle
                    const cycleStart = path.indexOf(neighbor);
                    return [...path.slice(cycleStart), neighbor];
                }
            }

            path.pop();
            recursionStack.delete(nodeId);
            return null;
        };

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                const cycle = dfs(node.id);
                if (cycle) {
                    return { hasCircular: true, cycle };
                }
            }
        }

        return { hasCircular: false };
    }

    private findConnectedComponents(nodes: ValidatableNode[], edges: ValidatableEdge[]): number {
        if (nodes.length === 0) return 0;

        const adjacencyList = new Map<string, Set<string>>();

        // Build undirected adjacency list
        for (const node of nodes) {
            adjacencyList.set(node.id, new Set());
        }
        for (const edge of edges) {
            adjacencyList.get(edge.source)?.add(edge.target);
            adjacencyList.get(edge.target)?.add(edge.source);
        }

        const visited = new Set<string>();
        let components = 0;

        const bfs = (startId: string) => {
            const queue = [startId];
            visited.add(startId);

            while (queue.length > 0) {
                const current = queue.shift()!;
                const neighbors = adjacencyList.get(current) || new Set();

                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push(neighbor);
                    }
                }
            }
        };

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                bfs(node.id);
                components++;
            }
        }

        return components;
    }
}
