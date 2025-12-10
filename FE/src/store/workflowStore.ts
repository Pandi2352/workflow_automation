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
import { axiosInstance } from '../api/axiosConfig';
import { API_ENDPOINTS } from '../api/endpoints';

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

    // UI State
    activeTab: 'editor' | 'executions';
    setActiveTab: (tab: 'editor' | 'executions') => void;

    // Workflow Metadata
    createWorkflow: (navigate: Function) => Promise<void>; // Added
    workflowName: string;
    workflowDescription: string;
    isWorkflowActive: boolean;
    setWorkflowMetadata: (metadata: Partial<{ workflowName: string; workflowDescription: string; isWorkflowActive: boolean }>) => void;

    nodeDefinitions: any[];
    fetchNodeDefinitions: () => Promise<void>;

    credentials: any[];
    fetchCredentials: (provider?: string) => Promise<void>;
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
        const { nodes, selectedNode } = get();
        const updatedNodes = nodes.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, ...data } };
            }
            return node;
        });

        // Also update selectedNode if it refers to the same node
        let updatedSelectedNode = selectedNode;
        if (selectedNode && selectedNode.id === id) {
            updatedSelectedNode = { ...selectedNode, data: { ...selectedNode.data, ...data } };
        }

        set({
            nodes: updatedNodes,
            selectedNode: updatedSelectedNode
        });
    },

    // UI State
    activeTab: 'editor',
    setActiveTab: (tab) => set({ activeTab: tab }),

    // Workflow Metadata
    createWorkflow: async (navigate) => {
        try {
            const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOWS.CREATE, {
                name: 'Untitled Workflow',
                description: '',
                nodes: [],
                edges: []
            });
            const newWorkflow = response.data;
            if (newWorkflow && newWorkflow._id) {
                navigate(`/workflow/${newWorkflow._id}`);
            }
        } catch (error) {
            console.error('Failed to create workflow:', error);
        }
    },
    workflowName: 'Untitled Workflow',
    workflowDescription: '',
    isWorkflowActive: true,
    setWorkflowMetadata: (metadata) => set((state) => ({ ...state, ...metadata })),

    nodeDefinitions: [],
    fetchNodeDefinitions: async () => {
        try {
            const response = await axiosInstance.get('/sample-workflows/nodes');
            set({ nodeDefinitions: response.data });
        } catch (error) {
            console.error('Failed to fetch node definitions:', error);
        }
    },

    credentials: [],
    fetchCredentials: async (provider?: string) => {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.CREDENTIALS.LIST, {
                params: provider ? { provider } : {}
            });
            set({ credentials: response.data });
        } catch (error) {
            console.error('Failed to fetch credentials:', error);
        }
    },
}));

