"use client";

import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize2, MapPin, MapPinOff } from "lucide-react";
import { Button } from "../../common/Button";
import { useWorkflowStore } from "../../store/workflowStore";
import { Panel } from "@xyflow/react";

interface ControlsProps {
    children?: React.ReactNode;
}

export const Controls: React.FC<ControlsProps> = ({ children }) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { showMinimap, toggleMinimap } = useWorkflowStore();

    const handleZoomIn = () => {
        zoomIn();
    };

    const handleZoomOut = () => {
        zoomOut();
    };

    const handleFitView = () => {
        fitView({ padding: 0.2, duration: 300 });
    };

    return (
        <Panel position="bottom-left">
            <div className="flex flex-col gap-1 p-1 bg-white/90 dark:bg-black/90 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
                <Button
                    className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-none shadow-none"
                    onClick={handleZoomIn}
                    size="icon"
                    title="Zoom in"
                    variant="ghost"
                >
                    <ZoomIn className="size-4" />
                </Button>
                <Button
                    className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-none shadow-none"
                    onClick={handleZoomOut}
                    size="icon"
                    title="Zoom out"
                    variant="ghost"
                >
                    <ZoomOut className="size-4" />
                </Button>
                <Button
                    className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-none shadow-none"
                    onClick={handleFitView}
                    size="icon"
                    title="Fit view"
                    variant="ghost"
                >
                    <Maximize2 className="size-4" />
                </Button>
                <Button
                    className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-none shadow-none"
                    onClick={toggleMinimap}
                    size="icon"
                    title={showMinimap ? "Hide minimap" : "Show minimap"}
                    variant="ghost"
                >
                    {showMinimap ? (
                        <MapPin className="size-4" />
                    ) : (
                        <MapPinOff className="size-4" />
                    )}
                </Button>
                {/* Custom Children (like AutoLayout, Undo/Redo) */}
                {children}
            </div>
        </Panel>
    );
};
