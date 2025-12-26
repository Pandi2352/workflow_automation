import React from 'react';

export const AnimatedWorkflowBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-slate-50">
            {/* 1. Large Gradient Orbs for Depth (Subtle) */}
            <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-blue-100/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '15s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-emerald-100/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse delay-700" style={{ animationDuration: '20s' }} />
            
            {/* 2. Isometric Grid Container */}
            <div className="absolute inset-0 flex items-center justify-center transform scale-125 opacity-60">
                <svg width="100%" height="100%" viewBox="-200 -200 1400 1400" className="opacity-80">
                    <defs>
                         <pattern id="isoGrid" width="60" height="35" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 60 17.5 L 30 35 L 0 17.5 Z" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                        </pattern>
                        <filter id="glow-iso">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Base Infinite Grid */}
                    <rect x="-50%" y="-50%" width="200%" height="200%" fill="url(#isoGrid)" />

                    {/* Animated Active Cells (Cubes) */}
                    {/* Randomly placed active cells providing "Computation" feel */}
                    <IsoCube x={6} y={5} color="#3b82f6" delay={0} />
                    <IsoCube x={12} y={8} color="#10b981" delay={1.5} />
                    <IsoCube x={8} y={15} color="#8b5cf6" delay={2.3} />
                    <IsoCube x={18} y={12} color="#f59e0b" delay={0.8} />
                    <IsoCube x={4} y={20} color="#ec4899" delay={3.1} />
                    <IsoCube x={15} y={22} color="#06b6d4" delay={1.2} />
                    <IsoCube x={22} y={5} color="#6366f1" delay={2.7} />

                    {/* Data Streams flowing along grid lines */}
                    {/* Path 1: Top-Left to Center */}
                    <IsoPath path="M 180 105 L 360 210 L 540 105" color="#3b82f6" activeColor="#60a5fa" duration={4} />

                    {/* Path 2: Bottom-Left Up */}
                    <IsoPath path="M 60 402 L 240 297 L 240 192" color="#10b981" activeColor="#34d399" duration={5} delay={1} />
                    
                    {/* Path 3: Traverse Right */}
                    <IsoPath path="M 540 507 L 720 402 L 900 507" color="#8b5cf6" activeColor="#a78bfa" duration={6} delay={2} />

                    {/* Path 4: Snake */}
                    <IsoPath path="M 360 612 L 540 507 L 540 297 L 720 192" color="#f59e0b" activeColor="#fbbf24" duration={8} delay={0.5} />
                    
                </svg>
            </div>
            
            {/* 3. Foreground Overlay (Grain) for Texture */}
             <div className="absolute inset-0 opacity-[0.4] mix-blend-overlay pointer-events-none" 
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")` }} 
             />
        </div>
    );
};

// Helper for an active "Cube" cell on the isometric grid
const IsoCube = ({ x, y, color, delay }: any) => {
    // Convert grid coords to screen pixels
    // Tile w=60, h=35.
    // Staggered grid logic approximation for visual placement
    // x * 30, y * 17.5 ish.
    // For a simple diamond grid:
    // cx = (x - y) * 30
    // cy = (x + y) * 17.5
    // Adjusted manually to fit within the viewbox range appropriately
    
    // To simplify: we'll just place them on the pattern grid intersections
    // const px = x * 30 + (y % 2) * 15; // Rough offset
    // const py = y * 35; // Rough vertical

    // Better Isometric projection map:
    // Iso X vector: (30, 17.5)
    // Iso Y vector: (-30, 17.5)
    const isoX = (x * 30) - (y * 30) + 600; // +600 to center horizontally
    const isoY = (x * 17.5) + (y * 17.5);

    return (
        <g transform={`translate(${isoX}, ${isoY})`}>
            {/* The Cell Itself */}
            <path 
                d="M 30 0 L 60 17.5 L 30 35 L 0 17.5 Z" 
                fill={color} 
                opacity="0.1"
                className="animate-pulse"
                style={{ animationDuration: '4s', animationDelay: `${delay}s` }}
            />
            {/* Top Highlight (Glass/Ice cube look) */}
            <path 
                d="M 30 0 L 60 17.5 L 30 35 L 0 17.5 Z" 
                fill="url(#grad-shine)"
                stroke={color}
                strokeWidth="1"
                fillOpacity="0.2"
                style={{
                    animation: `float-iso 4s ease-in-out infinite`,
                    animationDelay: `${delay}s`
                }}
            />
            
            {/* Shadow */}
            <ellipse cx="30" cy="45" rx="20" ry="10" fill="black" opacity="0.1">
                <animate attributeName="rx" values="20;15;20" dur="4s" begin={`${delay}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.1;0.05;0.1" dur="4s" begin={`${delay}s`} repeatCount="indefinite" />
            </ellipse>

             <style>{`
                @keyframes float-iso {
                    0%, 100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-15px); opacity: 1; }
                }
            `}</style>
        </g>
    )
}

const IsoPath = ({ path, color, activeColor, duration, delay = 0 }: any) => {
    return (
        <g>
            {/* Background Track */}
            <path d={path} stroke={color} strokeWidth="1" strokeOpacity="0.1" fill="none" />
            
            {/* Traveling Pulse */}
            <path d={path} stroke={activeColor} strokeWidth="3" fill="none" strokeDasharray="0 1000" strokeLinecap="round" opacity="1" filter="url(#glow-iso)">
                 <animate 
                    attributeName="stroke-dasharray" 
                    values="0 1000; 100 1000; 0 1000" 
                    dur={`${duration}s`} 
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                    keyTimes="0; 0.5; 1"
                 />
                 <animate 
                    attributeName="stroke-dashoffset" 
                    values="200; -400" 
                    dur={`${duration}s`} 
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                 />
                  <animate 
                    attributeName="opacity" 
                    values="0; 1; 0" 
                    dur={`${duration}s`} 
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                 />
            </path>
        </g>
    )
}
