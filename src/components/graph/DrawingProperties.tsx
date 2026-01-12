'use client';

import { DrawingTool } from '@/types/knowledge';

interface DrawingPropertiesProps {
    activeTool: DrawingTool;
    strokeWidth: number;
    strokeColor: string;
    strokeStyle: 'solid' | 'dashed' | 'dotted';
    onStrokeWidthChange: (width: number) => void;
    onStrokeColorChange: (color: string) => void;
    onStrokeStyleChange: (style: 'solid' | 'dashed' | 'dotted') => void;
}

const colors = [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#FFFFFF',
    '#6B7280',
];

const widths = [1, 2, 3, 5, 8];

const isDrawingTool = (tool: DrawingTool) =>
    ['pen', 'rectangle', 'diamond', 'circle', 'arrow', 'line'].includes(tool);

export function DrawingProperties({
    activeTool,
    strokeWidth,
    strokeColor,
    strokeStyle,
    onStrokeWidthChange,
    onStrokeColorChange,
    onStrokeStyleChange,
}: DrawingPropertiesProps) {
    if (!isDrawingTool(activeTool)) {
        return null;
    }

    return (
        <div className="absolute left-4 top-4 z-20 flex flex-col gap-3 rounded-xl bg-zinc-900/90 p-3 backdrop-blur-sm border border-zinc-800 min-w-[180px]">
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Properties</div>

            <div className="space-y-2">
                <label className="text-xs text-zinc-500">Color</label>
                <div className="flex flex-wrap gap-1.5">
                    {colors.map((color) => (
                        <button
                            key={color}
                            onClick={() => onStrokeColorChange(color)}
                            className={`w-6 h-6 rounded-md border-2 transition-all ${strokeColor === color
                                    ? 'border-white scale-110'
                                    : 'border-zinc-700 hover:border-zinc-500'
                                }`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs text-zinc-500">Stroke Width</label>
                <div className="flex gap-1">
                    {widths.map((w) => (
                        <button
                            key={w}
                            onClick={() => onStrokeWidthChange(w)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${strokeWidth === w
                                    ? 'bg-[#3B82F6] text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                        >
                            {w}px
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs text-zinc-500">Style</label>
                <div className="flex gap-1">
                    <button
                        onClick={() => onStrokeStyleChange('solid')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${strokeStyle === 'solid'
                                ? 'bg-[#3B82F6] text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        ━━━
                    </button>
                    <button
                        onClick={() => onStrokeStyleChange('dashed')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${strokeStyle === 'dashed'
                                ? 'bg-[#3B82F6] text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        ┅┅┅
                    </button>
                    <button
                        onClick={() => onStrokeStyleChange('dotted')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${strokeStyle === 'dotted'
                                ? 'bg-[#3B82F6] text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        ┈┈┈
                    </button>
                </div>
            </div>
        </div>
    );
}
