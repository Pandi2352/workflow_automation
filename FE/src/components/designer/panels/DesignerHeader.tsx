import React from 'react';
import { Save, ChevronLeft, PencilRulerIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../common/Button';
import { useWorkflowStore } from '../../../store/workflowStore';
import { Switch } from '../../../common/Switch';

interface DesignerHeaderProps {
    workflowId: string;
    onSave: () => void;
    isSaving: boolean;
    onActiveChange?: (active: boolean) => void;
    onOpenImportExport?: () => void;
}

// @ts-ignore
export const DesignerHeader: React.FC<DesignerHeaderProps> = ({ workflowId, onSave, isSaving, onActiveChange, onOpenImportExport }) => {
    const navigate = useNavigate();
    const { 
        workflowName, 
        activeTab, 
        setActiveTab, 
        isWorkflowActive, 
        setWorkflowMetadata,
        workflowDescription
    } = useWorkflowStore();
    
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = React.useState(false);
    const [tempDescription, setTempDescription] = React.useState(workflowDescription);
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [tempName, setTempName] = React.useState(workflowName);
    const nameInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setTempDescription(workflowDescription);
    }, [workflowDescription]);

    React.useEffect(() => {
        setTempName(workflowName);
    }, [workflowName]);

    React.useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [isEditingName]);

    const handleNameSave = () => {
        if (tempName.trim()) {
            setWorkflowMetadata({ workflowName: tempName });
        } else {
            setTempName(workflowName); // Revert if empty
        }
        setIsEditingName(false);
    };

    const handleDescriptionSave = () => {
        setWorkflowMetadata({ workflowDescription: tempDescription });
        setIsDescriptionModalOpen(false);
    };

    return (
        <>
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20 relative">
                {/* Left: Breadcrumbs & Name */}
                <div className="flex items-center gap-2 text-sm min-w-[300px]">
                     <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-1 h-auto text-slate-500 hover:text-slate-900 bg-transparent border-none cursor-pointer flex items-center justify-center"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => navigate('/dashboard')}>Personal</span>
                    <span className="text-slate-300">/</span>
                    
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            className="font-semibold text-slate-700 bg-transparent border border-[#10b981] rounded px-1 -ml-1 focus:outline-none min-w-[150px]"
                            style={{ width: `${Math.max(tempName.length, 5) + 2}ch` }}
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                        />
                    ) : (
                        <div 
                            className="font-semibold text-slate-700 border border-transparent hover:border-slate-200 rounded px-1 -ml-1 cursor-text transition-colors truncate max-w-[200px]"
                            onClick={() => setIsEditingName(true)}
                        >
                            {workflowName}
                        </div>
                    )}
                    
                    <Button 
                        variant="ghost" 
                        className="text-slate-400 hover:text-slate-600 p-1 h-auto"
                        onClick={() => setIsDescriptionModalOpen(true)}
                    >
                        <PencilRulerIcon size={14} />
                    </Button>
                </div>

                {/* Center: Tabs */}
                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 flex bg-gray-300 p-1 rounded-sm border border-slate-200">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`
                            px-4 py-1.5 text-xs font-medium rounded-sm transition-all cursor-pointer
                            ${activeTab === 'editor' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('executions')}
                        className={`
                            px-4 py-1.5 text-xs font-medium rounded-sm transition-all cursor-pointer
                            ${activeTab === 'executions' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        Executions
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4 min-w-[300px] justify-end">
                    <div className="flex items-center gap-2">
                         <span className="text-xs text-slate-500 font-medium">{isWorkflowActive ? 'Active' : 'Inactive'}</span>
                        <Switch 
                            checked={isWorkflowActive} 
                            onChange={(checked) => {
                                if (onActiveChange) {
                                    onActiveChange(checked);
                                } else {
                                    setWorkflowMetadata({ isWorkflowActive: checked });
                                }
                            }} 
                            size="md"
                        />
                    </div>

                    <div className="h-4 w-px bg-slate-200"></div>

                    <Button 
                        variant="ghost"
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white"
                        onClick={onOpenImportExport}
                    >
                        Import / Export
                    </Button>

                    <Button 
                        onClick={onSave}
                        isLoading={isSaving}
                        disabled={isSaving}
                        variant="primary"
                        size="sm"
                        className="text-xs font-medium hover:bg-[#059669]"
                        leftIcon={<Save size={14} />}
                    >
                        Save
                    </Button>
                </div>
            </div>

            {/* Description Popover */}
            {isDescriptionModalOpen && (
                <>
                    {/* Transparent Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsDescriptionModalOpen(false)}
                    />
                    
                    {/* Popover Content */}
                    <div className="absolute top-12 left-[320px] z-50 w-[400px] bg-white rounded-md border border-gray-200 p-4 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                        <textarea
                            className="w-full h-32 p-3 border border-slate-200 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] text-slate-600 placeholder:text-slate-400"
                            placeholder="Edit workflow description"
                            value={tempDescription}
                            onChange={(e) => setTempDescription(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-3">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setIsDescriptionModalOpen(false)}
                                className="text-slate-500 hover:text-slate-700"
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleDescriptionSave} 
                                className="bg-[#10b981] hover:bg-[#10b981]/80 border-none text-white shadow-none"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

