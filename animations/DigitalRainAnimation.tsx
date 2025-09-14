import React, { useRef, useEffect } from 'react';
import type { ThemeAnimationProps } from './themes';

export const DigitalRainAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePos = useRef({ x: -100, y: -100 });

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

        const handleMouseMove = (event: MouseEvent) => {
            mousePos.current = { x: event.clientX, y: event.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        const columns = Math.floor(canvas.width / 20);
        const drops = Array.from({ length: columns }).fill(canvas.height);
        const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン01';

        const draw = (audioLevel: number) => {
            ctx.fillStyle = `rgba(13, 15, 25, ${0.1 - audioLevel * 0.05})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const baseColor = [52, 211, 153]; // emerald-400
            const audioColorShift = Math.floor(audioLevel * 100);
            
            ctx.font = '16pt monospace';

            for (let i = 0; i < drops.length; i++) {
                const x = i * 20;
                const y = drops[i] * 20;

                const distanceToMouse = Math.hypot(x - mousePos.current.x, y - mousePos.current.y);
                const brightness = Math.max(0, 1 - distanceToMouse / 200);

                const text = chars[Math.floor(Math.random() * chars.length)];

                // Leading character
                ctx.fillStyle = '#c7d2fe';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#c7d2fe';
                ctx.fillText(text, x, y);

                // Trail
                if (brightness > 0.1) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                } else {
                    const r = baseColor[0] + audioColorShift;
                    const g = baseColor[1] - audioColorShift;
                    const b = baseColor[2];
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
                }
                ctx.shadowBlur = 0;
                ctx.fillText(text, x, y - 20); 

                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const animate = () => {
            let audioLevel = 0;
            if (analyserNode) {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                audioLevel = dataArray.reduce((a, b) => a + b, 0) / (dataArray.length * 255);
            }

            draw(audioLevel);
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-[#0d0f19]" />;
};
