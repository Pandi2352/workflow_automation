import React from 'react';
import { Terminal, AlertCircle } from 'lucide-react';

interface ExecutionLogsPanelProps {
    height: number;
    className?: string;
}

export const ExecutionLogsPanel: React.FC<ExecutionLogsPanelProps> = ({ height, className = '' }) => {
    return (
        <div 
            style={{ height }}
            className={`flex flex-col bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] ${className}`}
        >
            <div className="flex items-center h-9 px-4 border-b border-slate-100 bg-slate-50 select-none">
                <div className="text-xs font-medium text-slate-700 flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" />
                    Logs
                </div>
                <div className="flex-1" />
                <div className="flex items-center text-xs text-slate-400 gap-1">
                    <span>Success in 1ms</span>
                </div>
            </div>
            <div className="flex-1 p-0 flex flex-col min-h-0">
                <div className="px-4 py-2 bg-white border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 tracking-wider">OUTPUT</span>
                </div>
                <div className="flex-1 p-4 bg-white overflow-y-auto">
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                        <AlertCircle size={14} />
                        This is an item, but it's empty.
                    </div>
                </div>
            </div>
        </div>
    );
};
