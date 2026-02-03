import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Settings, Terminal, Upload, X, Zap } from 'lucide-react';
import axios from 'axios';
import { axiosInstance } from '../../api/axiosConfig';
import { useWorkflowStore } from '../../store/workflowStore';
import { SchemaDrivenConfig } from '../../components/designer/panels/SchemaDrivenConfig';
import { NodeDataSidebar } from '../../components/designer/panels/NodeDataSidebar';
import { DataTreeViewer } from '../../common/DataTreeViewer';
import { NodeHelpButton } from '../../common/NodeHelpButton';
import { cn } from '../../lib/utils';
import { GmailConfig } from '../trigger/gmail/GmailConfig';
import { GoogleDriveConfig } from '../trigger/google-drive/GoogleDriveConfig';
import { OneDriveConfig } from '../trigger/onedrive/OneDriveConfig';
import { OutlookConfig } from '../trigger/outlook/OutlookConfig';
import { ScheduleConfig } from '../trigger/schedule/ScheduleConfig';

const uppercase = (value: string) => value?.toUpperCase?.() || '';

const CODE_TEMPLATE_JS = `async function main(input) {
  // Write your logic here
  return { result: input };
}`;

const CODE_TEMPLATE_PY = `def main(input):
    # Write your logic here
    return {"result": input}
`;

