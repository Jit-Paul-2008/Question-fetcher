import "dotenv/config";

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Available Models:", JSON.stringify(data.models?.map((m: any) => m.name), null, 2));
  } catch (err: any) {
    console.error("Failed to fetch models:", err.message);
  }
}

listAllModels();
