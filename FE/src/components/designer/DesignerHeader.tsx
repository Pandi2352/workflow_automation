import React from 'react';
import { Save, Loader2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DesignerHeaderProps {
    workflowId: string;
    onSave: () => void;
    isSaving: boolean;
}

// @ts-ignore
export const DesignerHeader: React.FC<DesignerHeaderProps> = ({ workflowId, onSave, isSaving }) => {
    const navigate = useNavigate();


    return (
        <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 shadow-sm">
            <div className="flex items-center gap-2 text-sm">
                <button 
                    onClick={() => navigate('/')}
                    className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-slate-400">Personal</span>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-slate-700">My workflow</span>
                <button className="ml-2 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
                    + Add tag
                </button>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4 text-xs text-slate-500">
                     <span>Inactive</span>
                     <div className="w-8 h-4 bg-slate-200 rounded-full relative">
                        <div className="w-3 h-3 bg-white rounded-full absolute top-[2px] left-[2px] shadow-sm"></div>
                     </div>
                </div>

                <div className="h-4 w-px bg-slate-200 mx-2"></div>

                <button 
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-all border border-transparent hover:border-slate-200 cursor-pointer disabled:cursor-not-allowed"
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                </button>
            </div>
        </div>
    );
};
