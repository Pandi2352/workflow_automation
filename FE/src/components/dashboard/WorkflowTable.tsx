import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Play, Trash2, Zap, Calendar, Clock } from 'lucide-react';
import type { SampleWorkflow } from '../../types/workflow.types';
import { Switch } from '../../common/Switch';

interface WorkflowTableProps {
    workflows: SampleWorkflow[];
    onToggleActive: (workflow: SampleWorkflow, e?: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
    menuOpenId: string | null;
    setMenuOpenId: (id: string | null) => void;
}

export const WorkflowTable: React.FC<WorkflowTableProps> = ({
    workflows,
    onToggleActive,
    onDelete,
    menuOpenId,
    setMenuOpenId
}) => {
    const navigate = useNavigate();

    const handleViewExecutions = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        navigate(`/workflow/${id}?tab=executions`);
    };

    return (
        <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-900/5">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-6 border-b border-slate-200/60 bg-slate-50/50 px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-5">Workflow Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Last Activity</div>
                <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100">
                {workflows.map((workflow) => (
                    <div 
                        key={workflow._id}
                        onClick={() => navigate(`/workflow/${workflow._id}`)}
                        className="group grid grid-cols-12 gap-6 px-8 py-5 items-center hover:bg-white/80 transition-all cursor-pointer relative"
                    >
                        {/* Name Column */}
                        <div className="col-span-5">
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm
                                    ${workflow.isActive ? 'bg-emerald-100/50 text-emerald-600' : 'bg-slate-100 text-slate-400'}
                                `}>
                                    <Zap size={20} fill={workflow.isActive ? "currentColor" : "none"} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors mb-0.5">
                                        {workflow.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate max-w-[240px]">
                                        {workflow.description || 'No description provided'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Column */}
                        <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                                <Switch 
                                    checked={workflow.isActive} 
                                    onChange={() => onToggleActive(workflow)} 
                                    size="sm"
                                />
                                <span className={`text-xs font-medium ${workflow.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {workflow.isActive ? 'Active' : 'Paused'}
                                </span>
                            </div>
                        </div>

                        {/* Date Column */}
                        <div className="col-span-3 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <Calendar size={12} className="text-slate-400" />
                                {new Date(workflow.updatedAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Clock size={12} />
                                {new Date(workflow.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-2 flex justify-end">
                            <div className="relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(menuOpenId === workflow._id ? null : workflow._id);
                                    }}
                                    className={`
                                        p-2 rounded-lg transition-all
                                        ${menuOpenId === workflow._id 
                                            ? 'bg-slate-100 text-slate-900' 
                                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 opacity-0 group-hover:opacity-100'}
                                    `}
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                
                                {menuOpenId === workflow._id && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-slate-900/5">
                                        <button 
                                            onClick={(e) => handleViewExecutions(e, workflow._id)}
                                            className="w-full text-left px-4 py-3 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-3 transition-colors"
                                        >
                                            <Play size={14} /> View Executions
                                        </button>
                                        <div className="h-px bg-slate-100 mx-2" />
                                        <button 
                                            onClick={(e) => onDelete(e, workflow._id)}
                                            className="w-full text-left px-4 py-3 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                        >
                                            <Trash2 size={14} /> Delete Workflow
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
