import React from 'react';
import type { NewsArticle } from '../types';
import { findSimilarNews } from '../services/newsService';
import { NewsCard } from './NewsCard';

interface SimilarNewsProps {
  currentArticle: NewsArticle;
  allArticles: NewsArticle[];
  onArticleSelect: (article: NewsArticle) => void;
}

export const SimilarNews: React.FC<SimilarNewsProps> = ({ currentArticle, allArticles, onArticleSelect }) => {
  const similarArticles = findSimilarNews(currentArticle, allArticles);

  if (similarArticles.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gem-text mb-4">Oxşar Xəbərlər</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {similarArticles.map(article => (
          <NewsCard key={article.id} article={article} onSelect={onArticleSelect} variant="compact" />
        ))}
      </div>
    </div>
  );
};
