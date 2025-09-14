import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface Wave {
    x: number;
    y: number;
    amplitude: number;
    frequency: number;
    phase: number;
}

export const OceanWavesAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const waves = React.useRef<Wave[]>([]).current;
    const time = React.useRef(0);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (waves.length === 0) {
                for (let i = 0; i < 5; i++) {
                    waves.push({
                        x: 0,
                        y: canvas.height * 0.6 + i * 40,
                        amplitude: 30 + i * 10,
                        frequency: 0.01 + i * 0.005,
                        phase: i * Math.PI / 3,
                    });
                }
            }
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        let animationFrameId: number;

        const animate = () => {
            let audioLevel = 0;
            if (analyserNode) {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                const sum = dataArray.slice(0, 32).reduce((a, b) => a + b, 0);
                audioLevel = sum / (32 * 255);
            }

            // Clear canvas with gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0d0f19');
            gradient.addColorStop(0.6, '#1a2332');
            gradient.addColorStop(1, '#0ea5e9');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            time.current += 0.02;

            waves.forEach((wave, index) => {
                ctx.beginPath();
                ctx.moveTo(0, wave.y);

                for (let x = 0; x <= canvas.width; x += 5) {
                    const waveHeight = Math.sin(x * wave.frequency + time.current + wave.phase) * 
                                     (wave.amplitude + audioLevel * 50);
                    const y = wave.y + waveHeight;
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.closePath();

                const alpha = 0.3 - index * 0.05;
                ctx.fillStyle = `rgba(14, 165, 233, ${alpha + audioLevel * 0.2})`;
                ctx.fill();

                // Add wave outline
                ctx.beginPath();
                ctx.moveTo(0, wave.y);
                for (let x = 0; x <= canvas.width; x += 5) {
                    const waveHeight = Math.sin(x * wave.frequency + time.current + wave.phase) * 
                                     (wave.amplitude + audioLevel * 50);
                    const y = wave.y + waveHeight;
                    ctx.lineTo(x, y);
                }
                ctx.strokeStyle = `rgba(14, 165, 233, ${0.6 + audioLevel * 0.4})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, waves, time]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};
