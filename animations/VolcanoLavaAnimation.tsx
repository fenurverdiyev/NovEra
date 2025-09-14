import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface LavaParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
}

export const VolcanoLavaAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const particles = React.useRef<LavaParticle[]>([]).current;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        let animationFrameId: number;

        const createParticle = (x: number, y: number, intensity: number) => {
            particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4 * intensity,
                vy: -Math.random() * 8 * intensity - 2,
                size: Math.random() * 6 + 2,
                life: 1,
                maxLife: Math.random() * 60 + 40,
            });
        };

        const animate = () => {
            let audioLevel = 0;
            if (analyserNode) {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                const sum = dataArray.slice(0, 32).reduce((a, b) => a + b, 0);
                audioLevel = sum / (32 * 255);
            }

            // Clear canvas with volcanic background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0d0f19');
            gradient.addColorStop(0.7, '#451a03');
            gradient.addColorStop(1, '#7c2d12');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Create new particles from bottom center
            const intensity = 1 + audioLevel * 3;
            if (Math.random() < 0.3 + audioLevel) {
                const baseX = canvas.width / 2;
                const baseY = canvas.height - 50;
                for (let i = 0; i < 3; i++) {
                    createParticle(
                        baseX + (Math.random() - 0.5) * 100,
                        baseY,
                        intensity
                    );
                }
            }

            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                
                // Update physics
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.2; // gravity
                particle.life--;

                // Remove dead particles
                if (particle.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                // Calculate alpha based on life
                const alpha = particle.life / particle.maxLife;
                const size = particle.size * alpha;

                // Draw particle with glow
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                
                // Inner core (bright)
                const coreGradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, size
                );
                coreGradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`);
                coreGradient.addColorStop(0.3, `rgba(255, 100, 0, ${alpha})`);
                coreGradient.addColorStop(1, `rgba(200, 0, 0, ${alpha * 0.5})`);
                
                ctx.fillStyle = coreGradient;
                ctx.fill();

                // Outer glow
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 50, 0, ${alpha * 0.2})`;
                ctx.fill();
            }

            // Keep particle count reasonable
            if (particles.length > 150) {
                particles.splice(0, particles.length - 150);
            }

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, particles]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};
