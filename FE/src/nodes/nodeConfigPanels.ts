import { NodeConfigPanel as GoogleDriveConfigPanel } from './google-drive/NodeConfigPanel';
import { NodeConfigPanel as OneDriveConfigPanel } from './onedrive/NodeConfigPanel';
import { NodeConfigPanel as GmailConfigPanel } from './gmail/NodeConfigPanel';
import { NodeConfigPanel as ScheduleConfigPanel } from './schedule/NodeConfigPanel';
import { NodeConfigPanel as OCRConfigPanel } from './ocr/NodeConfigPanel';
import { NodeConfigPanel as IfElseConfigPanel } from './if-else/NodeConfigPanel';
import { NodeConfigPanel as ParsingConfigPanel } from './parsing/NodeConfigPanel';
import { NodeConfigPanel as MongoDBConfigPanel } from './mongodb/NodeConfigPanel';
import { NodeConfigPanel as SummarizeConfigPanel } from './summarize/NodeConfigPanel';
import { NodeConfigPanel as SmartExtractionConfigPanel } from './smart-extraction/NodeConfigPanel';
import FileUploadConfigPanel from './file-upload/NodeConfigPanel';
import { NodeConfigPanel as HttpNodeConfigPanel } from './http-request/NodeConfigPanel';
import { NodeConfigPanel as TesseractOCRConfigPanel } from './tesseract-ocr/NodeConfigPanel';
import { NodeConfigPanel as CodeConfigPanel } from './code/NodeConfigPanel';
import { NodeConfigPanel as OutlookConfigPanel } from './outlook/NodeConfigPanel';

import { NodeConfigPanel as RSSConfigPanel } from './rss/NodeConfigPanel';
import { NodeConfigPanel as AIAgentConfigPanel } from './ai-agent/NodeConfigPanel';
import { NodeConfigPanel as GeminiModelConfigPanel } from './ai-models/NodeConfigPanel';
import { NodeConfigPanel as GoogleSearchToolConfigPanel } from './ai-models/GoogleSearchToolConfigPanel';

export const NODE_CONFIG_PANELS: Record<string, React.FC<any>> = {
    ONEDRIVE: OneDriveConfigPanel,
    GOOGLE_DRIVE: GoogleDriveConfigPanel,
    GMAIL: GmailConfigPanel,
    SCHEDULE: ScheduleConfigPanel,
    OCR: OCRConfigPanel,
    IF_ELSE: IfElseConfigPanel,
    PARSING: ParsingConfigPanel,
    MONGODB: MongoDBConfigPanel,
    SUMMARIZE: SummarizeConfigPanel,
    SMART_EXTRACTION: SmartExtractionConfigPanel,
    FILE_UPLOAD: FileUploadConfigPanel,
    HTTP_REQUEST: HttpNodeConfigPanel,
    TESSERACT_OCR: TesseractOCRConfigPanel,
    CODE: CodeConfigPanel,
    OUTLOOK: OutlookConfigPanel,
    RSS: RSSConfigPanel,
    AI_AGENT: AIAgentConfigPanel,
    ai_agent: AIAgentConfigPanel,
    GEMINI_MODEL: GeminiModelConfigPanel,
    gemini_model: GeminiModelConfigPanel,
    GOOGLE_SEARCH_TOOL: GoogleSearchToolConfigPanel,
    google_search_tool: GoogleSearchToolConfigPanel,
};
