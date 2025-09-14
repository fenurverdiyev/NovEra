import React, { useRef, useEffect } from 'react';
import type { ThemeAnimationProps } from './themes';

export const UnderwaterAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let bubbles: Bubble[] = [];
        let fish: Fish[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Bubble {
            x: number; y: number; vx: number; vy: number; size: number; opacity: number;
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = Math.random() * 2 - 1;
                this.vy = Math.random() * 2 - 1;
                this.size = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.5 + 0.5;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            }
            draw() {
                if (!ctx) return;
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class Fish {
            x: number; y: number; vx: number; vy: number; size: number; maxSpeed: number;
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = Math.random() * 2 - 1;
                this.vy = Math.random() * 2 - 1;
                this.size = Math.random() * 2 + 1;
                this.maxSpeed = 2;
            }
            update() {
                const dx = this.x - mousePos.current.x;
                const dy = this.y - mousePos.current.y;
                const distance = Math.hypot(dx, dy);
                if (distance < 100) {
                    const angle = Math.atan2(dy, dx);
                    this.vx += Math.cos(angle) * 0.5;
                    this.vy += Math.sin(angle) * 0.5;
                }
                const speed = Math.hypot(this.vx, this.vy);
                if (speed > this.maxSpeed) {
                    this.vx = (this.vx / speed) * this.maxSpeed;
                    this.vy = (this.vy / speed) * this.maxSpeed;
                }
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            }
            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Math.atan2(this.vy, this.vx));
                ctx.fillStyle = 'rgba(200, 220, 255, 0.6)';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-this.size * 3, this.size);
                ctx.lineTo(-this.size * 3, -this.size);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        const init = () => {
            bubbles = [];
            for (let i = 0; i < 50; i++) {
                bubbles.push(new Bubble());
            }
            fish = [];
            for (let i = 0; i < 30; i++) {
                fish.push(new Fish());
            }
        };

        const drawLightRays = (audioLevel: number) => {
            const rays = 5 + Math.floor(audioLevel * 10);
            ctx.fillStyle = 'rgba(0, 105, 148, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < rays; i++) {
                const y = canvas.height / rays * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            bubbles.forEach(bubble => {
                bubble.update();
                bubble.draw();
            });

            fish.forEach(f => {
                f.update();
                f.draw();
            });
        };

        const animate = () => {
            drawLightRays(0.5);
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current.x = e.clientX;
            mousePos.current.y = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);

        init();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};
