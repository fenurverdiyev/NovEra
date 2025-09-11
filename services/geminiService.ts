// Fix: The `FunctionDeclarationTool` type does not exist in `@google/genai`. It has been replaced with the correct `Tool` type.
import { GoogleGenAI, Type, Content, Tool } from "@google/genai";
import type { Source, NewsArticle, WeatherData, Message } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
  
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// Add new device assistant functions
// Fix: The type `FunctionDeclarationTool[]` is incorrect and has been replaced with `Tool[]`.
const assistantTools: Tool[] = [
    {
      functionDeclarations: [
        {
          name: 'makeCall',
          description: 'Cihazın defolt zəng proqramını istifadə edərək müəyyən bir kontakta telefon zəngi et.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              contactName: {
                type: Type.STRING,
                description: 'Zəng ediləcək şəxsin adı, məsələn, "Fuad".',
              },
            },
            required: ['contactName'],
          },
        },
        {
          name: 'sendMessage',
          description: 'Müəyyən bir proqram (SMS, WhatsApp, email) vasitəsilə bir kontakta mesaj göndər.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              contactName: {
                type: Type.STRING,
                description: 'Mesaj göndəriləcək şəxsin adı, məsələn, "Fuad".',
              },
              message: {
                type: Type.STRING,
                description: 'Mesajın məzmunu.',
              },
              service: {
                type: Type.STRING,
                description: 'Mesaj göndərmək üçün istifadə ediləcək proqram. Dəstəklənənlər: "sms", "whatsapp", "email".',
              },
            },
            required: ['contactName', 'message', 'service'],
          },
        },
        {
          name: 'setAlarm',
          description: 'Cihazda müəyyən bir vaxt və başlıq üçün siqnal (zəngli saat) qur.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
                description: 'Siqnalın qurulacağı vaxt, məsələn, "07:30" və ya "axşam 9".',
              },
              label: {
                type: Type.STRING,
                description: 'Siqnal üçün etiket və ya ad, məsələn, "İşə getmək".',
              },
            },
            required: ['time'],
          },
        },
        {
          name: 'addCalendarEvent',
          description: 'Cihazın təqviminə yeni bir tədbir əlavə et.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Tədbirin adı.' },
              description: { type: Type.STRING, description: 'Tədbirin təsviri.' },
              startTime: { type: Type.STRING, description: 'Başlama vaxtı (ISO 8601 formatında və ya anlaşılan dildə).' },
              endTime: { type: Type.STRING, description: 'Bitmə vaxtı (ISO 8601 formatında və ya anlaşılan dildə).' },
            },
            required: ['title', 'startTime'],
          },
        },
        {
          name: 'addNote',
          description: 'Cihazın qeyd proqramına yeni bir qeyd əlavə et.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              content: {
                type: Type.STRING,
                description: 'Qeydin məzmunu.',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'toggleDevice',
          description: 'Cihazın funksiyalarını (WiFi, Bluetooth, Fənər) yandırmaq və ya söndürmək.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              device: {
                type: Type.STRING,
                description: 'İdarə ediləcək funksiya. Dəstəklənənlər: "wifi", "bluetooth", "flashlight".',
              },
              state: {
                type: Type.STRING,
                description: 'Funksiyanın vəziyyəti. Dəstəklənənlər: "on", "off".',
              },
            },
            required: ['device', 'state'],
          },
        },
      ],
    },
];


/**
 * Maps the application's Message array to the Gemini API's Content array format.
 * @param messages The array of messages from the app state.
 * @returns A Content array for the Gemini API.
 */
const mapMessagesToContent = (messages: Message[]): Content[] => {
    return messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));
};

