'use client';

import { useRef } from 'react';
import { DrawingTool, StrokeStyle } from '@/types/knowledge';
import { useDrawingCanvasLogic } from '@/hooks/useDrawingCanvasLogic';

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

    const { state, handlers } = useDrawingCanvasLogic({
        activeTool, strokeWidth, strokeColor, strokeStyle, transform, canvasRef, width, height
    });

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`absolute inset-0 z-10 ${state.isDrawingTool ? 'cursor-crosshair' : ''}`}
            style={{ pointerEvents: state.isDrawingTool ? 'auto' : 'none' }}
            onMouseDown={handlers.handleMouseDown}
            onMouseMove={handlers.handleMouseMove}
            onMouseUp={handlers.handleMouseUp}
            onMouseLeave={handlers.handleMouseUp}
        />
    );
}
