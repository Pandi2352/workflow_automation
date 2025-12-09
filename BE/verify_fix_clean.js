// Mocks
class BaseWorkflowNode {
    log(level, message) {}
}

class InputNode extends BaseWorkflowNode {
    execute(inputs, data) {
        // Priority 1: Check resolved config.value (from expression evaluation)
        if (data?.config?.value !== undefined) {
            return data.config.value;
        }

        // Priority 2: Check if config has any values
        if (data?.config && Object.keys(data.config).length > 0) {
            const keys = Object.keys(data.config);
            if (keys.length === 1) {
                const singleValue = data.config[keys[0]];
                return singleValue;
            }
            return data.config;
        }

        // Priority 3: Check inputs (Array or Object)
        if (data?.inputs) {
            // Case A: Array (Legacy)
            if (Array.isArray(data.inputs) && data.inputs.length > 0) {
                const valueInput = data.inputs.find(i => i?.name === 'value');
                if (valueInput?.value !== undefined) {
                    return valueInput.value;
                }

                const result = {};
                for (const input of data.inputs) {
                    if (input?.name && input.value !== undefined) {
                        result[input.name] = input.value;
                    }
                }
                if (Object.keys(result).length > 0) {
                    return Object.keys(result).length === 1 ? Object.values(result)[0] : result;
                }
            } 
            // Case B: Object (Simplified/New)
            else if (typeof data.inputs === 'object' && !Array.isArray(data.inputs)) {
                 const keys = Object.keys(data.inputs);
                 if (keys.length > 0) {
                     if (data.inputs['value'] !== undefined) {
                         return data.inputs['value'];
                     }

                     if (keys.length === 1) {
                        return data.inputs[keys[0]];
                     }

                     return data.inputs;
                 }
            }
        }

        // Priority 4: Check direct value property (backward compatibility)
        if (data?.value !== undefined) {
            return data.value;
        }

        return 0;
    }
}

// Tests
const mockInputNode = new InputNode();

function assert(description, actual, expected) {
    const jsonActual = JSON.stringify(actual);
    const jsonExpected = JSON.stringify(expected);
    if (jsonActual === jsonExpected) {
        console.log(`PASS: ${description}`);
    } else {
        console.log(`FAIL: ${description}. Expected ${jsonExpected}, got ${jsonActual}`);
    }
}

assert('Simplified Input { value: 10 }', mockInputNode.execute([], { inputs: { value: 10 } }), 10);
assert('Simplified Input { myVar: 50 }', mockInputNode.execute([], { inputs: { myVar: 50 } }), 50);
assert('Priority Check { value: 100, other: 200 }', mockInputNode.execute([], { inputs: { value: 100, other: 200 } }), 100);
assert('Multiple keys { a: 1, b: 2 }', mockInputNode.execute([], { inputs: { a: 1, b: 2 } }), { a: 1, b: 2 });
assert('Legacy Array', mockInputNode.execute([], { inputs: [{ name: 'value', value: 99 }] }), 99);
assert('Empty Object', mockInputNode.execute([], { inputs: {} }), 0);

