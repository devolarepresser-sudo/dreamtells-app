
const testDream = async () => {
    console.log("Testing AI Backend Connection...");
    try {
        const response = await fetch('http://localhost:3000/api/interpretarSonho', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: 'test-user',
                dreamText: 'Sonhei que estava voando sobre uma cidade de cristal, mas minhas asas eram feitas de papel.',
                premium: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("--- API RESPONSE ---");
        console.log(JSON.stringify(data, null, 2));

        if (data.data && data.data.interpretationMain) {
            console.log("SUCCESS: Received interpretation!");
        } else {
            console.log("FAILURE: Invalid response format.");
        }

    } catch (error) {
        console.error("TEST FAILED:", error.message);
    }
};

testDream();
