import React, { useState, useRef } from 'react';
import { SendIcon, MicrophoneIcon } from './Icons';

interface SearchBarProps {
  onSend: (query: string) => void;
  isLoading: boolean;
  onVoiceClick: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSend, isLoading, onVoiceClick }) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSend(query.trim());
      setQuery('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto p-4">
      <div className="relative flex items-end bg-bg-slate rounded-2xl border border-bg-onyx shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-accent">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Hər hansı bir şey soruşun..."
          className="w-full bg-transparent p-4 pr-28 text-text-main placeholder-text-sub resize-none focus:outline-none max-h-48"
          rows={1}
        />
        <button
          type="button"
          onClick={onVoiceClick}
          disabled={isLoading}
          className="absolute right-14 bottom-3 p-2 rounded-full text-text-sub hover:text-text-main hover:bg-bg-onyx disabled:text-bg-onyx transition-colors"
          aria-label="Səslə axtarış"
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-3 bottom-3 p-2 rounded-full bg-accent text-bg-jet disabled:bg-bg-onyx disabled:text-text-sub transition-colors"
          aria-label="Mesaj göndər"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};