import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X } from 'lucide-react';

export const NodeConfigPanel: React.FC = () => {
    const { selectedNode, updateNodeData, setSelectedNode } = useWorkflowStore();
    const [label, setLabel] = useState('');
    // Store local state for inputs to avoid too many re-renders, or sync directly. 
    // For n8n feel, usually sync on blur or change.
    
    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || '');
        }
    }, [selectedNode]);

    if (!selectedNode) return null;

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
        updateNodeData(selectedNode.id, { label: e.target.value });
    };

    return (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full absolute right-0 top-0 z-10 shadow-xl">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-700">Configuration</h3>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                </button>
            </div>
            
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Node Label</label>
                    <input 
                        type="text" 
                        value={label} 
                        onChange={handleLabelChange}
                        className="w-full bg-white border border-slate-300 rounded p-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Node ID</p>
                    <code className="text-xs bg-white p-1 rounded text-slate-600 border border-slate-200 block overflow-ellipsis overflow-hidden">
                        {selectedNode.id}
                    </code>
                </div>
                
                {/* Dynamic fields based on node type would go here */}
                {selectedNode.type === 'input' && (
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Input Value</label>
                        <textarea
                            className="w-full bg-white border border-slate-300 rounded p-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 h-24 font-mono"
                            placeholder='{"value": 10}'
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    updateNodeData(selectedNode.id, { inputs: parsed });
                                } catch (err) {
                                    // ignore invalid json while typing
                                }
                            }}
                            defaultValue={JSON.stringify(selectedNode.data?.inputs, null, 2)}
                        />
                     </div>
                )}
            </div>
        </div>
    );
};
