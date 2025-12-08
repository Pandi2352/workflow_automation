# Sample Workflow API Usage Guide

This guide provides instructions on how to start the backend server and interact with the Sample Workflow API using `curl`.

## 1. Starting the Server

Ensure you are in the `BE` directory and have your environment variables configured (MongoDB URI, etc.).

```bash
# Navigate to backend directory
cd "d:\AI - kit\Automation\BE"

# Install dependencies (if not already done)
npm install

# Start the server in development mode
npm run start:dev
```

The server should start on port `3000` (or `PORT` env var).

---

## 2. API Interaction

All commands assume the server is running at `http://localhost:3000`.

### A. Create a Workflow

This example creates a workflow that:
1.  Takes two inputs (10 and 5).
2.  Adds them ((10 + 5) = 15).
3.  Multiplies the result by 2 (15 * 2 = 30).

**Endpoint**: `POST /sample-workflows`

```bash
curl -X POST http://localhost:3000/sample-workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Math Demo Workflow",
    "description": "Calculates (10 + 5) * 2",
    "tags": ["math", "demo"],
    "settings": {
        "timeout": 5000,
        "maxRetries": 1
    },
    "nodes": [
        {
            "id": "node-1",
            "type": "INPUT",
            "nodeName": "Input A",
            "data": { "value": 10 },
            "position": { "x": 0, "y": 0 }
        },
        {
            "id": "node-2",
            "type": "INPUT",
            "nodeName": "Input B",
            "data": { "value": 5 },
            "position": { "x": 0, "y": 100 }
        },
        {
            "id": "node-3",
            "type": "ADD",
            "nodeName": "Adder",
            "position": { "x": 200, "y": 50 }
        },
        {
            "id": "node-4",
            "type": "MULTIPLY",
            "nodeName": "Multiplier",
            "position": { "x": 400, "y": 50 }
        },
        {
            "id": "node-5",
            "type": "INPUT",
            "nodeName": "Factor",
            "data": { "value": 2 },
            "position": { "x": 200, "y": 150 }
        }
    ],
    "edges": [
        { "id": "edge-1", "source": "node-1", "target": "node-3" },
        { "id": "edge-2", "source": "node-2", "target": "node-3" },
        { "id": "edge-3", "source": "node-3", "target": "node-4" },
        { "id": "edge-4", "source": "node-5", "target": "node-4" }
    ]
}'
```

**Response**: You will get a JSON object containing the created workflow, including its `_id`. **Copy this ID**.

### B. Execute a Workflow

Replace `<WORKFLOW_ID>` with the ID you copied from the previous step.

**Endpoint**: `POST /sample-workflows/<WORKFLOW_ID>/execute`

```bash
curl -X POST http://localhost:3000/sample-workflows/<WORKFLOW_ID>/execute \
  -H "Content-Type: application/json" \
  -d '{
    "timeout": 10000,
    "triggerData": { "reason": "manual_test" }
}'
```

**Response**:
```json
{
  "message": "Execution started",
  "executionId": "64f...", 
  "workflowId": "...",
  "workflowName": "Math Demo Workflow"
}
```
**Copy the `executionId`**.

### C. Check Execution Status

Replace `<EXECUTION_ID>` with the ID returned from the execution command.

**Endpoint**: `GET /sample-workflows/executions/<EXECUTION_ID>`

```bash
curl http://localhost:3000/sample-workflows/executions/<EXECUTION_ID>
```

**Response Analysis**:
Look for `status`. It should be `COMPLETED`.
Inspect `finalResult` to see the calculation output (should be roughly `30`).
Inspect `nodeExecutions` to see the step-by-step breakdown.

### D. Get Workflow Statistics

See how many times your workflow has run and its success rate.

**Endpoint**: `GET /sample-workflows/<WORKFLOW_ID>/stats`

```bash
curl http://localhost:3000/sample-workflows/<WORKFLOW_ID>/stats
```

### E. List All Executions

View a paginated list of all past runs.

**Endpoint**: `GET /sample-workflows/executions/list`

```bash
curl "http://localhost:3000/sample-workflows/executions/list?page=1&limit=10&status=COMPLETED"
```

---

## 3. Creating a "Fail" Scenario

To test error handling, create a workflow with a **Divide** node where the divisor is 0.

```bash
curl -X POST http://localhost:3000/sample-workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Division Error Test",
    "nodes": [
        { "id": "n1", "type": "INPUT", "nodeName": "Ten", "data": { "value": 10 } },
        { "id": "n2", "type": "INPUT", "nodeName": "Zero", "data": { "value": 0 } },
        { "id": "n3", "type": "DIVIDE", "nodeName": "Divider" }
    ],
    "edges": [
        { "id": "e1", "source": "n1", "target": "n3" },
        { "id": "e2", "source": "n2", "target": "n3" }
    ]
}'
```

(Note: The `DivideNode` logic currently handles 0 by logging a warning and falling back to 1. To see a *real* crash, you might modify `divide.node.ts` to throw an error, then re-run).

---

## 4. Database Storage Structure

When a workflow executes, the system stores a comprehensive record in the `workflow_executions` collection. Here is an example of what that document looks like:

```json
{
  "_id": "64f...",
  "workflowId": "...",
  "status": "COMPLETED", // PENDING, RUNNING, COMPLETED, FAILED
  "startTime": "2023-10-27T10:00:00.000Z",
  "endTime": "2023-10-27T10:00:05.000Z",
  "duration": 5000, // milliseconds

  // 1. Final Result
  // The output of the last node(s) in the chain
  "finalResult": {
    "value": 30,
    "fromNodeId": "node-4",
    "timestamp": "2023-10-27T10:00:05.000Z"
  },

  // 2. Metrics & Stats
  "metrics": {
    "totalNodes": 5,
    "completedNodes": 5,
    "failedNodes": 0,
    "totalDuration": 5000,
    "averageNodeDuration": 120,
    "fastestNode": { "nodeName": "Input A", "duration": 1 },
    "slowestNode": { "nodeName": "Multiplier", "duration": 50 }
  },

  // 3. Node Outputs (Quick Access)
  "nodeOutputs": [
    {
      "nodeId": "node-1",
      "nodeName": "Input A",
      "value": 10,
      "type": "number",
      "timestamp": "..."
    },
    // ... other nodes
  ],

  // 4. Detailed Execution Trace
  "nodeExecutions": [
    {
      "nodeId": "node-3",
      "nodeName": "Adder",
      "status": "SUCCESS",
      "input": {
        "sources": [
            { "nodeName": "Input A", "value": 10 },
            { "nodeName": "Input B", "value": 5 }
        ],
        "rawValues": [10, 5]
      },
      "output": { "value": 15 },
      "duration": 10,
      "logs": [
        { "level": "INFO", "message": "Addition result: 15" }
      ]
    }
  ],

  // 5. Error Tracking (if any)
  "errors": {
    "totalErrors": 0,
    "workflowErrors": [],
    "nodeErrors": []
  },

  // 6. Audit Info
  "clientInfo": {
    "ip": "::1",
    "userAgent": "curl/7.81.0",
    "system": { "os": "Unknown" } // Parsed from User-Agent
  }
}
```
