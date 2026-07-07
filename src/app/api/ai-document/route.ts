import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType, language } = await request.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const prompt = `You are a strict document verification AI for the 'Smart Bharat' civic platform.
    Analyze the provided image and determine if it is a valid, readable official document (like an Aadhar Card, PAN Card, Income Certificate, etc).
    
    You MUST respond with a raw JSON object containing exactly these fields:
    1. "isValid": boolean (true if it looks like a valid, readable document, false if blurry, irrelevant, or fake).
    2. "documentType": string (e.g., "Identity Card", "Income Certificate", "Utility Bill", or "Unknown").
    3. "feedback": string (A helpful message explaining why it was accepted or rejected, written in ${language || 'English'}).
    
    Output ONLY the JSON object.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);
    
    const response = await result.response;
    let text = response.text().trim();
    
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
    
  } catch (error: unknown) {
    console.error('Error verifying document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify document';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
