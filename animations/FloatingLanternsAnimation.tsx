import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
}

export const ParticlePlexusAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const particles = React.useRef<Particle[]>([]).current;
    const mousePos = React.useRef({ x: -999, y: -999 }).current;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (particles.length === 0) {
                const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
                for (let i = 0; i < particleCount; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        size: Math.random() * 1.5 + 1,
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

        const animate = () => {
            let audioLevel = 0;
            if (analyserNode) {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                audioLevel = sum / (dataArray.length * 255);
            }

            ctx.fillStyle = 'rgba(13, 15, 25, 0.25)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const allNodes = [...particles, { ...mousePos, size: 0 }];

            for (let i = 0; i < allNodes.length; i++) {
                const p1 = allNodes[i];

                // Update particle position
                if (i < particles.length) {
                    p1.x += p1.vx;
                    p1.y += p1.vy;
                    if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
                    if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(90, 166, 255, ${0.5 + audioLevel * 0.5})`;
                ctx.fill();

                // Draw lines to other particles
                for (let j = i + 1; j < allNodes.length; j++) {
                    const p2 = allNodes[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const connectDistance = j === particles.length ? 200 : 120; // Larger distance for mouse

                    if (dist < connectDistance) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        const alpha = 1 - dist / connectDistance;
                        ctx.strokeStyle = `rgba(90, 166, 255, ${alpha * (0.3 + audioLevel * 0.5)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, particles, mousePos]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-[#0d0f19] to-[#1a1a3a]" />;
};
