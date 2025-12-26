import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Search, LayoutGrid, List, MoreHorizontal, 
    Zap, Command, Trash2, Play
} from 'lucide-react';
import { workflowService } from '../services/api/workflows';
import type { SampleWorkflow } from '../types/workflow.types';
import { Button } from '../common/Button';
import { Switch } from '../common/Switch';
import { Modal } from '../common/Modal';

import { CredentialsList } from '../components/credentials/CredentialsList';
import { AnimatedWorkflowBackground } from '../components/landing/AnimatedWorkflowBackground';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<SampleWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  
  // View State (Workflows | Credentials)
  const [currentView, setCurrentView] = useState<'workflows' | 'credentials'>('workflows');
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Close menu on click outside
  useEffect(() => {
      const handleClickOutside = () => setMenuOpenId(null);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await workflowService.getAll();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    navigate('/workflow/new');
  };

  const handleClickDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteId(id);
      setMenuOpenId(null);
  };

  const confirmDelete = async () => {
      if (!deleteId) return;
      
      try {
          await workflowService.delete(deleteId);
          setWorkflows(prev => prev.filter(w => w._id !== deleteId));
      } catch (error) {
          console.error('Failed to delete workflow', error);
          alert('Failed to delete workflow');
      } finally {
          setDeleteId(null);
      }
  };

  // Simplified handler that doesn't rely on the event object being passed perfectly from Switch
  const handleToggleActive = async (workflow: SampleWorkflow, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      
      const newStatus = !workflow.isActive; 
      // Optimistic update
      setWorkflows(prev => prev.map(w => w._id === workflow._id ? { ...w, isActive: newStatus } : w));
      
      try {
          await workflowService.update(workflow._id, { isActive: newStatus });
      } catch (error) {
          console.error('Failed to update status', error);
          // Revert on failure
          setWorkflows(prev => prev.map(w => w._id === workflow._id ? { ...w, isActive: !newStatus } : w));
      }
  };
  
  const handleViewExecutions = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      navigate(`/workflow/${id}?tab=executions`);
  };

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/30 font-sans relative overflow-hidden">
      
      {/* Background Animation */}
      <div className="fixed inset-0 z-0">
         <AnimatedWorkflowBackground />
      </div>
      <style>{`
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent; 
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1; 
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8; 
        }
      `}</style>
      
      {/* Navbar */}
      <div className="h-16 bg-white/80 border-b border-slate-200/50 flex items-center px-6 md:px-10 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white shadow-md">
                <Zap size={18} fill="currentColor" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Automation Kit</h1>
        </div>
        <div className="ml-8 hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
             <button 
                onClick={() => setCurrentView('workflows')}
                className={`${currentView === 'workflows' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'} transition-colors`}
             >
                Workflows
             </button>
             <button 
                className="hover:text-slate-900 cursor-pointer transition-colors"
                // Implement Executions view later
             >
                Executions
             </button>
             <button 
                onClick={() => setCurrentView('credentials')}
                className={`${currentView === 'credentials' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'} transition-colors`}
             >
                Credentials
             </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                MK
             </div>
        </div>
      </div>

      {currentView === 'workflows' && (
      <div className="relative pt-16 pb-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                What would you like to automate?
            </h1>
            <div className="relative max-w-[640px] mx-auto">
                <div className="absolute inset-0 bg-emerald-200/40 blur-2xl rounded-full transform scale-95 opacity-50" />
                
                <div className="relative flex items-center bg-white p-2 rounded-full shadow-2xl shadow-emerald-900/10 ring-1 ring-slate-900/5 group focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                     <div className="pl-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                        <Search size={22} />
                     </div>
                     <input 
                        type="text" 
                        placeholder="Search workflows..." 
                        className="flex-1 min-w-0 px-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-base h-12"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-3 pr-2">
                        <button 
                            onClick={handleCreateWorkflow} 
                            className="bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-slate-900/20 px-6 h-12 rounded-full text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Create Workflow
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
      )}

      <div className="p-6 md:p-10 max-w-7xl mx-auto -mt-10 relative z-10">
       {currentView === 'credentials' ? (
           <CredentialsList />
       ) : (
           <>
            {/* Workflow List Header */}
             <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
                    <span>{workflows.length} workflows</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-emerald-700">{workflows.filter(w => w.isActive).length} active</span>
                </div>

                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        title="List View"
                    >
                        <List size={16} />
                    </button>
                    <div className="w-px bg-slate-100 mx-1" />
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>
             </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-200 rounded-lg" />)}
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                    <Command size={24} className="text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-medium mb-1">No workflows found</h3>
                <p className="text-slate-500 text-sm mb-6">Create a new workflow to get started.</p>
                <Button onClick={handleCreateWorkflow} size="sm">Create Workflow</Button>
            </div>
          ) : viewMode === 'table' ? (
            // TABLE VIEW
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible">
                <div className="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider backdrop-blur-sm sticky top-0 rounded-t-xl z-20">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Last Modified</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y divide-slate-100">
                    {filteredWorkflows.map((workflow) => (
                        <div 
                            key={workflow._id}
                            onClick={() => navigate(`/workflow/${workflow._id}`)}
                            className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-slate-50 transition-colors cursor-pointer group relative"
                        >
                            <div className="col-span-5 flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg border ${workflow.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                    <Zap size={14} fill={workflow.isActive ? "currentColor" : "none"} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">{workflow.name}</h4>
                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{workflow.description || 'No description'}</p>
                                </div>
                            </div>
                            <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                                 <Switch 
                                    checked={workflow.isActive} 
                                    onChange={() => handleToggleActive(workflow)} 
                                    size="sm"
                                 />
                            </div>
                            <div className="col-span-3 text-xs text-slate-500 font-mono">
                                {new Date(workflow.updatedAt).toLocaleDateString()} <span className="text-slate-300 mx-1">•</span> {new Date(workflow.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="col-span-2 flex justify-end gap-2 relative">
                                <div className="relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === workflow._id ? null : workflow._id);
                                        }}
                                        className="p-1.5 hover:bg-slate-200 cursor-pointer rounded text-slate-400 hover:text-slate-700 transition-colors"
                                    >
                                        <MoreHorizontal size={14} />
                                    </button>
                                    
                                    {menuOpenId === workflow._id && (
                                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                            <button 
                                                onClick={(e) => handleViewExecutions(e, workflow._id)}
                                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2"
                                            >
                                                <Play size={12} /> Executions
                                            </button>
                                            <button 
                                                onClick={(e) => handleClickDelete(e, workflow._id)}
                                                className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          ) : (
            // GRID VIEW {Compact)
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredWorkflows.map((workflow) => (
                    <div 
                        key={workflow._id}
                        onClick={() => navigate(`/workflow/${workflow._id}`)}
                        className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-visible flex flex-col justify-between h-[160px]"
                    >
                        <div className="flex justify-between items-start mb-3">
                             <div className={`p-2 rounded-lg border ${workflow.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                <Zap size={16} fill={workflow.isActive ? "currentColor" : "none"} />
                            </div>
                            <div className="relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(menuOpenId === workflow._id ? null : workflow._id);
                                    }}
                                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${menuOpenId === workflow._id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                                 {menuOpenId === workflow._id && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                        <button 
                                            onClick={(e) => handleViewExecutions(e, workflow._id)}
                                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2"
                                        >
                                            <Play size={12} /> Executions
                                        </button>
                                        <button 
                                            onClick={(e) => handleClickDelete(e, workflow._id)}
                                            className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors line-clamp-1">{workflow.name}</h4>
                            <div className="flex items-center justify-between mt-1" onClick={(e) => e.stopPropagation()}>
                                 <span className="text-xs text-slate-500 line-clamp-1">{workflow.description || 'No description'}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                            <span>Updated {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                            <div onClick={(e) => e.stopPropagation()}>
                                <Switch 
                                    checked={workflow.isActive}
                                    onChange={() => handleToggleActive(workflow)}
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                 
                 {/* Add New Card (Ghost) */}
                 <div 
                    onClick={handleCreateWorkflow}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-slate-300 hover:bg-slate-50/50 hover:text-slate-600 transition-all cursor-pointer h-[160px] bg-white/40 backdrop-blur-sm"
                 >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-sm">
                        <Plus size={20} />
                    </div>
                    <span className="text-sm font-medium">Create New</span>
                 </div>
            </div>
          )}
          </>
       )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Workflow"
        size="sm"
        footer={
            <>
                <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
                <Button 
                    className="bg-red-600 hover:bg-red-700 text-white border-none" 
                    onClick={confirmDelete}
                >
                    Delete Workflow
                </Button>
            </>
        }
      >
        <div className="py-2">
            <p className="text-slate-600 text-sm leading-relaxed">
                Are you sure you want to delete this workflow? This action is permanent and cannot be undone. All execution history will also be removed.
            </p>
        </div>
      </Modal>
      </div>
    </div>
  );
};
