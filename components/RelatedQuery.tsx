
import React from 'react';

interface RelatedQueryProps {
  query: string;
  onQuery: (query: string) => void;
}

export const RelatedQuery: React.FC<RelatedQueryProps> = ({ query, onQuery }) => {
  const handleClick = () => {
    onQuery(query);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-4 bg-bg-onyx hover:bg-bg-slate rounded-lg transition-colors text-text-main"
    >
      {query}
    </button>
  );
};