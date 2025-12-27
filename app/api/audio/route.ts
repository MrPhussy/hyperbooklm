import { NextRequest, NextResponse } from "next/server";

const HUME_TTS_URL = "https://api.hume.ai/v0/tts/file";

export async function POST(request: NextRequest) {
  try {
    const { text, turns } = await request.json();

    if (!text && (!turns || turns.length === 0)) {
      return NextResponse.json(
        { error: "Text or turns are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUME_API_KEY;
    if (!apiKey) {
      console.error("[Audio] Hume API key is missing");
      return NextResponse.json(
        { error: "Hume API key is missing" },
        { status: 500 }
      );
    }

    const host1Voice = process.env.HUME_HOST_1_VOICE || "Vince Douglas";
    const host2Voice = process.env.HUME_HOST_2_VOICE || "Ava Song";

    // Build utterances list
    const utterances = [];
    if (turns && Array.isArray(turns)) {
      for (const turn of turns) {
        utterances.push({
          text: turn.text,
          voice: {
            name: turn.role === "host1" ? host1Voice : host2Voice,
            provider: "HUME_AI",
          },
        });
      }
    } else {
      utterances.push({
        text: text,
        voice: {
          name: host1Voice,
          provider: "HUME_AI",
        },
      });
    }

    const response = await fetch(HUME_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hume-Api-Key": apiKey,
      },
      body: JSON.stringify({
        utterances,
        format: { type: "mp3" },
        version: "2"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Audio] Hume API error:", response.status, errorText);
      return NextResponse.json(
        { error: errorText || "Failed to generate audio" },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[Audio] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
