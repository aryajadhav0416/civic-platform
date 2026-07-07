const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = envFile.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';

async function run() {
  if (!apiKey) {
    console.error('API key not found');
    return;
  }
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      console.log('Available models:');
      data.models.forEach(m => console.log(m.name));
    } else {
      console.error('Error fetching models:', data);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
run();
