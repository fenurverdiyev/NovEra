// This is a Vercel-style serverless function.
// It acts as a secure proxy to the ElevenLabs API.

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // IMPORTANT: Use the non-VITE prefixed key here, as this runs on the server.
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!ELEVENLABS_API_KEY) {
    console.error("ElevenLabs API key not set on the server.");
    return new Response(JSON.stringify({ error: "TTS service is not configured." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { text, voiceId } = await request.json();

    if (!text || !voiceId) {
      return new Response(JSON.stringify({ error: "Missing 'text' or 'voiceId' in request body." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const elevenLabsResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!elevenLabsResponse.ok) {
        const errorBody = await elevenLabsResponse.text();
        console.error(`ElevenLabs API Error: ${elevenLabsResponse.status}`, errorBody);
        return new Response(JSON.stringify({ error: `ElevenLabs API request failed` }), {
            status: elevenLabsResponse.status,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Stream the audio back to the client
    return new Response(elevenLabsResponse.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error("Error in ElevenLabs proxy:", error);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
