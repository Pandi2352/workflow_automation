# Automation Kit – Project Overview

## Summary
Automation Kit is a full-stack workflow automation platform with a visual editor, execution engine, and AI-assisted nodes. Users build workflows as directed graphs (nodes + edges), run them on demand or via triggers (schedule, email, drive), and inspect execution history.

## Architecture
- Frontend: React + TypeScript (Vite), Zustand store, @xyflow/react canvas.
- Backend: NestJS + MongoDB (Mongoose).
- Real-time: Socket.IO namespace `events` for collaborative cursors.
- AI: Google Gemini via `@google/generative-ai` for OCR, extraction, summarization, and AI workflow generation.

## Key Domains
### 1) Workflow Design (Frontend)
- Visual canvas: `WorkflowCanvas` renders node types and edges, drag-drop from `NodeDrawer`.
- Node config panels per node type (Gmail, OCR, Smart Extraction, MongoDB, etc.).
- Store: `workflowStore` holds nodes/edges, undo/redo history, metadata, execution context.
- Templates: `WORKFLOW_TEMPLATES` (shared list) for prebuilt workflows.

### 2) Workflow Execution (Backend)
- Engine: `WorkflowExecutorService` validates, executes nodes in DAG order, handles retries, logs, metrics, and final results.
- History: `WorkflowHistory` tracks node executions, outputs, logs, errors, and metrics.
- Expression evaluation: `ExpressionEvaluatorService` resolves `{{Node.outputs...}}`, `$input`, `$vars`, `$json`, `$trigger`, etc.

### 3) Triggers & Polling
- Schedule: `SchedulerService` runs workflows with cron pattern from `SCHEDULE` node.
- Gmail: `GmailPollingService` polls inbox and triggers workflows for new messages.
- Outlook: `OutlookPollingService` polls Graph API and triggers workflows.
- Google Drive: `GoogleDrivePollingService` triggers on new files in a folder.

### 4) Nodes (Core Types)
Backend node registry (`NodeRegistryService`) registers these primary node types:
- Triggers: `SCHEDULE`, `GMAIL`, `OUTLOOK`, `GOOGLE_DRIVE`, `ONEDRIVE`, `FILE_UPLOAD`
- AI/ML: `OCR`, `SURYA_OCR`, `TESSERACT_OCR`, `SMART_EXTRACTION`, `SUMMARIZE`, `PARSING`
- Logic/Transform: `IF_ELSE`, `DATA_MAPPER`, `CODE`
- Data/Network: `MONGODB`, `HTTP_REQUEST`, `BROWSER_SCRAPER`

Frontend node components mirror backend types for rendering and configuration.

## Data Model
### Workflow (MongoDB)
- `SampleWorkflow`: name, description, nodes, edges, variables, settings, tags.
- Nodes store config + inputs/outputs metadata and positional data.

### Execution History
- `WorkflowHistory`: status, nodeExecutions, logs, outputs, errors, metrics, triggerData.

### Credentials
- OAuth credentials stored in `Credential` schema for Google/Microsoft/Gmail/Outlook/Gemini.

## APIs (Backend)
- Base URL: `/api`
- Workflows: `/sample-workflows` (CRUD, execute, executions, stats)
- Node metadata: `/sample-workflows/nodes`
- Credentials: `/credentials`
- Auth: `/auth/google`, `/auth/gmail`, `/auth/microsoft`, `/auth/outlook`
- Uploads: `/upload` (multipart, returns upload URL)
- AI: `/ai/generate-workflow`

Frontend uses `axiosInstance` with `VITE_API_URL` (default `http://localhost:4000/api`).

## Execution Flow (High Level)
1. User builds workflow in FE and saves to backend (`/sample-workflows`).
2. Backend validates graph, stores nodes/edges.
3. Execution starts from triggers (manual or scheduled/polling) and runs node strategies.
4. Outputs and logs are stored in `WorkflowHistory` for UI inspection.

## Templates
`WORKFLOW_TEMPLATES` provides prebuilt workflows (e.g., invoice processing, daily digest, drive OCR). Dashboard can create a new workflow from a template and open it in the designer.

## Real-Time Collaboration
- FE joins a workflow room via Socket.IO (`events` namespace).
- Cursor positions broadcast to other clients in the same workflow.

## Notes
- There are two workflow APIs in code: legacy `workflows` and primary `sample-workflows` (frontend uses `sample-workflows`).
- OCR uses Gemini for analysis and can also run Surya/Tesseract OCR.
- Expression engine supports n8n-style interpolations and built-in variables.

---

If you want this expanded (sequence diagrams, full node config schemas, or deployment steps), tell me which sections to deepen.
