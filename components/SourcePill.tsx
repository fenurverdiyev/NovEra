
import React from 'react';
import type { Source } from '../types';

interface SourcePillProps {
  source: Source;
}

export const SourcePill: React.FC<SourcePillProps> = ({ source }) => {
  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center bg-bg-onyx hover:bg-bg-slate transition-colors rounded-full text-sm font-medium text-text-sub mr-2 mb-2"
    >
      <span className="bg-bg-slate text-text-main rounded-full w-5 h-5 flex items-center justify-center mr-2">
        {source.index}
      </span>
      <span className="pr-3 truncate max-w-xs">{source.title}</span>
    </a>
  );
};