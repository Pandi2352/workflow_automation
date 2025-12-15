
import React, { useEffect, useState } from 'react';
import { Key, Plus, Trash2, Copy } from 'lucide-react';
import { credentialsService, type Credential } from '../../services/api/credentials';
import { GeminiCredentialModal } from './GeminiCredentialModal';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';

export const CredentialsList: React.FC = () => {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const loadCredentials = async () => {
        try {
            const data = await credentialsService.getAll();
            setCredentials(data);
        } catch (error) {
            console.error('Failed to load credentials', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCredentials();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await credentialsService.delete(deleteId);
            setCredentials(prev => prev.filter(c => c._id !== deleteId));
        } catch (error) {
            console.error('Failed to delete credential', error);
        } finally {
            setDeleteId(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast logic could go here
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto -mt-10 relative z-10">
            <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
                    <span>{credentials.length} credentials</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-emerald-700">All Secure</span>
                </div>
                
                <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Credential
                </Button>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                     {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-200 rounded-lg" />)}
                </div>
            ) : credentials.length === 0 ? (
                 <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                        <Key size={24} className="text-slate-400" />
                    </div>
                    <h3 className="text-slate-900 font-medium mb-1">No credentials found</h3>
                    <p className="text-slate-500 text-sm mb-6">Connect your external services safely.</p>
                    <Button onClick={() => setIsCreateModalOpen(true)} size="sm">Connect Account</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {credentials.map(cred => (
                        <div key={cred._id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Key size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{cred.name}</h4>
                                        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{cred.provider}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setDeleteId(cred._id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 font-mono text-xs text-slate-500 mb-4 flex items-center justify-between">
                                <span className="truncate max-w-[200px]">•••• •••• •••• {cred.accessToken.slice(-4)}</span>
                                <button 
                                    onClick={() => copyToClipboard(cred.accessToken)}
                                    className="text-slate-400 hover:text-slate-700 transition-colors"
                                    title="Copy ID"
                                >
                                    <Copy size={12} />
                                </button>
                            </div>

                            <div className="text-[10px] text-slate-400 font-medium pt-3 border-t border-slate-50 uppercase tracking-wide">
                                Added {new Date(cred.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <GeminiCredentialModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadCredentials}
            />

            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Delete Credential"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white border-none" onClick={handleDelete}>Delete</Button>
                    </>
                }
            >
                <div>
                   <p className="text-slate-600 text-sm">
                       Are you sure you want to delete this credential? Logic relying on it might break.
                   </p>
                </div>
            </Modal>
        </div>
    );
};
