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
    isDirty: boolean; // Tracking unsaved changes

    // Actions
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    setSelectedNode: (node: Node | null) => void;
    setIsDirty: (isDirty: boolean) => void;

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

    // Toast
    toast: { message: string; variant: 'success' | 'error' | 'info'; description?: string; isVisible: boolean };
    showToast: (message: string, variant?: 'success' | 'error' | 'info', description?: string) => void;
    hideToast: () => void;

    // Execution
    currentExecution: any;
    isExecuting: boolean;
    setCurrentExecution: (execution: any) => void;
    executionTrigger: number;
    triggerWorkflowExecution: () => void;
    // runWorkflow: () => Promise<void>; // Deferred

    // Helpers
    deleteNode: (id: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNode: null,
    isDirty: false,

    setIsDirty: (isDirty) => set({ isDirty }),

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSelectedNode: (selectedNode) => set({ selectedNode }),

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
            isDirty: true
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
            isDirty: true
        });
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
            isDirty: true
        });
    },

    addNode: (node: Node) => {
        set({ nodes: [...get().nodes, node], isDirty: true });
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

    // Toast State
    toast: { message: '', variant: 'success', isVisible: false },
    showToast: (message, variant = 'success', description) => set({
        toast: { message, variant, description, isVisible: true }
    }),
    hideToast: () => set((state) => ({ toast: { ...state.toast, isVisible: false } })),

    // Execution State
    currentExecution: null,
    isExecuting: false,
    setCurrentExecution: (execution) => set({ currentExecution: execution }),
    runWorkflow: async () => {
        const { id } = get().selectedNode?.data || { id: null }; // Not used for runWorkflow, we use current workflow ID
        // Note: runWorkflow logic requires saving first, which needs nodes/edges. 
        // Ideally we move the FULL logic here, but for now let's expose specific helpers or rely on the component.
        // Actually, let's keep running logic in Designer for now to avoid massive refactor of 'handleSave' which depends on component routing.
        // Instead, we will expose a TRIGGER flag.
    },
    // Execution Trigger (to request execution from components)
    executionTrigger: 0,
    triggerWorkflowExecution: () => set({ executionTrigger: Date.now() }),

    // Simplified Execution Starter (if backend allows generic start)
    // We will just expose 'setNodes' which we already have. 
    // Deletion helper
    deleteNode: (id: string) => {
        const { nodes, edges } = get();
        set({
            nodes: nodes.filter(n => n.id !== id),
            edges: edges.filter(e => e.source !== id && e.target !== id),
            isDirty: true
        });
    }
}));

