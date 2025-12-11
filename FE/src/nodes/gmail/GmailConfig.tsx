import { useWorkflowStore } from '../../store/workflowStore';

export const GmailConfig = ({ selectedNode }: { selectedNode: any }) => {
    const { updateNodeData, credentials } = useWorkflowStore();
    const config = selectedNode.data?.config || {};

    return (
        <div className="space-y-6">
            {/* Credential Selector */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Google Account</label>
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
                                        'http://localhost:4000/api/auth/gmail',
                                        'Gmail Auth',
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
                            {credentials?.filter((c: any) => c.provider === 'gmail').map((cred: any) => (
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

            {/* Max Results */}
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

            {/* Query */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                    <span>Search Query (Optional)</span>
                    <a href="https://support.google.com/mail/answer/7190" target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700">Syntax Help</a>
                </label>
                <input 
                    type="text"
                    placeholder="subject:invoice has:attachment"
                    value={config.query || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { config: { ...config, query: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                    Leave empty to fetch latest emails from Inbox.
                </p>
            </div>
        </div>
    );
};
