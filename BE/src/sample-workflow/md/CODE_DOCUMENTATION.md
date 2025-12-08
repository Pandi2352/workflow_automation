# Backend Codebase Documentation

This document provides a detailed explanation of the `Common` module and the `Sample Workflow` feature in the backend repository.

## Table of Contents

1.  [Common Module](#common-module)
    *   [Filters](#filters)
    *   [Utilities](#utilities)
2.  [Sample Workflow Module](#sample-workflow-module)
    *   [Architecture Overview](#architecture-overview)
    *   [Nodes](#nodes)
    *   [Services](#services)
    *   [Schemas](#schemas)
    *   [Controller](#controller)

---

## Common Module

Path: `src/common`

The Common module contains shared utilities, filters, and constants used across the entire application to ensure consistency in error handling, logging, and API responses.

### Filters

#### `http-exception.filter.ts`
**Path**: `src/common/filters/http-exception.filter.ts`

*   **Purpose**: Global exception filter that catches `HttpException` (and unknown errors) and formats the response to a standard structure.
*   **Key Functionality**:
    *   Catches errors thrown during request processing.
    *   Determines HTTP status code (defaulting to 500 for unknown errors).
    *   Logs the error using `CustomLogger`.
    *   Returns a JSON response using `createApiResponse` with `success: false`.

### Utilities

**Path**: `src/common/utils`

#### `client-info.util.ts`
*   **Purpose**: Extracts and parses client information from HTTP requests.
*   **Key Components**:
    *   `extractClientInfo(req)`: Utility function to parse `User-Agent` and IP address from an Express request object.
    *   `parseUserAgent(ua)`: Helper to identify Browser (Chrome, Firefox, etc.), Engine (Blink, Gecko), and OS (Windows, macOS) from the user-agent string.
    *   **Usage**: Used during workflow execution triggers to audit *who* or *what* started a workflow.

#### `logger.util.ts`
*   **Purpose**: Implements NestJS `LoggerService` interface for custom logging.
*   **Key Methods**: `log`, `error`, `warn`, `debug`, `verbose`.
*   **Format**: `[LEVEL] ISO-Timestamp - Message`.

#### `logger-helper.util.ts`
*   **Purpose**: Static helper class for logging with additional context labels.
*   **Usage**: `LoggerHelper.log('ContextName', 'Message')`. Useful for static contexts where dependency injection isn't available or needed.

#### `response.util.ts`
*   **Purpose**: Standardizes API responses.
*   **Interface**: `ApiResponse<T>` ensures every response has `success`, `message`, `data`, and `timestamp`.
*   **Function**: `createApiResponse(...)` factory function to generate these objects.

#### `error.entity.ts`
*   **Purpose**: Defines a standard class for error objects, potentially for documentation or internal error transport.

#### `http-status.util.ts`
*   **Purpose**: Constant object map for HTTP Status codes (e.g., `HttpStatus.OK`, `HttpStatus.BAD_REQUEST`) to avoid hardcoded numbers.

---

## Sample Workflow Module

Path: `src/sample-workflow`

This module implements a modular, arithmetic workflow engine capable of defining, validating, executing, and tracking node-based workflows.

### Architecture Overview

1.  **Controller**: Handles HTTP requests.
2.  **SampleWorkflowService**: High-level orchestration (CRUD, delegating execution).
3.  **WorkflowExecutorService**: The core engine that processes the graph.
4.  **WorkflowValidatorService**: Ensures graph integrity (cycles, types, structure).
5.  **NodeRegistryService**: Factory that manages available node types.
6.  **Nodes**: Individual logic implementations (Add, Subtract, etc.).

### Nodes

**Path**: `src/sample-workflow/nodes`

#### `workflow-node.interface.ts`
*   **Interface `WorkflowNode`**: Defines the contract `execute(inputs, data)`.
*   **Abstract Class `BaseWorkflowNode`**:
    *   Implements `executeWithContext()`: A wrapper pattern that handles:
        *   Execution timing (duration).
        *   Input logging.
        *   Error catching and stack trace capture.
        *   Standardized result formatting (`NodeExecutionResult`).
    *   **Logging**: Internal `log()` method to capture execution logs per node.

#### Concrete Implementations
*   **`add.node.ts`**: Sums all input numbers.
*   **`subtract.node.ts`**: Subtracts second input from first. Defaults undefined inputs to 0.
*   **`multiply.node.ts`**: Multiplies inputs. Starts accumulator at 1.
*   **`divide.node.ts`**: Divides first by second. **Safety**: Handles division by zero (warns and returns fallback or Infinity).
*   **`input.node.ts`**: Returns a static value configured in `data.value`. Used as a starting point.

### Services

**Path**: `src/sample-workflow/services`

#### `node-registry.service.ts`
*   **Purpose**: Central registry for all available node types.
*   **Functionality**:
    *   `registerDefaultNodes()`: Instantiates node classes and maps them to Enums.
    *   `nodeDefinitions`: Stores metadata (name, description, category, inputs/outputs) for UI consumption.
    *   `getNode(type)`: Factory method to retrieve the singleton instance of a node strategy.
    *   `getNodesByCategory()`: Helper for UI toolboxes.

#### `workflow-validator.service.ts`
*   **Purpose**: Deep validation of workflow structure before save or execute.
*   **Algorithms**:
    *   **Cycle Detection**: Uses DFS (Depth-First Search) with recursion stack tracking to detect circular dependencies.
    *   **Graph Connectivity**: Uses BFS (Breadth-First Search) to count connected components (warns if graph is disjoint).
    *   **Structural Checks**: Checks for self-loops, orphaned nodes (no inputs), invalid edge references, and duplicate IDs.

#### `workflow-executor.service.ts`
*   **Purpose**: The Runtime Engine.
*   **Key Logic**:
    *   **Dependency Resolution**: Builds an `incomingEdges` map to track dependencies.
    *   **Execution Loop**:
        *   Iteratively finds "ready" nodes (dependencies met).
        *   Executes nodes using strategies from `NodeRegistry`.
        *   Handles **Retries** with exponential backoff (`Math.pow` implied by timeout) if configured.
        *   Skips nodes if dependencies fail (unless `continueOnError` is true).
    *   **State Management**: Updates Mongodb `WorkflowHistory` in real-time with status `RUNNING`, `SUCCESS`, `FAILED`.
    *   **Cancellation**: Supports user-requested cancellation via `activeExecutions` map.

#### `sample-workflow.service.ts` (Main Service)
*   **Purpose**: CRUD wrapper and entry point.
*   **Key Methods**:
    *   `create/update`: Delegates to `ValidatorService` before saving.
    *   `execute`: Creates initial history record, then delegates to `ExecutorService` (async).
    *   `getExecutionStats`: Aggregation pipeline to calculate success rates, average durations, and totals by status.

### Schemas

**Path**: `src/sample-workflow/schemas`

#### `sample-workflow.schema.ts`
*   **Collection**: `sample_workflows`
*   **Structure**:
    *   `nodes`: Array of `WorkflowNode` (id, type, data, position).
    *   `edges`: Array of `WorkflowEdge` (source, target, handles).
    *   `settings`: Configuration for execution (timeout, retries).
    *   **Indexes**: `name`, `isActive`, `tags` for search performance.

#### `workflow-history.schema.ts`
*   **Collection**: `workflow_executions`
*   **Purpose**: Audit trail and runtime state.
*   **Key Fields**:
    *   `nodeExecutions`: Detailed array of every node's run (time, input, output, logs, error).
    *   `logs`: Global execution logs.
    *   `clientInfo`: Browser/OS of the user who triggered it.
    *   `metrics`: Counters for success/failure/skip.

### Controller

#### `sample-workflow.controller.ts`
*   **Prefix**: `/sample-workflows`
*   **Endpoints**:
    *   `POST /`: Create workflow.
    *   `GET /`: List with pagination, filters (active, tags).
    *   `GET /:id`: Get definition.
    *   `POST /:id/execute`: Start execution. (**Async**: returns executionId immediately).
    *   `GET /executions/:id`: Poll status.
    *   `POST /executions/:id/cancel`: Cancel running flow.
    *   `GET /nodes`: Meta-data for UI builder.

### Enums & DTOs

*   **Enums**:
    *   `SampleNodeType`: `ADD`, `SUBTRACT`, `MULTIPLY`, `DIVIDE`, `INPUT`.
    *   `ExecutionStatus`: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`.
*   **DTOs**:
    *   `CreateSampleWorkflowDto`: Validates nested Nodes/Edges structure using `class-validator`.
    *   `ExecuteWorkflowDto`: Options for runtime overrides (timeout, etc.).

