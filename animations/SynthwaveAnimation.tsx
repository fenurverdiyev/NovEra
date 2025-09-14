import React, { useRef, useEffect } from 'react';
import type { ThemeAnimationProps } from './themes';

export const SynthwaveAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const step = 20;
        let gridSpeed = 0;
        const horizon = canvas.height * 0.7;

        const drawGrid = (audioLevel: number) => {
            ctx.save();
            ctx.strokeStyle = '#330033';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < canvas.height; i += step) {
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
            }
            for (let i = 0; i < canvas.width; i += step) {
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
            }
            ctx.stroke();
            ctx.restore();

            gridSpeed = (gridSpeed + 1 + audioLevel * 10) % step;
        };

        const drawMountains = (bassLevel: number) => {
            ctx.save();
            ctx.fillStyle = '#110022';
            ctx.beginPath();
            ctx.moveTo(0, horizon);

            const mountainCount = 5;
            for (let i = 0; i < mountainCount; i++) {
                const mountainWidth = canvas.width / (mountainCount - 2);
                const x = i * mountainWidth - mountainWidth / 2;
                const height = (50 + Math.sin(i * 2) * 20) * (1 + bassLevel * 2);
                ctx.lineTo(x + mountainWidth / 2, horizon - height);
                ctx.lineTo(x + mountainWidth, horizon);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };

        const drawSun = (audioLevel: number) => {
            const sunRadius = 80 + audioLevel * 200;
            const sunY = horizon - 20;
            ctx.save();
            ctx.fillStyle = '#FF9900';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, sunY, sunRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        };

        const animate = () => {
            let audioLevel = 0;
            let bassLevel = 0;
            if (analyserNode) {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                audioLevel = sum / (dataArray.length * 255);

                // Calculate bass level from the first few frequency bins
                const bassFrequencies = dataArray.slice(0, 8);
                const bassSum = bassFrequencies.reduce((a, b) => a + b, 0);
                bassLevel = bassSum / (bassFrequencies.length * 255);
            }

            ctx.fillStyle = '#190033';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawSun(audioLevel);
            drawMountains(bassLevel);
            drawGrid(audioLevel);

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};
