# Code-Level and UI-Level Optimization and Enhancement Plan

## Objective
Raise code quality, runtime performance, and UX clarity while reducing maintenance cost and regression risk.

## Current High-Impact Gaps
- FE/BE node mismatch causes broken authoring-to-execution paths
- Security exposure in auth, token storage, and callback origin handling
- Legacy/duplicate modules and mock logic increase behavioral drift
- Large FE components and duplicated polling add complexity and overhead
- Low automated test coverage for critical execution paths

## Code-Level Plan

### P0 - Correctness and Security
1. Harden auth and data protection
   - Introduce route guards for workflow/credential/execution endpoints
   - Encrypt credential secrets at rest; return masked values only
   - Replace wildcard postMessage target and broad CORS defaults

2. Remove dangerous execution patterns
   - Eliminate `eval` from condition evaluation
   - Isolate/sandbox code execution node with strict resource/time limits
   - Gate high-risk nodes behind explicit feature flags

3. Fix executor integrity issues
   - Correct final status resolution logic
   - Normalize node status updates and error propagation
   - Add idempotency keys for retried tasks

### P1 - Architecture and Maintainability
1. Consolidate workflow domain
   - Deprecate duplicate legacy `workflows` module and keep single source (`sample-workflows`)
   - Clean stale node exports and unsupported docs

2. Unify contracts and typing
   - Create shared node schema/types package used by FE and BE
   - Reduce `any` usage in critical paths with strict TypeScript configs

3. Improve observability
   - Structured logs with runId/workflowId/nodeId correlation
   - Health checks for DB, queue, socket, and provider adapters

### P2 - Performance and Reliability
1. Execution transport optimization
   - Prefer websocket streaming over repetitive polling where possible
   - Batch execution updates and debounce UI state writes

2. Data path optimization
   - Add DB indexes for run-history query patterns
   - Paginate and cursor large execution histories

3. Testing strategy
   - Add FE unit tests for node config panels and store transitions
   - Add BE integration tests for full workflow execution chain
   - Add contract tests that validate FE-visible node set against BE registry

## UI-Level Plan

### P0 - UX Stability and Clarity
1. Designer reliability
   - Prevent showing nodes that BE cannot execute
   - Add upfront node validation badges before run

2. Execution transparency
   - Add run timeline with node duration, retries, and failure reason
   - Add clear "what to fix" hints in node-level error cards

3. Environment-safe configuration
   - Replace hardcoded localhost URLs with env-driven endpoints
   - Add environment health panel (API/socket/auth/provider connectivity)

### P1 - UI Maintainability
1. Component decomposition
   - Split large pages (`Dashboard`, `WorkflowDesigner`, docs page) into focused containers
   - Remove dead execution UI components and stale API clients

2. Schema-driven config forms
   - Expand schema-driven panel system to reduce duplicated node config code
   - Centralize field validation, defaults, and help text

3. Design system consistency
   - Standardize spacing, typography, status colors, and feedback states
   - Fix text encoding artifacts and inconsistent labels

### P2 - UI Performance
1. Rendering efficiency
   - Memoize heavy graph-derived selectors and expensive panel transforms
   - Virtualize long histories/log lists

2. Async UX improvements
   - Add optimistic updates where safe and skeleton states for slow endpoints
   - Reduce unnecessary rerenders from frequent store updates

## 12-Week Implementation Waves
- Wave 1 (Weeks 1-4): security/correctness fixes, contract alignment, env cleanup
- Wave 2 (Weeks 5-8): architecture cleanup, schema-driven UI expansion, observability
- Wave 3 (Weeks 9-12): performance tuning, advanced run analytics, test hardening

## Completion Criteria
- No FE-visible node can fail due to BE incompatibility
- Zero plaintext secret exposure in API/UI logs
- Critical workflow paths covered by automated tests
- Measurable UI responsiveness improvements on large workflows
- Reduced production incidents tied to execution drift
