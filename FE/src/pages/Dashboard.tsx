import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Activity, Calendar } from 'lucide-react';
import { workflowService } from '../services/api/workflows';
import type { SampleWorkflow } from '../types/workflow.types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<SampleWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-10 w-full h-full max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="mb-10">
         <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
                <p className="text-slate-500 text-sm mt-1">All the workflows, credentials and data tables you have access to</p>
            </div>
            <div className="flex gap-3">
                <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-md text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer">
                    <Activity size={16} />
                    Try an AI workflow
                </button>
                <button 
                    onClick={handleCreateWorkflow}
                    className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium text-sm shadow-sm cursor-pointer"
                >
                    <Plus size={18} />
                    Create workflow
                </button>
            </div>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden mb-8">
            {[
                { label: 'Prod. executions', val: '0', sub: 'Last 7 days', color: 'text-slate-900' },
                { label: 'Failed prod. executions', val: '0', sub: 'Last 7 days', color: 'text-red-600' },
                { label: 'Failure rate', val: '0%', sub: 'Last 7 days', color: 'text-slate-900' },
                { label: 'Run time (avg.)', val: '0s', sub: 'Last 7 days', color: 'text-slate-900' },
            ].map((stat, i) => (
                <div key={i} className="bg-white p-4 h-full">
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                    <p className="text-xs text-slate-400 mb-2">{stat.sub}</p>
                    <div className="flex items-end gap-2">
                        <span className={`text-xl font-semibold ${stat.color}`}>{stat.val}</span>
                    </div>
                </div>
            ))}
         </div>

         {/* Tabs */}
         <div className="flex gap-8 border-b border-slate-200 mb-6">
            {['Workflows', 'Credentials', 'Executions', 'Variables', 'Data tables'].map((tab, i) => (
                <div 
                    key={tab} 
                    className={`pb-3 text-sm font-medium cursor-pointer transition-colors ${i === 0 ? 'text-[#10b981] border-b-2 border-[#10b981]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {tab}
                </div>
            ))}
         </div>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-500 mb-4">No workflows found</p>
            <button 
              onClick={handleCreateWorkflow}
              className="text-[#10b981] hover:underline font-medium cursor-pointer"
            >
              Create your first workflow
            </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div className="col-span-6">Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Last Updated</div>
                <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* List Items */}
            <div className="divide-y divide-slate-100">
                {workflows.map((workflow) => (
                    <div 
                        key={workflow._id} 
                        className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/workflow/${workflow._id}`)}
                    >
                        <div className="col-span-6">
                            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-[#10b981] transition-colors">{workflow.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">Personal</span>
                                <p className="text-slate-400 text-xs truncate max-w-[300px]">{workflow.description}</p>
                            </div>
                        </div>
                        <div className="col-span-2">
                             {/* Mock Status Toggle */}
                             <div className="w-9 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                                <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] left-[3px] shadow-sm"></div>
                             </div>
                        </div>
                        <div className="col-span-3 text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(workflow.createdAt).toLocaleDateString()}
                        </div>
                        <div className="col-span-1 flex justify-end">
                             <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
                                <ArrowRight size={16} />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
