import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface Star {
    x: number;
    y: number;
    z: number;
}

export const RainyWindowAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const stars = React.useRef<Star[]>([]).current;
    const mousePos = React.useRef({ x: 0, y: 0 }).current;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (stars.length === 0) {
                for (let i = 0; i < 800; i++) {
                    stars.push({
                        x: (Math.random() - 0.5) * canvas.width * 2,
                        y: (Math.random() - 0.5) * canvas.height * 2,
                        z: Math.random() * canvas.width,
                    });
                }
            }
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.x = e.clientX - canvas.width / 2;
            mousePos.y = e.clientY - canvas.height / 2;
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

            const speed = 2 + audioLevel * 15;

            ctx.fillStyle = 'rgba(13, 15, 25, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);

            stars.forEach(star => {
                star.z -= speed;
                if (star.z <= 0) {
                    star.x = (Math.random() - 0.5) * canvas.width * 2;
                    star.y = (Math.random() - 0.5) * canvas.height * 2;
                    star.z = canvas.width;
                }

                const k = 128 / star.z;
                const px = star.x * k - mousePos.x * 0.1;
                const py = star.y * k - mousePos.y * 0.1;

                const size = (1 - star.z / canvas.width) * 5;
                const shade = (1 - star.z / canvas.width) * 255;

                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + (star.x * k * speed * 0.05), py + (star.y * k * speed * 0.05));
                ctx.lineWidth = size;
                ctx.strokeStyle = `rgb(${shade}, ${shade}, 255)`;
                ctx.stroke();
            });

            ctx.restore();
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, stars, mousePos]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-[#0d0f19]" />;
};
