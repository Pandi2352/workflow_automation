import React from 'react';
import { AlertCircle, Save, Trash2, X } from 'lucide-react';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onSaveAndExit: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({ 
    isOpen, 
    onSaveAndExit, 
    onDiscard, 
    onCancel 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-amber-50 rounded-full shrink-0">
                            <AlertCircle className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Unsaved Changes</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                You have unsaved changes in your workflow. If you leave now, your progress will be lost.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-6">
                        <button 
                            onClick={onSaveAndExit}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
                        >
                            <Save size={18} />
                            Save & Exit
                        </button>
                        
                        <button 
                            onClick={onDiscard}
                            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                            Discard Changes
                        </button>
                        
                        <button 
                            onClick={onCancel}
                            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 font-medium py-2 rounded-lg transition-colors"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
