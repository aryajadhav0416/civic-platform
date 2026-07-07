import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { message, language } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const prompt = `You are an AI Civic Companion for the 'Smart Bharat' platform in India.
    Your goal is to help citizens understand government services, schemes, and how to report issues.
    Keep your answers concise, empathetic, and very easy to understand (at an 8th-grade reading level).
    If asked about a specific service (like Birth Certificate, PM Awas Yojana, reporting potholes), give a clear step-by-step guide.
    IMPORTANT: You MUST respond in the following language: ${language || 'English'}.
    
    Citizen Query: ${message}`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return NextResponse.json({ text });
    } catch (geminiError) {
      console.warn('Gemini failed, falling back to Groq:', geminiError);
      
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!groqRes.ok) {
        const errorText = await groqRes.text();
        console.error('Groq API Error Response:', errorText);
        throw new Error(`Both Gemini and Groq APIs failed. Groq Status: ${groqRes.status}`);
      }
      
      const groqData = await groqRes.json();
      return NextResponse.json({ text: groqData.choices[0].message.content });
    }
  } catch (error: unknown) {
    console.error('Error generating AI response:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
