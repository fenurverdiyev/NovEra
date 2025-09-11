export interface Source {
  uri: string;
  title: string;
  index: number;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'tool';
  text: string;
  sources?: Source[];
  related?: string[];
  isLoading?: boolean;
  ttsError?: string;
  images?: string[];
  videos?: string[];
  toolCalls?: ToolCall[];
  toolResult?: { call: ToolCall; output: any };
}

export type AppView = 'search' | 'news' | 'weather' | 'translate' | 'settings';

export interface VoiceOption {
  id: string;
  name: string;
}

export interface AppSettings {
  voiceEnabled: boolean;
  voiceId: string;
  theme: string;
}

export interface NewsArticle {
    id: string;
    title: string;
    summary: string | null;
    url: string;
    source: string;
    imageUrl: string | null;
    publishedAt: string;
    content?: string | null;
    category?: string;
    language?: string;
    country?: string[];
}

export interface WeatherData {
    current: {
        temp: number;
        condition: string;
    };
    forecast: {
        day: string;
        temp: number;
        condition: string;
    }[];
    location: string;
}
