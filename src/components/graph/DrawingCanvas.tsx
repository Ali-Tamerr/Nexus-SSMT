'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { DrawingTool, StrokeStyle } from '@/types/knowledge';

interface Point {
    x: number;
    y: number;
}

interface DrawnShape {
    id: string;
    type: DrawingTool;
    points: Point[];
    color: string;
    width: number;
    style: StrokeStyle;
}

interface Transform {
    x: number;
    y: number;
    k: number;
}

interface DrawingCanvasProps {
    activeTool: DrawingTool;
    width: number;
    height: number;
    strokeWidth: number;
    strokeColor: string;
    strokeStyle: StrokeStyle;
    transform: Transform;
}

export function DrawingCanvas({ activeTool, width, height, strokeWidth, strokeColor, strokeStyle, transform }: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const [shapes, setShapes] = useState<DrawnShape[]>([]);

    const isDrawingTool = ['pen', 'rectangle', 'diamond', 'circle', 'arrow', 'line'].includes(activeTool);

    const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        return {
            x: (screenX - transform.x) / transform.k,
            y: (screenY - transform.y) / transform.k,
        };
    }, [transform]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingTool) return;

        const point = getCanvasPoint(e);
        setIsDrawing(true);
        setStartPoint(point);

        if (activeTool === 'pen') {
            setCurrentPoints([point]);
        }
    }, [activeTool, isDrawingTool, getCanvasPoint]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint) return;

        const point = getCanvasPoint(e);

        if (activeTool === 'pen') {
            setCurrentPoints(prev => [...prev, point]);
        } else {
            setCurrentPoints([startPoint, point]);
        }
    }, [isDrawing, startPoint, activeTool, getCanvasPoint]);

    const handleMouseUp = useCallback(() => {
        if (!isDrawing || currentPoints.length === 0) {
            setIsDrawing(false);
            return;
        }

        const newShape: DrawnShape = {
            id: crypto.randomUUID(),
            type: activeTool,
            points: [...currentPoints],
            color: strokeColor,
            width: strokeWidth,
            style: strokeStyle,
        };

        setShapes(prev => [...prev, newShape]);
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoints([]);
    }, [isDrawing, currentPoints, activeTool, strokeColor, strokeWidth, strokeStyle]);

    const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: DrawnShape, isPreview = false) => {
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = 'transparent';
        ctx.lineWidth = shape.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isPreview) {
            ctx.setLineDash([5, 5]);
        } else {
            switch (shape.style) {
                case 'dashed':
                    ctx.setLineDash([10, 5]);
                    break;
                case 'dotted':
                    ctx.setLineDash([2, 4]);
                    break;
                default:
                    ctx.setLineDash([]);
            }
        }

        const points = shape.points;
        if (points.length < 2 && shape.type !== 'pen') return;

        ctx.beginPath();

        switch (shape.type) {
            case 'pen':
                if (points.length === 0) return;
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
                const headLen = 15;

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
                const halfWidth = Math.abs(points[1].x - points[0].x) / 2;
                const halfHeight = Math.abs(points[1].y - points[0].y) / 2;

                ctx.moveTo(midX, points[0].y);
                ctx.lineTo(points[1].x, midY);
                ctx.lineTo(midX, points[1].y);
                ctx.lineTo(points[0].x, midY);
                ctx.closePath();
                ctx.stroke();
                break;
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.k, transform.k);

        shapes.forEach(shape => {
            drawShape(ctx, shape);
        });

        if (isDrawing && currentPoints.length > 0) {
            const previewShape: DrawnShape = {
                id: 'preview',
                type: activeTool,
                points: currentPoints,
                color: strokeColor,
                width: strokeWidth,
                style: strokeStyle,
            };
            drawShape(ctx, previewShape, true);
        }

        ctx.restore();
    }, [shapes, isDrawing, currentPoints, activeTool, strokeColor, strokeWidth, strokeStyle, width, height, drawShape, transform.x, transform.y, transform.k]);

    useEffect(() => {
        if (activeTool === 'eraser') {
            setShapes([]);
        }
    }, [activeTool]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`absolute inset-0 z-10 ${isDrawingTool ? 'cursor-crosshair' : ''}`}
            style={{ pointerEvents: isDrawingTool ? 'auto' : 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
}
