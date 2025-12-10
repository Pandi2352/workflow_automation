import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Search, Zap, Clock, ArrowRight, MoreHorizontal, 
    Settings, Bell, User, LayoutGrid, List
} from 'lucide-react';
import { workflowService } from '../services/api/workflows';
import type { SampleWorkflow } from '../types/workflow.types';
import { Button } from '../components/common/Button';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<SampleWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/30 font-sans">
        {/* Ambient Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/50 rounded-full blur-[120px]" />
        </div>

        {/* Minimal Navbar */}
        <nav className="relative z-50 flex items-center justify-between px-8 py-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Zap size={22} className="text-white" fill="currentColor" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">AutoFlow</span>
            </div>
            
            <div className="flex items-center gap-4">
                <button className="p-2.5 rounded-full hover:bg-white hover:shadow-sm text-slate-500 hover:text-emerald-600 transition-all relative group bg-white/50 border border-transparent hover:border-slate-200">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                </button>
                <div className="h-6 w-px bg-slate-200" />
                 <button 
                    onClick={() => navigate('/settings')}
                    className="p-2.5 rounded-full hover:bg-white hover:shadow-sm text-slate-500 hover:text-emerald-600 transition-all bg-white/50 border border-transparent hover:border-slate-200"
                >
                    <Settings size={20} />
                </button>
                <button 
                    onClick={() => navigate('/profile')}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-bold hover:shadow-md hover:border-emerald-500/50 transition-all"
                >
                    <User size={20} />
                </button>
            </div>
        </nav>

        {/* Main Interface */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 mt-12 pb-20">
            
            {/* Hero & Search */}
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                    What will you <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">automate</span> today?
                </h1>
                
                <div className="max-w-2xl mx-auto relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-75" />
                    <div className="relative flex items-center bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-2 shadow-xl shadow-slate-200/50">
                        <Search className="ml-4 text-slate-400" size={20} />
                        <input 
                            type="text"
                            placeholder="Search workflows..."
                            className="w-full bg-transparent border-none text-slate-900 placeholder-slate-400 focus:ring-0 text-lg px-4 py-2"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="hidden md:flex items-center gap-1 pr-2">
                             <Button 
                                onClick={handleCreateWorkflow}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20"
                            >
                                <Plus size={18} className="mr-2" />
                                Create
                             </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-slate-800">Your Workflows</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-xs font-medium text-emerald-700 border border-emerald-200">
                        {workflows.length}
                    </span>
                </div>
                
                <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                     <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Workflow List/Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-48 rounded-2xl bg-white animate-pulse border border-slate-200 shadow-sm" />
                    ))}
                </div>
            ) : filteredWorkflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <Search size={32} className="opacity-50" />
                    </div>
                    <p className="text-lg text-slate-600">No workflows found matching "{searchQuery}"</p>
                    <Button 
                        variant="secondary" 
                        onClick={() => setSearchQuery('')}
                        className="mt-4 border-slate-200 hover:bg-slate-50 text-slate-600"
                    >
                        Clear Search
                    </Button>
                </div>
            ) : (
                <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "flex flex-col gap-4"
                }>
                    {filteredWorkflows.map((workflow) => (
                        <div 
                            key={workflow._id}
                            onClick={() => navigate(`/workflow/${workflow._id}`)}
                            className={`
                                group relative bg-white hover:bg-white/80 backdrop-blur-sm border border-slate-200 
                                hover:border-emerald-500/30 transition-all duration-300 cursor-pointer overflow-hidden
                                ${viewMode === 'grid' ? 'rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5' : 'rounded-xl p-4 flex items-center justify-between hover:translate-x-1 hover:shadow-md'}
                            `}
                        >
                             {/* Gradient Glow */}
                             <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                             <div className={viewMode === 'grid' ? 'block' : 'flex items-center gap-6 flex-1'}>
                                {/* Header / Icon */}
                                <div className={`flex justify-between items-start ${viewMode === 'grid' ? 'mb-4' : ''}`}>
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105
                                        ${workflow.active 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-slate-50 text-slate-400 border border-slate-100'}
                                    `}>
                                        <Zap size={20} fill={workflow.active ? "currentColor" : "none"} />
                                    </div>
                                    
                                    {viewMode === 'grid' && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                             <button onClick={(e) => { e.stopPropagation(); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">
                                        {workflow.name}
                                    </h3>
                                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                                        {workflow.description || "No description provided."}
                                    </p>
                                </div>
                             </div>

                             {/* Footer / Meta */}
                             <div className={`
                                ${viewMode === 'grid' 
                                    ? 'flex items-center justify-between pt-4 mt-4 border-t border-slate-100' 
                                    : 'flex items-center gap-8 text-sm text-slate-500'}
                             `}>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                    <Clock size={14} />
                                    <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className={`flex items-center gap-1 text-xs font-semibold text-emerald-600 
                                    ${viewMode === 'grid' ? 'opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300' : 'hidden md:flex'}
                                `}>
                                    Open <ArrowRight size={14} />
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

