import React, { useState } from 'react';
import { LayoutGrid, List, Command, Plus } from 'lucide-react';
import type { SampleWorkflow } from '../../types/workflow.types';
import { Button } from '../../common/Button';
import { WorkflowCard } from './WorkflowCard';
import { WorkflowTable } from './WorkflowTable';

interface WorkflowListProps {
    workflows: SampleWorkflow[];
    loading: boolean;
    onToggleActive: (workflow: SampleWorkflow, e?: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
    onCreate: () => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({ 
    workflows, 
    loading, 
    onToggleActive, 
    onDelete,
    onCreate
}) => {
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    // Close menu when clicking outside (handled slightly differently here, relying on prop or local state?)
    // Actually, parent Dashboard usually handles click outside for the whole page, but let's manage menu state here if possible or pass it down.
    // Ideally menu state should be at this level or Dashboard level. 
    // Let's use local state but we need a way to close it on outside click globally.
    // For now, we'll rely on the button interaction, and maybe a simple backdrop or effect in the future.
    // To keep it simple and consistent with previous behavior, let's just use the state. 
    // *Self-correction*: The previous dashboard had a global click listener. We might want to keep that in Dashboard and pass menuOpenId down 
    // OR implement the listener here. Since Dashboard is the page, let's keep the listener there and pass props if we want to be strictly correct,
    // BUT to make this component self-contained for the "List" part, let's try to handle it here or just accept it's a list.
    // Let's implement the click outside listener HERE for the menus inside the list.

    React.useEffect(() => {
        const handleClickOutside = () => setMenuOpenId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[180px] bg-slate-200/50 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (workflows.length === 0) {
        return (
            <div className="text-center py-24 border-2 border-dashed border-slate-200/60 rounded-3xl bg-slate-50/30 backdrop-blur-sm">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    <Command size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No workflows found</h3>
                <p className="text-slate-500 text-base mb-8 max-w-sm mx-auto leading-relaxed">
                    Get started by creating your first automation workflow. It only takes a minute.
                </p>
                <Button onClick={onCreate} size="lg" className="shadow-lg shadow-emerald-500/20">
                    Create Workflow
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm ring-1 ring-slate-200/50">
                    <span className="text-slate-700 font-bold">{workflows.length}</span> workflows
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-emerald-600 font-semibold">{workflows.filter(w => w.isActive).length} active</span>
                </div>

                <div className="flex bg-white/60 backdrop-blur-md rounded-xl p-1 border border-white/50 shadow-sm ring-1 ring-slate-200/50">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="List View"
                    >
                        <List size={18} />
                    </button>
                    <div className="w-px bg-slate-200/50 mx-1 my-2" />
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Create New Card (Ghost) */}
                    <div 
                        onClick={onCreate}
                        className="group border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 
                                 hover:border-emerald-500/50 hover:bg-emerald-50/30 hover:text-emerald-600 
                                 transition-all duration-300 cursor-pointer h-[180px]"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-emerald-500/20 group-hover:scale-110 transition-all duration-300">
                            <Plus size={28} className="transition-colors" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Create New Workflow</span>
                    </div>

                    {workflows.map(workflow => (
                        <WorkflowCard 
                            key={workflow._id}
                            workflow={workflow}
                            onToggleActive={onToggleActive}
                            onDelete={onDelete}
                            menuOpenId={menuOpenId}
                            setMenuOpenId={setMenuOpenId}
                        />
                    ))}
                </div>
            ) : (
                <WorkflowTable 
                    workflows={workflows}
                    onToggleActive={onToggleActive}
                    onDelete={onDelete}
                    menuOpenId={menuOpenId}
                    setMenuOpenId={setMenuOpenId}
                />
            )}
        </div>
    );
};