export async function* streamChatQuery(
    prompt: string,
    history: Message[],
    images: string[] = []
): AsyncGenerator<{ text?: string; sources?: Source[], images?: string[], videos?: string[], toolCalls?: any[] }> {
    const systemInstruction = "Sən köməkçi assistantsan və mütləq Azərbaycan dilində cavab verməlisən. Sənə cihazla bağlı bəzi funksiyaları yerinə yetirmək üçün alətlər verilib: zəng etmək, mesaj göndərmək, siqnal qurmaq, təqvimə tədbir əlavə etmək, qeyd yazmaq və cihaz funksiyalarını (wifi, bluetooth, fənər) idarə etmək. İstifadəçi bu funksiyalardan birini istədikdə, lazımi məlumatları (məsələn, kimə zəng ediləcəyi, mesajın mətni, siqnalın vaxtı) topla. Əgər hər hansı məlumat əskikdirsə, aləti çağırmazdan əvvəl aydınlaşdırıcı sual ver. Bütün məlumatlar toplandıqdan sonra müvafiq aləti çağır. Ekranı oxumaq, bildirişləri yoxlamaq kimi dəstəklənməyən sorğular üçün, bu funksiyanı birbaşa brauzerdən edə bilmədiyini nəzakətlə bildir. Həmçinin, istifadəçi sorğularını vizual olaraq zənginləşdirmək üçün şəkil və video tapmaq məqsədilə Google Axtarışından istifadə et. Şəkil/video URL-lərini cavabına bu formatda daxil et: [image: URL] [video: URL].";
    
    const historicContent = mapMessagesToContent(history);
    
    const userParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: prompt }];
    if (images.length > 0) {
        images.forEach(imgData => {
            userParts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: imgData.split(',')[1],
                }
            });
        });
    }

    const contents: Content[] = [...historicContent, { role: 'user', parts: userParts }];

    const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
            tools: assistantTools,
            systemInstruction,
        },
    });

    let sourceIndex = 1;
    const seenUris = new Set<string>();
    
    const imageRegex = /\[image:\s*(https?:\/\/[^\]]+)\]/g;
    const videoRegex = /\[video:\s*(https?:\/\/[^\]]+)\]/g;


    for await (const chunk of responseStream) {
        let text = chunk.text;
        
        const newImages: string[] = [];
        const newVideos: string[] = [];

        if (text) {
            const imageMatches = text.matchAll(imageRegex);
            for (const match of imageMatches) {
                newImages.push(match[1]);
            }
            text = text.replace(imageRegex, '').trim();

            const videoMatches = text.matchAll(videoRegex);
            for (const match of videoMatches) {
                newVideos.push(match[1]);
            }
            text = text.replace(videoRegex, '').trim();
        }

        const newSources: Source[] = [];
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            for (const { web } of groundingChunks) {
                if (web?.uri && !seenUris.has(web.uri)) {
                    newSources.push({
                        uri: web.uri,
                        title: web.title || new URL(web.uri).hostname,
                        index: sourceIndex++,
                    });
                    seenUris.add(web.uri);
                }
            }
        }
        
        const toolCalls = chunk.candidates?.[0]?.content?.parts
            ?.filter(part => !!part.functionCall)
            .map(part => part.functionCall);

        yield { 
            text, 
            sources: newSources.length > 0 ? newSources : undefined,
            images: newImages.length > 0 ? newImages : undefined,
            videos: newVideos.length > 0 ? newVideos : undefined,
            toolCalls: toolCalls?.length ? toolCalls : undefined,
        };
    }
}


export async function generateRelatedQuestions(prompt: string, answer: string): Promise<string[]> {
    try {
        const fullPrompt = `Based on the following question and its answer, generate 3 concise and relevant follow-up questions that a curious user might ask next.
IMPORTANT: The questions MUST be in the Azerbaijani language.

Question: "${prompt}"

Answer: "${answer.substring(0, 2000)}..."

Return the questions as a JSON array of strings.`;

        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING
                            }
                        }
                    }
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result.questions || [];

    } catch (error) {
        console.error("Error generating related questions:", error);
        return [];
    }
}

export async function analyzeNewsArticle(article: NewsArticle): Promise<string> {
    try {
        const prompt = `Please analyze the following news article. Provide a concise, neutral summary covering the key points, any potential biases detected, and the wider implications of the story.
        IMPORTANT: Your entire response MUST be in the Azerbaijani language.

        Article Title: "${article.title}"
        Article Content: "${(article.content || article.summary || '').substring(0, 3000)}"

        Return the analysis as a single block of text.`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing news article:", error);
        return "Məqalə təhlil edilərkən xəta baş verdi.";
    }
}


export async function getWeather(location: string): Promise<WeatherData> {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Get the current weather and a 5-day forecast for the location: "${location}".
            IMPORTANT: All text content (location, condition, day) MUST be in the Azerbaijani language.
            Return the result as a single, valid JSON object.
            If the location is found, the JSON object must have a "success" key set to true, and a "data" key containing the weather information with this structure:
            { "location": "City, Country", "current": { "temp": number, "condition": "string" }, "forecast": [ { "day": "string", "temp": number, "condition": "string" }, ... ] }
            If the location is not found or is ambiguous, the JSON object must have a "success" key set to false, and an "error" key with a message like "Məkan tapılmadı".
            Do not include any text, markdown, or commentary outside of the JSON object.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        success: { type: Type.BOOLEAN },
                        data: {
                            type: Type.OBJECT,
                            properties: {
                                location: { type: Type.STRING },
                                current: {
                                    type: Type.OBJECT,
                                    properties: {
                                        temp: { type: Type.NUMBER },
                                        condition: { type: Type.STRING },
                                    },
                                    required: ['temp', 'condition'],
                                },
                                forecast: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            day: { type: Type.STRING },
                                            temp: { type: Type.NUMBER },
                                            condition: { type: Type.STRING },
                                        },
                                        required: ['day', 'temp', 'condition']
                                    },
                                },
                            },
                            required: ['location', 'current', 'forecast']
                        },
                        error: { type: Type.STRING }
                    },
                    required: ['success']
                },
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr) as { success: boolean; data?: WeatherData; error?: string };

        if (result.success && result.data) {
            return result.data;
        }

        if (!result.success && result.error) {
            throw new Error(result.error);
        }

        // If we reach here, the response is malformed.
        throw new Error("Hava məlumatı üçün natamam cavab alındı.");

    } catch (error) {
        console.error("Error fetching weather:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Hava məlumatı əldə edilərkən naməlum xəta baş verdi.");
    }
}

export async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || !text.trim()) {
        return "";
    }
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Translate the following text to ${targetLang}. Return only the translated text, with no additional commentary or explanations. Text to translate: "${text}"`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text:", error);
        throw new Error("Tərcümə etmək mümkün olmadı.");
    }
}