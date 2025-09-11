import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNews } from '../services/newsService';
import type { NewsArticle } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { NewsScreen } from './NewsScreen';
import { NewsArticle as NewsArticleView } from './NewsArticle';

export const News: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('hamısı');
  const [language, setLanguage] = useState('az');
  const [region, setRegion] = useState<'world' | 'local'>('world');
  
  const { countryCode, loading: geoLoading, error: geoError } = useGeolocation();
  
  const countryToFetch = region === 'local' && countryCode ? countryCode : null;

  const { data: articles = [], isLoading, isError } = useQuery<NewsArticle[]>({
    queryKey: ['news', activeCategory, language, countryToFetch],
    queryFn: () => fetchNews({ category: activeCategory, language, country: countryToFetch }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const handleArticleSelect = (article: NewsArticle) => {
      setSelectedArticle(article);
      window.scrollTo(0, 0);
  };

  const handleBack = () => {
      setSelectedArticle(null);
  };

  if (selectedArticle) {
      return <NewsArticleView article={selectedArticle} allArticles={articles} onBack={handleBack} onArticleSelect={handleArticleSelect} />;
  }

  return (
    <NewsScreen
        articles={articles}
        isLoading={isLoading || geoLoading}
        isError={isError}
        onArticleSelect={handleArticleSelect}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        region={region}
        setRegion={setRegion}
        isGeolocationEnabled={!!countryCode || !!geoError}
    />
  );
};
