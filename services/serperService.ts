const SERPER_API_KEY = import.meta.env.VITE_SERPAPI_KEY;
const SERPER_BASE_URL = 'https://google.serper.dev';

if (!SERPER_API_KEY) {
    console.warn('VITE_SERPAPI_KEY not found. Search features will be limited.');
}

export interface SerperSearchResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
}

export interface SerperImageResult {
    title: string;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    thumbnailUrl: string;
    thumbnailWidth: number;
    thumbnailHeight: number;
    source: string;
    domain: string;
    link: string;
    position: number;
}

export interface SerperVideoResult {
    title: string;
    link: string;
    snippet: string;
    imageUrl: string;
    duration: string;
    source: string;
    channel: string;
    date: string;
    position: number;
}

export interface SerperNewsItem {
    title: string;
    link: string;
    snippet?: string;
    source?: string;
    date?: string; // ISO or human readable
    imageUrl?: string;
    position?: number;
}

export interface SerperResponse {
    searchParameters: {
        q: string;
        type: string;
        engine: string;
    };
    organic?: SerperSearchResult[];
    images?: SerperImageResult[];
    videos?: SerperVideoResult[];
    answerBox?: {
        answer: string;
        title: string;
        link: string;
    };
    knowledgeGraph?: {
        title: string;
        type: string;
        description: string;
        descriptionSource: string;
        descriptionLink: string;
        imageUrl: string;
    };
}

/**
 * Search for web results using Serper API
 * @param query Search query
 * @param num Number of results to return (default: 10)
 * @returns Promise<SerperResponse | null>
 */
export async function searchWeb(query: string, num: number = 10): Promise<SerperResponse | null> {
    if (!SERPER_API_KEY) {
        console.warn('Serper API key not available');
        return null;
    }

    if (!query || query.trim().length === 0) {
        return null;
    }

    try {
        const response = await fetch(`${SERPER_BASE_URL}/search`, {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: query.trim(),
                num: Math.min(num, 100), // Serper API limit
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Serper API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        return data as SerperResponse;
    } catch (error) {
        console.error('Error in searchWeb:', error);
        return null;
    }
}

/**
 * Search for images using Serper API
 * @param query Search query
 * @param num Number of images to return (default: 10)
 * @returns Promise<SerperImageResult[] | null>
 */
export async function searchImages(query: string, num: number = 10): Promise<SerperImageResult[] | null> {
    if (!SERPER_API_KEY) {
        console.warn('Serper API key not available');
        return null;
    }

    if (!query || query.trim().length === 0) {
        return null;
    }

    try {
        const response = await fetch(`${SERPER_BASE_URL}/images`, {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: query.trim(),
                num: Math.min(num, 100),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Serper Images API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        return data.images || [];
    } catch (error) {
        console.error('Error in searchImages:', error);
        return null;
    }
}

/**
 * Search for videos using Serper API
 * @param query Search query
 * @param num Number of videos to return (default: 10)
 * @returns Promise<SerperVideoResult[] | null>
 */
export async function searchVideos(query: string, num: number = 10): Promise<SerperVideoResult[] | null> {
    if (!SERPER_API_KEY) {
        console.warn('Serper API key not available');
        return null;
    }

    if (!query || query.trim().length === 0) {
        return null;
    }

    try {
        const response = await fetch(`${SERPER_BASE_URL}/videos`, {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: query.trim(),
                num: Math.min(num, 100),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Serper Videos API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        return data.videos || [];
    } catch (error) {
        console.error('Error in searchVideos:', error);
        return null;
    }
}

/**
 * Combined search for images and videos
 * @param query Search query
 * @param maxImages Maximum number of images (default: 6)
 * @param maxVideos Maximum number of videos (default: 3)
 * @returns Promise<{images: string[], videos: string[]}>
 */
export async function searchImagesAndVideos(
    query: string,
    maxImages: number = 6,
    maxVideos: number = 3
): Promise<{ images: string[]; videos: string[] }> {
    const [imageResults, videoResults] = await Promise.all([
        searchImages(query, maxImages),
        searchVideos(query, maxVideos),
    ]);

    const images = imageResults?.slice(0, maxImages).map(img => img.imageUrl).filter(Boolean) || [];
    const videos = videoResults?.slice(0, maxVideos).map(vid => vid.link).filter(Boolean) || [];

    return { images, videos };
}

/**
 * Search for news using Serper API
 * @param query Search query
 * @param num Number of news results to return (default: 10)
 * @param opts Optional parameters to target country/language
 * @returns Promise<SerperNewsItem[] | null>
 */
export async function searchNews(query: string, num: number = 10, opts?: { gl?: string; hl?: string }): Promise<SerperNewsItem[] | null> {
    if (!SERPER_API_KEY) {
        console.warn('Serper API key not available');
        return null;
    }

    if (!query || query.trim().length === 0) {
        return null;
    }

    try {
        const response = await fetch(`${SERPER_BASE_URL}/news`, {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: query.trim(),
                num: Math.min(num, 100),
                ...(opts?.gl ? { gl: opts.gl } : {}),
                ...(opts?.hl ? { hl: opts.hl } : {}),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Serper News API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        const items = (data.news || []) as any[];
        // Normalize shape to SerperNewsItem
        const normalized: SerperNewsItem[] = items.map((n: any, idx: number) => ({
            title: n.title,
            link: n.link,
            snippet: n.snippet,
            source: n.source,
            date: n.date,
            imageUrl: n.imageUrl,
            position: n.position ?? idx + 1,
        }));
        return normalized;
    } catch (error) {
        console.error('Error in searchNews:', error);
        return null;
    }
}
