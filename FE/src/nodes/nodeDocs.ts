import {
    Sparkles, Binary, FileText, Mail, HardDrive, Code, Calendar, Upload, Globe
} from 'lucide-react';

export const NODE_DOCS = [
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
        id: 'ocr',
        name: 'OCR Processing',
        category: 'ai',
        icon: Binary,
        purpose: 'AI-driven OCR for document text extraction.',
        usage: 'Pass an image/PDF file. Returns normalized text for downstream nodes.',
        features: ['PDF support', 'Configurable models', 'Structured output'],
        howItWorks: 'This node uses a configured OCR-capable model to extract text from images or PDFs, normalizing the output for later parsing or summarization.',
        whyUseIt: 'Use it as the first step when your workflow starts with scanned documents or images.',
        example: 'Extracting text from a scanned invoice to feed Smart Extraction.'
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
        id: 'outlook',
        name: 'Outlook',
        category: 'integration',
        icon: Mail,
        purpose: 'Microsoft 365 Email Integration.',
        usage: 'Full support for Reading, Sending, and Moving emails via MS Graph API.',
        features: ['Folder Watch', 'Email Send', 'Move/Archive'],
        howItWorks: 'Integrates with Microsoft Graph API to interact with your Outlook mailbox. Supports complex OData queries for filtering and rich-text email composition.',
        whyUseIt: 'Essential for enterprise environments relying on the Microsoft ecosystem.',
        example: 'Automatically archiving processed invoices to a specific Outlook folder.'
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
        id: 'http-request',
        name: 'HTTP Request',
        category: 'integration',
        icon: Globe,
        purpose: 'Universal API Connector.',
        usage: 'Connect to any REST/GraphQL endpoint.',
        features: ['Authentication', 'Custom Headers', 'JSON Body'],
        howItWorks: 'Acts as a robust HTTP client (similar to Postman) within your workflow. Allows dynamic injection of data into URL, Headers, and Body.',
        whyUseIt: 'The swiss-army knife of integration. Connects your workflow to thousands of SaaS tools (Slack, Jira, Salesforce) that have an API.',
        example: 'Posting a notification to a Slack webhook when a workflow completes.'
    },
    {
        id: 'code-node',
        name: 'JS/Python Code',
        category: 'logic',
        icon: Code,
        purpose: 'Custom logic execution.',
        usage: 'Write JavaScript or Python to transform data or perform complex calculations.',
        features: ['Sandboxed execution', 'Variable resolution', 'Multi-language'],
        howItWorks: 'Executes your code in a secure, isolated environment. It resolves variables in your code before execution and captures the returned object as the node output.',
        whyUseIt: 'When off-the-shelf nodes can\'t handle your specific business logic or data transformation needs.',
        example: 'Parsing a custom proprietary date format or merging multiple data arrays into a single report.'
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

export const getDocForNode = (nodeType: string) => {
    const typeMapping: Record<string, string> = {
        'OCR': 'ocr',
        'CODE': 'code-node',
        'SUMMARIZE': 'summarize',
        'SMART_EXTRACTION': 'smart-extraction',
        'GMAIL_TRIGGER': 'gmail-trigger',
        'OUTLOOK': 'outlook',
        'GOOGLE_DRIVE': 'google-drive',
        'HTTP_REQUEST': 'http-request',
        'IF_ELSE': 'if-else',
        'SCHEDULE': 'schedule',
        'FILE_UPLOAD': 'file-upload'
    };

    const id = typeMapping[nodeType] || nodeType.toLowerCase();
    return NODE_DOCS.find(n => n.id === id);
};
