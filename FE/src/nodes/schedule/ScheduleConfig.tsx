import { useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { HelpCircle } from 'lucide-react';

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
                config: { ...config, interval: 'hours', value: 1 }
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
            {/* Interval Selector */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{/*Trigger Interval*/}</label>
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-slate-700">Trigger Interval</span>
                    <div className="flex bg-slate-100 rounded-md p-0.5">
                         <button className="px-2 py-0.5 text-xs font-medium rounded bg-white shadow-sm text-slate-700">Fixed</button>
                         <button className="px-2 py-0.5 text-xs font-medium rounded text-slate-500 hover:text-slate-700">Expression</button>
                    </div>
                </div>
                
                <select
                    value={config.interval || 'hours'}
                    onChange={(e) => handleChange('interval', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                >
                    {intervals.map(int => (
                        <option key={int.value} value={int.value}>{int.label}</option>
                    ))}
                </select>
            </div>

            {/* Dynamic Value Input */}
            {config.interval !== 'custom' && (
                <div className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {config.interval ? config.interval.charAt(0).toUpperCase() + config.interval.slice(1) : ''} Between Triggers
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={config.value || ''}
                        onChange={(e) => handleChange('value', e.target.value)}
                         className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="30"
                    />
                    {config.interval === 'seconds' && (
                        <p className="text-xs text-slate-500 mt-1">Must be in range 1-59</p>
                    )}
                </div>
            )}

            {/* Custom Cron Input */}
            {config.interval === 'custom' && (
                <div className="mb-5">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                        <span>Cron Expression</span>
                        <a href="https://crontab.guru/" target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
                            <HelpCircle size={12}/> Help
                        </a>
                    </label>
                    <input
                        type="text"
                        value={config.cronExpression || ''}
                        onChange={(e) => handleChange('cronExpression', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="* * * * *"
                    />
                    <p className="text-xs text-slate-500 mt-1">Use standard cron syntax (e.g. <code>*/5 * * * *</code> for every 5 mins)</p>
                </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                    This workflow will run on the schedule you define here once you <strong>activate</strong> it.
                    <br/><br/>
                    For testing, you can also trigger it manually: by going back to the canvas and clicking 'Test Node' or 'Execute Workflow'.
                </p>
            </div>
        </div>
    );
};
