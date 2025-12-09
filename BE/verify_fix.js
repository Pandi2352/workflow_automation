// Mocks
class BaseWorkflowNode {
    log(level, message) {
        console.log(`[${level}] ${message}`);
    }
}

class InputNode extends BaseWorkflowNode {
    execute(inputs, data) {
        this.log('DEBUG', `InputNode received data: ${JSON.stringify(data)}`);

        // Priority 1: Check resolved config.value (from expression evaluation)
        if (data?.config?.value !== undefined) {
            this.log('INFO', `Input node providing value from config.value: ${JSON.stringify(data.config.value)}`);
            return data.config.value;
        }

        // Priority 2: Check if config has any values
        if (data?.config && Object.keys(data.config).length > 0) {
            const keys = Object.keys(data.config);
            if (keys.length === 1) {
                const singleValue = data.config[keys[0]];
                this.log('INFO', `Input node providing single config value: ${JSON.stringify(singleValue)}`);
                return singleValue;
            }
            this.log('INFO', `Input node providing config object: ${JSON.stringify(data.config)}`);
            return data.config;
        }

        // Priority 3: Check inputs (Array or Object)
        if (data?.inputs) {
            // Case A: Array (Legacy)
            if (Array.isArray(data.inputs) && data.inputs.length > 0) {
                const valueInput = data.inputs.find(i => i?.name === 'value');
                if (valueInput?.value !== undefined) {
                    this.log('INFO', `Input node providing value from inputs array: ${JSON.stringify(valueInput.value)}`);
                    return valueInput.value;
                }

                const result = {};
                for (const input of data.inputs) {
                    if (input?.name && input.value !== undefined) {
                        result[input.name] = input.value;
                    }
                }
                if (Object.keys(result).length > 0) {
                    this.log('INFO', `Input node providing values from inputs array: ${JSON.stringify(result)}`);
                    return Object.keys(result).length === 1 ? Object.values(result)[0] : result;
                }
            } 
            // Case B: Object (Simplified/New)
            else if (typeof data.inputs === 'object' && !Array.isArray(data.inputs)) {
                 const keys = Object.keys(data.inputs);
                 if (keys.length > 0) {
                     if (data.inputs['value'] !== undefined) {
                         this.log('INFO', `Input node providing value from inputs object 'value' key: ${JSON.stringify(data.inputs['value'])}`);
                         return data.inputs['value'];
                     }

                     if (keys.length === 1) {
                        const val = data.inputs[keys[0]];
                        this.log('INFO', `Input node providing single value from inputs object: ${JSON.stringify(val)}`);
                        return val;
                     }

                     this.log('INFO', `Input node providing inputs object: ${JSON.stringify(data.inputs)}`);
                     return data.inputs;
                 }
            }
        }

        // Priority 4: Check direct value property (backward compatibility)
        if (data?.value !== undefined) {
            this.log('INFO', `Input node providing direct value: ${JSON.stringify(data.value)}`);
            return data.value;
        }

        // Default
        this.log('WARN', 'Input node has no value configured, returning 0');
        return 0;
    }
}

// Tests
const mockInputNode = new InputNode();

console.log('--- Test Case 1: Simplified Input Object { value: 10 } ---');
const result1 = mockInputNode.execute([], { inputs: { value: 10 } });
console.log('Result 1:', result1); // Should be 10

console.log('\n--- Test Case 2: Simplified Input Object { myVar: 50 } ---');
const result2 = mockInputNode.execute([], { inputs: { myVar: 50 } });
console.log('Result 2:', result2); // Should be 50

console.log('\n--- Test Case 3: Priority Check (value vs others) ---');
const result3 = mockInputNode.execute([], { inputs: { value: 100, other: 200 } });
console.log('Result 3:', result3); // Should be 100

console.log('\n--- Test Case 4: Multiple keys without "value" ---');
const result4 = mockInputNode.execute([], { inputs: { a: 1, b: 2 } });
console.log('Result 4:', result4); // Should be { a: 1, b: 2 }

console.log('\n--- Test Case 5: Legacy Array ---');
const result5 = mockInputNode.execute([], { inputs: [{ name: 'value', value: 99 }] });
console.log('Result 5:', result5); // Should be 99

console.log('\n--- Test Case 6: Empty Object ---');
const result6 = mockInputNode.execute([], { inputs: {} });
console.log('Result 6:', result6); // Should be 0 (WARN)
