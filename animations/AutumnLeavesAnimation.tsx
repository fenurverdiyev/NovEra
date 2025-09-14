import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface Firefly {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    baseAlpha: number;
    alpha: number;
    flickerSpeed: number;
}

export const AutumnLeavesAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const fireflies = React.useRef<Firefly[]>([]).current;
    const mousePos = React.useRef({ x: -999, y: -999 }).current;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (fireflies.length === 0) {
                const fireflyCount = Math.floor((canvas.width * canvas.height) / 20000);
                for (let i = 0; i < fireflyCount; i++) {
                    fireflies.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        size: Math.random() * 2 + 1,
                        baseAlpha: Math.random() * 0.5 + 0.2,
                        alpha: 0,
                        flickerSpeed: Math.random() * 0.05 + 0.02,
                    });
                }
            }
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        let animationFrameId: number;
        let frameCount = 0;

        const animate = () => {
            let audioLevel = 0;
            if (analyserNode) {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                audioLevel = sum / (dataArray.length * 255);
            }

            ctx.fillStyle = 'rgba(13, 15, 25, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            fireflies.forEach(fly => {
                fly.x += fly.vx;
                fly.y += fly.vy;

                // Flicker effect
                fly.alpha = fly.baseAlpha * (0.5 + Math.sin(frameCount * fly.flickerSpeed + fly.x) * 0.5);

                // Mouse interaction
                const dx = fly.x - mousePos.x;
                const dy = fly.y - mousePos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    fly.alpha = Math.min(1, fly.alpha + (1 - dist / 100) * 0.5);
                    fly.vx += (dx / dist) * 0.1;
                    fly.vy += (dy / dist) * 0.1;
                }

                // Audio interaction
                fly.alpha = Math.min(1, fly.alpha + audioLevel * 0.3);

                // Boundary check
                if (fly.x < 0 || fly.x > canvas.width) fly.vx *= -1;
                if (fly.y < 0 || fly.y > canvas.height) fly.vy *= -1;

                // Clamp velocity
                fly.vx = Math.max(-1, Math.min(1, fly.vx * 0.99));
                fly.vy = Math.max(-1, Math.min(1, fly.vy * 0.99));

                // Draw glow
                const glowRadius = fly.size * 5;
                const gradient = ctx.createRadialGradient(fly.x, fly.y, 0, fly.x, fly.y, glowRadius);
                gradient.addColorStop(0, `hsla(60, 100%, 70%, ${fly.alpha * 0.5})`);
                gradient.addColorStop(1, `hsla(60, 100%, 50%, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(fly.x, fly.y, glowRadius, 0, Math.PI * 2);
                ctx.fill();

                // Draw core
                ctx.fillStyle = `hsla(60, 100%, 90%, ${fly.alpha})`;
                ctx.beginPath();
                ctx.arc(fly.x, fly.y, fly.size, 0, Math.PI * 2);
                ctx.fill();
            });

            frameCount++;
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, fireflies, mousePos]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-[#0d0f19] to-[#1e3a1a]" />;
};
