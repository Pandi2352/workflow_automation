# Feature Implementation Plan: External Workflow Integration (Webhook-as-a-Service)

To integrate a specific workflow with an external project, we should implement a **Webhook-based triggering system**. This allows the external project to "call" our workflow as if it were a private API.

## 1. Backend Architecture

### A. New Node Type: `WEBHOOK`
Add `WEBHOOK` to the `SampleNodeType` enum to represent the entry point for external calls.

### B. Unique Endpoint Generation
Create a dedicated controller to handle incoming requests from other projects.
- **Route**: `POST /api/webhooks/workflow/:workflowId`
- **Functionality**:
    - Validates the `workflowId` exists and is active.
    - Captures the Request Body (JSON), Headers, and Query Parameters.
    - Passes this data into the `WorkflowExecutorService` as `triggerData`.

### C. Security & Authentication
- **API Keys**: Implement a simple API key system per workflow or per external project.
- **Whitelist**: Optional IP whitelisting for the external project's server.
- **Payload Signature**: Optional HMAC signature verification to ensure requests haven't been tampered with.

### D. Synchronous Response Handling (Optional)
Modify the `WorkflowExecutorService` to allow workflows to send data back to the HTTP caller:
- Add a `HTTP_RESPONSE` node type.
- If the workflow execution reaches this node, the engine returns the node's input as the HTTP response body to the project that called the webhook.

---

## 2. Frontend Configuration

### A. Webhook Node UI
Create a `WebhookNode` component in the workflow builder:
- **Display**: Shows the unique URL for that workflow.
- **Interaction**: "Copy URL" button.
- **Config**: 
    - Method (POST/GET/PUT).
    - Authentication Type (API Key, Basic, None).
    - JSON Schema definition (to help mapping variables in downstream nodes).

---

## 3. Implementation Steps

### Phase 1: Core Webhook Trigger
1.  **Modify `SampleNodeType`**: Add `WEBHOOK`.
2.  **Create `WebhookController`**: To receive external POST requests.
3.  **Update `NodeRegistryService`**: Register the Webhook node as a Trigger category.
4.  **Update `WorkflowExecutorService`**: Ensure it can start a workflow using data received from the controller.

### Phase 2: Security & DX
1.  **API Key Management**: Allow users to generate a token in the Workflow Settings.
2.  **Schema Support**: Allow users to paste a sample JSON in the Webhook Node so following nodes can see available fields in the "Variable Picker".

### Phase 3: Response Support
1.  **Add `RESPONSE` node**: To allow the workflow to return values to the external project synchronously.
