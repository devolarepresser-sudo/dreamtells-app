// test_load.cjs
// Simple script to verify that syntax is correct and modules can be loaded

process.env.OPENAI_API_KEY = "sk-test-dummy-key";

try {
    console.log("Loading openaiClient...");
    require('./server/src/services/openaiClient.cjs');
    console.log("OK.");

    console.log("Loading dreamInterpreter...");
    require('./server/src/services/dreamInterpreter.cjs');
    console.log("OK.");

    console.log("Loading dreamRoutes...");
    require('./server/src/routes/dreamRoutes.cjs');
    console.log("OK.");

    console.log("All modules loaded successfully!");
} catch (e) {
    console.error("Error loading modules:", e);
    process.exit(1);
}
