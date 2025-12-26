import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Trash2, Play, Mail } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { axiosInstance } from '../../api/axiosConfig';
import gmailIcon from '../../assets/nodeIcons/gmail-icon-logo-svgrepo-com.svg';

interface GmailNodeData extends Record<string, unknown> {
    label?: string;
    executionStatus?: string;
    config?: {
        mode?: 'action' | 'trigger';
        query?: string;
        [key: string]: any;
    };
}

const GmailLogo = () => (
    <img src={gmailIcon} alt="Gmail" className="w-full h-full object-contain" />
);

export const GmailNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as GmailNodeData;
    const { deleteNode, showToast, currentExecution } = useWorkflowStore();

    // Find execution status
    const nodeStatus = nodeData.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isRunning = nodeStatus === 'RUNNING';
    const isSuccess = nodeStatus === 'SUCCESS';
    const isFailed = nodeStatus === 'FAILED';

    const handleTestNode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        showToast('Testing node...', 'info');
        try {
            await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'GMAIL',
                nodeData: nodeData.config || {},
                inputs: [] 
            });
            showToast('Node test successful', 'success');
        } catch (error: any) {
            showToast('Node test failed', 'error', error.message);
        }
    };

    const getStatusColor = () => {
        if (isRunning) return 'border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
        if (isSuccess) return 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
        if (isFailed) return 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
        return selected ? 'border-red-500 ring-2 ring-red-100 shadow-lg' : 'border-slate-200 hover:border-red-400 shadow-sm';
    };

    const mode = nodeData.config?.mode || 'action';
    const isTrigger = mode === 'trigger';

    let displayLabel = nodeData.label || (isTrigger ? 'Watch Emails' : 'Fetch Emails');
    if (isTrigger && nodeData.config?.query) {
        const q = nodeData.config.query;
        displayLabel = `Watch ${q.length > 10 ? q.slice(0, 10) + '...' : q}`;
    }

    return (
        <div className={`relative group min-w-[200px] bg-white rounded-xl border-2 transition-all duration-300 ${getStatusColor()}`}>
            
            {/* Top Toolbar - Actions */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                 <div className="flex items-center gap-1">
                    <button 
                        onClick={handleTestNode}
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                        title="Test Node"
                    >
                        <Play size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                        title="Delete Node"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-red-50 to-white border-b border-red-100/50 rounded-t-[10px]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 shrink-0">
                        <GmailLogo />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-0.5">GMAIL</span>
                        <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter flex items-center gap-0.5">
                            <Zap size={8} fill="currentColor" /> {isTrigger ? 'TRIGGER' : 'ACTION'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Body Content */}
            <div className="p-3 bg-white space-y-3">
                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="block text-xs font-bold text-slate-900 leading-tight truncate px-1" title={displayLabel}>
                        {displayLabel}
                    </span>
                    <div className="flex items-center gap-1 mt-1 px-1">
                        <Mail size={10} className="text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-medium">Google Workspace</span>
                    </div>
                 </div>
            </div>

            {/* Execution Status Indicator */}
            {(isRunning || isSuccess || isFailed) && (
                <div className="absolute -bottom-2 -right-2 flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-sm transform transition-all scale-110 ${
                        isRunning ? 'bg-blue-500 animate-spin border-t-transparent' :
                        isSuccess ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                        {isSuccess && '✓'}
                        {isFailed && '!'}
                    </div>
                </div>
            )}

             {/* Loading Overlay */}
             {isRunning && (
                <div className="absolute inset-0 bg-red-50/10 backdrop-blur-[0.5px] rounded-xl animate-pulse pointer-events-none" />
            )}

            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-red-500 shadow-sm" 
            />
            {!isTrigger && (
                <Handle 
                    type="target" 
                    position={Position.Left} 
                    isConnectable={isConnectable}
                    className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-red-500 shadow-sm" 
                />
            )}
        </div>
    );
});
