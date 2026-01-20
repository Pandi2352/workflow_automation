import { useEffect } from 'react';
import { useWorkflowStore } from '../../../store/workflowStore';

export const OutlookConfig = ({ selectedNode }: { selectedNode: any }) => {
    const { updateNodeData, credentials, fetchCredentials } = useWorkflowStore();
    const config = selectedNode.data?.config || {};
    const mode = config.mode || 'action';

    // Fetch credentials on mount if not already loaded
    useEffect(() => {
        fetchCredentials();
    }, [fetchCredentials]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && (event.data?.provider === 'outlook' || event.data?.provider === 'microsoft')) {
                // Update the current node's credentialId directly
                updateNodeData(selectedNode.id, { 
                    config: { 
                        ...(selectedNode.data?.config || {}), 
                        credentialId: event.data.credentialId 
                    } 
                });
                // Refresh the global credentials list
                fetchCredentials();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [selectedNode.id, updateNodeData, fetchCredentials]);

    const microsoftCredentials = credentials?.filter((c: any) => 
        c.provider === 'outlook' || c.provider === 'microsoft'
    ) || [];

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mode</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => updateNodeData(selectedNode.id, { config: { ...config, mode: 'action' } })}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'action' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Action
                    </button>
                    <button
                        onClick={() => updateNodeData(selectedNode.id, { config: { ...config, mode: 'trigger' } })}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'trigger' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Trigger
                    </button>
                </div>
            </div>

            {/* Credential Selector */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Microsoft Account</label>
                <div className="relative flex gap-2">
                    <div className="relative flex-1">
                        <select
                            value={config.credentialId || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__new__') {
                                    const width = 500;
                                    const height = 600;
                                    const left = (window.screen.width - width) / 2;
                                    const top = (window.screen.height - height) / 2;
                                    window.open(
                                        'http://localhost:4000/api/auth/outlook',
                                        'Outlook Auth',
                                        `width=${width},height=${height},top=${top},left=${left}`
                                    );
                                } else {
                                    updateNodeData(selectedNode.id, { 
                                        config: { ...config, credentialId: val } 
                                    });
                                }
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                        >
                            <option value="">-- Select --</option>
                            {microsoftCredentials.map((cred: any) => (
                                <option key={cred._id} value={cred._id}>
                                    {cred.name || cred.metadata?.email || 'Unnamed Credential'}
                                </option>
                            ))}
                            <option disabled>────────────────</option>
                            <option value="__new__" className="text-indigo-600 font-medium">+ Connect New Account</option>
                        </select>
                    </div>
                </div>
            </div>

            {mode === 'trigger' && (
                <>
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                             Event Type
                        </label>
                        <select
                            value={config.eventType || 'new_email'}
                            onChange={(e) => updateNodeData(selectedNode.id, { config: { ...config, eventType: e.target.value } })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="new_email">New Email Received</option>
                            <option value="email_with_attachment">Email with Attachment</option>
                        </select>
                    </div>

                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg mb-5">
                        <p className="text-[10px] text-indigo-600 font-medium">
                            This workflow will run automatically when a {config.eventType === 'email_with_attachment' ? 'new email with attachment' : 'new email'} arrives in your Outlook inbox.
                        </p>
                    </div>
                </>
            )}

            {/* Max Results - Only for Action */}
             {mode === 'action' && (
                <div className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Emails to Fetch</label>
                    <input 
                        type="number"
                        min="1"
                        max="50"
                        value={config.maxResults || 5}
                        onChange={(e) => updateNodeData(selectedNode.id, { config: { ...config, maxResults: parseInt(e.target.value) } })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
             )}

            {/* Query - Common but description changes */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                    <span>{mode === 'trigger' ? 'Filter Criteria (OData Filter)' : 'Search Query (Optional)'}</span>
                    <a href="https://learn.microsoft.com/en-us/graph/query-parameters?tabs=http#filter-parameter" target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700">Syntax Help</a>
                </label>
                <input 
                    type="text"
                    placeholder="receivedDateTime ge 2024-01-01T00:00:00Z"
                    value={config.query || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { config: { ...config, query: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                    {mode === 'trigger' ? 'e.g. "from/emailAddress/address eq \'boss@company.com\'"' : 'Leave empty to fetch latest emails from Inbox.'}
                </p>
            </div>
        </div>
    );
};

