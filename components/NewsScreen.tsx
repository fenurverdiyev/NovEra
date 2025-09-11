import React from 'react';
import type { NewsArticle } from '../types';
import { NewsCard } from './NewsCard';
import { LoadingSpinner, AlertTriangleIcon, SearchIcon, GlobeIcon, MapPinIcon } from './Icons';

interface NewsScreenProps {
  articles: NewsArticle[];
  isLoading: boolean;
  isError: boolean;
  onArticleSelect: (article: NewsArticle) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  region: 'world' | 'local';
  setRegion: (region: 'world' | 'local') => void;
  isGeolocationEnabled: boolean;
}

const categories = ['hamısı', 'siyasət', 'idman', 'texnologiya', 'mədəniyyət', 'iqtisadiyyat', 'səhiyyə', 'elm', 'dünya'];

export const NewsScreen: React.FC<NewsScreenProps> = ({
  articles,
  isLoading,
  isError,
  onArticleSelect,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  region,
  setRegion,
  isGeolocationEnabled,
}) => {
  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow overflow-y-auto p-4 md:p-8 bg-bg-jet/90 backdrop-blur-sm">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-text-main mb-2">Xəbərlər</h1>
        <p className="text-text-sub">Dünyadan və bölgənizdən ən son xəbərlər.</p>
        
        <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub"/>
                <input
                    type="text"
                    placeholder="Xəbərlərdə axtar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-bg-slate pl-10 pr-4 py-2 rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent"
                />
            </div>
            {isGeolocationEnabled && (
                <div className="flex bg-bg-slate p-1 rounded-lg">
                    <button onClick={() => setRegion('world')} className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2 ${region === 'world' ? 'bg-bg-onyx text-accent' : 'text-text-sub'}`}>
                        <GlobeIcon className="w-4 h-4"/> Dünya
                    </button>
                    <button onClick={() => setRegion('local')} className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2 ${region === 'local' ? 'bg-bg-onyx text-accent' : 'text-text-sub'}`}>
                        <MapPinIcon className="w-4 h-4"/> Sizin Bölgə
                    </button>
                </div>
            )}
        </div>
      </header>

      <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex space-x-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                activeCategory === cat ? 'bg-accent text-bg-jet' : 'bg-bg-slate text-text-sub hover:bg-bg-onyx'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="w-12 h-12 text-accent" />
        </div>
      ) : isError ? (
        <div className="flex flex-col justify-center items-center h-64 text-center text-text-sub">
            <AlertTriangleIcon className="w-16 h-16 text-yellow-500 mb-4" />
            <p className="max-w-md">Xəbərləri yükləmək mümkün olmadı. Zəhmət olmasa, daha sonra yenidən cəhd edin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <NewsCard 
                key={article.id} 
                article={article} 
                onSelect={onArticleSelect}
                style={{ animation: `fadeInUp 0.5s ${index * 0.05}s ease-out both` }}
            />
          ))}
        </div>
      )}
      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};