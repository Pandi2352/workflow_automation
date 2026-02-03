import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { BaseNode } from '../BaseNode';

const getHost = (url: string): string => {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
};

export const BrowserScraperNode = memo((props: NodeProps) => {
    const config = (props.data.config || {}) as Record<string, any>;
    const mode = String(config.mode || 'ai').toUpperCase();
    const host = config.url ? getHost(String(config.url)) : '';

    return (
        <BaseNode
            {...props}
            label={(props.data.label as string) || 'Browser Scraper'}
            icon={Globe}
            color="text-cyan-600"
        >
            <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-700">Mode: {mode}</div>
                <div className="text-xs text-slate-500 truncate">{host || 'No URL configured'}</div>
            </div>
        </BaseNode>
    );
});

export default BrowserScraperNode;
