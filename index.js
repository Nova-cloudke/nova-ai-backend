async function generateAI(question, mode, context) {
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
return {
configured: false,
answer: null,
notice: "Groq API key is not configured."
};
}

const response = await fetch(
"https://api.groq.com/openai/v1/chat/completions",
{
method: "POST",
headers: {
"Authorization": "Bearer ${apiKey}",
"Content-Type": "application/json"
},
body: JSON.stringify({
model: "llama-3.3-70b-versatile",
messages: [
{
role: "system",
content: "You are Nova AI inside Nova Cloud. Understand the user's actual question, give clear and specific answers, distinguish facts from assumptions, avoid inventing evidence, and recommend practical next actions. Adapt your answer to the topic. Requested mode: " + mode
},
{
role: "user",
content: JSON.stringify({ question, mode, context })
}
],
temperature: 0.4
}),
signal: AbortSignal.timeout(60000)
}
);

const data = await response.json();

if (!response.ok) {
console.error("Groq request failed:", response.status, data);
throw new Error("Groq AI request failed. Check the API key and model.");
}

return {
configured: true,
answer: data.choices?.[0]?.message?.content || null,
model: data.model || "llama-3.3-70b-versatile"
};
}
