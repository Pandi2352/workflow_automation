import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Cpu, AlertTriangle } from 'lucide-react';

interface NodeConfigPanelProps {
    nodeExecutionData?: {
        status: string;
        result?: {
            confidenceScore?: number;
            [key: string]: any;
        };
        error?: any;
    };
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData } = useWorkflowStore();
    const [config, setConfig] = useState<any>({ 
        schema: '{}',
        modelName: 'gemini-1.5-flash'
    });
    const [jsonError, setJsonError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedNode?.data?.config) {
            const currentConfig = selectedNode.data.config as any;
            if (currentConfig.schema && typeof currentConfig.schema === 'object') {
                 setConfig({ 
                    ...currentConfig, 
                    schema: JSON.stringify(currentConfig.schema, null, 2),
                    modelName: currentConfig.modelName || 'gemini-1.5-flash'
                });
            } else {
                 setConfig({
                    ...currentConfig,
                    modelName: currentConfig.modelName || 'gemini-1.5-flash'
                 });
            }
        }
    }, [selectedNode?.id, selectedNode?.data?.config]);

    const handleConfigChange = (key: string, value: any) => {
        if (!selectedNode) return;
        
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        
        // Validate JSON
        if (key === 'schema') {
            try {
                const parsed = JSON.parse(value);
                setJsonError(null);
                updateNodeData(selectedNode.id, {
                    config: { ...newConfig, schema: parsed }
                });
            } catch (e) {
                setJsonError('Invalid JSON format');
                // Only update local state
            }
        } else {
            updateNodeData(selectedNode.id, { config: newConfig });
        }
    };

    if (!selectedNode) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                        <Cpu size={16} />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                        AI Parsing
                    </span>
                 </div>
                 <h2 className="text-lg font-bold text-gray-900">
                     {selectedNode.data.label as string}
                 </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Model Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                        AI Model
                        <span className="text-xs text-gray-400 font-normal">Select the model to use</span>
                    </label>
                    <select
                        value={config.modelName || 'gemini-1.5-flash'}
                        onChange={(e) => handleConfigChange('modelName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    >
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                </div>

                {/* Schema Editor */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                        Extraction Schema (JSON)
                        <span className="text-xs text-gray-400 font-normal">Define fields to extract</span>
                    </label>
                    <div className="relative">
                        <textarea
                            value={config.schema}
                            onChange={(e) => handleConfigChange('schema', e.target.value)}
                            className={`w-full h-64 p-3 pr-10 text-xs font-mono bg-slate-800 text-green-400 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-sm ${
                                jsonError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'
                            }`}
                            placeholder='{ "field": "type" }'
                        />
                        {jsonError && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-red-400 bg-red-900/20 px-2 py-1 rounded text-xs">
                                <AlertTriangle size={12} />
                                <span>Invalid JSON</span>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        Define expected output structure. Example:
                        <code className="block bg-gray-100 p-1.5 rounded mt-1 text-gray-600">
                            {`{
  "invoiceNumber": "string",
  "totalAmount": "number",
  "date": "date"
}`}
                        </code>
                    </p>
                </div>
            </div>

             {/* Footer / Results */}
             <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Execution Results
                    </span>
                    {nodeExecutionData?.status && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            nodeExecutionData.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                            nodeExecutionData.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {nodeExecutionData.status}
                        </span>
                    )}
                </div>
                
                 {nodeExecutionData?.result?.confidenceScore && (
                    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Confidence Score</span>
                            <span className={`text-sm font-bold ${
                                nodeExecutionData.result.confidenceScore > 0.8 ? 'text-green-600' : 
                                nodeExecutionData.result.confidenceScore > 0.5 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                                {(nodeExecutionData.result.confidenceScore * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full ${
                                    nodeExecutionData.result.confidenceScore > 0.8 ? 'bg-green-500' : 
                                    nodeExecutionData.result.confidenceScore > 0.5 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${nodeExecutionData.result.confidenceScore * 100}%` }}
                            />
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};
