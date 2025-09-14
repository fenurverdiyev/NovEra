import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface Snowflake {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
}

export const SnowStormAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const snowflakes = React.useRef<Snowflake[]>([]).current;
    const wind = React.useRef(0);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (snowflakes.length === 0) {
                for (let i = 0; i < 200; i++) {
                    snowflakes.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        vx: (Math.random() - 0.5) * 2,
                        vy: Math.random() * 2 + 1,
                        size: Math.random() * 3 + 1,
                        opacity: Math.random() * 0.8 + 0.2,
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

            // Clear canvas with dark winter background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0d0f19');
            gradient.addColorStop(0.5, '#1e293b');
            gradient.addColorStop(1, '#334155');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update wind based on audio
            wind.current = Math.sin(Date.now() * 0.001) * 2 + audioLevel * 5;

            snowflakes.forEach(flake => {
                // Update position
                flake.x += flake.vx + wind.current;
                flake.y += flake.vy + audioLevel * 3;

                // Reset if out of bounds
                if (flake.x > canvas.width + 10) flake.x = -10;
                if (flake.x < -10) flake.x = canvas.width + 10;
                if (flake.y > canvas.height + 10) {
                    flake.y = -10;
                    flake.x = Math.random() * canvas.width;
                }

                // Draw snowflake
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(226, 232, 240, ${flake.opacity + audioLevel * 0.3})`;
                ctx.fill();

                // Add glow effect
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(226, 232, 240, ${(flake.opacity + audioLevel * 0.3) * 0.1})`;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, snowflakes, wind]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};
