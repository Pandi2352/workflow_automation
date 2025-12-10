
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface WorkflowMetadataModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; description: string; active: boolean }) => void;
    initialData?: {
        name: string;
        description: string;
        active: boolean;
    };
}

export const WorkflowMetadataModal: React.FC<WorkflowMetadataModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData 
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setDescription(initialData.description || '');
            setActive(initialData.active ?? true);
        } else if (isOpen) {
            // Defaults for new
            setName('Untitled Workflow');
            setDescription('');
            setActive(true);
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, description, active });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Workflow Settings">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Workflow Name
                    </label>
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="e.g., Daily Report Generator"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description
                    </label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        placeholder="Describe what this workflow does..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="active-toggle"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="active-toggle" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                        Enable Workflow
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!name.trim()}>
                        Save Settings
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
