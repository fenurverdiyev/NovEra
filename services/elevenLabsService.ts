// NOTE: This service requires an API key from ElevenLabs.
// It must be provided as an environment variable named ELEVENLABS_API_KEY.

import type { VoiceOption } from '../types';

// IMPORTANT: Do not hardcode API keys in the source code.
// This key should be loaded from an environment variable, e.g., process.env.ELEVENLABS_API_KEY
const ELEVENLABS_API_KEY = ''; // REMOVED HARDCODED KEY

// Voice IDs from user request:
// Betül Voice id: 6GYyziau4Hk8qdg7od5c
// Cansu Voice id: SMRHdMmNcA5RcHlk7xCP
// Will Voice id: kIfcKu9kr8RZrbz7H3ox
// Liam Voice id: TX3LPaxmHKxFdv7VOQHJ
export const AVAILABLE_VOICES: VoiceOption[] = [
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
    { id: '6GYyziau4Hk8qdg7od5c', name: 'Betül' },
    { id: 'SMRHdMmNcA5RcHlk7xCP', name: 'Cansu' },
    { id: 'kIfcKu9kr8RZrbz7H3ox', name: 'Will' },
];

export const textToSpeech = async (text: string, voiceId: string = 'TX3LPaxmHKxFdv7VOQHJ'): Promise<string | null> => {
    if (!ELEVENLABS_API_KEY) {
        console.warn("ElevenLabs API key not found. Make sure ELEVENLABS_API_KEY environment variable is set. Skipping text-to-speech.");
        return null;
    }

    if (!text || text.trim().length < 5) {
        return null;
    }

    const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_v3',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            let errorBody;
            try {
                 errorBody = await response.json();
                 console.error("ElevenLabs API Error:", JSON.stringify(errorBody, null, 2));
            } catch(e) {
                 errorBody = await response.text();
                 console.error("ElevenLabs API Error (non-JSON):", errorBody);
            }
            throw new Error(`ElevenLabs API request failed with status ${response.status}`);
        }

        const audioBlob = await response.blob();
        return URL.createObjectURL(audioBlob);

    } catch (error) {
        console.error("Error with ElevenLabs text-to-speech:", error);
        return null;
    }
};
