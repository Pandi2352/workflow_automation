import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Play, Trash2, Clock } from 'lucide-react';
import type { SampleWorkflow } from '../../types/workflow.types';
import { Switch } from '../../common/Switch';

interface WorkflowCardProps {
    workflow: SampleWorkflow;
    onToggleActive: (workflow: SampleWorkflow, e?: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
    menuOpenId: string | null;
    setMenuOpenId: (id: string | null) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ 
    workflow, 
    onToggleActive, 
    onDelete, 
    menuOpenId, 
    setMenuOpenId 
}) => {
    const navigate = useNavigate();

    const handleViewExecutions = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/workflow/${workflow._id}?tab=executions`);
    };

    return (
        <div 
            onClick={() => navigate(`/workflow/${workflow._id}`)}
            className="group relative bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm rounded-2xl p-5 
                     hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-emerald-500/30 
                     transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between h-[180px] overflow-visible"
        >
            {/* Status & Menu Header */}
            <div className="flex justify-between items-start mb-4">
                <div className={`
                    flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-colors
                    ${workflow.isActive 
                        ? 'bg-emerald-50/80 border-emerald-100 text-emerald-700' 
                        : 'bg-slate-50/80 border-slate-200 text-slate-500'}
                `}>
                    <div className={`w-1.5 h-1.5 rounded-full ${workflow.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {workflow.isActive ? 'Active' : 'Inactive'}
                </div>

                <div className="relative">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === workflow._id ? null : workflow._id);
                        }}
                        className={`
                            p-2 rounded-xl transition-all duration-200
                            ${menuOpenId === workflow._id 
                                ? 'bg-slate-100 text-slate-900' 
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 opacity-0 group-hover:opacity-100'}
                        `}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {menuOpenId === workflow._id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-slate-900/5">
                            <button 
                                onClick={handleViewExecutions}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-3 transition-colors"
                            >
                                <Play size={14} /> View Executions
                            </button>
                            <div className="h-px bg-slate-100 mx-2" />
                            <button 
                                onClick={(e) => onDelete(e, workflow._id)}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                                <Trash2 size={14} /> Delete Workflow
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Content */}
            <div className="flex-1">
                <h4 className="text-lg font-bold text-slate-800 mb-1.5 group-hover:text-emerald-700 transition-colors line-clamp-1 tracking-tight">
                    {workflow.name}
                </h4>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {workflow.description || 'No description provided.'}
                </p>
            </div>

            {/* Footer Meta */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <Clock size={12} />
                        {new Date(workflow.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <div onClick={(e) => e.stopPropagation()} className="transform scale-90 origin-right">
                    <Switch 
                        checked={workflow.isActive}
                        onChange={() => onToggleActive(workflow)}
                        size="sm"
                    />
                </div>
            </div>
        </div>
    );
};
