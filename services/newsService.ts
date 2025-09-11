import type { NewsArticle } from '../types';

const GNEWS_API_KEY = '286e9378fdc9ac15698ee4398547d04a';


// Mappings
const azCategoryToEn: { [key: string]: string } = {
    'siyasət': 'politics',
    'idman': 'sports',
    'texnologiya': 'technology',
    'mədəniyyət': 'entertainment',
    'iqtisadiyyat': 'business',
    'səhiyyə': 'health',
    'elm': 'science',
    'dünya': 'world',
};

const gnewsCategoryMap: { [key: string]: string } = {
    'politics': 'nation',
    'sports': 'sports',
    'technology': 'technology',
    'entertainment': 'entertainment',
    'business': 'business',
    'health': 'health',
    'science': 'science',
    'world': 'world',
};

// Smart Categorization Keywords (in Azerbaijani)
const categoryKeywords: { [key: string]: string[] } = {
    'siyasət': ['hökumət', 'nazir', 'parlament', 'prezident', 'seçki', 'qanun', 'partiya'],
    'idman': ['futbol', 'qarabağ', 'neftçi', 'klub', 'oyun', 'çempionat', 'idmançı', 'komanda'],
    'texnologiya': ['ai', 'süni intellekt', 'kompüter', 'internet', 'mobil', 'proqram', 'google', 'apple', 'meta'],
    'mədəniyyət': ['musiqi', 'film', 'kino', 'teatr', 'sərgi', 'incəsənət', 'kitab', 'festival'],
    'iqtisadiyyat': ['iqtisadiyyat', 'biznes', 'şirkət', 'investisiya', 'bank', 'dollar', 'manat', 'neft'],
    'səhiyyə': ['səhiyyə', 'xəstəxana', 'həkim', 'virus', 'covid', 'sağlamlıq', 'dərman'],
    'elm': ['elm', 'tədqiqat', 'kəşf', 'kosmos', 'nasa', 'alimlər', 'universitet'],
};

const smartCategorize = (article: NewsArticle): string => {
    const content = `${article.title.toLowerCase()} ${article.summary?.toLowerCase() || ''}`;
    for (const category in categoryKeywords) {
        for (const keyword of categoryKeywords[category]) {
            if (content.includes(keyword)) {
                return category;
            }
        }
    }
    return 'dünya'; // Default category
};

const fetchGNews = async (query: string, category: string, language: string, country: string | null): Promise<NewsArticle[]> => {
    let url = `https://gnews.io/api/v4/top-headlines?apikey=${GNEWS_API_KEY}&lang=${language}`;
    if (query) {
        url = `https://gnews.io/api/v4/search?apikey=${GNEWS_API_KEY}&q=${encodeURIComponent(query)}&lang=${language}`;
    } else if (category !== 'hamısı') {
        const enCategory = azCategoryToEn[category];
        const gnewsCategory = enCategory ? gnewsCategoryMap[enCategory] : undefined;
        if (gnewsCategory) {
            url += `&topic=${gnewsCategory}`;
        }
    }
    if (country) url += `&country=${country}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GNews API error: ${response.statusText}`);
        const data = await response.json();
        
        return (data.articles || []).map((article: any, index: number): NewsArticle => ({
            id: `${article.source.name}-${article.publishedAt}-${index}`,
            title: article.title,
            summary: article.description,
            url: article.url,
            source: article.source.name,
            imageUrl: article.image,
            publishedAt: article.publishedAt,
            content: article.content,
        }));
    } catch (error) {
        console.error("Failed to fetch from GNews:", error);
        return [];
    }
};


export const fetchNews = async ({ query = '', category = 'hamısı', language = 'az', country = null }: { query?: string, category?: string, language?: string, country?: string | null }): Promise<NewsArticle[]> => {
    // NewsData.io API key was invalid, so we now rely solely on GNews.
    const gnewsArticles = await fetchGNews(query, category, language, country);

    const combined = [...gnewsArticles];

    // Deduplicate (still useful in case GNews returns duplicates)
    const uniqueArticles = new Map<string, NewsArticle>();
    combined.forEach(article => {
        // Normalize title for better deduplication
        const normalizedTitle = article.title.toLowerCase().trim();
        if (!uniqueArticles.has(normalizedTitle)) {
            uniqueArticles.set(normalizedTitle, article);
        }
    });

    const articles = Array.from(uniqueArticles.values());

    // Smart categorize and sort
    const processedArticles = articles.map(article => {
        const azCategory = smartCategorize(article);
        return { ...article, category: azCategory };
    }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return processedArticles;
};

// Similarity scoring for related news
export const findSimilarNews = (currentArticle: NewsArticle, allArticles: NewsArticle[], count: number = 4): NewsArticle[] => {
    const currentTitleWords = new Set(currentArticle.title.toLowerCase().split(/\s+/));

    const scores = allArticles
        .filter(article => article.id !== currentArticle.id)
        .map(article => {
            const otherTitleWords = new Set(article.title.toLowerCase().split(/\s+/));
            const intersection = new Set([...currentTitleWords].filter(word => otherTitleWords.has(word)));
            const union = new Set([...currentTitleWords, ...otherTitleWords]);
            const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;
            return { article, score: jaccardSimilarity };
        });

    return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(item => item.article);
};