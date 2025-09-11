import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, CameraIcon, CloseIcon, LoadingSpinner, RotateCameraIcon } from './Icons';

interface VoiceOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onQuery: (query: string, images?: string[]) => void;
    liveResponse: { id: string; text: string; } | null;
    isResponding: boolean;
}

type ConversationState = 'idle' | 'listening' | 'processing' | 'responding';
type FacingMode = 'user' | 'environment';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({ isOpen, onClose, onQuery, liveResponse, isResponding }) => {
    const [transcript, setTranscript] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState<FacingMode>('user');
    const [error, setError] = useState<string | null>(null);
    const [frameCaptured, setFrameCaptured] = useState(false);
    const [conversationState, setConversationState] = useState<ConversationState>('idle');

    const recognitionRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const capturedImagesRef = useRef<string[]>([]);
    const finalTranscriptRef = useRef<string>('');
    const shouldBeListeningRef = useRef(false);

    const isListening = conversationState === 'listening';

    useEffect(() => {
        if (liveResponse && conversationState !== 'responding') {
            setConversationState('responding');
        } else if (!liveResponse && conversationState === 'responding') {
            setConversationState('idle');
        }
    }, [liveResponse, conversationState]);

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const cleanup = () => {
        if (recognitionRef.current) {
            shouldBeListeningRef.current = false;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        stopCamera();
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

    const startCamera = async (mode: FacingMode) => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        setError(null);
      } catch (err) {
        console.error("Camera access or play failed:", err);
        setError("Kamera işə salına bilmədi. Zəhmət olmasa, icazələri yoxlayın.");
        stopCamera();
      }
    };
    
    const handleToggleListen = () => {
        const recognition = recognitionRef.current;
        if (!recognition) {
            setError("Səs tanıma mövcud deyil.");
            return;
        }
    
        if (isListening) {
            shouldBeListeningRef.current = false;
            recognition.stop();
            setConversationState('processing');
            const queryText = finalTranscriptRef.current.trim() || transcript.trim();
            if (queryText || capturedImagesRef.current.length > 0) {
                onQuery(queryText, capturedImagesRef.current);
            } else {
                setConversationState('idle');
            }
        } else {
            setTranscript('');
            finalTranscriptRef.current = '';
            capturedImagesRef.current = [];
            shouldBeListeningRef.current = true;
            try {
                if(isCameraActive) {
                  captureFrame();
                }
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
        if(isCameraActive) {
            stopCamera();
        } else {
            startCamera(facingMode);
        }
    };

    const handleFlipCamera = () => {
        if (!isCameraActive) return;
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);
        // Stop current stream before starting a new one
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        startCamera(newFacingMode);
    };

    const captureFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if(video && canvas && video.readyState >= 3) { // HAVE_FUTURE_DATA
            try {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                capturedImagesRef.current = [dataUrl];
                setFrameCaptured(true);
                setTimeout(() => setFrameCaptured(false), 500); // Visual feedback for 500ms
            } catch(e) {
                console.error("Could not capture frame:", e);
            }
        } else {
            console.warn("Could not capture frame, video not ready. State:", video?.readyState);
            setError("Kamera şəkli çəkilə bilmədi. Zəhmət olmasa yenidən cəhd edin.");
        }
    }

    const renderMainContent = () => {
        if (error) return <span className="text-red-400">{error}</span>;
        
        switch (conversationState) {
            case 'listening':
                return transcript || (isCameraActive ? 'Dinlənilir və qeydə alınır...' : 'Dinlənilir...');
            case 'processing':
                return <div className="flex justify-center items-center"><LoadingSpinner className="w-6 h-6" /></div>;
            case 'responding':
                return liveResponse?.text;
            case 'idle':
            default:
                return 'Danışmağa başlamaq üçün mikrofona klikləyin';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-bg-jet z-50 flex flex-col items-center justify-between p-8 text-white">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`absolute inset-0 w-full h-full object-cover z-0 transition-all duration-500 border-4 ${frameCaptured ? 'border-accent' : 'border-transparent'} ${isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            ></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            {isCameraActive && (
                <button
                    onClick={handleFlipCamera}
                    className="absolute top-6 right-6 z-30 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                    aria-label="Kameranı çevir"
                >
                    <RotateCameraIcon className="w-6 h-6 text-white" />
                </button>
            )}

            <div className={`absolute inset-0 bg-bg-jet z-10 transition-opacity duration-500 ${isCameraActive ? 'opacity-70' : 'opacity-100'}`}></div>

            <header className="relative z-20 text-center">
                <h1 className="text-6xl font-bold">NovEra</h1>
            </header>

            <main className="relative z-20 flex flex-col items-center justify-center flex-grow w-full">
                {!isCameraActive && conversationState !== 'processing' && <div className="w-48 h-48 bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 rounded-full orb-animation"></div>}
                <div className="w-full max-w-2xl min-h-[4rem] mt-12 bg-white/5 rounded-2xl p-4 text-center text-lg text-gray-300">
                    {renderMainContent()}
                </div>
            </main>
            
            <footer className="relative z-20 w-full max-w-md">
                <div className="flex justify-around items-center">
                    <button onClick={handleToggleListen} className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-500 recording-pulse' : 'bg-white/10 hover:bg-white/20'}`} aria-label={isListening ? 'Dayandır' : 'Başlat'}>
                        <MicrophoneIcon className="w-10 h-10 text-white" />
                    </button>
                    <button onClick={handleToggleCamera} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isCameraActive ? 'bg-accent text-bg-jet' : 'bg-white/10 hover:bg-white/20 text-white'}`} aria-label={isCameraActive ? 'Kameranı söndür' : 'Kameranı yandır'}>
                        <CameraIcon className="w-8 h-8" />
                    </button>
                    <button onClick={onClose} className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Bağla">
                        <CloseIcon className="w-8 h-8 text-white" />
                    </button>
                </div>
            </footer>
        </div>
    );
};