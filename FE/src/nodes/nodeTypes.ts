import { GenericNode } from './GenericNode';
import { GoogleDriveNode } from './trigger/google-drive/GoogleDriveNode';
import { OneDriveNode } from './trigger/onedrive/OneDriveNode';
import { GmailNode } from './trigger/gmail/GmailNode';
import { ScheduleNode } from './trigger/schedule/ScheduleNode';
import { OCRNode } from './ocr/OCRNode';
import { SmartExtractionNode } from './smart-extraction/SmartExtractionNode';
import FileUploadNode from './trigger/file-upload/FileUploadNode';
import { HttpNode } from './http-request/HttpNode';
import { IfElseNode } from './if-else/IfElseNode';
import { ParsingNode } from './parsing/ParsingNode';
import { MongoDBNode } from './mongodb/MongoDBNode';
import { SummarizeNode } from './summarize/SummarizeNode';
import { TesseractOCRNode } from './tesseract-ocr/TesseractOCRNode';
import { CodeNode } from './code/CodeNode';
import { OutlookNode } from './trigger/outlook/OutlookNode';
import { RSSNode } from './trigger/rss/RSSNode';
import { AIAgentNode } from './ai-agent/AIAgentNode';
import { GeminiModelNode } from './ai-models/GeminiModelNode';
import { GoogleSearchToolNode } from './ai-models/GoogleSearchToolNode';
import { WebhookNode } from './trigger/webhook/WebhookNode';

export const NODE_TYPES = {
    GOOGLE_DRIVE: GoogleDriveNode,
    ONEDRIVE: OneDriveNode,
    GMAIL: GmailNode,
    SCHEDULE: ScheduleNode,
    OCR: OCRNode,
    ocr: OCRNode,
    SMART_EXTRACTION: SmartExtractionNode,
    smart_extraction: SmartExtractionNode,
    FILE_UPLOAD: FileUploadNode,
    file_upload: FileUploadNode,
    HTTP_REQUEST: HttpNode,
    IF_ELSE: IfElseNode,
    MONGODB: MongoDBNode,
    PARSING: ParsingNode,
    SUMMARIZE: SummarizeNode,
    TESSERACT_OCR: TesseractOCRNode,
    CODE: CodeNode,
    OUTLOOK: OutlookNode,
    RSS: RSSNode,
    AI_AGENT: AIAgentNode,
    ai_agent: AIAgentNode,
    GEMINI_MODEL: GeminiModelNode,
    gemini_model: GeminiModelNode,
    GOOGLE_SEARCH_TOOL: GoogleSearchToolNode,
    google_search_tool: GoogleSearchToolNode,
    WEBHOOK: WebhookNode,
    webhook: WebhookNode,
    default: GenericNode,
    input: GenericNode,
    api: GenericNode,
    transform: GenericNode,
    output: GenericNode,
    schedule: ScheduleNode,
};
