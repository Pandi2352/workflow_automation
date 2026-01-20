import { useEffect } from 'react';
import { useWorkflowStore } from '../../../store/workflowStore';

export const ScheduleConfig = ({ selectedNode }: { selectedNode: any }) => {
    const { updateNodeData } = useWorkflowStore();
    const config = selectedNode.data?.config || {};

    const intervals = [
        { label: 'Seconds', value: 'seconds' },
        { label: 'Minutes', value: 'minutes' },
        { label: 'Hours', value: 'hours' },
        { label: 'Days', value: 'days' },
        { label: 'Weeks', value: 'weeks' },
        { label: 'Months', value: 'months' },
        { label: 'Custom (Cron)', value: 'custom' },
    ];

    // Defaults
    useEffect(() => {
        if (!config.interval) {
            updateNodeData(selectedNode.id, {
                config: { ...config, interval: 'days', value: 1, hour: 7, minute: 0 }
            });
        }
    }, []);

    const handleChange = (key: string, value: any) => {
        updateNodeData(selectedNode.id, {
            config: { ...config, [key]: value }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    This workflow will run on the schedule you define here once you publish it.
                    For testing, you can also trigger it manually: by going back to the canvas and clicking 'execute workflow'
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight">Trigger Rules</h4>
                </div>

                {/* Interval Selector */}
                <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trigger Interval</label>
                        <div className="flex bg-slate-100 rounded-md p-0.5 scale-90">
                             <button className="px-2 py-0.5 text-[10px] font-bold rounded bg-white shadow-sm text-slate-700 uppercase">Fixed</button>
                             <button className="px-2 py-0.5 text-[10px] font-bold rounded text-slate-400 hover:text-slate-600 uppercase">Expression</button>
                        </div>
                    </div>
                    
                    <select
                        value={config.interval || 'days'}
                        onChange={(e) => handleChange('interval', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                    >
                        {intervals.map(int => (
                            <option key={int.value} value={int.value}>{int.label}</option>
                        ))}
                    </select>
                </div>

                {/* Value Input */}
                {config.interval !== 'custom' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {config.interval ? config.interval.charAt(0).toUpperCase() + config.interval.slice(1) : ''} Between Triggers
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={config.value || ''}
                            onChange={(e) => handleChange('value', parseInt(e.target.value))}
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                            placeholder="1"
                        />
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            Must be in range 1-31
                        </p>
                    </div>
                )}

                {/* Trigger at Hour */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trigger at Hour</label>
                    <select
                        value={config.hour || 7}
                        onChange={(e) => handleChange('hour', parseInt(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                    >
                        {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={i}>{i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i-12}pm`}</option>
                        ))}
                    </select>
                </div>

                {/* Trigger at Minute */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trigger at Minute</label>
                    <input
                        type="number"
                        min="0"
                        max="59"
                        value={config.minute || 0}
                        onChange={(e) => handleChange('minute', parseInt(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                        placeholder="0"
                    />
                </div>

                <button className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest mt-2">
                    Add Rule
                </button>
            </div>
        </div>
    );
};

