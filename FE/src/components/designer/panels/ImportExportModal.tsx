import React from 'react';
import { Modal } from '../../../common/Modal';
import { Button } from '../../../common/Button';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    exportJson: string;
    onCopyExport: () => void;
    onDownloadExport: () => void;
    importJson: string;
    onImportJsonChange: (value: string) => void;
    importName: string;
    onImportNameChange: (value: string) => void;
    onImport: () => void;
    isImporting: boolean;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
    isOpen,
    onClose,
    exportJson,
    onCopyExport,
    onDownloadExport,
    importJson,
    onImportJsonChange,
    importName,
    onImportNameChange,
    onImport,
    isImporting,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import / Export Workflow"
            size="xl"
            footer={
                <Button variant="ghost" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="space-y-3">
                    <div className="text-sm font-semibold text-slate-700">Export JSON</div>
                    <p className="text-xs text-slate-500">
                        Share or back up your workflow with schema versioning included.
                    </p>
                    <textarea
                        readOnly
                        className="w-full h-72 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-700"
                        value={exportJson}
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={onCopyExport}>
                            Copy JSON
                        </Button>
                        <Button variant="primary" onClick={onDownloadExport}>
                            Download JSON
                        </Button>
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="text-sm font-semibold text-slate-700">Import JSON</div>
                    <p className="text-xs text-slate-500">
                        Paste an exported bundle or a raw workflow payload.
                    </p>
                    <textarea
                        className="w-full h-56 text-xs font-mono bg-white border border-slate-200 rounded-md p-3 text-slate-700"
                        placeholder="Paste workflow JSON here"
                        value={importJson}
                        onChange={(e) => onImportJsonChange(e.target.value)}
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">Override name (optional)</label>
                        <input
                            className="w-full h-10 text-sm border border-slate-200 rounded-md px-3 text-slate-700"
                            placeholder="New workflow name"
                            value={importName}
                            onChange={(e) => onImportNameChange(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-end">
                        <Button variant="primary" onClick={onImport} isLoading={isImporting} disabled={isImporting}>
                            Import workflow
                        </Button>
                    </div>
                </section>
            </div>
        </Modal>
    );
};

