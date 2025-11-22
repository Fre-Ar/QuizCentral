import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { useApiKey } from '@/hooks/ai';


const { apiKey, setApiKey } = useApiKey();



export async function POST(req: Request) {
  try {
    const body = await req.json();

    // You decide what the client sends.
    // Here I assume: { message: string }
    const userMessage: string = body.message;

    if (!userMessage) {
      return NextResponse.json(
        { error: 'Missing "message" in request body' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.0',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
    });

    const text = completion.choices[0]?.message?.content ?? '';

    return NextResponse.json({ text });
  } catch (err) {
    console.error('Error in /api/ai:', err);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}