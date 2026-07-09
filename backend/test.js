require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function main() {
    try {
        console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
        console.log("First 5 chars:", process.env.GEMINI_API_KEY.substring(0, 5));

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Say hello",
        });

        console.log("Response:");
        console.log(response.text);

    } catch (err) {
        console.error("ERROR:");
        console.error(err);
    }
}

main();