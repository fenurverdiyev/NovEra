import { searchImagesAndVideos as serperSearchImagesAndVideos } from './serperService';

export interface SearchResult {
  images: string[];
  videos: string[];
}

/**
 * Search for images and videos using Serper API
 * @param query Search query
 * @param maxImages Maximum number of images to return (default: 6)
 * @param maxVideos Maximum number of videos to return (default: 3)
 * @returns Promise<SearchResult>
 */
export async function searchImagesAndVideos(query: string, maxImages = 6, maxVideos = 3): Promise<SearchResult> {
  try {
    return await serperSearchImagesAndVideos(query, maxImages, maxVideos);
  } catch (error) {
    console.error('Search error:', error);
    return { images: [], videos: [] };
  }
}
