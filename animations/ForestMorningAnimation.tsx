import React from 'react';
import type { ThemeAnimationProps } from './themes';

export const ForestMorningAnimation: React.FC<ThemeAnimationProps> = ({ scrollOffset = 0 }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const mousePos = React.useRef({ x: window.innerWidth / 2, y: window.innerHeight / 4 });

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

        const handleMouseMove = (event: MouseEvent) => {
            mousePos.current = { x: event.clientX, y: event.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        const trees = [
            { depth: 0.9, color: '#1a2e1a', trees: Array.from({ length: 20 }, () => ({ x: Math.random(), y: Math.random() * 0.2 + 0.8 })) },
            { depth: 0.6, color: '#2b4d2b', trees: Array.from({ length: 20 }, () => ({ x: Math.random(), y: Math.random() * 0.2 + 0.8 })) },
            { depth: 0.3, color: '#3c6b3c', trees: Array.from({ length: 20 }, () => ({ x: Math.random(), y: Math.random() * 0.2 + 0.8 })) },
        ];

        let animationFrameId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Sky gradient
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, '#a6d8ff');
            skyGradient.addColorStop(0.7, '#ffffff');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Sun rays
            const sunX = mousePos.current.x;
            const sunY = mousePos.current.y;
            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 200, ${Math.random() * 0.05})`;
                ctx.moveTo(sunX, sunY);
                ctx.lineTo(Math.random() * canvas.width, canvas.height);
                ctx.stroke();
            }

            // Trees
            trees.forEach(layer => {
                ctx.fillStyle = layer.color;
                layer.trees.forEach(tree => {
                    const x = (tree.x * canvas.width + scrollOffset * layer.depth) % canvas.width;
                    const y = tree.y * canvas.height;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + 15, y - 60);
                    ctx.lineTo(x + 30, y);
                    ctx.closePath();
                    ctx.fill();
                });
            });

            // Fog
            const fogGradient = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
            fogGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            fogGradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
            ctx.fillStyle = fogGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [scrollOffset]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};
