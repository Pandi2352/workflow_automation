# How to Add a New Node to the Sample Workflow

This guide explains how the node execution system works and provides a step-by-step tutorial on adding a new node type (e.g., a "Power/Exponent" node).

## How It Works

The workflow engine uses a **Strategy Pattern** for node execution:

1.  **Definition**: The `SampleNodeType` enum defines the unique identifier for the node.
2.  **Implementation**: Individual classes (e.g., `AddNode`, `MultiplyNode`) implement the logic. They must extend `BaseWorkflowNode`.
3.  **Registry**: The `NodeRegistryService` acts as a central catalog. It maps the Enum -> Class Instance and provides metadata (name, description, inputs/outputs) for the UI/API.
4.  **Execution**: When the `WorkflowExecutorService` encounters a node, it asks the Registry: *"Do you have a handler for type 'POWER'?"*. If yes, it runs that handler.

---

## Step-by-Step Guide

To add a new node, you need to touch **3 files**.

### Step 1: Define the Node Type
**File**: `src/sample-workflow/enums/node-type.enum.ts`

Add a new entry to the enum. This string will be stored in the database.

```typescript
export enum SampleNodeType {
    ADD = 'ADD',
    SUBTRACT = 'SUBTRACT',
    MULTIPLY = 'MULTIPLY',
    DIVIDE = 'DIVIDE',
    INPUT = 'INPUT',
    // Add your new type here
    POWER = 'POWER', 
}
```

### Step 2: Implement the Node Logic
**File**: Create a new file in `src/sample-workflow/nodes/`, e.g., `power.node.ts`.

Create a class that extends `BaseWorkflowNode` and implements the `execute` method.

```typescript
import { BaseWorkflowNode } from './workflow-node.interface';

export class PowerNode extends BaseWorkflowNode {
    /**
     * @param inputs Array of input values from connected nodes.
     * @param data Optional configuration data (static values set in the workflow).
     */
    execute(inputs: number[], data?: any): number {
        // 1. Get inputs safely
        const base = inputs[0] || 0;
        const exponent = inputs[1] || 1;

        // 2. Log useful debug info (shows up in execution history)
        this.log('DEBUG', `Calculating ${base} ^ ${exponent}`);

        // 3. Perform calculation
        const result = Math.pow(base, exponent);

        // 4. Log result
        this.log('INFO', `Power result: ${result}`);

        // 5. Return the result (passed to next nodes)
        return result;
    }
}
```

### Step 3: Register the Node
**File**: `src/sample-workflow/services/node-registry.service.ts`

You need to do two things here: **Import** your new class, and **Register** it in the constructor.

```typescript
// 1. Import
import { PowerNode } from '../nodes/power.node'; 

// ... inside the class ...

    private registerDefaultNodes(): void {
        // ... existing registrations ...

        // 2. Register the Instance (Logic)
        this.nodeInstances.set(SampleNodeType.POWER, new PowerNode());

        // 3. Register the Definition (Metadata for UI)
        this.nodeDefinitions.set(SampleNodeType.POWER, {
            type: SampleNodeType.POWER,
            name: 'Power', // Display Name
            description: 'Raises the first input to the power of the second input',
            category: 'Math', // Grouping in UI
            inputs: 2, // Number of input handles
            outputs: 1, // Number of output handles
        });
    }
```

---

## checklist

1.  [ ] Update `node-type.enum.ts`
2.  [ ] Create `nodes/your-node.node.ts`
3.  [ ] Update `node-registry.service.ts`
4.  [ ] Restart the server (to load the new registry).

Once done, the new node will automatically appear in the `GET /sample-workflows/nodes` endpoint and be executable by the engine.
