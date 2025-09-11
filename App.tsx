import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SearchBar } from './components/SearchBar';
import { MessageDisplay } from './components/MessageDisplay';
import { streamChatQuery, generateRelatedQuestions } from './services/geminiService';
import { textToSpeech, AVAILABLE_VOICES } from './services/elevenLabsService';
import type { Message, AppView, AppSettings, ToolCall } from './types';
import { Sidebar } from './components/Sidebar';
import { News } from './components/News';
import { Weather } from './components/Weather';
import { Translate } from './components/Translate';
import { Settings } from './components/Settings';
import { VoiceOverlay } from './components/VoiceOverlay';
import { Logo } from './components/Logo';
import { THEMES } from './animations/themes';
import { useDeviceTools } from './hooks/useDeviceTools';

const chunkText = (text: string): string[] => {
  if (!text) return [];
  const sentences = text.match(/[^.!?…]+[.!?…]*|[^.!?…]+$/g) || [];
  if (sentences.length === 0) return [text];

  const chunks: string[] = [];
  let currentChunk = "";
  const maxChunkSize = 400;

  for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length === 0) continue;
      if (currentChunk.length > 0 && currentChunk.length + trimmedSentence.length + 1 > maxChunkSize) {
          chunks.push(currentChunk);
          currentChunk = "";
      }
      currentChunk += (currentChunk.length > 0 ? " " : "") + trimmedSentence;
  }
  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks.length > 0 ? chunks : [text];
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('search');
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('gemini-insight-settings');
      if (savedSettings) return JSON.parse(savedSettings);
    } catch (error) {
      console.error("Could not parse saved settings:", error);
    }
    return {
      voiceEnabled: true,
      voiceId: AVAILABLE_VOICES[0]?.id || 'TX3LPaxmHKxFdv7VOQHJ',
      theme: 'novera',
    };
  });
  
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [liveVocalResponse, setLiveVocalResponse] = useState<{ id: string; text: string; } | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  const currentAudioIndexRef = useRef(0);
  const audioCacheRef = useRef<Record<string, Record<number, string | null>>>({});
  const currentPlayingMessageIdRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...message, id: Date.now().toString() }]);
  }, []);

  const { executeToolCalls } = useDeviceTools(addMessage);

  useEffect(() => {
    // Simulate app loading
    const timer = setTimeout(() => {
        setIsAppReady(true);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 2500); // Show loading for 2.5 seconds
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (audioRef.current && !audioSourceRef.current) {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            
            const source = audioCtx.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            
            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
            audioSourceRef.current = source;
        } catch (e) {
            console.error("Could not create AudioContext:", e);
        }
    }
    return () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('gemini-insight-settings', JSON.stringify(settings));
      document.body.className = `theme-${settings.theme} font-sans`;
    } catch (error) {
      console.error("Could not save settings:", error);
    }
  }, [settings]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const stopPlayback = useCallback(() => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
      }
      setPlayingMessageId(null);
      currentPlayingMessageIdRef.current = null;
      audioQueueRef.current = [];
      currentAudioIndexRef.current = 0;
  }, []);

  const processAudioQueue = useCallback(async () => {
    const messageId = currentPlayingMessageIdRef.current;
    if (!messageId || currentAudioIndexRef.current >= audioQueueRef.current.length) {
      stopPlayback();
      return;
    }

    const index = currentAudioIndexRef.current;
    const text = audioQueueRef.current[index];
    
    if (!audioCacheRef.current[messageId]) audioCacheRef.current[messageId] = {};
    const messageCache = audioCacheRef.current[messageId];

    const nextIndex = index + 1;
    if (nextIndex < audioQueueRef.current.length && !messageCache[nextIndex]) {
        textToSpeech(audioQueueRef.current[nextIndex], settings.voiceId).then(url => {
            if (currentPlayingMessageIdRef.current === messageId) messageCache[nextIndex] = url;
        });
    }

    let url = messageCache[index];
    if (url === undefined) {
      url = await textToSpeech(text, settings.voiceId);
      messageCache[index] = url;
    }

    if (url && audioRef.current && currentPlayingMessageIdRef.current === messageId) {
      audioRef.current.src = url;
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Audio play failed:", error);
        stopPlayback();
      }
    } else {
      currentAudioIndexRef.current++;
      processAudioQueue();
    }
  }, [settings.voiceId, stopPlayback]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleAudioEnd = () => {
      if (currentPlayingMessageIdRef.current) {
        currentAudioIndexRef.current++;
        processAudioQueue();
      }
    };
    audio.addEventListener('ended', handleAudioEnd);
    return () => audio.removeEventListener('ended', handleAudioEnd);
  }, [processAudioQueue]);


  const handlePlayAudio = (messageId: string, text: string) => {
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }
    if (playingMessageId === messageId) {
        stopPlayback();
        return;
    }
    stopPlayback();
    audioQueueRef.current = chunkText(text);
    if (audioQueueRef.current.length === 0) return;
    currentAudioIndexRef.current = 0;
    currentPlayingMessageIdRef.current = messageId;
    setPlayingMessageId(messageId);
    processAudioQueue();
  };

  const handleSend = async (query: string, images?: string[], isVocalQuery: boolean = false) => {
    if (!isVocalQuery) setIsVoiceOverlayOpen(false);
    stopPlayback();
    setIsLoading(true);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: query };
    const modelMessageId = (Date.now() + 1).toString();
    const initialModelMessage: Message = {
      id: modelMessageId, role: 'model', text: '', sources: [], related: [],
      isLoading: true, images: [], videos: [],
    };
    
    const history = messages.slice(-10);
    setMessages(prev => [...prev, userMessage, initialModelMessage]);

    try {
      let fullResponseText = '';
      let accumulatedToolCalls: ToolCall[] = [];
      const stream = streamChatQuery(query, history, images);

      for await (const chunk of stream) {
        if (chunk.text) fullResponseText += chunk.text;
        
        if (chunk.toolCalls) {
            accumulatedToolCalls.push(...chunk.toolCalls);
        }

        setMessages(prev => prev.map(msg => msg.id === modelMessageId ? {
            ...msg, text: fullResponseText,
            sources: [...(msg.sources || []), ...(chunk.sources || [])],
            images: [...(msg.images || []), ...(chunk.images || [])],
            videos: [...(msg.videos || []), ...(chunk.videos || [])],
        } : msg));

        if (isVocalQuery) setLiveVocalResponse({ id: modelMessageId, text: fullResponseText });
      }

      if (accumulatedToolCalls.length > 0) {
        await executeToolCalls(accumulatedToolCalls);
      }
      
      const relatedQuestions = await generateRelatedQuestions(query, fullResponseText);
      setMessages(prev => prev.map(msg => msg.id === modelMessageId ? { ...msg, isLoading: false, related: relatedQuestions } : msg));
      
      if (settings.voiceEnabled && fullResponseText) {
          handlePlayAudio(modelMessageId, fullResponseText);
      }

    } catch (error) {
      console.error('An error occurred:', error);
      setMessages(prev => prev.map(msg => msg.id === modelMessageId ? { ...msg, isLoading: false, text: "Üzr istəyirəm, xəta baş verdi. Zəhmət olmasa yenidən cəhd edin." } : msg));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseVoiceOverlay = () => {
    setIsVoiceOverlayOpen(false);
    setLiveVocalResponse(null);
    stopPlayback();
  };
  
  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    setScrollOffset(event.currentTarget.scrollTop);
  };

  const renderView = () => {
    switch (activeView) {
        case 'news': return <News />;
        case 'weather': return <Weather />;
        case 'translate': return <Translate />;
        case 'settings': return <Settings settings={settings} onSettingsChange={setSettings} />;
        case 'search':
        default:
            return (
                <div className="flex flex-col h-full bg-bg-jet/80 backdrop-blur-sm">
                    <main className="flex-grow overflow-y-auto" onScroll={handleScroll}>
                        {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <Logo isLarge={true} className="mb-4" />
                            <h1 className="text-4xl font-bold text-text-main">Bu gün sizə necə kömək edə bilərəm?</h1>
                        </div>
                        ) : (
                        <div>
                            {messages.map(msg => (
                            <MessageDisplay key={msg.id} message={msg} onRelatedQuery={(q) => handleSend(q)} onPlayAudio={handlePlayAudio} playingMessageId={playingMessageId} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        )}
                    </main>
                    <footer className="bg-transparent pt-2">
                        <SearchBar onSend={(q) => handleSend(q)} isLoading={isLoading} onVoiceClick={() => setIsVoiceOverlayOpen(true)} />
                        <p className="text-center text-xs text-text-sub pb-3">
                        NovEra səhv edə bilər. Vacib məlumatları yoxlamağınız tövsiyə olunur.
                        </p>
                    </footer>
                </div>
            )
    }
  };

  const ActiveAnimation = THEMES.find(t => t.id === settings.theme)?.animation;

  return (
    <div className={`flex h-screen bg-transparent text-text-main transition-opacity duration-500 ${isAppReady ? 'opacity-100' : 'opacity-0'}`}>
      {ActiveAnimation && <ActiveAnimation scrollOffset={scrollOffset} analyserNode={analyserRef.current} />}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col overflow-y-hidden">
        {renderView()}
      </div>
      <audio ref={audioRef} crossOrigin="anonymous" />
      <VoiceOverlay 
        isOpen={isVoiceOverlayOpen} 
        onClose={handleCloseVoiceOverlay}
        onQuery={(q, i) => handleSend(q, i, true)}
        liveResponse={liveVocalResponse}
        isResponding={isLoading && !!liveVocalResponse}
      />
    </div>
  );
};

export default App;
