import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import { workflowService } from '../../services/api/workflows';
import { useWorkflowStore } from '../../store/workflowStore';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'success' | 'error';
    timestamp: number;
}

interface AIChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your AI architect. Describe what you want to build, or ask me to modify your current workflow.",
            timestamp: Date.now()
        }
    ]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { nodes, edges, setNodes, setEdges, setIsDirty } = useWorkflowStore();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Determine if we are updating or creating new
            const isUpdate = nodes.length > 0;
            
            const result = await workflowService.generateAIWorkflow(
                userMsg.content,
                isUpdate ? nodes : [],
                isUpdate ? edges : []
            );

            // Apply changes with Sanitization
            const sanitizedNodes = result.nodes.map((node: any) => {
                // If config or label is at root, move it to data
                if (node.config || !node.data) {
                    return {
                        ...node,
                        config: undefined, // Remove root config
                        data: {
                            ...(node.data || {}),
                            label: node.label || node.data?.label || node.id,
                            config: node.config || node.data?.config || {}
                        }
                    };
                }
                return node;
            });

            setNodes(sanitizedNodes);
            setEdges(result.edges);
            setIsDirty(true);
            if (result.metadata) {
                // Assuming useWorkflowStore has a setter for metadata or individual fields
                // The store hook exposes 'setWorkflowMetadata'
                useWorkflowStore.getState().setWorkflowMetadata({
                    workflowName: result.metadata.name,
                    workflowDescription: result.metadata.description,
                    isWorkflowActive: true // Default to true or keep existing
                });
            }


            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                type: 'success',
                content: isUpdate 
                    ? "I've updated the workflow based on your request." 
                    : "I've generated a new workflow for you.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error: any) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                type: 'error',
                content: error.response?.data?.message || "Sorry, I couldn't generate that workflow. Please try again.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between text-white shadow-md">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Sparkles size={18} className="text-yellow-300" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm">AI Architect</h2>
                        <p className="text-xs text-indigo-100 opacity-80">Powered by Gemini 2.0</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                            ${msg.role === 'assistant' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}
                        `}>
                            {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        
                        <div className={`
                            max-w-[80%] rounded-2xl p-3 text-sm shadow-sm
                            ${msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                            }
                            ${msg.type === 'error' ? 'border-red-200 bg-red-50 text-red-600' : ''}
                        `}>
                            <p className="loading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            {msg.type === 'success' && (
                                <div className="mt-2 text-xs opacity-70 flex items-center gap-1 border-t border-black/10 pt-1">
                                    <Sparkles size={10} />
                                    <span>Workflow updated</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-indigo-500" />
                            <span className="text-xs text-gray-500">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Describe your workflow..."
                        className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm transition-all max-h-32 min-h-[50px]"
                        rows={1}
                        autoFocus
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`
                            absolute right-2 bottom-2 p-2 rounded-lg transition-all
                            ${input.trim() && !isLoading 
                                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-105' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="mt-2 flex justify-center">
                    <p className="text-[10px] text-gray-400">AI can make mistakes. Review the generated workflow.</p>
                </div>
            </div>
        </div>
    );
};
