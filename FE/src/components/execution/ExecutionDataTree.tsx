import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface ExecutionDataTreeProps {
    data: any;
    level?: number;
    initiallyExpanded?: boolean;
    pathPrefix?: string;
    truncate?: boolean;
}

const getType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
};

const ValueDisplay: React.FC<{ value: any, type: string }> = ({ value, type }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const stringValue = String(value);
    const shouldTruncate = type === 'string' && stringValue.length > 100;

    if (type === 'string') {
        return (
            <span className="break-all whitespace-pre-wrap">
                <span className="text-emerald-600 font-mono text-[11px]">
                    "{shouldTruncate && !isExpanded ? stringValue.slice(0, 100) + '...' : stringValue}"
                </span>
                {shouldTruncate && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="ml-2 text-[9px] text-blue-500 hover:text-blue-700 hover:underline font-medium"
                    >
                        {isExpanded ? 'See Less' : 'See More'}
                    </button>
                )}
            </span>
        );
    }
    
    switch (type) {
        case 'number':
            return <span className="text-amber-600 font-mono text-[11px]">{value}</span>;
        case 'boolean':
            return <span className="text-purple-600 font-mono text-[11px] font-bold">{value.toString()}</span>;
        case 'null':
            return <span className="text-slate-400 font-mono text-[11px] italic">null</span>;
        case 'array':
            return <span className="text-slate-400 text-[10px] font-medium">Array({value.length})</span>;
        case 'object':
            return <span className="text-slate-400 text-[10px] font-medium">Object &#123; {Object.keys(value).length} &#125;</span>;
        default:
            return <span className="text-slate-600 text-[11px] break-all">{String(value)}</span>;
    }
};

export const ExecutionDataTree: React.FC<ExecutionDataTreeProps> = ({ 
    data, 
    level = 0, 
    initiallyExpanded = true,
    pathPrefix = '',
    truncate = false // Keeping prop for backwards compatibility/pass-through, though logic is now internal
}) => {
    // If data is null or primitive at root, just show it
    if (data === null || typeof data !== 'object') {
        return (
            <div className="flex items-center group w-full">
                <div className="p-1 overflow-hidden w-full">
                    <ValueDisplay value={data} type={getType(data)} />
                </div>
            </div>
        );
    }

    const keys = Object.keys(data);
    const isArray = Array.isArray(data);

    return (
        <div className={`w-full text-sm font-sans ${level === 0 ? 'bg-transparent' : ''}`}>
            {keys.map((key) => {
                const value = data[key];
                const type = getType(value);
                const isComposite = type === 'object' || type === 'array';
                const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
                const [copied, setCopied] = useState(false);

                const handleCopy = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                };

                return (
                    <div key={key} className="flex flex-col relative group/row w-full border-b border-gray-50/50 last:border-0">
                        {/* Row Content */}
                        <div 
                            className={`flex items-start py-1 px-1 hover:bg-slate-50 transition-colors cursor-pointer rounded-sm w-full`}
                            style={{ paddingLeft: `${level * 12 + 4}px` }}
                            onClick={() => isComposite && setIsExpanded(!isExpanded)}
                        >
                            {/* Expander Icon */}
                            <div className="w-4 flex-shrink-0 flex items-center justify-center mt-0.5 mr-1 text-slate-400">
                                {isComposite ? (
                                    isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                                ) : (
                                    <div className="w-3" />
                                )}
                            </div>

                            {/* Key & Value Container */}
                            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5 break-words"> 
                                {/* Key */}
                                <span className={`font-medium text-[11px] shrink-0 ${isArray ? 'text-slate-400 font-mono' : 'text-slate-700'}`}>
                                    {key}:
                                </span>

                                {/* Value Preview (for collapsed composite or scalar) */}
                                {(!isComposite || !isExpanded) && (
                                    <div className="flex-1 min-w-0">
                                        <ValueDisplay value={value} type={type} />
                                    </div>
                                )}
                            </div>

                            {/* Actions (Copy) */}
                            <div className={`opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center ml-2 px-1 shrink-0`}>
                                <button 
                                    onClick={handleCopy}
                                    className="p-1 text-slate-300 hover:text-blue-500 rounded transition-colors"
                                    title="Copy value"
                                >
                                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>

                        {/* Children (if expanded) */}
                        {isComposite && isExpanded && (
                            <div className="w-full">
                                <ExecutionDataTree 
                                    data={value} 
                                    level={level + 1} 
                                    initiallyExpanded={false}
                                    pathPrefix={isArray ? `${pathPrefix}[${key}]` : `${pathPrefix}.${key}`}
                                    truncate={truncate}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
             {keys.length === 0 && (
                <div className="p-1 text-[11px] text-slate-400 italic pl-6">
                    Empty {Array.isArray(data) ? 'Array' : 'Object'}
                </div>
            )}
        </div>
    );
};
