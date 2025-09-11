import React, { useEffect } from 'react';
import { ThemeAnimationProps } from './themes';

export const NatureAnimation: React.FC<ThemeAnimationProps> = () => {

    useEffect(() => {
        const canvas = document.getElementById('theme-animation-canvas') as HTMLCanvasElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let mouse = { x: -999, y: -999, radius: 80 };
        const vines: any[] = [];

        class Vine {
            points: { x: number; y: number; vx: number; vy: number; origX: number; origY: number; }[];
            isGrowing: boolean;
            growthSpeed: number;
            maxPoints: number;
            startX: number;
            side: 'left' | 'right';
            color: string;
            
            constructor(side: 'left' | 'right') {
                this.side = side;
                this.startX = this.side === 'left' ? 20 : canvas.width - 20;
                this.points = [{ x: this.startX, y: 0, vx: 0, vy: 0, origX: this.startX, origY: 0 }];
                this.isGrowing = true;
                this.growthSpeed = Math.random() * 0.5 + 0.3;
                this.maxPoints = 150;
                this.color = `rgba(110, 231, 183, ${Math.random() * 0.3 + 0.4})`;
            }

            update() {
                // Grow
                if (this.isGrowing && this.points.length < this.maxPoints) {
                    const lastPoint = this.points[this.points.length - 1];
                    if (lastPoint.y > canvas.height + 20) {
                        this.isGrowing = false;
                    } else {
                        const newY = lastPoint.y + this.growthSpeed * 5;
                        const newX = this.startX + Math.sin(newY * 0.02) * 20 * (Math.sin(newY * 0.005) + 0.5);
                        this.points.push({ x: newX, y: newY, vx: 0, vy: 0, origX: newX, origY: newY });
                    }
                }

                // Update points based on mouse and physics
                this.points.forEach(p => {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Mouse repulsion
                    if (dist < mouse.radius) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        p.vx += (dx / dist) * force * 0.5;
                        p.vy += (dy / dist) * force * 0.5;
                    }

                    // Spring back to original position
                    p.vx += (p.origX - p.x) * 0.01;
                    p.vy += (p.origY - p.y) * 0.01;

                    // Apply velocity and damping
                    p.vx *= 0.95;
                    p.vy *= 0.95;
                    p.x += p.vx;
                    p.y += p.vy;
                });
            }

            draw() {
                if (this.points.length < 2) return;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.points[0].x, this.points[0].y);
                for (let i = 1; i < this.points.length - 1; i++) {
                    const xc = (this.points[i].x + this.points[i + 1].x) / 2;
                    const yc = (this.points[i].y + this.points[i + 1].y) / 2;
                    ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
                }
                ctx.stroke();
            }
        }

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            vines.length = 0;
            vines.push(new Vine('left'));
            vines.push(new Vine('right'));
             if (canvas.width > 800) {
                vines.push(new Vine('left'));
                vines.push(new Vine('right'));
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            vines.forEach(vine => {
                vine.update();
                vine.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        
        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleResize = () => setup();

        setup();
        animate();
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, []);

    return null;
};
