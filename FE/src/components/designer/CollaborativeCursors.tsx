import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useReactFlow } from '@xyflow/react';
import { MousePointer2 } from 'lucide-react';

// Random color generator
const getColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export const CollaborativeCursors: React.FC<{ workflowId: string }> = ({ workflowId }) => {
    const { socket, joinWorkflow, leaveWorkflow, emitCursor, isConnected } = useSocket();
    const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
    const [cursors, setCursors] = useState<{ [userId: string]: { x: number, y: number, userName?: string } }>({});
    
    // Identity - Ideally from Auth Context
    const userId = useRef(`user_${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (isConnected && workflowId) {
            joinWorkflow(workflowId);

            socket?.on('cursor-update', (data: { x: number, y: number, userId: string, userName?: string }) => {
                 setCursors(prev => ({ ...prev, [data.userId]: data }));
            });

            return () => {
                leaveWorkflow(workflowId);
                socket?.off('cursor-update');
            };
        }
    }, [isConnected, workflowId, joinWorkflow, leaveWorkflow, socket]);

    // Track mouse movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
             // We need to send FLOW coordinates, so they stick to the canvas world
             // But we are listening to global mouse move? 
             // Ideally we listen to ReactFlow's onMouseMove, but a global listener works if we map correctly.
             // Actually, for better UX, let's just listen to document and convert.
             // Wait, if we send screen coordinates, they will be wrong for other users with different viewports/zoom.
             // We MUST send Flow coordinates.
             
             const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
             
             emitCursor(workflowId, { 
                 x: flowPos.x, 
                 y: flowPos.y, 
                 userId: userId.current,
                 userName: 'User ' + userId.current.substr(0,4) 
            });
        };

        // Throttle this in real app!
        const throttledMove = (e: MouseEvent) => {
             requestAnimationFrame(() => handleMouseMove(e));
        };

        document.addEventListener('mousemove', throttledMove);
        return () => document.removeEventListener('mousemove', throttledMove);
    }, [workflowId, emitCursor, screenToFlowPosition]);

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {Object.entries(cursors).map(([id, cursor]) => {
                // Convert flow coordinates back to screen for rendering overlay?
                // Or render them INSIDE the ReactFlow viewport using a custom edge/node?
                // Rendering as overlay requires mapping back to screen.
                
                // ISSUE: useReactFlow's flowToScreenPosition is needed.
                // However, this component is inside ReactFlowProvider but maybe not inside ReactFlow viewport?
                // It should be rendered INSIDE <ReactFlow> as a child or sibling? 
                // Creating a simplified overlay that assumes this component is mounted *alongside* ReactFlow.
                
                // Let's try rendering INSIDE ReactFlow by placing it in WorkflowCanvasInner.
                // If it is inside, we can just use absolute positioning if we assume the parent is the flow renderer.
                // Actually, standard way is to map flowToScreen.
                
                const screenPos = flowToScreenPosition({ x: cursor.x, y: cursor.y });

                return (
                    <div 
                        key={id}
                        className="absolute flex items-start gap-1 transition-all duration-100 ease-linear"
                        style={{ 
                            transform: `translate(${screenPos.x}px, ${screenPos.y}px)`,
                        }}
                    >
                        <MousePointer2 
                            size={16} 
                            fill={getColor(id)} 
                            className="text-white drop-shadow-sm" 
                            stroke={getColor(id)}
                        />
                        <span 
                            className="bg-white/90 text-[10px] px-1.5 py-0.5 rounded shadow-sm font-medium border border-slate-100"
                            style={{ color: getColor(id) }}
                        >
                            {cursor.userName || id}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
