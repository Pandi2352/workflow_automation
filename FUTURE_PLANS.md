# Future Plans & Next Steps

## Immediate Next Steps (Start Here)
1. **Webhook Trigger (Core External Integrations)**
   - Add `WEBHOOK` node type (BE enum + FE node UI).
   - Create backend endpoint: `POST /api/webhooks/workflow/:workflowId`.
   - Add API key + optional IP allowlist.
   - FE: show endpoint URL + copy button, schema sample, auth settings.

2. **Templates Expansion + Governance**
   - Expand `WORKFLOW_TEMPLATES` with business-ready templates.
   - Add tags (finance, support, ops, marketing).
   - Add template preview panel in dashboard.

3. **Human Approval Node**
   - Add `APPROVAL` node for manual review.
   - Simple inbox UI: list pending approvals, approve/reject.
   - Update executor to pause workflow and resume on approval.

4. **Workflow Variables UI**
   - Add UI to manage `variables` in workflow settings.
   - Provide variable picker for configs and expressions.

---

## Important Nodes to Build Next (Priority Order)

### Tier 1 — Critical
- **WEBHOOK** (Trigger) – external system integration.
- **APPROVAL** (Human in the loop) – business-grade workflows.
- **Slack / Teams** (Notifications) – real-time alerts.
- **Google Sheets / Excel 365** (Data store) – most common business backend.
- **Loop / Iterator** – process arrays and attachments properly.

### Tier 2 — High Value
- **Jira / Zendesk / HubSpot / Salesforce** – tickets, leads, CRM actions.
- **Database: Postgres / MySQL** – enterprise storage.
- **S3 / Azure Blob** – file storage export.
- **PDF / Doc Generation** – reports and invoices.

### Tier 3 — Advanced
- **Speech-to-Text (Whisper)** – meeting/transcript workflows.
- **Vector DB (Pinecone/Weaviate)** – RAG workflows.
- **Browser Automation** – page actions beyond scraping.

---

## Platform Optimization Priorities

### Backend
- Add execution queue + per-workflow concurrency limits.
- Retry with exponential backoff + node-specific policies.
- Deduplicate OCR by hash; reduce duplicate AI calls.
- Move polling to incremental cursor + idle backoff.

### Frontend
- Node config schema-driven UI (reduces duplication).
- Execution logs pagination + incremental loading.
- Performance: memoize nodes and virtualize large lists.

---

## Suggested Template Additions
- **Ticket Auto-Triage** (Outlook/Gmail ? Parsing ? HTTP ? Gmail).
- **Competitor Price Monitor** (Schedule ? Scraper ? Parsing ? Slack).
- **Meeting Minutes** (Drive ? STT ? Smart Extraction ? Doc).
- **Sentiment Report** (Schedule ? HTTP ? Parsing ? Summarize ? MongoDB).

---

## Notes
- FE uses `/sample-workflows` as primary API.
- Keep node names aligned across FE and BE enums.
- Prefer schema-driven config forms for new nodes.
## Additional Enhancements

### Security & Governance
- **RBAC**: owner/admin/editor/viewer roles with per‑workflow permissions.
- **Secrets Vault**: encrypt credentials, rotate keys, show masked secrets.
- **Audit Trails**: track who changed workflows and when.
- **IP Allowlist** for webhook triggers.
- **Execution Sandboxing** for Code node (resource/time limits).

### Reliability & Scale
- **Execution replay** + checkpointing for long‑running workflows.
- **Dead‑letter queue** for failed executions.
- **Workspace quotas** (runs, storage, API calls).
- **Backups & restore** for workflows and history.

### Developer Experience
- **Node SDK** for custom integrations.
- **Plugin marketplace** / importable node packages.
- **Workflow import/export** (JSON packages).
- **Environment profiles** (dev/stage/prod variables).

### UX & Product
- **Template gallery** with search, filters, and preview.
- **Inline validation** (missing credentials, invalid config).
- **One‑click node test** from config panels.
- **Workflow version history** + diff view.

