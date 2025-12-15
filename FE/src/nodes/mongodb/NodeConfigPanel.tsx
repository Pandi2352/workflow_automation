
import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Database } from 'lucide-react';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData } = useWorkflowStore();
    const [config, setConfig] = useState<any>({ 
        connectionString: '',
        dbName: 'automation_db',
        collectionName: 'manual_review'
    });

    useEffect(() => {
        if (selectedNode?.data?.config) {
             setConfig({ 
                 ...config, // defaults
                 ...(selectedNode.data.config as any)
             });
        }
    }, [selectedNode?.id]);

    const handleConfigChange = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        updateNodeData(selectedNode!.id, { config: newConfig });
    };

    if (!selectedNode) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                        <Database size={16} />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-green-600">
                        Database
                    </span>
                 </div>
                 <h2 className="text-lg font-bold text-gray-900">
                     {selectedNode.data.label as string || 'MongoDB'}
                 </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Connection String */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Connection String
                    </label>
                    <input
                        type="password"
                        value={config.connectionString}
                        onChange={(e) => handleConfigChange('connectionString', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-mono"
                        placeholder="mongodb://username:password@host..."
                    />
                    <p className="text-xs text-gray-400">Standard MongoDB URI</p>
                </div>

                {/* DB Name */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Database Name
                    </label>
                    <input
                        type="text"
                        value={config.dbName}
                        onChange={(e) => handleConfigChange('dbName', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                </div>

                {/* Collection Name */}
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Collection Name
                    </label>
                    <input
                        type="text"
                        value={config.collectionName}
                        onChange={(e) => handleConfigChange('collectionName', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                </div>
            </div>

             {/* Footer / Results */}
             <div className="border-t border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                    </span>
                    {nodeExecutionData?.status ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            nodeExecutionData.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                            nodeExecutionData.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {nodeExecutionData.status}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">Idle</span>
                    )}
                </div>
                {nodeExecutionData?.result?.insertedId && (
                     <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-100">
                         Inserted ID: <span className="font-mono">{nodeExecutionData.result.insertedId}</span>
                     </div>
                )}
            </div>
        </div>
    );
};
