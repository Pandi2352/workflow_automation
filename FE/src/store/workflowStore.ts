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

interface WorkflowHistoryState {
    nodes: Node[];
    edges: Edge[];
}

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
    selectedNode: Node | null;
    isDirty: boolean; // Tracking unsaved changes

    // History
    past: WorkflowHistoryState[];
    future: WorkflowHistoryState[];
    undo: () => void;
    redo: () => void;
    pushToHistory: () => void; // Call this before state changing actions

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
    createWorkflow: (navigate: Function) => Promise<void>;
    workflowName: string;
    workflowDescription: string;
    isWorkflowActive: boolean;
    maxConcurrency: number;
    setWorkflowMetadata: (metadata: Partial<{ workflowName: string; workflowDescription: string; isWorkflowActive: boolean; maxConcurrency: number }>) => void;

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

    // Reset
    resetWorkflowStore: () => void;

    // Display options
    showMinimap: boolean;
    toggleMinimap: () => void;

    // Helpers
    deleteNode: (id: string) => void;
}

const MAX_HISTORY = 20;

export const useWorkflowStore = create<WorkflowState>()((set, get) => ({
    nodes: [],
    edges: [],
    selectedNode: null,
    isDirty: false,

    // History
    past: [],
    future: [],

    pushToHistory: () => {
        const { nodes, edges, past } = get();
        const newPast = [...past, { nodes, edges }];
        if (newPast.length > MAX_HISTORY) {
            newPast.shift();
        }
        set({ past: newPast, future: [] });
    },

    undo: () => {
        const { past, future, nodes, edges } = get();
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        set({
            nodes: previous.nodes,
            edges: previous.edges,
            past: newPast,
            future: [{ nodes, edges }, ...future]
        });
    },

    redo: () => {
        const { past, future, nodes, edges } = get();
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        set({
            nodes: next.nodes,
            edges: next.edges,
            past: [...past, { nodes, edges }],
            future: newFuture
        });
    },


    setIsDirty: (isDirty) => set({ isDirty }),

    setNodes: (nodes) => {
        // We typically don't want to undo a full setNodes (like loading)
        // But if it's used for layouting, maybe we do? 
        // For now, let's assume programmatic setNodes might trigger history if desired, 
        // but typically applyNodeChanges is where the action is.
        set({ nodes });
    },
    setEdges: (edges) => set({ edges }),
    setSelectedNode: (selectedNode) => set({ selectedNode }),

    onNodesChange: (changes: NodeChange[]) => {
        // Filter out selection changes from history
        const isSelectionChange = changes.every(c => c.type === 'select');
        if (!isSelectionChange) {
            get().pushToHistory();
        }

        set({
            nodes: applyNodeChanges(changes, get().nodes),
            isDirty: true
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        // Filter out selection changes from history
        const isSelectionChange = changes.every(c => c.type === 'select');
        if (!isSelectionChange) {
            get().pushToHistory();
        }

        set({
            edges: applyEdgeChanges(changes, get().edges),
            isDirty: true
        });
    },

    onConnect: (connection: Connection) => {
        get().pushToHistory();
        set({
            edges: addEdge(connection, get().edges),
            isDirty: true
        });
    },

    addNode: (node: Node) => {
        get().pushToHistory();
        set({ nodes: [...get().nodes, node], isDirty: true });
    },

    updateNodeData: (id: string, data: any) => {
        // This can be frequent (typing), debouncing history might be needed in real world.
        // For now, simpler is better. Maybe don't history track every keystroke?
        // Let's track it for now to be safe.
        // get().pushToHistory(); 

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
    maxConcurrency: 2,
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

    // Execution Trigger (to request execution from components)
    executionTrigger: 0,
    triggerWorkflowExecution: () => set({ executionTrigger: Date.now() }),

    // Reset State
    resetWorkflowStore: () => {
        set({
            nodes: [],
            edges: [],
            selectedNode: null,
            isDirty: false,
            past: [],
            future: [],
            workflowName: 'Untitled Workflow',
            workflowDescription: '',
            isWorkflowActive: true,
            maxConcurrency: 2,
            currentExecution: null,
            isExecuting: false,
            executionTrigger: 0,
            activeTab: 'editor'
        });
    },

    // Display options
    showMinimap: true,
    toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),

    // Deletion helper
    deleteNode: (id: string) => {
        get().pushToHistory();
        const { nodes, edges } = get();
        set({
            nodes: nodes.filter(n => n.id !== id),
            edges: edges.filter(e => e.source !== id && e.target !== id),
            isDirty: true
        });
    }
}));
