import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Handle, Position } from "@xyflow/react";
import type { ComponentProps } from "react";
import { AnimatedBorder } from "@/components/ui/animated-border";

export type NodeProps = ComponentProps<typeof Card> & {
  handles?: {
    target?: boolean;
    source?: boolean;
  };
  status?: "idle" | "running" | "success" | "error";
  selected?: boolean;
  isConnectable?: boolean;
};

export const Node = ({ handles, className, status, selected, isConnectable, ...props }: NodeProps) => (
  <Card
    className={cn(
      "node-container group relative h-auto w-auto min-w-[200px] max-w-[280px] rounded-xl bg-white shadow-sm transition-all duration-200 border border-slate-200 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5",
      status === "success" && "border-green-500 ring-2 ring-green-500/10",
      status === "error" && "border-red-500 ring-2 ring-red-500/10",
      selected && "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg",
      className
    )}
    {...props}
  >
    {status === "running" && <AnimatedBorder />}
    {handles?.target && (
         <Handle 
            position={Position.Left} 
            type="target" 
            isConnectable={isConnectable}
            className="!w-3.5 !h-3.5 !bg-slate-400 !border-2 !border-white transition-all hover:!bg-indigo-500 hover:scale-125 top-1/2 -left-[9px]"
        />
    )}
    {handles?.source && (
        <Handle 
            position={Position.Right} 
            type="source" 
            isConnectable={isConnectable}
            className="!w-3.5 !h-3.5 !bg-slate-400 !border-2 !border-white transition-all hover:!bg-indigo-500 hover:scale-125 top-1/2 -right-[9px]"
        />
    )}
    {props.children}
  </Card>
);

export type NodeHeaderProps = ComponentProps<typeof CardHeader>;

export const NodeHeader = ({ className, ...props }: NodeHeaderProps) => (
  <CardHeader
    className={cn("flex flex-row items-center gap-2 px-3 py-2 border-b border-slate-100/80 bg-slate-50/50 rounded-t-xl", className)}
    {...props}
  />
);

export type NodeTitleProps = ComponentProps<typeof CardTitle>;

export const NodeTitle = ({ className, ...props}: NodeTitleProps) => (
    <CardTitle 
        className={cn("text-sm font-semibold text-slate-700 tracking-tight", className)} 
        {...props} 
    />
);

export type NodeDescriptionProps = ComponentProps<typeof CardDescription>;

export const NodeDescription = (props: NodeDescriptionProps) => (
  <CardDescription {...props} />
);

export type NodeActionProps = ComponentProps<typeof CardAction>;

export const NodeAction = (props: NodeActionProps) => <CardAction {...props} />;

export type NodeContentProps = ComponentProps<typeof CardContent>;

export const NodeContent = ({ className, ...props }: NodeContentProps) => (
  <CardContent className={cn("p-3 pt-2 text-xs text-slate-600", className)} {...props} />
);

export type NodeFooterProps = ComponentProps<typeof CardFooter>;

export const NodeFooter = ({ className, ...props }: NodeFooterProps) => (
  <CardFooter
    className={cn("flex items-center p-2 border-t border-slate-100 bg-slate-50/30 rounded-b-xl", className)}
    {...props}
  />
);
