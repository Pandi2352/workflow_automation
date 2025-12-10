import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useWorkflowStore } from '../../../../store/workflowStore';
import { axiosInstance } from '../../../../api/axiosConfig';
import { API_ENDPOINTS } from '../../../../api/endpoints';

// Internal Folder Selector Component
const FolderSelectorField = ({ credentialId, value, onFolderSelect }: any) => {
    const [folders, setFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchFolders = () => {
        if (!credentialId) return;
        setLoading(true);
        setError('');
        
        axiosInstance.get(API_ENDPOINTS.GOOGLE_DRIVE.LIST, {
            params: { type: 'folders', credentialId }
        })
        .then(res => {
            setFolders(Array.isArray(res.data) ? res.data : []);
            setLoading(false);
        })
        .catch(err => {
            console.error('Failed to fetch folders', err);
            setError('Failed to load folders');
            setLoading(false);
        });
    };

    useEffect(() => {
        if (credentialId) {
            fetchFolders();
        } else {
            setFolders([]);
        }
    }, [credentialId]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedFolder = folders.find(f => f.id === selectedId);
        if (onFolderSelect) {
            onFolderSelect(selectedId, selectedFolder?.name);
        }
    };

    return (
        <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                <span>Folder</span>
                {loading && <span className="text-xs text-indigo-500 animate-pulse">Loading...</span>}
            </label>
            <div className="relative">
                <select
                    value={value || ''}
                    onChange={handleChange}
                    disabled={!credentialId || loading}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60 transition-all"
                >
                    <option value="">{loading ? 'Loading folders...' : (credentialId ? 'Select a specific folder...' : 'Select Credential First')}</option>
                    {folders.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
                {credentialId && !loading && (
                    <button 
                        onClick={fetchFolders}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1"
                        title="Refresh Folders"
                    >
                         <RefreshCw size={14} />
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export const GoogleDriveConfig = ({ selectedNode }: { selectedNode: any }) => {
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
                                        'http://localhost:4000/api/auth/google',
                                        'Google Auth',
                                        `width=${width},height=${height},top=${top},left=${left}`
                                    );
                                } else {
                                    const newConfig = { 
                                        ...config, 
                                        credentialId: val,
                                        operation: 'list_files'
                                    };
                                    if (val !== config.credentialId) {
                                        newConfig.folderId = null;
                                        newConfig.folderId_name = null;
                                    }
                                    updateNodeData(selectedNode.id, { config: newConfig });
                                }
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                        >
                            <option value="">-- Select --</option>
                            {credentials?.filter((c: any) => c.provider === 'google').map((cred: any) => (
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

            {/* Folder Selector (Always shown if Credential Selected) */}
            {config.credentialId && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                     <FolderSelectorField 
                        credentialId={config.credentialId}
                        value={config.folderId}
                        onFolderSelect={(id: string, name: string) => {
                            updateNodeData(selectedNode.id, {
                                config: { ...config, folderId: id, folderId_name: name }
                            });
                        }}
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Files from the selected folder will be outputted as a list.
                    </p>
                </div>
            )}
        </div>
    );

};
