import React, { useState } from 'react';
import { X, Key, Save } from 'lucide-react';
import { Button } from '../../common/Button';
import { axiosInstance } from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

interface GeminiCredentialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const GeminiCredentialModal: React.FC<GeminiCredentialModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await axiosInstance.post(API_ENDPOINTS.CREDENTIALS.LIST, {
                name,
                provider: 'GEMINI',
                accessToken: apiKey,
                metadata: {}
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save credential');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Key size={18} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Add Gemini API Key</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Credential Name
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none"
                                placeholder="e.g. My Gemini Key"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                API Key
                            </label>
                            <input
                                type="password"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none font-mono"
                                placeholder="AIzaSy..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <span>Get your key from</span>
                                <a 
                                    href="https://aistudio.google.com/app/apikey" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Google AI Studio
                                </a>
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={onClose}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            isLoading={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                            leftIcon={<Save size={16} />}
                        >
                            Save Credential
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
