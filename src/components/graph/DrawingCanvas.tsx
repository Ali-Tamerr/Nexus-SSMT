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

    const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
        return {
            x: (screenX - transform.x) / transform.k,
            y: (screenY - transform.y) / transform.k,
        };
    }, [transform.x, transform.y, transform.k]);

    const worldToScreen = useCallback((worldX: number, worldY: number): Point => {
        return {
            x: worldX * transform.k + transform.x,
            y: worldY * transform.k + transform.y,
        };
    }, [transform.x, transform.y, transform.k]);

    const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        return screenToWorld(screenX, screenY);
    }, [screenToWorld]);

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

    const drawShapeOnCanvas = useCallback((ctx: CanvasRenderingContext2D, shape: DrawnShape, isPreview = false) => {
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = 'transparent';
        ctx.lineWidth = shape.width * transform.k;
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

        const screenPoints = shape.points.map(p => worldToScreen(p.x, p.y));
        if (screenPoints.length < 2 && shape.type !== 'pen') return;

        ctx.beginPath();

        switch (shape.type) {
            case 'pen':
                if (screenPoints.length === 0) return;
                ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
                for (let i = 1; i < screenPoints.length; i++) {
                    ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
                }
                ctx.stroke();
                break;

            case 'line':
                ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
                ctx.lineTo(screenPoints[1].x, screenPoints[1].y);
                ctx.stroke();
                break;

            case 'arrow':
                const [start, end] = [screenPoints[0], screenPoints[1]];
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                const headLen = 15 * transform.k;

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
                const rectWidth = screenPoints[1].x - screenPoints[0].x;
                const rectHeight = screenPoints[1].y - screenPoints[0].y;
                ctx.strokeRect(screenPoints[0].x, screenPoints[0].y, rectWidth, rectHeight);
                break;

            case 'circle':
                const radiusX = Math.abs(screenPoints[1].x - screenPoints[0].x) / 2;
                const radiusY = Math.abs(screenPoints[1].y - screenPoints[0].y) / 2;
                const centerX = screenPoints[0].x + (screenPoints[1].x - screenPoints[0].x) / 2;
                const centerY = screenPoints[0].y + (screenPoints[1].y - screenPoints[0].y) / 2;
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                ctx.stroke();
                break;

            case 'diamond':
                const midX = (screenPoints[0].x + screenPoints[1].x) / 2;
                const midY = (screenPoints[0].y + screenPoints[1].y) / 2;

                ctx.moveTo(midX, screenPoints[0].y);
                ctx.lineTo(screenPoints[1].x, midY);
                ctx.lineTo(midX, screenPoints[1].y);
                ctx.lineTo(screenPoints[0].x, midY);
                ctx.closePath();
                ctx.stroke();
                break;
        }
    }, [transform.k, worldToScreen]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        shapes.forEach(shape => {
            drawShapeOnCanvas(ctx, shape);
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
            drawShapeOnCanvas(ctx, previewShape, true);
        }
    }, [shapes, isDrawing, currentPoints, activeTool, strokeColor, strokeWidth, strokeStyle, width, height, drawShapeOnCanvas]);

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
