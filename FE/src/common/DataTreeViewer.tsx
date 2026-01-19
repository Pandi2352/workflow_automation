import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface DataTreeViewerProps {
    data: any;
    level?: number;
    initiallyExpanded?: boolean;
    onDragStart?: (e: React.DragEvent, path: string) => void;
    pathPrefix?: string; // e.g. "OCRNode.outputs"
    truncate?: boolean;
}

const getType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
};

const ValueDisplay: React.FC<{ value: any, type: string, truncate?: boolean }> = ({ value, type, truncate }) => {
    const truncateClass = truncate ? "truncate max-w-[150px] inline-block align-bottom" : "break-all";
    
    switch (type) {
        case 'string':
            return <span className={`text-green-600 font-mono text-[11px] ${truncate ? "truncate max-w-[150px] inline-block align-bottom" : "break-all"}`}>"{value}"</span>;
        case 'number':
            return <span className="text-orange-600 font-mono text-[11px]">{value}</span>;
        case 'boolean':
            return <span className="text-purple-600 font-mono text-[11px] font-bold">{value.toString()}</span>;
        case 'null':
            return <span className="text-slate-500 font-mono text-[11px] italic font-medium">null</span>;
        case 'array':
            return <span className="text-slate-500 text-[10px] font-bold">Array({value.length})</span>;
        case 'object':
            return <span className="text-slate-500 text-[10px] font-bold">Object &#123; {Object.keys(value).length} &#125;</span>;
        default:
            return <span className={`text-slate-600 text-[11px] ${truncateClass}`}>{String(value)}</span>;
    }
};

export const DataTreeViewer: React.FC<DataTreeViewerProps> = ({ 
    data, 
    level = 0, 
    initiallyExpanded = true,
    onDragStart,
    pathPrefix = '',
    truncate = false
}) => {
    // If data is null or primitive at root, just show it
    if (data === null || typeof data !== 'object') {
        const rootPath = pathPrefix;
        return (
            <div 
                className={`flex items-center group ${onDragStart ? 'cursor-grab hover:bg-slate-50' : ''}`}
                draggable={!!onDragStart}
                onDragStart={(e) => onDragStart && onDragStart(e, rootPath)}
            >
                <div className="p-2 overflow-hidden">
                    <ValueDisplay value={data} type={getType(data)} truncate={truncate} />
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
                const [isHovered, setIsHovered] = useState(false);
                const [copied, setCopied] = useState(false);

                // Construct path for this item
                const currentPath = isArray 
                    ? `${pathPrefix}[${key}]`
                    : pathPrefix ? `${pathPrefix}.${key}` : key;

                const handleCopy = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                };

                return (
                    <div key={key} className="flex flex-col border-b border-slate-100 last:border-0 relative group select-none">
                        {/* Row Content */}
                        <div 
                            className={`flex items-start py-1.5 px-2 hover:bg-white transition-colors cursor-pointer ${onDragStart ? 'hover:bg-indigo-50/50' : ''}`}
                            style={{ paddingLeft: `${level * 16 + 8}px` }}
                            onClick={() => isComposite && setIsExpanded(!isExpanded)}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            draggable={!!onDragStart}
                            onDragStart={(e) => {
                                e.stopPropagation();
                                if (onDragStart) onDragStart(e, `{{${currentPath}}}`);
                            }}
                        >
                            {/* Expander Icon */}
                            <div className="w-5 flex-shrink-0 flex items-center justify-center mt-0.5 mr-1 text-slate-400">
                                {isComposite ? (
                                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                                ) : (
                                    <div className="w-4" />
                                )}
                            </div>

                            {/* Key & Value Container */}
                            <div className="flex-1 flex flex-wrap items-center gap-2 overflow-hidden">
                                {/* Key */}
                                <span className={`font-semibold text-xs ${isArray ? 'text-slate-400 font-mono' : 'text-slate-700'}`}>
                                    {key}:
                                </span>

                                {/* Value Preview (for collapsed composite or scalar) */}
                                {(!isComposite || !isExpanded) && (
                                    <ValueDisplay value={value} type={type} truncate={truncate} />
                                )}
                                
                                {/* Drag Hint */}
                                {onDragStart && isHovered && (
                                    <span className="text-[9px] text-slate-400 opacity-50 ml-2">Drag</span>
                                )}
                            </div>

                            {/* Actions (Copy) */}
                            {!onDragStart && (
                                <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-2 px-1`}>
                                    <button 
                                        onClick={handleCopy}
                                        className="p-1 text-slate-300 hover:text-blue-500 rounded transition-colors"
                                        title="Copy value"
                                    >
                                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Children (if expanded) */}
                        {isComposite && isExpanded && (
                            <div className="w-full border-l border-slate-100 ml-[11px]">
                                <DataTreeViewer 
                                    data={value} 
                                    level={level + 1} 
                                    initiallyExpanded={false}
                                    onDragStart={onDragStart} // Pass drag handler down
                                    pathPrefix={currentPath} // Expand path
                                    truncate={truncate}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
             {keys.length === 0 && (
                <div className="p-2 text-xs text-slate-500 italic pl-8 font-medium">
                    Empty {Array.isArray(data) ? 'Array' : 'Object'}
                </div>
            )}
        </div>
    );
};
