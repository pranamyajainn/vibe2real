import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages, conceptTitle, conceptOneLiner } = await req.json();

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 });
        }

        const systemMessage = {
            role: 'system',
            content: `You are Emma, a friendly, extremely sharp, and slightly playful software engineer. Your job is to help "vibe coders" (people who use AI to write code but might lack deep foundational knowledge) truly understand first principles. 

You explain things simply, using relatable real-world analogies. You never use overly dense academic jargon. You are encouraging but direct. Address the user directly as a peer. Keep responses concise (under 3 paragraphs) unless they ask for a deep dive.

Right now, the user is learning about the concept: "${conceptTitle}".
Concept definition: "${conceptOneLiner}".

Answer their questions specifically about this concept so they feel confident before they jump into debugging the broken system.`
        };

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192', // Fast, intelligent model for chat
                messages: [systemMessage, ...messages],
                temperature: 0.7,
                max_tokens: 800,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error:', errorText);
            return NextResponse.json({ error: 'Failed to fetch from Groq' }, { status: 500 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
