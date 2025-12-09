import { create } from 'zustand';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import type {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from '@xyflow/react';

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
    selectedNode: Node | null;

    // Actions
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    setSelectedNode: (node: Node | null) => void;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    addNode: (node: Node) => void;
    updateNodeData: (id: string, data: any) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNode: null,

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSelectedNode: (selectedNode) => set({ selectedNode }),

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },

    addNode: (node: Node) => {
        set({ nodes: [...get().nodes, node] });
    },

    updateNodeData: (id: string, data: any) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === id) {
                    // If updating data, perform a deeply merged or shallow merge as needed
                    // For now, simpler shallow merge of config/inputs
                    return { ...node, data: { ...node.data, ...data } };
                }
                return node;
            }),
        });
    },
}));
