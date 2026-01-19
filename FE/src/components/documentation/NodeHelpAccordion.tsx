import React, { useState } from 'react';
import { NODE_DOCS, getDocForNode } from '../../data/nodeDocumentation';
import { ChevronDown, ChevronRight, Lightbulb, BadgeCheck, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NodeHelpAccordionProps {
    currentNodeType?: string;
    className?: string;
}

export const NodeHelpAccordion: React.FC<NodeHelpAccordionProps> = ({ currentNodeType, className }) => {
    const defaultDoc = currentNodeType ? getDocForNode(currentNodeType) : null;
    const [expandedId, setExpandedId] = useState<string | null>(defaultDoc?.id || null);

    return (
        <div className={cn("space-y-3 p-1", className)}>
            {NODE_DOCS.map((node) => {
                const isExpanded = expandedId === node.id;
                const Icon = node.icon;

                return (
                    <div 
                        key={node.id} 
                        className={cn(
                            "rounded-2xl border transition-all duration-300 overflow-hidden bg-white",
                            isExpanded ? "border-indigo-500/30 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300"
                        )}
                    >
                        {/* Summary Header */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : node.id)}
                            className="w-full flex items-center justify-between p-4 text-left transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                    isExpanded ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-50 text-slate-400"
                                )}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h4 className={cn(
                                        "text-sm font-bold tracking-tight",
                                        isExpanded ? "text-slate-900" : "text-slate-600"
                                    )}>
                                        {node.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{node.category}</p>
                                </div>
                            </div>
                            <div className={cn(
                                "p-1.5 rounded-lg transition-all",
                                isExpanded ? "bg-indigo-50 text-indigo-600" : "text-slate-300"
                            )}>
                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="px-5 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="h-px bg-slate-100 mb-4" />
                                
                                {/* Purpose & Usage */}
                                <div className="space-y-2">
                                    <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                                        {node.howItWorks}
                                    </p>
                                </div>

                                {/* Why Section */}
                                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex gap-3">
                                    <Lightbulb size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Why use this?</span>
                                        <p className="text-[12px] text-emerald-800 font-medium leading-relaxed">
                                            {node.whyUseIt}
                                        </p>
                                    </div>
                                </div>

                                {/* Example Section */}
                                <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-[11px] leading-relaxed relative overflow-hidden group">
                                    <div className="relative z-10 flex items-start gap-3">
                                        <BadgeCheck size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-[0.2em] block">Real-world Example</span>
                                            <span className="text-slate-300">{node.example}</span>
                                        </div>
                                    </div>
                                    <Sparkles className="absolute -right-4 -bottom-4 text-white/5 opacity-40 group-hover:scale-125 transition-all" size={60} />
                                </div>

                                {/* Features Chips */}
                                <div className="flex flex-wrap gap-1.5">
                                    {node.features.map((feat, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 text-[9px] font-bold border border-slate-100 uppercase tracking-tighter">
                                            {feat}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
