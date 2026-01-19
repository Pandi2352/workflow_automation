import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    CheckCircle2,
    Share2,
    Upload,
    Construction,
    BrainCircuit,
    Search,
    Lock as LockIcon
} from 'lucide-react';
import { Button } from '../common/Button';
import { DocumentationButton } from '../common/DocumentationButton';
import { BadgeCheck, Info, Lightbulb as IdeaIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export const DocumentationPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeCategory, setActiveCategory] = useState<'all' | 'ai' | 'integration' | 'storage' | 'logic' | 'math' | 'data'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        { id: 'mission', title: 'Mission & Vision', icon: Flame },
        { id: 'getting-started', title: 'Quick Start', icon: Zap },
        { id: 'node-lexicon', title: 'Node Lexicon', icon: Boxes },
        { id: 'expression-engine', title: 'Expression Engine', icon: Terminal },
        { id: 'api-reference', title: 'API Reference', icon: FileCode },
        { id: 'operations', title: 'Operations & Limits', icon: Activity },
        { id: 'recipes', title: 'Cookbook', icon: Lightbulb },
        { id: 'security', title: 'Security', icon: Shield },
        { id: 'architecture', title: 'Engine Architecture', icon: Layers },
        { id: 'deployment', title: 'Self-Hosting', icon: Cloud },
        { id: 'faq', title: 'FAQ', icon: HelpCircle }
    ];

    const nodes = [
        { 
            id: 'smart-extraction', 
            name: 'Smart Extraction', 
            category: 'ai', 
            icon: Sparkles, 
            purpose: 'AI-driven structured data extraction.', 
            usage: 'Define a JSON schema and provide text/file input. Uses Gemini 1.5/2.0 to normalize complex data.', 
            features: ['Handlebars support', 'Recursive nesting', 'Multi-model selection'],
            howItWorks: 'This node uses Google Gemini Large Language Models (LLM) to parse unstructured or semi-structured data. It takes your provided JSON schema and maps raw text or OCR outputs into that exact structure using sophisticated prompt engineering and validation.',
            whyUseIt: 'Ideal for variable-format documents like invoices, receipts, or legal contracts where traditional regex-based extraction would fail. It provides human-like understanding with machine-like precision.',
            example: 'Extracting "Total Amount", "Vendor Name", and "Due Date" from a scanned PDF invoice.'
        },
        { 
            id: 'ocr-surya', 
            name: 'OCR (Surya-AI)', 
            category: 'ai', 
            icon: Binary, 
            purpose: 'High-accuracy neural OCR for complex layouts.', 
            usage: 'Pass a image/PDF path. Surya provides line-by-line text and layout coordinates.', 
            features: ['Table detection', 'Multi-language', 'PDF support'],
            howItWorks: 'Surya is a line-level neural OCR that excels in document layout analysis. It processes images through a deep learning model that identifies text regions, reading order, and table structures across 90+ languages.',
            whyUseIt: 'Use this when standard Tesseract OCR fails or when you need to preserve the visual context of the document (like items in a specific table column).',
            example: 'Reading a dense academic paper with multi-column layouts and mathematical formulas.'
        },
        { 
            id: 'summarize', 
            name: 'Summarize', 
            category: 'ai', 
            icon: FileText, 
            purpose: 'LLM-powered text condensation.', 
            usage: 'Takes long text inputs and generates executive summaries or bullet points.', 
            features: ['Tone control', 'Custom length', 'Multi-document merge'],
            howItWorks: 'Leveraging Gemini flash models, this node analyzes the context of a body of text and applies your specific compression rules (e.g., "summarize in 3 bullet points").',
            whyUseIt: 'Saves time for humans by pre-processing long emails, transcriptions, or reports into actionable insights.',
            example: 'Creating a 50-word summary of a 10-page meeting transcript.'
        },
        { 
            id: 'gmail-trigger', 
            name: 'Gmail Trigger', 
            category: 'integration', 
            icon: Mail, 
            purpose: 'Real-time email workflow activation.', 
            usage: 'Polls or watches your inbox for specific queries (e.g., from:finance@email.com).', 
            features: ['Attachment auto-save', 'OAuth2 lifecycle', 'Filter regex'],
            howItWorks: 'Connects to the Google Gmail API using secure OAuth2 credentials. It polls for new messages matching your search criteria and automatically downloads relevant metadata and attachments.',
            whyUseIt: 'The starting point for any email-based automation. It eliminates the need for manual monitoring of shared inboxes or support queues.',
            example: 'Monitoring for emails with "INVOICE" in the subject line to trigger a payment workflow.'
        },
        { 
            id: 'google-drive', 
            name: 'Google Drive', 
            category: 'integration', 
            icon: HardDrive, 
            purpose: 'Cloud file management.', 
            usage: 'Search, upload, or download files from GDrive. Can append to existing docs.', 
            features: ['Folder traversal', 'Metadata injection', 'Permission audit'],
            howItWorks: 'Uses the Google Drive v3 API to perform file operations. It allows for dynamic path resolution using workflow variables, making it easy to organize files into project-specific folders.',
            whyUseIt: 'Provides a centralized storage layer for your automated processes, ensuring files are saved where your team can find them.',
            example: 'Uploading an extracted invoice data file to a specific client folder on Google Drive.'
        },
        { 
            id: 'if-else', 
            name: 'If / Else', 
            category: 'logic', 
            icon: Code, 
            purpose: 'Boolean path branching.', 
            usage: 'Compare variables using syntax like {{node.data}} > 100.', 
            features: ['Multiple conditions', 'Custom expressions', 'Visual routing'],
            howItWorks: 'Evaluates logical expressions at runtime. It supports common operators like ==, !=, >, <, and includes() for string checks. It splits the workflow path based on the result.',
            whyUseIt: 'Essential for decision-making. Allows the workflow to behave differently based on the data it encounters (e.g., different approval routes for high vs low amounts).',
            example: 'Sending the workflow to a "Manager" manual review if an invoice total exceeds $5000.'
        },
        { 
            id: 'schedule', 
            name: 'Schedule', 
            category: 'logic', 
            icon: Calendar, 
            purpose: 'Time-based workflow execution.', 
            usage: 'Set Cron or interval timers to run automations periodically.', 
            features: ['Cron builder', 'Timezone support', 'Overlap protection'],
            howItWorks: 'Registers handlers in the backend scheduler (BullMQ/Cron). When the time arrives, the engine instantiates the workflow with an empty trigger payload.',
            whyUseIt: 'Useful for recurring tasks like end-of-month reporting, daily data syncs, or weekly backup operations.',
            example: 'Triggering a "Daily Summary" workflow every morning at 9:00 AM.'
        },
        { 
            id: 'file-upload', 
            name: 'File Upload', 
            category: 'data', 
            icon: Upload, 
            purpose: 'Ingest local assets into the execution engine.', 
            usage: 'Upload data for OCR or Smart Extraction processing.', 
            features: ['Multi-file handling', 'Temp storage'],
            howItWorks: 'Provides a web-based portal for users to manually submit files into the system. It handles multipart/form-data uploads and generates temporary secure URLs for processing.',
            whyUseIt: 'The primary way to handle ad-hoc document processing that isn\'t coming through an automated channel like email.',
            example: 'Dragging and dropping a batch of PDF receipts into the browser for processing.'
        },
    ];

    useEffect(() => {
        const nodeParam = searchParams.get('node');
        if (nodeParam) {
            // Scroll to top when node changes to ensure content is visible
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [searchParams]);

    const isFocusedView = !!searchParams.get('node');
    const focusedNode = nodes.find(n => n.id === searchParams.get('node'));

    if (isFocusedView && focusedNode) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-['Space_Grotesk'] relative overflow-x-hidden scroll-smooth">
                {/* Background */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_55%)]" />
                </div>

                {/* Focused Header */}
                <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-900 transition-all text-xs font-semibold"
                        >
                            <ArrowLeft size={14} />
                            Back to Workflow
                        </button>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-white">
                                <Book size={16} />
                            </div>
                            <span className="font-extrabold text-slate-900 text-sm">Node Reference</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/documentation')}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 transition-all uppercase tracking-widest border border-indigo-100"
                    >
                        Explore Full Lexicon
                    </button>
                </header>

                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row relative z-10 px-6 lg:px-8">
                    <main className="flex-1 py-16 lg:pr-12 min-w-0">
                        <div className="space-y-12">
                            {/* Title Section */}
                            <div className="flex flex-col md:flex-row md:items-center gap-8 p-10 bg-white border border-slate-200/70">
                                <div className="w-24 h-24 bg-indigo-600 text-white flex items-center justify-center shrink-0 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                                    <focusedNode.icon size={48} />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{focusedNode.name}</h1>
                                        <span className="px-4 py-1 bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{focusedNode.category}</span>
                                    </div>
                                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl italic">
                                        {focusedNode.purpose}
                                    </p>
                                </div>
                            </div>

                            {/* Detail Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-5 p-10 bg-white border border-slate-200/70">
                                    <h4 className="flex items-center gap-3 text-base font-black text-slate-900 uppercase tracking-widest">
                                        <div className="p-1.5 bg-indigo-50 text-indigo-600">
                                            <Info size={18} />
                                        </div>
                                        Operational Logic
                                    </h4>
                                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                                        {focusedNode.howItWorks}
                                    </p>
                                </div>

                                <div className="space-y-5 p-10 bg-white border border-slate-200/70">
                                    <h4 className="flex items-center gap-3 text-base font-black text-slate-900 uppercase tracking-widest">
                                        <div className="p-1.5 bg-emerald-50 text-emerald-600">
                                            <IdeaIcon size={18} />
                                        </div>
                                        Strategic Value
                                    </h4>
                                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                                        {focusedNode.whyUseIt}
                                    </p>
                                </div>
                            </div>

                            {/* Features & Usage */}
                            <div className="p-10 bg-slate-900 text-white relative overflow-hidden group border border-slate-800">
                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400">Core Capabilities</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {focusedNode.features.map((feat, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10">
                                                    <BadgeCheck size={16} className="text-emerald-400" />
                                                    <span className="text-[13px] font-bold text-slate-200">{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Implementation Example</h4>
                                        <div className="p-6 bg-black/40 border border-white/5 font-mono text-sm leading-relaxed text-slate-300">
                                            <p className="italic text-slate-500 mb-4">// Production use-case</p>
                                            {focusedNode.example}
                                        </div>
                                    </div>
                                </div>
                                <Sparkles className="absolute -right-12 -bottom-12 text-white/5 opacity-40 group-hover:scale-125 transition-transform duration-700" size={240} />
                            </div>

                            {/* Usage Note */}
                            <div className="flex items-center justify-center py-10">
                                <div className="flex items-center gap-3 px-6 py-3 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest border border-slate-200">
                                    <Zap size={14} />
                                    Technical Reference V1.2.0 • Build 882
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Focused Right Sidebar - Node Selection */}
                    <aside className="lg:w-72 shrink-0 lg:h-[calc(100vh-80px)] lg:sticky lg:top-20 py-16 hidden lg:flex flex-col gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Node Catalog</p>
                            <nav className="space-y-1 overflow-y-auto custom-scrollbar pr-2 max-h-[calc(100vh-300px)]">
                                {nodes.map((node) => (
                                    <button 
                                        key={node.id}
                                        onClick={() => navigate(`/documentation?node=${node.id}`)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition-all border border-transparent group",
                                            focusedNode.id === node.id 
                                                ? "bg-indigo-600 text-white border-indigo-600" 
                                                : "text-slate-500 hover:text-indigo-600 hover:bg-white hover:border-slate-200 bg-white/40"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 flex items-center justify-center transition-colors",
                                            focusedNode.id === node.id ? "bg-white/20" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                                        )}>
                                            <node.icon size={14} />
                                        </div>
                                        <span className="truncate">{node.name}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6 bg-white border border-slate-200/70 space-y-4">
                            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Support</h5>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Missing a node or found a bug in the documentation?</p>
                            <button className="text-[10px] font-bold text-indigo-600 hover:underline">Report Issue</button>
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    const filteredNodes = nodes.filter(n => {
        const matchCat = activeCategory === 'all' || n.category === activeCategory;
        const matchSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.purpose.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-['Space_Grotesk'] selection:bg-indigo-500/30 overflow-x-hidden relative scroll-smooth">
            
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_55%)]" />
            </div>

            {/* Premium Header */}
            <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-900 transition-all text-xs font-semibold"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 flex items-center justify-center text-white">
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
                            className="bg-slate-100 border border-slate-200 pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-64"
                        />
                    </div>
                    <Button 
                        onClick={() => navigate('/dashboard')}
                        className="text-xs h-9 bg-slate-900 text-white hover:bg-slate-800 border-none px-5 font-bold transition-all active:scale-95"
                    >
                        Go to Canvas
                    </Button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row relative z-10 px-6 lg:px-8">
                
                {/* Floating Sidebar */}
                <aside className="lg:w-64 shrink-0 lg:h-[calc(100vh-80px)] lg:sticky lg:top-20 py-10 flex flex-col gap-8 hidden-scrollbar lg:overflow-y-auto lg:pr-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">Overview</p>
                        <nav className="space-y-1 max-h-[calc(100vh-260px)] overflow-y-auto pr-2 custom-scrollbar">
                            {sections.map((section) => (
                                <a 
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group border border-transparent"
                                >
                                    <section.icon size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    {section.title}
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-8 p-5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border border-indigo-400/40 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-indigo-100 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Construction size={10} /> Beta
                            </p>
                            <h4 className="text-xs font-bold mb-3 leading-relaxed">Build custom nodes?</h4>
                            <button className="w-full bg-white/20 hover:bg-white/30 text-white py-1.5 px-3 text-[10px] font-bold backdrop-blur-md transition-all border border-white/20">
                                Developer Guide
                            </button>
                        </div>
                        <Boxes className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-all" size={80} />
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 lg:pl-16 py-10 lg:py-16 lg:pr-12 min-w-0">
                    
                    {/* Mission Section */}
                    <section id="mission" className="scroll-mt-32 mb-32">
                        <div className="max-w-2xl space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
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
                                <div className="p-6 bg-white border border-slate-200/70 transition-all group">
                                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all mb-4">
                                        <Zap size={20} />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 mb-2">Deterministic Logic</h4>
                                    <p className="text-slate-500 text-[13px] leading-relaxed">Rigid structures like If/Else and Math formulas ensure precision where it matters most.</p>
                                </div>
                                <div className="p-6 bg-white border border-slate-200/70 transition-all group">
                                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all mb-4">
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
                                    <div className="p-6 bg-white border border-slate-200/70 hover:border-slate-400 transition-all h-full">
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
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 border border-slate-200 ml-2">20+ Nodes</span>
                            </h2>
                            
                            <div className="flex bg-slate-100/80 p-1 border border-slate-200 gap-0.5 overflow-x-auto">
                                {['all', 'ai', 'integration', 'storage', 'logic', 'math', 'data'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat as any)}
                                        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${activeCategory === cat ? 'bg-white text-indigo-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredNodes.map((node, i) => (
                                <div
                                    key={i}
                                    onClick={() => navigate(`/documentation?node=${node.id}`)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            navigate(`/documentation?node=${node.id}`);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    className="group p-6 bg-white border border-slate-200/70 hover:border-indigo-500/30 transition-all flex flex-col gap-6 cursor-pointer"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <node.icon size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{node.name}</h4>
                                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 border border-slate-200/50 uppercase">{node.category}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1 italic">{node.purpose}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 flex-1">
                                        <div className="p-4 bg-slate-50 border border-slate-100/70">
                                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{node.usage}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {node.features.map((feat, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-white text-slate-400 text-[9px] font-bold border border-slate-100">{feat}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex justify-end">
                                        <DocumentationButton 
                                            onClick={() => navigate(`/documentation?node=${node.id}`)}
                                        />
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
                                        <div key={i} className="p-4 bg-white border border-slate-200/70 hover:border-indigo-200 transition-all flex items-start gap-3">
                                            <div className="w-8 h-8 bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
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

                            <div className="bg-slate-900 p-8 flex flex-col border border-slate-800 relative overflow-hidden group">
                                <div className="space-y-4 relative z-10 font-mono text-xs">
                                    <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-4">
                                        <span>Template Preview</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-slate-700" />
                                            <div className="w-2 h-2 bg-slate-700" />
                                            <div className="w-2 h-2 bg-slate-700" />
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
                                <div key={i} className="group flex items-center gap-6 p-4 bg-white border border-slate-200/70 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer">
                                    <div className={`w-16 py-1 text-center text-[9px] font-black uppercase tracking-wider ${api.method === 'POST' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'} border border-slate-200`}>
                                        {api.method}
                                    </div>
                                    <div className="flex-1 font-mono text-[11px] font-bold text-slate-700">{api.endpoint}</div>
                                    <div className="hidden md:block text-[10px] text-slate-400 font-medium">{api.desc}</div>
                                    <div className="text-[9px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 border border-slate-200/50 uppercase">{api.auth}</div>
                                    <ChevronRight size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Operations & Limits */}
                    <section id="operations" className="scroll-mt-32 mb-32">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Operations & Limits</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="p-6 bg-white border border-slate-200/70 flex flex-col gap-4">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Execution Limits</h4>
                                <div className="space-y-2 text-[11px] text-slate-500 font-medium">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span>Concurrent runs</span>
                                        <span className="font-mono text-slate-700">50+ / 1GB RAM</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span>Max workflow nodes</span>
                                        <span className="font-mono text-slate-700">200</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Payload size</span>
                                        <span className="font-mono text-slate-700">10MB default</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white border border-slate-200/70 flex flex-col gap-4">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Reliability</h4>
                                <div className="space-y-2 text-[11px] text-slate-500 font-medium">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span>Retry policy</span>
                                        <span className="font-mono text-slate-700">Exponential + jitter</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span>Timeouts</span>
                                        <span className="font-mono text-slate-700">Configurable</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Audit logs</span>
                                        <span className="font-mono text-slate-700">Immutable</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white border border-slate-200/70 flex flex-col gap-4">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Versioning</h4>
                                <div className="space-y-2 text-[11px] text-slate-500 font-medium">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span>API stability</span>
                                        <span className="font-mono text-slate-700">/v1 default</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span>Node schema</span>
                                        <span className="font-mono text-slate-700">SemVer</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Migration notes</span>
                                        <span className="font-mono text-slate-700">Changelog</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Security Deep Dive */}
                    <section id="security" className="scroll-mt-32 mb-32">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security & Governance</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="p-8 bg-white border border-slate-200/70 flex flex-col gap-6">
                                <h4 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                    <Shield size={20} className="text-indigo-600" />
                                    Vault Credentialing
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">We separate sensitive API keys from workflow definitions. Keys are stored in an encrypted vault and injected only during safe runtime contexts.</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                        <div className="w-5 h-5 bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={10}/></div>
                                        OAuth2 lifecycle management
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                        <div className="w-5 h-5 bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={10}/></div>
                                        Encrypted Local State storage
                                    </div>
                                </div>
                             </div>

                             <div className="p-8 bg-slate-900 text-white flex flex-col gap-6 border border-slate-800 relative overflow-hidden group">
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

                        <div className="p-8 lg:p-12 bg-white border border-slate-200/70 relative overflow-hidden flex flex-col md:flex-row gap-12 items-center">
                             <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-slate-900 leading-tight">Strategy-Driven <br /> Executable DAG</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-sm">
                                        Our core service constructs a Directed Acyclic Graph from your nodes. Each node type implements a specific Execution Strategy, ensuring modularity and isolated error handling.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 flex items-center justify-center text-indigo-500"><Cpu size={14} /></div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">Isolated</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-50 flex items-center justify-center text-emerald-500"><Zap size={14} /></div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">Parallel</span>
                                    </div>
                                </div>
                             </div>

                             <div className="flex flex-col gap-2 w-full md:w-auto shrink-0 font-mono">
                                 <div className="p-4 bg-slate-900 text-[10px] text-white flex items-center justify-between gap-10 border border-slate-800">
                                     <span className="text-slate-500 uppercase font-bold tracking-[0.2em]">F-End</span>
                                     <span className="text-indigo-400">React + Tailwind</span>
                                 </div>
                                 <div className="h-4 w-px bg-slate-200 mx-auto" />
                                 <div className="p-4 bg-slate-900 text-[10px] text-white border border-indigo-500/30 flex flex-col items-center gap-2">
                                     <span className="text-slate-500 uppercase font-bold tracking-[0.2em]">C-Engine</span>
                                     <span className="text-emerald-400">NestJS Core</span>
                                     <div className="flex gap-2 mt-2 opacity-60">
                                         <div className="px-2 py-0.5 bg-white/5 border border-white/10 uppercase">Strategies</div>
                                         <div className="px-2 py-0.5 bg-white/5 border border-white/10 uppercase">DAG</div>
                                     </div>
                                 </div>
                                 <div className="h-4 w-px bg-slate-200 mx-auto" />
                                 <div className="p-4 bg-slate-50 text-[10px] text-slate-900 border border-slate-200 border-dashed flex items-center justify-around gap-4">
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
                                <div key={i} className="p-6 bg-white border border-slate-200/70 hover:border-indigo-400 transition-all">
                                    <h4 className="text-xs font-bold text-slate-900 mb-3 underline decoration-indigo-500/30 underline-offset-4">{item.q}</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">{item.a}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-16 p-8 bg-slate-900 text-center space-y-6 border border-slate-800 relative overflow-hidden group">
                             <div className="relative z-10 space-y-4">
                                <h3 className="text-2xl font-black text-white tracking-tight">Need engineering support?</h3>
                                <p className="text-slate-400 max-w-sm mx-auto text-xs font-medium">Join our developer Discord or browse active discussions on GitHub. We respond fast.</p>
                                <div className="flex justify-center gap-3 pt-2">
                                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase px-6 py-2.5 transition-all active:scale-95 border border-indigo-500/40">
                                        Join Community
                                    </button>
                                    <button className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase px-6 py-2.5 border border-white/10 transition-all">
                                        Github Discussions
                                    </button>
                                </div>
                             </div>
                             <Boxes className="absolute -left-10 -bottom-10 text-white/10 opacity-40" size={200} />
                        </div>
                    </section>
                </main>

                {/* Lexicon Right Sidebar - Persistent Node List */}
                <aside className="lg:w-72 shrink-0 lg:h-[calc(100vh-80px)] lg:sticky lg:top-20 py-10 hidden lg:flex flex-col gap-8">
                    <div className="space-y-4">
                        <div className="px-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quick Access</p>
                            <h4 className="text-base font-black text-slate-900 tracking-tight">Node Lexicon</h4>
                        </div>
                        <nav className="space-y-1.5 overflow-y-auto custom-scrollbar pr-2 max-h-[calc(100vh-350px)]">
                            {nodes.map((node) => (
                                <button 
                                    key={node.id}
                                    onClick={() => navigate(`/documentation?node=${node.id}`)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-white hover:border-slate-200 bg-white/40 border border-transparent transition-all group"
                                >
                                    <div className="w-8 h-8 bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                        <node.icon size={14} />
                                    </div>
                                    <span className="truncate">{node.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/50 space-y-4">
                        <Zap size={20} className="text-indigo-600" />
                        <h5 className="text-xs font-black text-indigo-900 uppercase tracking-tight leading-relaxed">Fast-Track Your Automation</h5>
                        <p className="text-[10px] text-indigo-700/70 font-medium leading-relaxed">Learn how to chain nodes together to build complex data pipelines in minutes.</p>
                    </div>
                </aside>
            </div>

            {/* Minimalist Footer */}
            <footer className="bg-white border-t border-slate-200/50 py-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
                    <div className="space-y-6 max-w-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-white">
                                <Zap size={18} fill="currentColor" />
                            </div>
                            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">Automation Kit</span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                            Synthesize document processing, logic, and storage into one premium engine. The professional choice for visual automation.
                        </p>
                        <div className="flex items-center gap-3">
                             <a href="#" className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-200"><Github size={16} /></a>
                             <a href="#" className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-200"><Share2 size={16} /></a>
                             <a href="#" className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-200"><ExternalLink size={16} /></a>
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
                        <div className="flex items-center gap-1.5 py-1 px-3 bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Operational</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">STABLE v1.2.0-PRO</span>
                    </div>
                </div>
            </footer>

        </div>
    );
};
