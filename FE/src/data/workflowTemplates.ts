import type { WorkflowEdge, WorkflowNode } from '../types/workflow.types';

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    metadata?: {
        name: string;
        description: string;
    };
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'invoice-processing',
        name: 'Intelligent Invoice Processing',
        description: 'Automate AP by extracting data from invoice emails and saving to DB.',
        metadata: {
            name: 'Invoice Operations',
            description: 'Automated invoice processing pipeline with OCR and Smart Extraction.'
        },
        nodes: [
            {
                id: 'node_1',
                type: 'GMAIL',
                position: { x: 100, y: 100 },
                nodeName: 'Watch Invoices',
                data: {
                    label: 'Watch Invoices',
                    config: { query: 'label:invoices' }
                }
            },
            {
                id: 'node_2',
                type: 'OCR',
                position: { x: 100, y: 250 },
                nodeName: 'Extract Text (OCR)',
                data: {
                    label: 'Extract Text (OCR)',
                    config: { model: 'gemini-1.5-flash-001' }
                }
            },
            {
                id: 'node_3',
                type: 'SMART_EXTRACTION',
                position: { x: 100, y: 400 },
                nodeName: 'Parse Invoice Data',
                data: {
                    label: 'Parse Invoice Data',
                    config: {
                        fields: ['invoice_number', 'vendor_name', 'date', 'total_amount', 'line_items'],
                        model: 'gemini-1.5-flash-001'
                    }
                }
            },
            {
                id: 'node_4',
                type: 'IF_ELSE',
                position: { x: 100, y: 550 },
                nodeName: 'Check High Value',
                data: {
                    label: 'Check High Value',
                    config: {
                        condition: 'total_amount > 1000'
                    }
                }
            },
            {
                id: 'node_5',
                type: 'GMAIL',
                position: { x: -100, y: 700 },
                nodeName: 'Email Manager',
                data: {
                    label: 'Email Manager',
                    config: {
                        to: 'manager@example.com',
                        subject: 'High Value Invoice Approval Needed'
                    }
                }
            },
            {
                id: 'node_6',
                type: 'MONGODB',
                position: { x: 300, y: 700 },
                nodeName: 'Save into Database',
                data: {
                    label: 'Save into Database',
                    config: {
                        collection: 'invoices'
                    }
                }
            }
        ],
        edges: [
            { id: 'edge_1', source: 'node_1', target: 'node_2' },
            { id: 'edge_2', source: 'node_2', target: 'node_3' },
            { id: 'edge_3', source: 'node_3', target: 'node_4' },
            { id: 'edge_4', source: 'node_4', target: 'node_5', sourceHandle: 'true' },
            { id: 'edge_5', source: 'node_4', target: 'node_6', sourceHandle: 'false' }
        ]
    },
    {
        id: 'daily-digest',
        name: 'Daily Digest',
        description: 'Summarize key inbox items on a schedule and email the digest.',
        metadata: {
            name: 'Daily Digest',
            description: 'Scheduled summary of important inbox messages.'
        },
        nodes: [
            {
                id: 'node_1',
                type: 'SCHEDULE',
                position: { x: 100, y: 100 },
                nodeName: 'Every Morning',
                data: {
                    label: 'Every Morning',
                    config: { cron: '0 9 * * *' }
                }
            },
            {
                id: 'node_2',
                type: 'GMAIL',
                position: { x: 100, y: 250 },
                nodeName: 'Fetch Inbox',
                data: {
                    label: 'Fetch Inbox',
                    config: { query: 'newer_than:1d' }
                }
            },
            {
                id: 'node_3',
                type: 'SUMMARIZE',
                position: { x: 100, y: 400 },
                nodeName: 'Summarize',
                data: {
                    label: 'Summarize',
                    config: { length: 'short', tone: 'executive' }
                }
            },
            {
                id: 'node_4',
                type: 'GMAIL',
                position: { x: 100, y: 560 },
                nodeName: 'Send Digest',
                data: {
                    label: 'Send Digest',
                    config: { to: 'me@example.com', subject: 'Daily Digest' }
                }
            }
        ],
        edges: [
            { id: 'edge_1', source: 'node_1', target: 'node_2' },
            { id: 'edge_2', source: 'node_2', target: 'node_3' },
            { id: 'edge_3', source: 'node_3', target: 'node_4' }
        ]
    },
    {
        id: 'drive-ocr-archive',
        name: 'Drive OCR Archive',
        description: 'Extract text from Drive files and archive structured data.',
        metadata: {
            name: 'Drive OCR Archive',
            description: 'Monitor Drive, OCR new files, then store structured data.'
        },
        nodes: [
            {
                id: 'node_1',
                type: 'GOOGLE_DRIVE',
                position: { x: 100, y: 100 },
                nodeName: 'New Drive Files',
                data: {
                    label: 'New Drive Files',
                    config: { folderId: 'root' }
                }
            },
            {
                id: 'node_2',
                type: 'OCR',
                position: { x: 100, y: 260 },
                nodeName: 'OCR Documents',
                data: {
                    label: 'OCR Documents',
                    config: { model: 'gemini-1.5-flash-001' }
                }
            },
            {
                id: 'node_3',
                type: 'SMART_EXTRACTION',
                position: { x: 100, y: 420 },
                nodeName: 'Extract Fields',
                data: {
                    label: 'Extract Fields',
                    config: { fields: ['title', 'date', 'summary'] }
                }
            },
            {
                id: 'node_4',
                type: 'MONGODB',
                position: { x: 100, y: 580 },
                nodeName: 'Archive Results',
                data: {
                    label: 'Archive Results',
                    config: { collection: 'documents' }
                }
            }
        ],
        edges: [
            { id: 'edge_1', source: 'node_1', target: 'node_2' },
            { id: 'edge_2', source: 'node_2', target: 'node_3' },
            { id: 'edge_3', source: 'node_3', target: 'node_4' }
        ]
    }
];
