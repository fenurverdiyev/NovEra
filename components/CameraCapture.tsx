import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface CapturedImage {
    dataUrl: string;
    timestamp: number;
    blob: Blob;
}

interface CameraCaptureProps {
    isActive: boolean;
    onImageCaptured?: (image: CapturedImage) => void;
    captureInterval?: number; // in milliseconds, default 3000 (3 seconds)
    onError?: (error: string) => void;
    className?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
    isActive,
    onImageCaptured,
    captureInterval = 3000,
    onError,
    className = ''
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsStreamActive(false);
    }, []);

    const captureImage = useCallback((): void => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas || !isStreamActive) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to data URL and blob
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
            canvas.toBlob((blob) => {
                if (blob && onImageCaptured) {
                    onImageCaptured({
                        dataUrl,
                        timestamp: Date.now(),
                        blob
                    });
                }
            }, 'image/jpeg', 0.8);
        } catch (error) {
            console.error('Error capturing image:', error);
        }
    }, [isStreamActive, onImageCaptured]);

    const startStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            streamRef.current = stream;
            setHasPermission(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsStreamActive(true);

                // Start automatic capture interval
                if (captureInterval > 0) {
                    intervalRef.current = setInterval(() => {
                        captureImage();
                    }, captureInterval);
                }
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasPermission(false);
            const errorMessage = error instanceof Error ? error.message : 'Kameraya giriş xətası';
            onError?.(errorMessage);
        }
    }, [captureInterval, captureImage, onError]);

    useEffect(() => {
        if (isActive && hasPermission !== false) {
            startStream();
        } else {
            stopStream();
        }

        return () => {
            stopStream();
        };
    }, [isActive, startStream, stopStream, hasPermission]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopStream();
        };
    }, [stopStream]);

    if (hasPermission === false) {
        return (
            <div className={`flex items-center justify-center bg-bg-onyx/50 rounded-lg p-4 ${className}`}>
                <div className="text-center">
                    <div className="text-red-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-text-sub text-sm">Kamera icazəsi tələb olunur</p>
                    <button 
                        onClick={() => {
                            setHasPermission(null);
                            startStream();
                        }}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                        Yenidən cəhd et
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-lg bg-bg-onyx"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect for user camera
            />
            <canvas
                ref={canvasRef}
                className="hidden"
            />
            
            {isStreamActive && (
                <div className="absolute top-2 right-2">
                    <div className="flex items-center space-x-1 bg-red-600/80 text-white px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                        <span>CANLI</span>
                    </div>
                </div>
            )}
            
            {!isStreamActive && hasPermission !== false && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-onyx/50 rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-text-sub text-sm">Kamera başladılır...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Hook for managing camera capture functionality
 */
export const useCameraCapture = () => {
    const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);

    const startCapturing = useCallback(() => {
        setIsCapturing(true);
        setCapturedImages([]);
    }, []);

    const stopCapturing = useCallback(() => {
        setIsCapturing(false);
    }, []);

    const handleImageCaptured = useCallback((image: CapturedImage) => {
        setCapturedImages(prev => [...prev, image]);
    }, []);

    const clearImages = useCallback(() => {
        setCapturedImages([]);
    }, []);

    const getImagesAsBase64 = useCallback(() => {
        return capturedImages.map(img => img.dataUrl);
    }, [capturedImages]);

    const getLatestImage = useCallback(() => {
        return capturedImages[capturedImages.length - 1] || null;
    }, [capturedImages]);

    return {
        capturedImages,
        isCapturing,
        startCapturing,
        stopCapturing,
        handleImageCaptured,
        clearImages,
        getImagesAsBase64,
        getLatestImage
    };
};
