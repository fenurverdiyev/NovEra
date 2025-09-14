import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface Ring {
    z: number;
    hue: number;
}

export const DigitalTunnelAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const rings = React.useRef<Ring[]>([]).current;
    const mousePos = React.useRef({ x: 0, y: 0 }).current;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (rings.length === 0) {
                for (let i = 0; i < 50; i++) {
                    rings.push({ z: i * 20, hue: i * 5 });
                }
            }
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.x = (e.clientX - canvas.width / 2) * 0.2;
            mousePos.y = (e.clientY - canvas.height / 2) * 0.2;
        };
        window.addEventListener('mousemove', handleMouseMove);

        let animationFrameId: number;
        let frameCount = 0;

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
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);

            rings.forEach(ring => {
                ring.z -= 5;
                ring.hue += 0.5;
                if (ring.z < -10) {
                    ring.z = 1000;
                }

                const k = 128 / ring.z;
                const radius = k * (100 + audioLevel * 500);

                const x = Math.sin(frameCount * 0.01) * mousePos.x;
                const y = Math.cos(frameCount * 0.01) * mousePos.y;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${ring.hue}, 100%, 70%, ${0.5 + (1 - ring.z / 1000) * 0.5})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            ctx.restore();
            frameCount++;
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, rings, mousePos]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-[#0d0f19]" />;
};
