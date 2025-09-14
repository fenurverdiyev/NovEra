import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface Crystal {
    x: number;
    y: number;
    size: number;
    angle: number;
    sides: number;
    baseAlpha: number;
}

export const CrystalCaveAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const crystals = React.useRef<Crystal[]>([]).current;
    const mousePos = React.useRef({ x: -999, y: -999 }).current;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (crystals.length === 0) {
                for (let i = 0; i < 30; i++) {
                    crystals.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        size: Math.random() * 40 + 20,
                        angle: Math.random() * Math.PI * 2,
                        sides: Math.floor(Math.random() * 3) + 4, // 4, 5, or 6 sides
                        baseAlpha: Math.random() * 0.1 + 0.05,
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

        const drawCrystal = (crystal: Crystal, audioPulse: number, mouseDistanceFactor: number) => {
            const { x, y, size, angle, sides, baseAlpha } = crystal;
            const alpha = baseAlpha + audioPulse * 0.5 + (1 - mouseDistanceFactor) * 0.3;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const a = (i / sides) * Math.PI * 2;
                const sx = Math.cos(a) * size;
                const sy = Math.sin(a) * size;
                i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            }
            ctx.closePath();

            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            gradient.addColorStop(0, `hsla(260, 100%, 80%, ${alpha * 0.8})`);
            gradient.addColorStop(1, `hsla(260, 100%, 50%, ${alpha * 0.2})`);

            ctx.fillStyle = gradient;
            ctx.strokeStyle = `hsla(260, 100%, 90%, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fill();

            ctx.restore();
        };

        const animate = () => {
            let audioLevel = 0;
            if (analyserNode) {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                const sum = dataArray.slice(0, 16).reduce((a, b) => a + b, 0); // Bass frequencies
                audioLevel = sum / (16 * 255);
            }

            ctx.fillStyle = 'rgba(13, 15, 25, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            crystals.forEach(crystal => {
                const dx = crystal.x - mousePos.x;
                const dy = crystal.y - mousePos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const distFactor = Math.min(dist / 300, 1); // Factor is 0 when close, 1 when far
                drawCrystal(crystal, audioLevel, distFactor);
            });

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, crystals, mousePos]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-[#1e1b4b] to-[#0d0f19]" />;
};
