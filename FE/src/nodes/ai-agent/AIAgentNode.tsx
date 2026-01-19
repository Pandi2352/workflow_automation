
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot, Sparkles } from 'lucide-react';
import { BaseNode } from '../BaseNode';

export const AIAgentNode = memo((props: NodeProps) => {
    const nodeData = props.data as any;

    return (
        <BaseNode
            {...props}
            label={nodeData.label || 'AI Agent'}
            icon={Bot}
            color="text-emerald-600"
            isConnectable={props.isConnectable}
        >
            <div className="flex flex-col gap-2">
                <div className="text-[10px] text-slate-500 font-medium italic">
                    {nodeData.description || 'Intelligent agent that can use tools'}
                </div>
                
                {/* Agent Type / Model Badge */}
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                    <Sparkles size={10} className="text-emerald-600" />
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight">
                        {nodeData.config?.agentType || 'Reasoning Agent'}
                    </span>
                </div>

                {/* Bottom Handles Labels */}
                <div className="flex justify-between items-center mt-2 px-1">
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Model*</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Memory</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Tool</span>
                    </div>
                </div>
            </div>

            {/* Custom Bottom Handles */}
            <Handle
                type="target"
                position={Position.Bottom}
                id="model"
                isConnectable={props.isConnectable}
                style={{ left: '25%', bottom: '-6px' }}
                className="!w-3.5 !h-3.5 !bg-white !border-2 !border-emerald-500 !shadow-md transition-all hover:scale-125 hover:!bg-emerald-50"
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id="memory"
                isConnectable={props.isConnectable}
                style={{ left: '50%', bottom: '-6px' }}
                className="!w-3.5 !h-3.5 !bg-white !border-2 !border-slate-300 !shadow-md transition-all hover:scale-125 hover:!bg-slate-50"
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id="tool"
                isConnectable={props.isConnectable}
                style={{ left: '75%', bottom: '-6px' }}
                className="!w-3.5 !h-3.5 !bg-white !border-2 !border-amber-400 !shadow-md transition-all hover:scale-125 hover:!bg-amber-50"
            />
        </BaseNode>
    );
});

export default AIAgentNode;
