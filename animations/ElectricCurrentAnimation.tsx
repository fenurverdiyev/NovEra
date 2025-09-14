import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface Lightning {
    points: { x: number; y: number }[];
    life: number;
    maxLife: number;
    intensity: number;
}

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
}

export const ElectricCurrentAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const lightnings = React.useRef<Lightning[]>([]).current;
    const sparks = React.useRef<Spark[]>([]).current;

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

        const createLightning = (startX: number, startY: number, endX: number, endY: number, intensity: number) => {
            const points = [];
            const segments = 20;
            
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 50 * intensity;
                const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 30 * intensity;
                points.push({ x, y });
            }

            lightnings.push({
                points,
                life: 15,
                maxLife: 15,
                intensity,
            });
        };

        const createSpark = (x: number, y: number) => {
            sparks.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
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

            // Clear canvas with electric background
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
            );
            gradient.addColorStop(0, '#0d0f19');
            gradient.addColorStop(0.5, '#1e1b4b');
            gradient.addColorStop(1, '#0d0f19');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Create new lightning based on audio
            if (Math.random() < audioLevel * 0.8) {
                const startX = Math.random() * canvas.width;
                const startY = Math.random() * canvas.height * 0.3;
                const endX = Math.random() * canvas.width;
                const endY = canvas.height * 0.7 + Math.random() * canvas.height * 0.3;
                createLightning(startX, startY, endX, endY, 1 + audioLevel * 2);
            }

            // Update and draw lightning
            for (let i = lightnings.length - 1; i >= 0; i--) {
                const lightning = lightnings[i];
                lightning.life--;

                if (lightning.life <= 0) {
                    lightnings.splice(i, 1);
                    continue;
                }

                const alpha = lightning.life / lightning.maxLife;
                
                // Draw main lightning bolt
                ctx.beginPath();
                ctx.moveTo(lightning.points[0].x, lightning.points[0].y);
                for (let j = 1; j < lightning.points.length; j++) {
                    ctx.lineTo(lightning.points[j].x, lightning.points[j].y);
                }
                
                ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
                ctx.lineWidth = 3 * lightning.intensity;
                ctx.stroke();

                // Draw glow
                ctx.beginPath();
                ctx.moveTo(lightning.points[0].x, lightning.points[0].y);
                for (let j = 1; j < lightning.points.length; j++) {
                    ctx.lineTo(lightning.points[j].x, lightning.points[j].y);
                }
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Create sparks at random points
                if (Math.random() < 0.3) {
                    const randomPoint = lightning.points[Math.floor(Math.random() * lightning.points.length)];
                    createSpark(randomPoint.x, randomPoint.y);
                }
            }

            // Update and draw sparks
            for (let i = sparks.length - 1; i >= 0; i--) {
                const spark = sparks[i];
                
                spark.x += spark.vx;
                spark.y += spark.vy;
                spark.vx *= 0.98;
                spark.vy *= 0.98;
                spark.life--;

                if (spark.life <= 0) {
                    sparks.splice(i, 1);
                    continue;
                }

                const alpha = spark.life / spark.maxLife;
                
                ctx.beginPath();
                ctx.arc(spark.x, spark.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
                ctx.fill();
            }

            // Keep arrays reasonable size
            if (lightnings.length > 10) {
                lightnings.splice(0, lightnings.length - 10);
            }
            if (sparks.length > 100) {
                sparks.splice(0, sparks.length - 100);
            }

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, lightnings, sparks]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};
