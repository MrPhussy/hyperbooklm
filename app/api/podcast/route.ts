import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { context } = await request.json();

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "OpenAI API key is missing" },
                { status: 500 }
            );
        }

        if (!context) {
            return NextResponse.json(
                { error: "Context is required for script generation" },
                { status: 400 }
            );
        }

        const openai = new OpenAI({ apiKey });
        const model = "gpt-4o-mini";

        const systemPrompt = `
You are an expert podcast scriptwriter. 
Generate a conversational, engaging dialogue between two hosts, Host 1 (Vince) and Host 2 (Ava), based on the provided research context.

Format:
- The script should be a JSON array of Turns.
- Each Turn has: "role" (either "host1" or "host2") and "text" (the spoken dialogue).
- Host 1 (Vince) is reflective, authoritative, and slightly formal.
- Host 2 (Ava) is enthusiastic, inquisitive, and brings high personality.
- The dialogue should cover the key insights from the context.
- Keep the total length around 6-10 turns.

JSON Structure:
{
  "turns": [
    { "role": "host1", "text": "..." },
    { "role": "host2", "text": "..." }
  ]
}

Return ONLY valid JSON.
`;

        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Context:\n${context}` },
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Empty response from OpenAI");
        }

        const scriptData = JSON.parse(content);

        return NextResponse.json(scriptData);
    } catch (error) {
        console.error("[Podcast Script] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
