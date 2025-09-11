import React, { useEffect, useRef } from 'react';
import { ThemeAnimationProps } from './themes';

export const SpaceAnimation: React.FC<ThemeAnimationProps> = ({ scrollOffset = 0 }) => {
    const scrollRef = useRef(scrollOffset);

    useEffect(() => {
        scrollRef.current = scrollOffset;
    }, [scrollOffset]);

    useEffect(() => {
        const canvas = document.getElementById('theme-animation-canvas') as HTMLCanvasElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: any[] = [];
        let isIdle = false;
        let idleTimer: number;
        let constellationOpacity = 0;
        let mouse = { x: -100, y: -100 };

        const constellations = [
            { name: "Orion", points: [10, 25, 33, 42, 55, 61, 78] },
            { name: "Böyük Ayı", points: [80, 95, 101, 112, 120, 134, 145] },
            { name: "Kassiopeya", points: [150, 162, 175, 188, 200] }
        ];

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            const numStars = 300;
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    origY: Math.random() * canvas.height,
                    z: Math.random() * 0.7 + 0.3, // Depth: 0.3 (far) to 1 (near)
                    radius: Math.random() * 1.5,
                });
            }
        };

        const handleIdle = () => {
            clearTimeout(idleTimer);
            isIdle = false;
            constellationOpacity = Math.max(0, constellationOpacity - 0.05);
            idleTimer = window.setTimeout(() => {
                isIdle = true;
            }, 3000);
        };
        
        const handleMouseMove = (e: MouseEvent) => {
             mouse.x = e.clientX;
             mouse.y = e.clientY;
             handleIdle();
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (isIdle && constellationOpacity < 1) {
                constellationOpacity = Math.min(1, constellationOpacity + 0.01);
            }

            stars.forEach(star => {
                const speed = star.z * 0.1;
                star.x -= speed;
                
                // Parallax scroll effect
                star.y = (star.origY - scrollRef.current * star.z * 0.5) % canvas.height;
                if (star.y < 0) star.y += canvas.height;

                if (star.x < 0) star.x = canvas.width;
                
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius * star.z, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + star.z * 0.5})`;
                ctx.fill();
            });

            if (constellationOpacity > 0) {
                ctx.save();
                ctx.globalAlpha = constellationOpacity;
                constellations.forEach(con => {
                    const firstStar = stars[con.points[0]];
                    if (!firstStar) return;
                    
                    // Draw lines
                    ctx.beginPath();
                    ctx.moveTo(firstStar.x, firstStar.y);
                    con.points.slice(1).forEach(pointIndex => {
                        const star = stars[pointIndex];
                        if(star) ctx.lineTo(star.x, star.y);
                    });
                    ctx.strokeStyle = `rgba(88, 166, 255, 0.5)`;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Check for hover and draw name
                    let isHovering = false;
                    con.points.forEach(pointIndex => {
                        const star = stars[pointIndex];
                        if (star && Math.hypot(mouse.x - star.x, mouse.y - star.y) < 20) {
                            isHovering = true;
                        }
                    });

                    if (isHovering) {
                        ctx.fillStyle = "rgba(88, 166, 255, 1)";
                        ctx.font = "14px Inter, sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(con.name, firstStar.x, firstStar.y - 20);
                    }
                });
                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(animate);
        };
        
        const handleResize = () => setup();

        setup();
        handleIdle();
        animate();
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearTimeout(idleTimer);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, []);

    return null;
};
