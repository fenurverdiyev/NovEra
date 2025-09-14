import React from 'react';
import type { ThemeAnimationProps } from './themes';

interface VineNode {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    angle: number;
    speed: number;
    branch: VineNode[];
}

export const NatureAnimation: React.FC<ThemeAnimationProps> = ({ analyserNode }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const vines = React.useRef<VineNode[]>([]).current;
    const mousePos = React.useRef({ x: -999, y: -999 }).current;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (vines.length === 0) {
                // Start vines from corners
                vines.push(createVine(0, 0, Math.PI / 4));
                vines.push(createVine(canvas.width, 0, (3 * Math.PI) / 4));
                vines.push(createVine(0, canvas.height, -Math.PI / 4));
                vines.push(createVine(canvas.width, canvas.height, (-3 * Math.PI) / 4));
            }
        };

        const createVine = (x: number, y: number, angle: number): VineNode => ({
            x, y, vx: 0, vy: 0, life: 100, angle, speed: Math.random() * 0.5 + 0.2, branch: []
        });

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        let animationFrameId: number;

        const drawVine = (node: VineNode, audioLevel: number, depth = 0) => {
            const dx = mousePos.x - node.x;
            const dy = mousePos.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Grow towards mouse
            const targetAngle = Math.atan2(dy, dx);
            node.angle += (targetAngle - node.angle) * 0.02;

            node.vx = Math.cos(node.angle) * node.speed * (1 + audioLevel * 2);
            node.vy = Math.sin(node.angle) * node.speed * (1 + audioLevel * 2);

            const nextX = node.x + node.vx;
            const nextY = node.y + node.vy;

            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(nextX, nextY);
            ctx.strokeStyle = `hsl(145, 63%, ${40 + audioLevel * 20}%)`;
            ctx.lineWidth = Math.max(1, 5 - depth * 0.5);
            ctx.stroke();

            node.x = nextX;
            node.y = nextY;

            // Branching logic
            if (node.branch.length < 5 && Math.random() < 0.01) {
                node.branch.push(createVine(node.x, node.y, node.angle + (Math.random() - 0.5) * Math.PI / 2));
            }

            // Draw branches
            node.branch.forEach(branch => drawVine(branch, audioLevel, depth + 1));

            // Reset if out of bounds
            if (node.x < -50 || node.x > canvas.width + 50 || node.y < -50 || node.y > canvas.height + 50) {
                Object.assign(node, createVine(canvas.width / 2, canvas.height / 2, Math.random() * Math.PI * 2));
            }
        };

        const animate = () => {
            let audioLevel = 0;
            if (analyserNode) {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                audioLevel = sum / (dataArray.length * 255);
            }

            ctx.fillStyle = 'rgba(13, 15, 25, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.lineCap = 'round';

            vines.forEach(vine => drawVine(vine, audioLevel));

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [analyserNode, vines, mousePos]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-[#0d0f19] to-[#1a3a1a]" />;
};
