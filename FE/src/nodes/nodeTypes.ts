import { GenericNode } from './GenericNode';
import { GoogleDriveNode } from './google-drive/GoogleDriveNode';
import { OneDriveNode } from './onedrive/OneDriveNode';
import { GmailNode } from './gmail/GmailNode';
import { ScheduleNode } from './schedule/ScheduleNode';
import { OCRNode } from './ocr/OCRNode';
import { SmartExtractionNode } from './smart-extraction/SmartExtractionNode';
import FileUploadNode from './file-upload/FileUploadNode';
import { HttpNode } from './http-request/HttpNode';
import { IfElseNode } from './if-else/IfElseNode';
import { ParsingNode } from './parsing/ParsingNode';
import { MongoDBNode } from './mongodb/MongoDBNode';
import { SummarizeNode } from './summarize/SummarizeNode';
import { DataMapperNode } from './data-mapper/DataMapperNode';
import { ScraperNode } from './scraper/ScraperNode';
import { SuryaOCRNode } from './surya-ocr/SuryaOCRNode';
import { TesseractOCRNode } from './tesseract-ocr/TesseractOCRNode';
import { CodeNode } from './code/CodeNode';
import { OutlookNode } from './outlook/OutlookNode';

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
    BROWSER_SCRAPER: ScraperNode,
    HTTP_REQUEST: HttpNode,
    IF_ELSE: IfElseNode,
    MONGODB: MongoDBNode,
    PARSING: ParsingNode,
    SUMMARIZE: SummarizeNode,
    DATA_MAPPER: DataMapperNode,
    SURYA_OCR: SuryaOCRNode,
    TESSERACT_OCR: TesseractOCRNode,
    CODE: CodeNode,
    OUTLOOK: OutlookNode,
    default: GenericNode,
    input: GenericNode,
    webhook: GenericNode,
    api: GenericNode,
    transform: GenericNode,
    output: GenericNode,
    schedule: ScheduleNode,
};
