import React from 'react';

export const CanvasLoader: React.FC = () => {
    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md transition-opacity duration-500">
            <div className="relative flex items-center justify-center w-40 h-40">
                {/* Fixed Structural Cross */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-emerald-50"></div>
                <div className="absolute left-1/2 top-0 w-[1px] h-full bg-emerald-50"></div>
                
                {/* Rotating Squares (Concentric) */}
                <div className="absolute inset-0 border-[1px] border-emerald-200 rounded-lg animate-[spin_8s_linear_infinite]"></div>
                <div className="absolute inset-4 border-[1px] border-emerald-400/40 rounded-md animate-[spin_6s_linear_infinite_reverse]"></div>
                <div className="absolute inset-8 border-[1px] border-emerald-600/20 rounded-sm animate-[spin_4s_linear_infinite]"></div>
                
                {/* Central Data Core */}
                <div className="w-10 h-10 border-2 border-emerald-500 rounded-sm flex items-center justify-center animate-pulse">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
                
                {/* Peripheral Data Points */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
            </div>
            
            <div className="mt-16 text-center">
                <h3 className="text-emerald-900 font-black text-xs uppercase tracking-[0.5em] mb-4">
                    Initialising Architect
                </h3>
                
                <div className="flex gap-1 justify-center">
                    {[0, 150, 300, 450, 600].map((delay) => (
                        <div 
                            key={delay}
                            className="w-8 h-1 bg-emerald-100 overflow-hidden rounded-full"
                        >
                            <div 
                                className="w-full h-full bg-emerald-500 animate-[progress_1.5s_ease-in-out_infinite]"
                                style={{ animationDelay: `${delay}ms` }}
                            ></div>
                        </div>
                    ))}
                </div>
                
                <p className="mt-6 text-[10px] font-mono text-emerald-400/60 uppercase tracking-widest">
                    Hydrating Workspace Data...
                </p>
            </div>

            <style>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

