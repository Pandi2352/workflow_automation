import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Book, 
    Layers, 
    Cpu, 
    Network, 
    FileText, 
    Database,
    ChevronRight,
    Github,
    ExternalLink,
    Zap,
    Shield,
    Mail,
    HardDrive,
    Binary,
    Code,
    Sparkles,
    MousePointer2,
    Calendar,
    HelpCircle,
    Activity,
    EyeOff,
    Terminal,
    Lightbulb,
    Boxes,
    FileCode,
    Flame,
    Cloud,
    Calculator,
    Filter,
    CheckCircle2,
    Share2,
    Upload,
    Construction,
    BrainCircuit,
    Search,
    Lock as LockIcon
} from 'lucide-react';
import { Button } from '../common/Button';

export const DocumentationPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState<'all' | 'ai' | 'integration' | 'storage' | 'logic' | 'math' | 'data'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        { id: 'mission', title: 'Mission & Vision', icon: Flame },
        { id: 'getting-started', title: 'Quick Start', icon: Zap },
        { id: 'node-lexicon', title: 'Node Lexicon', icon: Boxes },
        { id: 'expression-engine', title: 'Expression Engine', icon: Terminal },
        { id: 'api-reference', title: 'API Reference', icon: FileCode },
        { id: 'recipes', title: 'Cookbook', icon: Lightbulb },
        { id: 'security', title: 'Security', icon: Shield },
        { id: 'architecture', title: 'Engine Architecture', icon: Layers },
        { id: 'deployment', title: 'Self-Hosting', icon: Cloud },
        { id: 'faq', title: 'FAQ', icon: HelpCircle }
    ];

    const nodes = [
        { id: 'smart-extraction', name: 'Smart Extraction', category: 'ai', icon: Sparkles, purpose: 'AI-driven structured data extraction.', usage: 'Define a JSON schema and provide text/file input. Uses Gemini 1.5/2.0 to normalize complex data.', features: ['Handlebars support', 'Recursive nesting', 'Multi-model selection'] },
        { id: 'ocr-surya', name: 'OCR (Surya-AI)', category: 'ai', icon: Binary, purpose: 'High-accuracy neural OCR for complex layouts.', usage: 'Pass a image/PDF path. Surya provides line-by-line text and layout coordinates.', features: ['Table detection', 'Multi-language', 'PDF support'] },
        { id: 'ocr-tesseract', name: 'OCR (Tesseract)', category: 'ai', icon: Binary, purpose: 'Lightweight, fast OCR for simple documents.', usage: 'Best for clean text documents and simple forms.', features: ['Fast processing', 'Open source', 'Low latency'] },
        { id: 'summarize', name: 'Summarize', category: 'ai', icon: FileText, purpose: 'LLM-powered text condensation.', usage: 'Takes long text inputs and generates executive summaries or bullet points.', features: ['Tone control', 'Custom length', 'Multi-document merge'] },
        { id: 'gmail-trigger', name: 'Gmail Trigger', category: 'integration', icon: Mail, purpose: 'Real-time email workflow activation.', usage: 'Polls or watches your inbox for specific queries (e.g., from:finance@email.com).', features: ['Attachment auto-save', 'OAuth2 lifecycle', 'Filter regex'] },
        { id: 'google-drive', name: 'Google Drive', category: 'integration', icon: HardDrive, purpose: 'Cloud file management.', usage: 'Search, upload, or download files from GDrive. Can append to existing docs.', features: ['Folder traversal', 'Metadata injection', 'Permission audit'] },
        { id: 'mongodb', name: 'MongoDB', category: 'storage', icon: Database, purpose: 'JSON document persistence.', usage: 'Batch insert workflow results into specific collections for long-term storage.', features: ['Upsert support', 'Batch mode', 'Schema-less'] },
        { id: 'onedrive', name: 'OneDrive', category: 'integration', icon: Cloud, purpose: 'Microsoft ecosystem file access.', usage: 'Integrate with Microsoft 365 workflows.', features: ['Large file support', 'Enterprise search'] },
        { id: 'if-else', name: 'If / Else', category: 'logic', icon: Code, purpose: 'Boolean path branching.', usage: 'Compare variables using syntax like {{node.data}} > 100.', features: ['Multiple conditions', 'Custom expressions', 'Visual routing'] },
        { id: 'schedule', name: 'Schedule', category: 'logic', icon: Calendar, purpose: 'Time-based workflow execution.', usage: 'Set Cron or interval timers to run automations periodically.', features: ['Cron builder', 'Timezone support', 'Overlap protection'] },
        { id: 'input', name: 'Manual Input', category: 'logic', icon: MousePointer2, purpose: 'Start workflows with custom payload.', usage: 'Define fields to be filled by users via UI or API when triggering manually.', features: ['Default values', 'Field validation'] },
        { id: 'math-add', name: 'Add / Subtract', category: 'math', icon: Calculator, purpose: 'Basic arithmetic on variable data.', usage: 'Sum totals from extracted invoices or calculate discounts.', features: ['Multi-variable sum', 'Precision control'] },
        { id: 'math-multiply', name: 'Multiply / Divide', category: 'math', icon: Calculator, purpose: 'Scaling and division logic.', usage: 'Calculate tax percentages or unit price conversions.', features: ['Formula chaining'] },
        { id: 'parsing', name: 'File Parsing', category: 'data', icon: Filter, purpose: 'CSV/JSON/Text structure cleaning.', usage: 'Normalize raw file outputs into clean arrays for downstream nodes.', features: ['Header mapping', 'Encoding detection'] },
        { id: 'file-upload', name: 'File Upload', category: 'data', icon: Upload, purpose: 'Ingest local assets into the execution engine.', usage: 'Upload data for OCR or Smart Extraction processing.', features: ['Multi-file handling', 'Temp storage'] },
    ];

    const recipes = [
        { title: 'AI Invoice Auditor', desc: 'Gmail -> Surya OCR -> Smart Extraction -> MongoDB', complex: 'High', time: '10m Setup' },
        { title: 'Daily News Digest', desc: 'Schedule -> RSS Parser -> Summarize -> Gmail', complex: 'Medium', time: '5m Setup' },
        { title: 'CRM File Sync', desc: 'OneDrive -> Google Drive -> Slack Notification', complex: 'Low', time: '2m Setup' }
    ];

    const filteredNodes = nodes.filter(n => {
        const matchCat = activeCategory === 'all' || n.category === activeCategory;
        const matchSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.purpose.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
            
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
                <div className="absolute inset-0 bg-grid-slate-200/[0.03] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
            </div>

            {/* Premium Header */}
            <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all text-xs font-semibold"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                            <Book size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 leading-none text-base">Documentation</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Version 1.2.0</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find anything..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-64"
                        />
                    </div>
                    <Button 
                        onClick={() => navigate('/dashboard')}
                        className="text-xs h-9 bg-slate-900 text-white hover:bg-slate-800 border-none px-5 rounded-xl font-bold transition-all shadow-md active:scale-95"
                    >
                        Go to Canvas
                    </Button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row relative z-10 px-6 lg:px-8">
                
                {/* Floating Sidebar */}
                <aside className="lg:w-64 shrink-0 lg:h-[calc(100vh-80px)] lg:sticky lg:top-20 py-10 flex flex-col gap-8 hidden-scrollbar">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">Overview</p>
                        <nav className="space-y-1">
                            {sections.map((section) => (
                                <a 
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all group border border-transparent"
                                >
                                    <section.icon size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    {section.title}
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-indigo-100 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Construction size={10} /> Beta
                            </p>
                            <h4 className="text-xs font-bold mb-3 leading-relaxed">Build custom nodes?</h4>
                            <button className="w-full bg-white/20 hover:bg-white/30 text-white py-1.5 px-3 rounded-lg text-[10px] font-bold backdrop-blur-md transition-all">
                                Developer Guide
                            </button>
                        </div>
                        <Boxes className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-all" size={80} />
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 lg:pl-16 py-10 lg:py-16 min-w-0">
                    
                    {/* Mission Section */}
                    <section id="mission" className="scroll-mt-32 mb-32">
                        <div className="max-w-2xl space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                                    <Sparkles size={12} />
                                    Core Philosophy
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                                    Bridge Logic and <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">Cognitive Intelligence.</span>
                                </h1>
                            </div>
                            
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                A high-performance automation framework designed for the next generation of AI-native applications. Build deterministic flows with probabilistic smarts.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                <div className="p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all mb-4">
                                        <Zap size={20} />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 mb-2">Deterministic Logic</h4>
                                    <p className="text-slate-500 text-[13px] leading-relaxed">Rigid structures like If/Else and Math formulas ensure precision where it matters most.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all mb-4">
                                        <BrainCircuit size={20} />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 mb-2">Cognitive Power</h4>
                                    <p className="text-slate-500 text-[13px] leading-relaxed">Leverage Gemini LLMs and Neural OCR to handle complex, unstructured data effortlessly.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Quick Start Guide */}
                    <section id="getting-started" className="scroll-mt-32 mb-32">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Quick Start
                                <span className="h-px bg-slate-200 flex-1 ml-4" />
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { title: 'Connect', desc: 'Add a trigger like Gmail.', icon: Network, color: 'text-indigo-500' },
                                { title: 'Vision', desc: 'Use OCR to read PDFs.', icon: EyeOff, color: 'text-blue-500' },
                                { title: 'Extract', desc: 'Pull structured JSON fields.', icon: Database, color: 'text-purple-500' },
                                { title: 'Save', desc: 'Push to Cloud Storage.', icon: CheckCircle2, color: 'text-emerald-500' }
                            ].map((step, i) => (
                                <div key={i} className="group relative">
                                    <div className="p-6 rounded-2xl bg-white border border-slate-200/60 hover:border-slate-400 hover:shadow-lg transition-all h-full">
                                        <div className={`mb-4 ${step.color} group-hover:scale-110 transition-transform`}>
                                            <step.icon size={22} />
                                        </div>
                                        <h5 className="font-bold text-slate-900 text-sm mb-1">{step.title}</h5>
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">{step.desc}</p>
                                    </div>
                                    {i < 3 && <ChevronRight className="absolute top-1/2 -right-3 -translate-y-1/2 text-slate-200 hidden md:block" size={18} />}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Node Lexicon */}
                    <section id="node-lexicon" className="scroll-mt-32 mb-32">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 shrink-0">
                                Node Lexicon
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">20+ Nodes</span>
                            </h2>
                            
                            <div className="flex bg-slate-100/80 p-1 rounded-xl gap-0.5 overflow-x-auto">
                                {['all', 'ai', 'integration', 'storage', 'logic', 'math', 'data'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat as any)}
                                        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeCategory === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredNodes.map((node, i) => (
                                <div key={i} className="group p-6 rounded-2xl bg-white border border-slate-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all flex flex-col gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <node.icon size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{node.name}</h4>
                                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/50 uppercase">{node.category}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1 italic">{node.purpose}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100/50">
                                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{node.usage}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {node.features.map((feat, idx) => (
                                                <span key={idx} className="px-2 py-1 rounded-lg bg-white text-slate-400 text-[9px] font-bold border border-slate-100">{feat}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Expressions Section */}
                    <section id="expression-engine" className="scroll-mt-32 mb-32">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Expressions & Interpolation</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Power your workflows with dynamic data. We use an intelligent interpolation engine based on Handlebars syntax to bind node outputs in real-time.
                                </p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Node Output', syntax: '{{NodeName.outputs.path}}', desc: 'Access specific properties from any previous node.' },
                                        { label: 'Chain Input', syntax: '$input', desc: 'Shortcut to the direct predecessor combined output.' },
                                        { label: 'Global Vars', syntax: '{{$vars.key}}', desc: 'Securely access shared workflow constants.' }
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-sm hover:border-indigo-200 transition-all flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                                <Code size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-mono text-indigo-600 font-bold mb-1">{item.syntax}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-3xl p-8 flex flex-col shadow-2xl relative overflow-hidden group">
                                <div className="space-y-4 relative z-10 font-mono text-xs">
                                    <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-4">
                                        <span>Template Preview</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 leading-relaxed">
                                        <p className="text-slate-500 italic">// Dynamic Condition</p>
                                        <p className="text-indigo-400">if <span className="text-slate-300">(</span> <span className="text-emerald-400">{'{{Gmail.subject}}'}</span>.includes<span className="text-slate-300">(</span><span className="text-amber-300">"Invoice"</span><span className="text-slate-300">) ) {'{'}</span></p>
                                        <p className="pl-4 text-slate-300">return <span className="text-emerald-400">{'{{SuryaOCR.analysis}}'}</span>;</p>
                                        <p className="text-slate-300">{'}'}</p>
                                    </div>
                                </div>
                                <Activity className="absolute bottom-[-20px] right-[-20px] text-white/5 group-hover:rotate-12 group-hover:scale-110 transition-all" size={120} />
                            </div>
                        </div>
                    </section>

                    {/* API Reference Explorer */}
                    <section id="api-reference" className="scroll-mt-32 mb-32">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Backend API Reference</h2>
                        </div>

                        <div className="space-y-3">
                             {[
                                { method: 'POST', endpoint: '/sample-workflows', desc: 'Create a new automated workflow.', auth: 'Bearer' },
                                { method: 'GET', endpoint: '/sample-workflows/:id/executions', desc: 'List performance and state logs.', auth: 'Public' },
                                { method: 'POST', endpoint: '/sample-workflows/:id/execute', desc: 'Trigger workflow with custom payload.', auth: 'Bearer' },
                                { method: 'GET', endpoint: '/sample-workflows/nodes', desc: 'Fetch registered node strategies.', auth: 'Public' }
                            ].map((api, i) => (
                                <div key={i} className="group flex items-center gap-6 p-4 rounded-xl bg-white border border-slate-200/60 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer">
                                    <div className={`w-16 py-1 rounded text-center text-[9px] font-black uppercase tracking-wider ${api.method === 'POST' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {api.method}
                                    </div>
                                    <div className="flex-1 font-mono text-[11px] font-bold text-slate-700">{api.endpoint}</div>
                                    <div className="hidden md:block text-[10px] text-slate-400 font-medium">{api.desc}</div>
                                    <div className="text-[9px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/50 uppercase">{api.auth}</div>
                                    <ChevronRight size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Security Deep Dive */}
                    <section id="security" className="scroll-mt-32 mb-32">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security & Governance</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="p-8 rounded-3xl bg-white border border-slate-200/60 flex flex-col gap-6 shadow-sm">
                                <h4 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                    <Shield size={20} className="text-indigo-600" />
                                    Vault Credentialing
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">We separate sensitive API keys from workflow definitions. Keys are stored in an encrypted vault and injected only during safe runtime contexts.</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={10}/></div>
                                        OAuth2 lifecycle management
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={10}/></div>
                                        Encrypted Local State storage
                                    </div>
                                </div>
                             </div>

                             <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col gap-6 shadow-xl relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h4 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                        <LockIcon size={20} className="text-indigo-400" />
                                        Data Privacy
                                    </h4>
                                    <p className="text-xs text-indigo-100 opacity-60 leading-relaxed font-medium mt-4">By default, execution results are stored in your private MongoDB instance. We never proxy or inspect your file content.</p>
                                    <button className="mt-8 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors border-b border-indigo-500/30 pb-1">
                                        Download Security Whitepaper
                                    </button>
                                </div>
                                <Shield className="absolute bottom-[-30px] right-[-30px] text-white/5 opacity-40 group-hover:rotate-6 transition-all" size={140} />
                             </div>
                        </div>
                    </section>

                    {/* Architecture Technical Deep-Dive */}
                    <section id="architecture" className="scroll-mt-32 mb-32">
                         <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Engine Architecture</h2>
                        </div>

                        <div className="p-8 lg:p-12 rounded-[2rem] bg-white border border-slate-200/60 shadow-xl shadow-slate-200/20 relative overflow-hidden flex flex-col md:flex-row gap-12 items-center">
                             <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-slate-900 leading-tight">Strategy-Driven <br /> Executable DAG</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-sm">
                                        Our core service constructs a Directed Acyclic Graph from your nodes. Each node type implements a specific Execution Strategy, ensuring modularity and isolated error handling.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500"><Cpu size={14} /></div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">Isolated</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500"><Zap size={14} /></div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">Parallel</span>
                                    </div>
                                </div>
                             </div>

                             <div className="flex flex-col gap-2 w-full md:w-auto shrink-0 font-mono">
                                 <div className="p-4 bg-slate-900 rounded-2xl text-[10px] text-white flex items-center justify-between gap-10">
                                     <span className="text-slate-500 uppercase font-bold tracking-[0.2em]">F-End</span>
                                     <span className="text-indigo-400">React + Tailwind</span>
                                 </div>
                                 <div className="h-4 w-px bg-slate-200 mx-auto" />
                                 <div className="p-4 bg-slate-900 rounded-2xl text-[10px] text-white border border-indigo-500/30 flex flex-col items-center gap-2">
                                     <span className="text-slate-500 uppercase font-bold tracking-[0.2em]">C-Engine</span>
                                     <span className="text-emerald-400">NestJS Core</span>
                                     <div className="flex gap-2 mt-2 opacity-60">
                                         <div className="px-2 py-0.5 bg-white/5 rounded border border-white/10 uppercase">Strategies</div>
                                         <div className="px-2 py-0.5 bg-white/5 rounded border border-white/10 uppercase">DAG</div>
                                     </div>
                                 </div>
                                 <div className="h-4 w-px bg-slate-200 mx-auto" />
                                 <div className="p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-900 border border-slate-200 border-dashed flex items-center justify-around gap-4">
                                     <span className="text-indigo-500 font-bold uppercase">Mongo</span>
                                     <span className="text-emerald-500 font-bold uppercase">Gemini</span>
                                 </div>
                             </div>
                        </div>
                    </section>

                    {/* FAQ & Support */}
                    <section id="faq" className="scroll-mt-32 mb-40">
                         <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">FAQ</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {[
                                { q: "Parallel limit?", a: "Handles 50+ concurrent executions per 1GB RAM on typical hardware." },
                                { q: "Model support?", a: "Native Gemini support. OpenAI and local Ollama support arriving Q1 2025." },
                                { q: "Webhook trigger?", a: "Yes, use the /execute endpoint for any external signals." },
                                { q: "Error recovery?", a: "Automatic retries with 'Continue on Error' flags for critical paths." }
                            ].map((item, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200/60 hover:border-indigo-400 transition-all shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-900 mb-3 underline decoration-indigo-500/30 underline-offset-4">{item.q}</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">{item.a}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-16 p-8 rounded-3xl bg-slate-900 text-center space-y-6 shadow-2xl relative overflow-hidden group">
                             <div className="relative z-10 space-y-4">
                                <h3 className="text-2xl font-black text-white tracking-tight">Need engineering support?</h3>
                                <p className="text-slate-400 max-w-sm mx-auto text-xs font-medium">Join our developer Discord or browse active discussions on GitHub. We respond fast.</p>
                                <div className="flex justify-center gap-3 pt-2">
                                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-xl transition-all shadow-lg active:scale-95">
                                        Join Community
                                    </button>
                                    <button className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-xl border border-white/10 transition-all">
                                        Github Discussions
                                    </button>
                                </div>
                             </div>
                             <Boxes className="absolute -left-10 -bottom-10 text-white/10 opacity-40" size={200} />
                        </div>
                    </section>
                </main>
            </div>

            {/* Minimalist Footer */}
            <footer className="bg-white border-t border-slate-200/50 py-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
                    <div className="space-y-6 max-w-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg">
                                <Zap size={18} fill="currentColor" />
                            </div>
                            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">Automation Kit</span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                            Synthesize document processing, logic, and storage into one premium engine. The professional choice for visual automation.
                        </p>
                        <div className="flex items-center gap-3">
                             <a href="#" className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all hover:shadow-sm"><Github size={16} /></a>
                             <a href="#" className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all hover:shadow-sm"><Share2 size={16} /></a>
                             <a href="#" className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all hover:shadow-sm"><ExternalLink size={16} /></a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
                        <div className="space-y-4">
                            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stack</h4>
                            <nav className="flex flex-col gap-3 text-[11px] font-bold text-slate-600">
                                <a href="#" className="hover:text-indigo-600 transition-colors">Core Engine</a>
                                <a href="#" className="hover:text-indigo-600 transition-colors">Plugin API</a>
                                <a href="#" className="hover:text-indigo-600 transition-colors">Changelog</a>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Help</h4>
                            <nav className="flex flex-col gap-3 text-[11px] font-bold text-slate-600">
                                <a href="#" className="hover:text-indigo-600 transition-colors">Discord</a>
                                <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
                                <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
                            </nav>
                        </div>
                        <div className="space-y-4 hidden lg:block">
                            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Legal</h4>
                            <nav className="flex flex-col gap-3 text-[11px] font-bold text-slate-600">
                                <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
                                <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
                                <a href="#" className="hover:text-indigo-600 transition-colors">Security</a>
                            </nav>
                        </div>
                    </div>
                </div>
                
                <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">© 2025 Deepmind Advanced Agentic Coding. Built for the era of intelligence.</p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Operational</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">STABLE v1.2.0-PRO</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
