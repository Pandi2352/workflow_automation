const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Manually parse .env to avoid dotenv dependency if not installed
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim();
            }
        });
        return envVars;
    } catch (e) {
        console.error("Failed to read .env file:", e.message);
        return {};
    }
}

async function testGemini() {
    const env = loadEnv();
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in .env file via manual parsing.");
        return;
    }

    console.log(`✅ Found GEMINI_API_KEY: ${apiKey.substring(0, 4)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        console.log("⏳ Sending test prompt to Gemini...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();
        console.log("✅ Gemini Response:", text);
    } catch (error) {
        console.error("❌ Gemini API Call Failed:");
        console.error(error);
    }
}

testGemini();
