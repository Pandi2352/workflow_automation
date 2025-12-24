import React, { useState } from 'react';

interface JsonViewerProps {
    data: any;
    level?: number;
    initialExpanded?: boolean;
    maxStringLength?: number;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ 
    data, 
    level = 0, 
    initialExpanded = false, 
    maxStringLength = 200 
}) => {
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({
        'self': initialExpanded
    });

    const toggleExpand = (key: string) => {
        setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (data === null) return <span className="text-slate-400 font-bold">null</span>;
    if (data === undefined) return <span className="text-slate-400 font-bold">undefined</span>;

    if (typeof data === 'string') {
        const isLong = data.length > maxStringLength;
        const isExpanded = expandedKeys['self'];
        
        // Preserve whitespace formatting for OCR text results
        if (!isLong) return <span className="text-green-600 whitespace-pre-wrap break-all">"{data}"</span>;

        return (
            <span>
                <span className="text-green-600 whitespace-pre-wrap break-all">
                    {isExpanded ? `"${data}"` : `"${data.substring(0, maxStringLength)}..."`}
                </span>
                <button 
                    onClick={() => toggleExpand('self')}
                    className="ml-1.5 text-[9px] text-purple-600 hover:text-purple-800 font-bold bg-purple-50 hover:bg-purple-100 border border-purple-100 px-1.5 py-0.5 rounded cursor-pointer select-none transition-colors inline-block align-middle"
                >
                    {isExpanded ? 'Less' : 'More'}
                </button>
            </span>
        );
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
        return <span className="text-blue-600 font-semibold">{String(data)}</span>;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return <span className="text-slate-500">[]</span>;
        
        return (
            <div className="inline-block align-top">
                <span className="text-slate-600 font-bold">[</span>
                {/* Removed ml-0.5 for strict alignment */}
                <div style={{ paddingLeft: '12px', borderLeft: '1px solid #e2e8f0' }} className="">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-start leading-6">
                            <div className="flex-1 min-w-0">
                                <JsonViewer 
                                    data={item} 
                                    level={level + 1} 
                                    initialExpanded={initialExpanded}
                                    maxStringLength={maxStringLength}
                                />
                                {index < data.length - 1 && <span className="text-slate-400 select-none">,</span>}
                            </div>
                        </div>
                    ))}
                </div>
                <span className="text-slate-600 font-bold">]</span>
            </div>
        );
    }

    if (typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length === 0) return <span className="text-slate-500">{'{'}{'}'}</span>;
        
        return (
            <div className="inline-block align-top w-full">
                <span className="text-slate-600 font-bold">{'{'}</span>
                {/* Removed ml-0.5 for strict alignment */}
                <div style={{ paddingLeft: '12px', borderLeft: '1px solid #e2e8f0' }} className="">
                    {keys.map((key, index) => (
                        <div key={key} className="flex items-start leading-6">
                            <span className="text-purple-700 font-semibold mr-1.5 shrink-0 opacity-90 select-none">"{key}":</span>
                            <div className="flex-1 min-w-0">
                                <JsonViewer 
                                    data={data[key]} 
                                    level={level + 1} 
                                    initialExpanded={initialExpanded}
                                    maxStringLength={maxStringLength}
                                />
                                {index < keys.length - 1 && <span className="text-slate-400 select-none">,</span>}
                            </div>
                        </div>
                    ))}
                </div>
                <span className="text-slate-600 font-bold">{'}'}</span>
            </div>
        );
    }

    return <span>{String(data)}</span>;
};

export default JsonViewer;
