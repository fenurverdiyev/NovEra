import React from 'react';
import type { ThemeAnimationProps } from './themes';

// Particle interface
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
    color: string;
}

// Firefly interface
interface Firefly {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    baseAlpha: number;
    alpha: number;
}

export const CampfireAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const particles = React.useRef<Particle[]>([]).current;
    const fireflies = React.useRef<Firefly[]>([]).current;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            if (fireflies.length === 0) {
                for (let i = 0; i < 20; i++) {
                    fireflies.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        size: Math.random() * 2 + 1,
                        baseAlpha: Math.random() * 0.5 + 0.2,
                        alpha: 0,
                    });
                }
            }
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        let animationFrameId: number;
        let frameCount = 0;

        const createParticle = (x: number, y: number) => {
            const angle = Math.random() * Math.PI * 0.5 + Math.PI * 1.25; // Upward cone
            const speed = Math.random() * 5 + 2;
            const life = Math.random() * 60 + 60; // 1 to 2 seconds
            const size = Math.random() * 3 + 1;
            const color = `hsl(${Math.random() * 30 + 15}, 100%, ${50 + Math.random() * 20}%)`; // Oranges and yellows

            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: life,
                size,
                color,
            });
        };

        const animate = () => {
            let audioLevel = 0;
            if (analyserNode) {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                audioLevel = sum / (dataArray.length * 128); // Normalize to ~0-2 range
            }

            ctx.fillStyle = 'rgba(13, 15, 25, 0.25)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // --- Fireflies ---
            fireflies.forEach(fly => {
                fly.x += fly.vx;
                fly.y += fly.vy;

                fly.alpha = fly.baseAlpha * (0.5 + Math.sin(frameCount * 0.05 + fly.x) * 0.5);

                if (fly.x < 0 || fly.x > canvas.width) fly.vx *= -1;
                if (fly.y < 0 || fly.y > canvas.height) fly.vy *= -1;

                ctx.beginPath();
                ctx.arc(fly.x, fly.y, fly.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(176, 200, 83, ${fly.alpha})`; // Firefly green-yellow
                ctx.fill();
            });

            // --- Campfire Sparks ---
            const fireX = canvas.width / 2;
            const fireY = canvas.height;

            const particleCount = Math.floor(audioLevel * 5) + 1;
            for (let i = 0; i < particleCount; i++) {
                createParticle(fireX, fireY);
            }

            ctx.globalCompositeOperation = 'lighter';

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy -= 0.08; // Gravity/lift
                p.life--;
                p.size *= 0.98;

                if (p.life <= 0 || p.size < 0.5) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 60; // Fade out
                ctx.fill();
            }
            
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over';

            frameCount++;
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, particles, fireflies]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-[#0d0f19]" />;
};
