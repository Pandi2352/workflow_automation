import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Combine, Cpu, Shield } from 'lucide-react';
import { AnimatedWorkflowBackground } from '../components/landing/AnimatedWorkflowBackground';
import { Button } from '../common/Button';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
            
            {/* Animated Background */}
            <AnimatedWorkflowBackground />

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 h-20 border-b border-slate-200/50 backdrop-blur-sm bg-white/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">Automation Kit</span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Sign In
                    </button>
                    <Button 
                        onClick={() => navigate('/dashboard')}
                        className="bg-slate-900 text-white hover:bg-slate-800 border-none shadow-xl shadow-slate-900/10"
                    >
                        Get Started
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 px-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    v1.0 Now Available
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl leading-[1.1] text-slate-900 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    Automate your work <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">
                        without limits.
                    </span>
                </h1>

                <p className="text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    Build powerful workflows, integrate AI, and connect your favorite apps with a visual designer that feels like magic.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="group relative px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-600/30 flex items-center gap-2"
                    >
                        Start Automating Free
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                        onClick={() => navigate('/documentation')}
                        className="px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full font-semibold text-lg transition-all shadow-sm hover:shadow-md"
                    >
                        View Documentation
                    </button>
                </div>
            </div>

            {/* Features Grid */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard 
                        icon={Combine}
                        title="Visual Builder"
                        desc="Drag, drop, and connect nodes to create complex logic without writing code."
                        delay={400}
                    />
                    <FeatureCard 
                        icon={Cpu}
                        title="AI Powered"
                        desc="Integrate LLMs directly into your flow for smart extraction, summarization, and more."
                        delay={500}
                    />
                    <FeatureCard 
                        icon={Shield}
                        title="Secure & Private"
                        desc="Enterprise-grade security implies your data stays safe and under your control."
                        delay={600}
                    />
                </div>
            </div>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
    <div 
        className="p-8 rounded-3xl bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 cursor-default group"
        style={{ animation: `fadeInUp 0.8s ease-out ${delay}ms backwards` }}
    >
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 mb-6 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-300">
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-500 leading-relaxed">
            {desc}
        </p>
        
        <style>{`
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
);
