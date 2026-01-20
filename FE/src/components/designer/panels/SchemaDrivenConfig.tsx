import React, { memo, useMemo } from 'react';
import { useWorkflowStore } from '../../../store/workflowStore';

interface SchemaDrivenConfigProps {
    selectedNode: any;
    focusColor?: string;
}

const defaultFocus = 'focus:ring-2 focus:ring-indigo-500';

export const SchemaDrivenConfig: React.FC<SchemaDrivenConfigProps> = memo(({ selectedNode, focusColor }) => {
    const { updateNodeData, nodeDefinitions, credentials } = useWorkflowStore();

    const handleConfigChange = (key: string, value: any) => {
        const currentConfig = selectedNode.data?.config || {};
        updateNodeData(selectedNode.id, {
            config: { ...currentConfig, [key]: value }
        });
    };

    const definition = nodeDefinitions.find(def => def.type === selectedNode.type);
    const configSchema = definition?.configSchema || {};
    const nodeConfig = (selectedNode.data?.config || {}) as Record<string, any>;
    const focusRing = focusColor || defaultFocus;
    const configEntries = useMemo(() => Object.entries(configSchema), [configSchema]);

    const renderField = (key: string, field: any) => {
        if (field.condition) {
            const [condKey, condValue] = Object.entries(field.condition)[0];
            if (nodeConfig[condKey] !== condValue) return null;
        }

        if (field.type === 'credential') {
            return (
                <div key={key} className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.description}</label>
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <select
                                value={nodeConfig['credentialId'] || ''}
                                onChange={(e) => handleConfigChange('credentialId', e.target.value)}
                                className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none ${focusRing} appearance-none`}
                            >
                                <option value="">-- Select Credential --</option>
                                {credentials?.filter((c: any) => c.provider === field.provider).map((cred: any) => (
                                    <option key={cred._id} value={cred._id}>
                                        {cred.name || cred.metadata?.email || 'Unnamed Credential'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            );
        }

        if (field.type === 'select') {
            return (
                <div key={key} className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.description}</label>
                    <select
                        value={nodeConfig[key] ?? field.default ?? ''}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none ${focusRing} transition-all`}
                    >
                        {(field.options || []).map((opt: string) => (
                            <option key={opt} value={opt}>
                                {opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        if (field.type === 'boolean') {
            return (
                <div key={key} className="mb-5 flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={Boolean(nodeConfig[key])}
                        onChange={(e) => handleConfigChange(key, e.target.checked)}
                        className="h-4 w-4 text-emerald-600 border-slate-300 rounded"
                    />
                    <label className="text-sm font-semibold text-slate-700">{field.description}</label>
                </div>
            );
        }

        if (field.type === 'number') {
            return (
                <div key={key} className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.description}</label>
                    <input
                        type="number"
                        value={nodeConfig[key] ?? field.default ?? ''}
                        onChange={(e) => handleConfigChange(key, Number(e.target.value))}
                        className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none ${focusRing} transition-all`}
                    />
                </div>
            );
        }

        if (field.type === 'textarea' || field.type === 'text') {
            return (
                <div key={key} className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.description}</label>
                    <textarea
                        value={nodeConfig[key] ?? field.default ?? ''}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        rows={field.rows || 3}
                        className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none ${focusRing} transition-all resize-none`}
                        placeholder={field.placeholder || ''}
                    />
                </div>
            );
        }

        if (field.type === 'json') {
            return (
                <div key={key} className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.description}</label>
                    <textarea
                        value={nodeConfig[key] ? JSON.stringify(nodeConfig[key], null, 2) : ''}
                        onChange={(e) => {
                            try {
                                handleConfigChange(key, JSON.parse(e.target.value));
                            } catch {
                                handleConfigChange(key, e.target.value);
                            }
                        }}
                        rows={field.rows || 5}
                        className={`w-full bg-slate-900 border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none ${focusRing} transition-all`}
                        placeholder={field.placeholder || '{}'}
                    />
                </div>
            );
        }

        // Default: string input
        return (
            <div key={key} className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.description}</label>
                <input
                    type="text"
                    value={nodeConfig[key] ?? field.default ?? ''}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none ${focusRing} transition-all`}
                />
            </div>
        );
    };

    return (
        <>
            {configEntries.map(([key, field]) => renderField(key, field))}

            {!definition && selectedNode.type === 'input' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-amber-900 mb-2">Test Payload (JSON)</label>
                    <textarea
                        className="w-full bg-white border border-amber-300 rounded-lg p-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 h-32"
                        placeholder='{"value": 10}'
                        defaultValue={JSON.stringify(selectedNode.data?.inputs || {}, null, 2)}
                        onChange={(e) => {
                            try {
                                updateNodeData(selectedNode.id, { inputs: JSON.parse(e.target.value) });
                            } catch {}
                        }}
                    />
                </div>
            )}
        </>
    );
});

