import React, { useState } from 'react';
import { SendIcon, LoadingSpinner, MicrophoneIcon, VideoIcon, PlusIcon } from './Icons';

interface SearchBarProps {
  onSend: (query: string) => void;
  isLoading: boolean;
  onVoiceClick: () => void; 
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSend, isLoading, onVoiceClick }) => {
  const [query, setQuery] = useState('');

  const handleSend = () => {
    if (query.trim()) {
      onSend(query.trim());
      setQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative flex items-center bg-bg-slate rounded-full shadow-lg p-2">
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <PlusIcon className="w-6 h-6" />
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="NovEra-dan soruşun..."
          className="flex-grow bg-transparent text-lg text-white placeholder-gray-500 focus:outline-none px-4"
          disabled={isLoading}
        />

        <div className="flex items-center space-x-2">
            <button onClick={onVoiceClick} className="p-2 text-gray-400 hover:text-white transition-colors">
                <VideoIcon className="w-6 h-6" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <MicrophoneIcon className="w-6 h-6" />
            </button>
            <button
                onClick={handleSend}
                disabled={isLoading || !query.trim()}
                className="p-2 rounded-full bg-accent text-white disabled:bg-gray-600 transition-colors flex items-center justify-center w-10 h-10"
            >
                {isLoading ? <LoadingSpinner className="w-6 h-6" /> : <SendIcon className="w-6 h-6" />}
            </button>
        </div>
      </div>
    </div>
  );
};