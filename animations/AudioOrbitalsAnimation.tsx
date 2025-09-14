import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface Orb {
    angle: number;
    radius: number;
    speed: number;
    size: number;
    color: string;
}

export const AudioOrbitalsAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const orbs = React.useRef<Orb[]>([]).current;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (orbs.length === 0) {
                const baseRadius = Math.min(canvas.width, canvas.height) / 4;
                for (let i = 0; i < 50; i++) {
                    orbs.push({
                        angle: Math.random() * Math.PI * 2,
                        radius: Math.random() * baseRadius + 50,
                        speed: (Math.random() - 0.5) * 0.02,
                        size: Math.random() * 3 + 1,
                        color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)` // Hues from Cyan to Blue to Magenta
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
                audioLevel = dataArray.reduce((a, b) => a + b, 0) / (dataArray.length * 255);
            }

            ctx.fillStyle = 'rgba(13, 15, 25, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            orbs.forEach(orb => {
                orb.angle += orb.speed + (audioLevel - 0.05) * orb.speed * 10;

                const currentRadius = orb.radius + audioLevel * 150;
                const x = centerX + Math.cos(orb.angle) * currentRadius;
                const y = centerY + Math.sin(orb.angle) * currentRadius;

                ctx.beginPath();
                ctx.arc(x, y, orb.size, 0, Math.PI * 2);
                ctx.fillStyle = orb.color;
                ctx.shadowColor = orb.color;
                ctx.shadowBlur = 10;
                ctx.fill();
            });
            ctx.shadowBlur = 0;

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, orbs]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-[#0d0f19]" />;
};
