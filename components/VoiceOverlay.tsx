import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, CameraIcon, CloseIcon, LoadingSpinner, RotateCameraIcon } from './Icons';
import { CameraCapture, useCameraCapture } from './CameraCapture';

interface VoiceOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onQuery: (query: string, images?: string[]) => void;
    liveResponse: { id: string; text: string; } | null;
    isResponding: boolean;
}

type ConversationState = 'idle' | 'listening' | 'processing' | 'responding';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({ isOpen, onClose, onQuery, liveResponse, isResponding }) => {
    const [transcript, setTranscript] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationState, setConversationState] = useState<ConversationState>('idle');

    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>('');
    const shouldBeListeningRef = useRef(false);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const {
        capturedImages,
        isCapturing,
        startCapturing,
        stopCapturing,
        handleImageCaptured,
        clearImages,
        getImagesAsBase64
    } = useCameraCapture();

    const isListening = conversationState === 'listening';

    useEffect(() => {
        if (liveResponse && conversationState !== 'responding') {
            setConversationState('responding');
        } else if (!liveResponse && conversationState === 'responding') {
            setConversationState('idle');
        }
    }, [liveResponse, conversationState]);

    const cleanup = () => {
        if (recognitionRef.current) {
            shouldBeListeningRef.current = false;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        
        if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
            captureIntervalRef.current = null;
        }
        
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        
        stopCapturing();
        clearImages();
        setIsCameraActive(false);
        setTranscript('');
        finalTranscriptRef.current = '';
        setError(null);
        setConversationState('idle');
    };
    
    useEffect(() => {
        if (!isOpen) {
            cleanup();
            return;
        }

        if (!SpeechRecognition) {
            setError('Səs tanıma bu brauzerdə dəstəklənmir.');
            return;
        }

        try {
            if (!recognitionRef.current) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'az-AZ';

                recognition.onresult = (event: any) => {
                    let final_transcript = '';
                    let interim_transcript = '';

                    for (let i = 0; i < event.results.length; i++) {
                        const transcript_part = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            final_transcript += transcript_part + ' ';
                        } else {
                            interim_transcript += transcript_part;
                        }
                    }

                    finalTranscriptRef.current = final_transcript;
                    setTranscript(final_transcript + interim_transcript);

                    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                    if (event.results[event.results.length - 1].isFinal) {
                        silenceTimerRef.current = setTimeout(() => {
                            console.log("Silence detected, submitting query.");
                            handleToggleListen(); // This will now act as the 'stop' action
                        }, 1200); // Submit after 1.2s of silence
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                     if (event.error !== 'no-speech' && event.error !== 'aborted') {
                        setError(`Səs tanıma xətası: ${event.error}`);
                        shouldBeListeningRef.current = false;
                        setConversationState('idle');
                    }
                };
                
                recognition.onstart = () => {
                    setConversationState('listening');
                };
                
                recognition.onend = () => {
                    if (shouldBeListeningRef.current) {
                        console.log("Recognition ended unexpectedly, restarting...");
                        setTimeout(() => recognitionRef.current?.start(), 100);
                    } else {
                        setConversationState('idle');
                    }
                };

                recognitionRef.current = recognition;
            }
        } catch (err) {
            console.error("Failed to create SpeechRecognition instance:", err);
            setError("Səs tanıma xidmətini başlatmaq mümkün olmadı.");
        }

        return cleanup;
    }, [isOpen]);
    
    const handleToggleListen = () => {
        const recognition = recognitionRef.current;
        if (!recognition) {
            setError("Səs tanıma mövcud deyil.");
            return;
        }
    
        if (isListening) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            shouldBeListeningRef.current = false;
            recognition.stop();
            
            // Stop camera capturing
            if (isCameraActive) {
                stopCapturing();
            }
            
            setConversationState('processing');
            const queryText = finalTranscriptRef.current.trim() || transcript.trim();
            const images = isCameraActive ? getImagesAsBase64() : [];
            
            if (queryText || images.length > 0) {
                onQuery(queryText, images);
            } else {
                setConversationState('idle');
            }
        } else {
            setTranscript('');
            finalTranscriptRef.current = '';
            clearImages();
            shouldBeListeningRef.current = true;
            
            // Start camera capturing if camera is active
            if (isCameraActive) {
                startCapturing();
            }
            
            try {
                recognition.start();
            } catch (e: any) {
                console.error("Could not start recognition:", e);
                 if (e.name !== 'InvalidStateError') {
                  setError("Səs tanıma başladılmadı.");
                  shouldBeListeningRef.current = false;
                  setConversationState('idle');
                }
            }
        }
    };

    const handleToggleCamera = () => {
        setIsCameraActive(!isCameraActive);
        if (isCameraActive) {
            stopCapturing();
            clearImages();
        }
    };

    const handleCameraError = (errorMessage: string) => {
        setError(errorMessage);
        setIsCameraActive(false);
    };

    const renderMainContent = () => {
        if (error) return <span className="text-red-400">{error}</span>;
        
        switch (conversationState) {
            case 'listening':
                const baseText = transcript || 'Dinlənilir...';
                const cameraInfo = isCameraActive ? ` (${capturedImages.length} şəkil çəkildi)` : '';
                return baseText + cameraInfo;
            case 'processing':
                return <div className="flex justify-center items-center"><LoadingSpinner className="w-6 h-6" /></div>;
            case 'responding':
                return liveResponse?.text;
            case 'idle':
            default:
                return isCameraActive 
                    ? 'Kamera aktiv. Danışmağa başlamaq üçün mikrofona klikləyin'
                    : 'Danışmağa başlamaq üçün mikrofona klikləyin';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-bg-jet z-50 flex flex-col items-center justify-between p-8 text-white">
            {/* Camera Component */}
            {isCameraActive && (
                <CameraCapture
                    isActive={isCapturing}
                    onImageCaptured={handleImageCaptured}
                    captureInterval={3000}
                    onError={handleCameraError}
                    className="absolute inset-0 w-full h-full z-0"
                />
            )}
            
            {/* Overlay for better text visibility */}
            <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${
                isCameraActive ? 'bg-bg-jet/70' : 'bg-bg-jet'
            }`}></div>

            <header className="relative z-20 text-center">
                <h1 className="text-6xl font-bold">NovEra</h1>
            </header>

            <main className="relative z-20 flex flex-col items-center justify-center flex-grow w-full">
                {!isCameraActive && conversationState !== 'processing' && (
                    <div className="w-48 h-48 bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 rounded-full orb-animation"></div>
                )}
                
                <div className="w-full max-w-2xl min-h-[4rem] mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center text-lg text-gray-300 border border-white/20">
                    {renderMainContent()}
                </div>
                
                {/* Camera status indicator */}
                {isCameraActive && (
                    <div className="mt-4 flex items-center space-x-2 text-sm text-blue-400">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>
                            Kamera aktiv - {capturedImages.length} şəkil çəkildi
                            {isCapturing && ' (Çəkiliş davam edir...)'}
                        </span>
                    </div>
                )}
            </main>
            
            <footer className="relative z-20 w-full max-w-md">
                <div className="flex justify-around items-center">
                    <button 
                        onClick={handleToggleListen} 
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                            isListening ? 'bg-red-500 recording-pulse' : 'bg-white/10 hover:bg-white/20'
                        }`} 
                        aria-label={isListening ? 'Dayandır' : 'Başlat'}
                    >
                        <MicrophoneIcon className="w-10 h-10 text-white" />
                    </button>
                    
                    <button 
                        onClick={handleToggleCamera} 
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                            isCameraActive ? 'bg-accent text-bg-jet' : 'bg-white/10 hover:bg-white/20 text-white'
                        }`} 
                        aria-label={isCameraActive ? 'Kameranı söndür' : 'Kameranı yandır'}
                    >
                        <CameraIcon className="w-8 h-8" />
                    </button>
                    
                    <button 
                        onClick={onClose} 
                        className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" 
                        aria-label="Bağla"
                    >
                        <CloseIcon className="w-8 h-8 text-white" />
                    </button>
                </div>
            </footer>
        </div>
    );
};