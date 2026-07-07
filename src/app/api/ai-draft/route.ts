import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { message, language } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const prompt = `You are a legal and civic assistant for the 'Smart Bharat' platform in India.
    A citizen has provided a simple description of an issue they are facing.
    Your task is to convert this simple text into a formal, legally structured complaint.
    
    Citizen Issue: "${message}"
    
    You MUST respond with a raw JSON object (do not wrap in markdown or backticks) containing exactly these three fields:
    1. "title": A formal subject line for the complaint.
    2. "description": A highly formal, detailed letter of complaint addressing the concerned authorities.
    3. "department": The specific local Indian government body or department responsible for resolving this issue (e.g., "Electricity Board (MSEDCL)", "Municipal Corporation - Public Works Dept").
    
    IMPORTANT: The "title" and "description" MUST be written in the following language: ${language || 'English'}. The "department" should preferably remain in English for routing purposes, but can include the local name.
    
    Output ONLY the JSON object.`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      // Strip markdown code blocks if the model ignored the instruction
      if (text.startsWith('\`\`\`json')) {
        text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
      } else if (text.startsWith('\`\`\`')) {
        text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
      }

      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (geminiError) {
      console.warn('Gemini failed in draft, falling back to Groq:', geminiError);
      
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        })
      });

      if (!groqRes.ok) {
        throw new Error(`Groq API Error: ${groqRes.status}`);
      }
      
      const groqData = await groqRes.json();
      const parsed = JSON.parse(groqData.choices[0].message.content);
      return NextResponse.json(parsed);
    }
  } catch (error: unknown) {
    console.error('Error generating AI draft:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process draft request';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
