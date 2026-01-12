'use client';

import { DrawingTool, StrokeStyle } from '@/types/knowledge';

export interface DrawnShape {
    id: string;
    type: DrawingTool;
    points: { x: number; y: number }[];
    color: string;
    width: number;
    style: StrokeStyle;
}

export function drawShapeOnContext(
    ctx: CanvasRenderingContext2D, 
    shape: DrawnShape, 
    globalScale: number,
    isPreview = false
) {
    ctx.save();
    
    if (isPreview) {
        ctx.globalAlpha = 0.3;
    }
    
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = 'transparent';
    ctx.lineWidth = shape.width / globalScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (shape.style) {
        case 'dashed':
            ctx.setLineDash([10 / globalScale, 5 / globalScale]);
            break;
        case 'dotted':
            ctx.setLineDash([2 / globalScale, 4 / globalScale]);
            break;
        default:
            ctx.setLineDash([]);
    }

    const points = shape.points;
    if (points.length < 2 && shape.type !== 'pen') {
        ctx.restore();
        return;
    }

    ctx.beginPath();

    switch (shape.type) {
        case 'pen':
            if (points.length === 0) break;
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
            break;

        case 'line':
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.stroke();
            break;

        case 'arrow':
            const [start, end] = [points[0], points[1]];
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const headLen = 15 / globalScale;

            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
                end.x - headLen * Math.cos(angle - Math.PI / 6),
                end.y - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
                end.x - headLen * Math.cos(angle + Math.PI / 6),
                end.y - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
            break;

        case 'rectangle':
            const rectWidth = points[1].x - points[0].x;
            const rectHeight = points[1].y - points[0].y;
            ctx.strokeRect(points[0].x, points[0].y, rectWidth, rectHeight);
            break;

        case 'circle':
            const radiusX = Math.abs(points[1].x - points[0].x) / 2;
            const radiusY = Math.abs(points[1].y - points[0].y) / 2;
            const centerX = points[0].x + (points[1].x - points[0].x) / 2;
            const centerY = points[0].y + (points[1].y - points[0].y) / 2;
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();
            break;

        case 'diamond':
            const midX = (points[0].x + points[1].x) / 2;
            const midY = (points[0].y + points[1].y) / 2;

            ctx.moveTo(midX, points[0].y);
            ctx.lineTo(points[1].x, midY);
            ctx.lineTo(midX, points[1].y);
            ctx.lineTo(points[0].x, midY);
            ctx.closePath();
            ctx.stroke();
            break;
    }

    ctx.restore();
}
