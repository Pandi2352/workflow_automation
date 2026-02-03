# Feature Plan

## Objective
Deliver a production-ready automation platform by aligning FE/BE capabilities, expanding workflow value, and improving execution trust.

## Guiding Outcomes
- Reliable workflow execution across all supported nodes
- Secure credential and execution model for enterprise use
- Faster workflow authoring with fewer manual steps
- Better visibility into run history, failures, and retries

## Priority Roadmap

### P0 - Platform Alignment and Trust (0-4 weeks)
1. FE-BE node parity and contract lock
   - Add missing BE support for `WEBHOOK` or remove it from FE until supported
   - Expose BE-supported nodes in FE: `BROWSER_SCRAPER`, `DATA_MAPPER`, `SURYA_OCR`
   - Add a shared node contract spec and validation tests in CI
   - Acceptance: a saved workflow can execute every visible FE node end-to-end

2. Secure auth and credentials foundation
   - Add API authN/authZ (JWT + role checks)
   - Encrypt provider tokens at rest and redact all API responses/logs
   - Restrict OAuth callback postMessage origin and tighten CORS
   - Acceptance: no plaintext token storage or unsafe wildcard origin paths

3. Execution reliability baseline
   - Fix workflow executor status finalization and duplicate status field assignment
   - Replace random/mock service paths in production flow with real adapters or feature flags
   - Add durable retry + backoff for external APIs
   - Acceptance: deterministic status transitions with repeatable retries

### P1 - Workflow Capability Expansion (4-8 weeks)
1. Human approval gates
   - Add manual approval node with SLA timeout and escalation path
   - Add inbox-style task queue for pending approvals

2. Reusable subflows and templates
   - Convert common patterns into reusable callable subflows
   - Add template catalog for onboarding workflows

3. Data quality and mapping improvements
   - Enhance data mapper with schema preview, required-field checks, and transform test mode
   - Add structured validation node (schema + custom rules)

4. Operational controls
   - Add pause/resume/cancel run controls
   - Add dead-letter queue and replay for failed executions

### P2 - Advanced Intelligence and Scale (8-12 weeks)
1. AI-assisted builder
   - Natural language to draft workflow graph and config suggestions
   - Context-aware node setup hints based on prior runs

2. Scheduling and eventing upgrades
   - Timezone-safe schedule builder and cron presets
   - First-class webhook trigger with signature verification

3. Analytics and governance
   - SLA dashboard, node-level MTTR, and failure hot-spot analytics
   - Audit trails for workflow edits, credential changes, and execution overrides

## Cross-Cutting Deliverables
- Node compatibility matrix published in docs and validated in CI
- Versioned API and migration notes for FE/BE contract changes
- Feature flags for risky rollouts (code execution, scraper, OCR paths)
- Playbook for incident response and rollback

## Success Metrics
- Workflow save-to-run success rate >= 98%
- Mean failed-run triage time reduced by 50%
- Time-to-first-automation for new users < 20 minutes
- Credential security score: no critical findings in security review

## Suggested Execution Sequence
- Sprint 1-2: parity, security baseline, executor fixes
- Sprint 3-4: approval node, subflows, operational controls
- Sprint 5-6: AI assist, analytics, governance hardening
