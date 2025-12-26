import React, { useState } from 'react';
import { X, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../../common/Button';
import { workflowService } from '../../services/api/workflows';

interface WorkflowGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWorkflowGenerated: (nodes: any[], edges: any[]) => void;
}

const SUGGESTIONS = [
    "When I receive an email with an invoice, use Smart Extraction to get the data and save it to MongoDB.",
    "Every day at 9am, look for new files in Google Drive, OCR them, and email me a summary.",
    "Listen for new emails, check if the subject contains 'Urgent', and if so, categorize it using AI."
];

export const WorkflowGeneratorModal: React.FC<WorkflowGeneratorModalProps> = ({ 
    isOpen, 
    onClose,
    onWorkflowGenerated 
}) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await workflowService.generateAIWorkflow(prompt);
            onWorkflowGenerated(result.nodes, result.edges);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to generate workflow. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={120} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="text-yellow-300" />
                            AI Workflow Generator
                        </h2>
                        <p className="text-indigo-100 mt-2 text-sm opacity-90">
                            Describe your automation needs in plain English, and I'll build the workflow for you.
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., When a new invoice arrives in Gmail, extract the data and save it to Google Drive..."
                            className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none text-gray-700 placeholder:text-gray-400 text-base"
                            disabled={isLoading}
                        />
                        {error && (
                            <div className="mt-2 text-red-500 text-sm flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Suggestions */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
                            Try asking for:
                        </label>
                        <div className="space-y-2">
                            {SUGGESTIONS.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setPrompt(suggestion)}
                                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group flex items-center justify-between"
                                >
                                    <span className="text-sm text-gray-600 group-hover:text-indigo-700 truncate">
                                        {suggestion}
                                    </span>
                                    <ArrowRight size={14} className="text-indigo-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isLoading}
                            className={`
                                relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5
                                ${isLoading ? 'opacity-90 cursor-wait' : ''}
                            `}
                        >
                            <span className="relative z-10 flex items-center gap-2 font-semibold">
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Generating Magic...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Generate Workflow
                                    </>
                                )}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