export const UnifiedNodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const {
        selectedNode,
        updateNodeData,
        setSelectedNode,
        fetchNodeDefinitions,
        fetchCredentials,
        nodes,
        edges,
        currentExecution,
    } = useWorkflowStore();

    const [label, setLabel] = useState('');
    const [activeTab, setActiveTab] = useState<'config' | 'output'>('config');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [testInput, setTestInput] = useState('[]');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const nodeType = uppercase(String(selectedNode?.type || ''));

    useEffect(() => {
        fetchNodeDefinitions();
        fetchCredentials();
    }, [fetchNodeDefinitions, fetchCredentials]);

    useEffect(() => {
        if (!selectedNode) {
            return;
        }

        setLabel((selectedNode.data?.label as string) || '');
        setExecutionResult(null);
        setActiveTab('config');
        setTestInput('[]');
        setUploading(false);
        setUploadError(null);

        if (nodeType === 'CODE' && !selectedNode.data?.config?.code) {
            const language = selectedNode.data?.config?.language || 'javascript';
            updateNodeData(selectedNode.id, {
                config: {
                    ...(selectedNode.data?.config || {}),
                    language,
                    code: language === 'python3' ? CODE_TEMPLATE_PY : CODE_TEMPLATE_JS,
                },
            });
        }
    }, [selectedNode?.id]);

    useEffect(() => {
        if (!nodeExecutionData) {
            return;
        }

        setExecutionResult({
            success: nodeExecutionData.status === 'SUCCESS',
            output:
                nodeExecutionData.outputs ?? nodeExecutionData.output ?? nodeExecutionData.value ?? nodeExecutionData.data,
            logs: nodeExecutionData.logs,
            status: nodeExecutionData.status,
            error: nodeExecutionData.error,
        });
        setActiveTab('output');
    }, [nodeExecutionData]);

    const inputData = useMemo(() => {
        if (!selectedNode) {
            return [];
        }

        const incomingEdges = edges.filter((edge: any) => edge.target === selectedNode.id);
        return incomingEdges.map((edge: any) => {
            const sourceNode = nodes.find((n: any) => n.id === edge.source);
            const sourceExecution = currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === edge.source);
            const sourceOutput = currentExecution?.nodeOutputs?.find((out: any) => out.nodeId === edge.source);

            return {
                nodeId: edge.source,
                nodeName: (sourceNode?.data?.label as string) || sourceNode?.id || 'Unknown Node',
                data: sourceExecution?.outputs ?? sourceOutput?.value ?? sourceExecution?.value ?? null,
                status: sourceExecution?.status || 'NOT_RUN',
            };
        });
    }, [selectedNode, edges, nodes, currentExecution]);

    if (!selectedNode) {
        return null;
    }

    const config = (selectedNode.data?.config || {}) as Record<string, any>;

    const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value;
        setLabel(next);
        updateNodeData(selectedNode.id, { label: next });
    };

    const handleConfigChange = (key: string, value: any) => {
        updateNodeData(selectedNode.id, {
            config: { ...config, [key]: value },
        });
    };

    const handleCodeLanguageChange = (language: string) => {
        const currentCode = String(config.code || '').trim();
        const nextCode =
            currentCode.length > 0
                ? config.code
                : language === 'python3'
                ? CODE_TEMPLATE_PY
                : CODE_TEMPLATE_JS;

        updateNodeData(selectedNode.id, {
            config: {
                ...config,
                language,
                code: nextCode,
            },
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:4000/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            handleConfigChange('file', response.data);
        } catch (error: any) {
            setUploadError(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleExecuteNode = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        setActiveTab('output');

        let parsedInputs: any[] = [];
        try {
            const raw = JSON.parse(testInput);
            if (!Array.isArray(raw)) {
                throw new Error('Inputs must be a JSON array.');
            }
            parsedInputs = raw;
        } catch (error: any) {
            setExecutionResult({
                success: false,
                status: 'CONFIG_ERROR',
                error: `Invalid test input: ${error.message}`,
            });
            setIsExecuting(false);
            return;
        }

        try {
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType,
                nodeData: config,
                inputs: parsedInputs,
            });

            setExecutionResult({
                success: response.data?.success ?? true,
                status: response.data?.status || 'SUCCESS',
                output: response.data?.output ?? response.data?.outputs ?? response.data,
                logs: response.data?.logs,
                error: response.data?.error,
            });
        } catch (error: any) {
            setExecutionResult({
                success: false,
                status: 'FAILED',
                error: error.response?.data?.message || error.message,
                output: error.response?.data,
            });
        } finally {
            setIsExecuting(false);
        }
    };

    const renderSpecialConfig = () => {
        if (nodeType === 'GMAIL') return <GmailConfig selectedNode={selectedNode} />;
        if (nodeType === 'GOOGLE_DRIVE') return <GoogleDriveConfig selectedNode={selectedNode} />;
        if (nodeType === 'ONEDRIVE') return <OneDriveConfig selectedNode={selectedNode} />;
        if (nodeType === 'OUTLOOK') return <OutlookConfig selectedNode={selectedNode} />;
        if (nodeType === 'SCHEDULE') return <ScheduleConfig selectedNode={selectedNode} />;

        if (nodeType === 'FILE_UPLOAD') {
            const currentFile = config.file;
            return (
                <div className="space-y-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload File</label>
                    {!currentFile ? (
                        <label className="block border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            <div className="text-sm text-slate-600">{uploading ? 'Uploading...' : 'Click to select a file'}</div>
                        </label>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                            <div className="font-semibold text-slate-800">{currentFile.originalName || 'Uploaded file'}</div>
                            {currentFile.size && <div className="text-slate-500 mt-1">{(currentFile.size / 1024).toFixed(2)} KB</div>}
                            <button
                                onClick={() => handleConfigChange('file', null)}
                                className="mt-3 inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                                <Upload size={12} /> Remove file
                            </button>
                        </div>
                    )}
                    {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                </div>
            );
        }

        if (nodeType === 'CODE') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Language</label>
                        <select
                            value={config.language || 'javascript'}
                            onChange={(e) => handleCodeLanguageChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python3">Python</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Code</label>
                        <textarea
                            value={config.code || ''}
                            onChange={(e) => handleConfigChange('code', e.target.value)}
                            rows={12}
                            className="w-full bg-slate-900 border border-slate-300 rounded-lg p-3 text-xs font-mono text-green-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                    </div>
                </div>
            );
        }

        return <SchemaDrivenConfig selectedNode={selectedNode} focusColor="focus:ring-2 focus:ring-purple-500" />;
    };

    const resultOutput = executionResult?.output;
    const resultLogs = executionResult?.logs;
    const resultError = executionResult?.error;

    return (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden backdrop-blur-[2px]">
            <div className="absolute inset-0 bg-slate-900/40 animate-in fade-in duration-300" onClick={() => setSelectedNode(null)} />

            <div className="relative z-50 h-full flex flex-row animate-in slide-in-from-right duration-300">
                {activeTab === 'config' && (
                    <div className="w-80 h-full bg-slate-50/50 backdrop-blur-md border-r border-slate-200 flex flex-col">
                        <NodeDataSidebar
                            availableNodes={inputData}
                            onDragStart={(event, variablePath) => {
                                event.dataTransfer.setData('text/plain', `{{${variablePath}}}`);
                            }}
                        />
                    </div>
                )}

                <div className="w-[500px] h-full bg-white flex flex-col border-l border-slate-200 relative">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
                                <Settings size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">{nodeType.replace(/_/g, ' ')}</h3>
                                <p className="text-[10px] text-slate-500 font-medium font-mono uppercase tracking-tight">{selectedNode.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <NodeHelpButton nodeType={nodeType} />
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="px-5 py-3 border-b border-slate-100 bg-white">
                        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                            {[
                                { id: 'config', label: 'Configuration', icon: Settings },
                                { id: 'output', label: 'Results', icon: Terminal },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'config' | 'output')}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold rounded-lg transition-all',
                                        activeTab === tab.id
                                            ? 'bg-white text-slate-900 border border-slate-200/60 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50',
                                    )}
                                >
                                    <tab.icon size={13} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden bg-slate-50/30 flex flex-col">
                        {activeTab === 'config' ? (
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar h-full">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">General Settings</label>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[11px] font-semibold text-slate-600 mb-1.5 block">Display Name</span>
                                            <input
                                                type="text"
                                                value={label}
                                                onChange={handleLabelChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500 transition-all"
                                                placeholder="Node display name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-6">
                                    {renderSpecialConfig()}
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex justify-between">
                                        <span>Test Inputs (JSON Array)</span>
                                        <span className="text-[10px] normal-case font-normal text-slate-400">Optional mock upstream data</span>
                                    </label>
                                    <textarea
                                        value={testInput}
                                        onChange={(event) => setTestInput(event.target.value)}
                                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-y custom-scrollbar"
                                        placeholder='[{ "value": "example" }]'
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar h-full">
                                {executionResult ? (
                                    <>
                                        <div
                                            className={cn(
                                                'p-5 rounded-2xl border-2',
                                                executionResult.success ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100',
                                            )}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span
                                                    className={cn(
                                                        'text-xs font-bold uppercase tracking-wider',
                                                        executionResult.success ? 'text-emerald-700' : 'text-red-700',
                                                    )}
                                                >
                                                    {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">ST: {executionResult.status || 'DONE'}</span>
                                            </div>
                                            {resultError && (
                                                <p className="text-xs text-red-600 mt-2 font-mono italic whitespace-pre-wrap leading-relaxed">{String(resultError)}</p>
                                            )}
                                        </div>

                                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                                            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Output Payload</span>
                                                <button
                                                    className="text-[9px] text-purple-600 hover:text-purple-800 uppercase font-bold"
                                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(resultOutput, null, 2))}
                                                >
                                                    Copy JSON
                                                </button>
                                            </div>
                                            <div className="p-5 bg-white min-h-[100px]">
                                                <DataTreeViewer data={resultOutput} truncate={false} />
                                            </div>
                                        </div>

                                        {Array.isArray(resultLogs) && resultLogs.length > 0 && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Runtime Logs</label>
                                                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    <div className="space-y-1.5 font-mono">
                                                        {resultLogs.map((log: any, index: number) => {
                                                            const message = typeof log === 'object' && log !== null ? log.message || JSON.stringify(log) : String(log);
                                                            return (
                                                                <div key={index} className="text-[11px] border-b border-white/5 pb-1.5 mb-1.5 last:border-0 last:mb-0">
                                                                    <div className="text-slate-300 break-words whitespace-pre-wrap leading-relaxed">{message}</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                                        <Terminal size={32} className="opacity-20 mb-3" />
                                        <p className="text-sm font-medium text-slate-600 uppercase tracking-tight">No Runtime Data</p>
                                        <p className="text-[11px] opacity-60 mt-1 font-medium italic">Run test to see results here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between">
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={handleExecuteNode}
                            disabled={isExecuting}
                            className={cn(
                                'flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all border',
                                isExecuting
                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 active:scale-95',
                            )}
                        >
                            {isExecuting ? <RefreshCw className="animate-spin" size={12} /> : <Zap size={10} fill="white" stroke="white" />}
                            {isExecuting ? 'Processing...' : 'Run Analysis'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnifiedNodeConfigPanel;
