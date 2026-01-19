import { Injectable } from '@nestjs/common';
import { SampleNodeType } from '../enums/node-type.enum';
import { BaseWorkflowNode } from '../nodes/workflow-node.interface';
import { GoogleDriveNode } from '../nodes/google-drive.node';
import { OneDriveNode } from '../nodes/onedrive.node';
import { GmailNode } from '../nodes/gmail.node';
import { GoogleDriveService } from '../node-services/google-drive.service';
import { OneDriveService } from '../node-services/onedrive.service';
import { GmailService } from '../node-services/gmail.service';
import { ScheduleNode } from '../nodes/schedule.node';
import { OCRService } from '../node-services/ocr.service';
import { IfElseNodeStrategy } from '../nodes/if-else.node';
import { OCRNodeStrategy } from '../nodes/ocr.node';
import { ParsingNodeStrategy } from '../nodes/parsing.node';
import { MongoDBNodeStrategy } from '../nodes/mongodb.node';
import { SummarizeNodeStrategy } from '../nodes/summarize.node';
import { SuryaOCRNodeStrategy } from '../nodes/surya-ocr.node';
import { TesseractOCRNodeStrategy } from '../nodes/tesseract-ocr.node';
import { SuryaOCRService } from '../node-services/surya-ocr.service';
import { TesseractOCRService } from '../node-services/tesseract-ocr.service';
import { OutlookNode } from '../nodes/outlook.node';
import { OutlookService } from '../node-services/outlook.service';
import { RSSNode } from '../nodes/rss.node';

import { SmartExtractionNodeStrategy } from '../nodes/smart-extraction.node';
import { FileUploadNodeStrategy } from '../nodes/file-upload.node';
import { ParsingService } from '../../node-services/parsing.service';
import { MongoDBService } from '../../node-services/mongodb.service';
import { HttpRequestNodeStrategy } from '../../node-services/http-request/http-request.strategy';
import { DataMapperNodeStrategy } from '../../node-services/data-mapper/data-mapper.strategy';
import { ScraperNodeStrategy } from '../../node-services/scraper/scraper.strategy';
import { CodeNodeStrategy } from '../nodes/code.node';

export interface NodeDefinition {
    type: string;
    name: string;
    description: string;
    category: string;
    inputs: number;
    outputs: number;
    configSchema?: Record<string, any>;
}

import { ProcessedItemService } from '../../sample-workflow/services/processed-item.service';

@Injectable()
export class NodeRegistryService {
    private nodeInstances: Map<string, BaseWorkflowNode> = new Map();
    private nodeDefinitions: Map<string, NodeDefinition> = new Map();

    constructor(
        private readonly googleDriveService: GoogleDriveService,
        private readonly oneDriveService: OneDriveService,
        private readonly gmailService: GmailService,
        private readonly ocrService: OCRService,
        private readonly suryaOCRService: SuryaOCRService,
        private readonly tesseractOCRService: TesseractOCRService,
        private readonly parsingService: ParsingService,
        private readonly mongoService: MongoDBService,
        private readonly processedItemService: ProcessedItemService,
        private readonly codeNodeStrategy: CodeNodeStrategy,
        private readonly outlookService: OutlookService,
    ) {
        this.registerDefaultNodes();
        this.registerParsingNodes();
    }

    private registerDefaultNodes(): void {
        // Register node instances
        this.nodeInstances.set(SampleNodeType.GOOGLE_DRIVE, new GoogleDriveNode(this.googleDriveService));
        this.nodeInstances.set(SampleNodeType.ONEDRIVE, new OneDriveNode(this.oneDriveService));
        this.nodeInstances.set(SampleNodeType.GMAIL, new GmailNode(this.gmailService));
        this.nodeInstances.set(SampleNodeType.OUTLOOK, new OutlookNode(this.outlookService));
        this.nodeInstances.set(SampleNodeType.SCHEDULE, new ScheduleNode());
        this.nodeInstances.set(SampleNodeType.OCR, new OCRNodeStrategy(this.ocrService, this.processedItemService));
        this.nodeInstances.set(SampleNodeType.IF_ELSE, new IfElseNodeStrategy());
        this.nodeInstances.set(SampleNodeType.PARSING, new ParsingNodeStrategy(this.parsingService));
        this.nodeInstances.set(SampleNodeType.MONGODB, new MongoDBNodeStrategy(this.mongoService));
        this.nodeInstances.set(SampleNodeType.SUMMARIZE, new SummarizeNodeStrategy(this.ocrService));
        this.nodeInstances.set(SampleNodeType.SURYA_OCR, new SuryaOCRNodeStrategy(this.suryaOCRService, this.processedItemService));
        this.nodeInstances.set(SampleNodeType.TESSERACT_OCR, new TesseractOCRNodeStrategy(this.tesseractOCRService, this.processedItemService));



        this.nodeInstances.set(SampleNodeType.SMART_EXTRACTION, new SmartExtractionNodeStrategy(this.ocrService));
        this.nodeInstances.set(SampleNodeType.FILE_UPLOAD, new FileUploadNodeStrategy());
        this.nodeInstances.set(SampleNodeType.HTTP_REQUEST, new HttpRequestNodeStrategy());
        this.nodeInstances.set(SampleNodeType.DATA_MAPPER, new DataMapperNodeStrategy());
        this.nodeInstances.set(SampleNodeType.BROWSER_SCRAPER, new ScraperNodeStrategy(this.ocrService));
        this.nodeInstances.set(SampleNodeType.CODE, this.codeNodeStrategy);
        this.nodeInstances.set(SampleNodeType.RSS, new RSSNode());

        // Register node definitions
        this.nodeDefinitions.set(SampleNodeType.BROWSER_SCRAPER, {
            type: SampleNodeType.BROWSER_SCRAPER,
            name: 'Web Scraper (AI)',
            description: 'Fetch website content and extract data using AI',
            category: 'AI / Machine Learning',
            inputs: 0,
            outputs: 1,
            configSchema: {
                url: {
                    type: 'string',
                    description: 'Website URL to scrape',
                    default: ''
                },
                mode: {
                    type: 'select',
                    options: ['ai', 'selector'],
                    default: 'ai'
                },
                prompt: {
                    type: 'string',
                    description: 'Instructions for AI extraction',
                    default: 'Extract the title, main article text, and date.'
                }
            }
        });


        // Register node definitions
        this.nodeDefinitions.set(SampleNodeType.RSS, {
            type: SampleNodeType.RSS,
            name: 'RSS Feed',
            description: 'Fetch and parse RSS feeds',
            category: 'Network',
            inputs: 1,
            outputs: 1,
            configSchema: {
                url: {
                    type: 'string',
                    description: 'RSS Feed URL',
                    default: ''
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.GOOGLE_DRIVE, {
            type: SampleNodeType.GOOGLE_DRIVE,
            name: 'Google Drive',
            description: 'Fetch files and folders from Google Drive',
            category: 'Google',
            inputs: 0,
            outputs: 1,
            configSchema: {
                operation: {
                    type: 'select',
                    options: ['fetch_files', 'fetch_folders', 'upload_file'],
                    default: 'fetch_files',
                    description: 'Operation to perform'
                },
                folderId: {
                    type: 'folder_selector',
                    description: 'Folder ID to list files from (optional)',
                    condition: { operation: 'fetch_files' }
                },
                parentId: {
                    type: 'string',
                    description: 'Parent Folder ID to list folders from (optional)',
                    condition: { operation: 'fetch_folders' }
                },
                targetFolderId: {
                    type: 'string',
                    description: 'Target Folder ID for upload',
                    condition: { operation: 'upload_file' }
                },
                fileName: {
                    type: 'string',
                    description: 'Target Filename (Optional, defaults to input name)',
                    condition: { operation: 'upload_file' }
                },
                credentials: {
                    type: 'credential',
                    provider: 'google',
                    description: 'Google Drive Credentials'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.ONEDRIVE, {
            type: SampleNodeType.ONEDRIVE,
            name: 'OneDrive (Microsoft)',
            description: 'Fetch files and folders from OneDrive',
            category: 'Microsoft',
            inputs: 0,
            outputs: 1,
            configSchema: {
                operation: {
                    type: 'select',
                    options: ['fetch_files', 'fetch_folders'],
                    default: 'fetch_files',
                    description: 'Operation to perform'
                },
                folderId: {
                    type: 'string', // Eventually could be folder_selector if UI supports it for OneDrive
                    description: 'Folder ID to list files from (optional)',
                    condition: { operation: 'fetch_files' }
                },
                parentId: {
                    type: 'string',
                    description: 'Parent Folder ID to list folders from (optional)',
                    condition: { operation: 'fetch_folders' }
                },
                credentials: {
                    type: 'credential',
                    provider: 'microsoft',
                    description: 'OneDrive (Microsoft) Credentials'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.GMAIL, {
            type: SampleNodeType.GMAIL,
            name: 'Gmail (Trigger)',
            description: 'Fetch emails and attachments from Gmail',
            category: 'Google',
            inputs: 0,
            outputs: 1,
            configSchema: {
                query: {
                    type: 'string',
                    description: 'Search Query (e.g. "subject:invoice has:attachment")',
                    default: ''
                },
                maxResults: {
                    type: 'number',
                    description: 'Max emails to fetch',
                    default: 5
                },
                credentials: {
                    type: 'credential',
                    provider: 'gmail',
                    description: 'Gmail Credentials'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.OUTLOOK, {
            type: SampleNodeType.OUTLOOK,
            name: 'Outlook (Trigger)',
            description: 'Fetch emails and attachments from Outlook',
            category: 'Microsoft',
            inputs: 0,
            outputs: 1,
            configSchema: {
                query: {
                    type: 'string',
                    description: 'Search Query (Microsoft OData Filter syntax)',
                    default: ''
                },
                eventType: {
                    type: 'string',
                    description: 'Trigger event type',
                    default: 'new_email',
                    options: [
                        { label: 'New Email Received', value: 'new_email' },
                        { label: 'Email with Attachment', value: 'email_with_attachment' }
                    ]
                },
                maxResults: {
                    type: 'number',
                    description: 'Max emails to fetch',
                    default: 5
                },
                credentials: {
                    type: 'credential',
                    provider: 'microsoft',
                    description: 'Outlook Credentials'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.SCHEDULE, {
            type: SampleNodeType.SCHEDULE,
            name: 'Schedule Trigger',
            description: 'Trigger workflow at specific intervals',
            category: 'Trigger',
            inputs: 0,
            outputs: 1,
            configSchema: {
                interval: {
                    type: 'select',
                    options: ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'custom'],
                    default: 'hours',
                    description: 'Trigger Interval'
                },
                value: {
                    type: 'number',
                    description: 'Value (e.g., every N seconds)',
                    condition: { interval: ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months'] }
                },
                cronExpression: {
                    type: 'string',
                    description: 'Cron Expression (e.g. "*/5 * * * *")',
                    condition: { interval: 'custom' }
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.OCR, {
            type: SampleNodeType.OCR,
            name: 'OCR Processing (Gemini)',
            description: 'Extract text and analyze files using Gemini AI',
            category: 'AI / Machine Learning',
            inputs: 1,
            outputs: 1,
            configSchema: {
                apiKey: {
                    type: 'string',
                    description: 'Gemini API Key',
                    default: ''
                },
                modelName: {
                    type: 'select',
                    options: ['gemini-1.5-flash', 'gemini-1.5-pro'],
                    default: 'gemini-1.5-flash',
                    description: 'Model Name'
                },
                prompt: {
                    type: 'string',
                    description: 'Custom Prompt (Optional)',
                    default: ''
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.IF_ELSE, {
            type: SampleNodeType.IF_ELSE,
            name: 'Decision Engine (If/Else)',
            description: 'Conditional logic to branch the workflow',
            category: 'Logic',
            inputs: 1,
            outputs: 1, // Visual 1, but handles 2 (true/false) in FE
            configSchema: {
                condition: {
                    type: 'string',
                    description: 'Condition to evaluate (e.g. {{prev.value}} > 10)',
                    default: ''
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.SUMMARIZE, {
            type: SampleNodeType.SUMMARIZE,
            name: 'Summarize',
            description: 'Generate concise summaries using Gemini AI',
            category: 'AI / Machine Learning',
            inputs: 1,
            outputs: 1,
            configSchema: {
                apiKey: {
                    type: 'string',
                    description: 'Gemini API Key',
                    default: ''
                },
                modelName: {
                    type: 'select',
                    options: ['gemini-1.5-flash', 'gemini-1.5-pro'],
                    default: 'gemini-1.5-flash',
                    description: 'Model Name'
                },
                prompt: {
                    type: 'string',
                    description: 'Custom Prompt (Optional)',
                    default: ''
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.SURYA_OCR, {
            type: SampleNodeType.SURYA_OCR,
            name: 'Surya OCR',
            description: 'Advanced multilingual OCR with layout preservation',
            category: 'AI / Machine Learning',
            inputs: 1,
            outputs: 1,
            configSchema: {
                modelType: {
                    type: 'select',
                    options: ['standard', 'multilingual'],
                    default: 'standard',
                    description: 'Model type'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.TESSERACT_OCR, {
            type: SampleNodeType.TESSERACT_OCR,
            name: 'Tesseract OCR',
            description: 'Standard open-source OCR engine',
            category: 'AI / Machine Learning',
            inputs: 1,
            outputs: 1,
            configSchema: {
                lang: {
                    type: 'string',
                    default: 'eng',
                    description: 'Language code (e.g. eng, fra)'
                }
            }
        });



        this.nodeDefinitions.set(SampleNodeType.SMART_EXTRACTION, {
            type: SampleNodeType.SMART_EXTRACTION,
            name: 'Smart Extraction',
            description: 'Context-aware field extraction with confidence scores',
            category: 'AI / Machine Learning',
            inputs: 1,
            outputs: 1,
            configSchema: {
                schema: {
                    type: 'json',
                    description: 'Field Mapping Schema',
                    default: '{}'
                },
                modelName: {
                    type: 'select',
                    options: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
                    default: 'gemini-1.5-flash',
                    description: 'Model Name'
                },
                apiKey: { type: 'string' }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.FILE_UPLOAD, {
            type: SampleNodeType.FILE_UPLOAD,
            name: 'File Upload',
            description: 'Upload a file directly to the workflow',
            category: 'Input',
            inputs: 0,
            outputs: 1,
            configSchema: {
                file: {
                    type: 'file',
                    description: 'The file to upload',
                    default: null
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.HTTP_REQUEST, {
            type: SampleNodeType.HTTP_REQUEST,
            name: 'HTTP Request',
            description: 'Make HTTP requests to external APIs',
            category: 'Network',
            inputs: 1,
            outputs: 1,
            configSchema: {
                method: {
                    type: 'select',
                    options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                    default: 'GET',
                    description: 'HTTP Method'
                },
                url: {
                    type: 'string',
                    description: 'Request URL',
                    default: ''
                },
                headers: {
                    type: 'json',
                    description: 'Headers (JSON)',
                    default: '{}'
                },
                data: {
                    type: 'json',
                    description: 'Request Body (JSON)',
                    default: '{}'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.DATA_MAPPER, {
            type: SampleNodeType.DATA_MAPPER,
            name: 'Data Mapper',
            description: 'Transform and map data between nodes',
            category: 'Logic',
            inputs: 1,
            outputs: 1,
            configSchema: {
                mappingType: {
                    type: 'select',
                    options: ['visual', 'custom'],
                    default: 'visual',
                    description: 'Mapping Method'
                },
                mappings: {
                    type: 'json',
                    description: 'Visual Mappings Array',
                    default: '[]',
                    condition: { mappingType: 'visual' }
                },
                expression: {
                    type: 'string',
                    description: 'JSONATA Expression',
                    default: '$',
                    condition: { mappingType: 'custom' }
                }
            }
        });
    }

    private registerParsingNodes() {
        this.nodeDefinitions.set(SampleNodeType.PARSING, {
            type: SampleNodeType.PARSING,
            name: 'AI Parsing',
            description: 'Extract structured data from text using AI',
            category: 'AI / Machine Learning',
            inputs: 1,
            outputs: 1,
            configSchema: {
                schema: {
                    type: 'json',
                    default: '{}',
                    description: 'Schema Definition (JSON keys and types)'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.MONGODB, {
            type: SampleNodeType.MONGODB,
            name: 'MongoDB',
            description: 'Store data in MongoDB',
            category: 'Database',
            inputs: 1,
            outputs: 1,
            configSchema: {
                connectionString: {
                    type: 'string',
                    description: 'MongoDB Connection String',
                    default: ''
                },
                dbName: {
                    type: 'string',
                    description: 'Database Name',
                    default: 'automation_db'
                },
                collectionName: {
                    type: 'string',
                    description: 'Collection Name',
                    default: 'data'
                }
            }
        });
    }

    getNode(type: string): BaseWorkflowNode | undefined {
        return this.nodeInstances.get(type);
    }

    getNodeDefinition(type: string): NodeDefinition | undefined {
        return this.nodeDefinitions.get(type);
    }

    getAllNodeDefinitions(): NodeDefinition[] {
        return Array.from(this.nodeDefinitions.values());
    }

    getNodesByCategory(): Record<string, NodeDefinition[]> {
        const categorized: Record<string, NodeDefinition[]> = {};

        for (const def of this.nodeDefinitions.values()) {
            if (!categorized[def.category]) {
                categorized[def.category] = [];
            }
            categorized[def.category].push(def);
        }

        return categorized;
    }

    hasNode(type: string): boolean {
        return this.nodeInstances.has(type);
    }
}

