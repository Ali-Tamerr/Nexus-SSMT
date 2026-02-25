'use client';

import { useState, useRef, useEffect } from 'react';
import { DrawingTool } from '@/types/knowledge';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { X, Trash2 } from 'lucide-react';

interface DrawingPropertiesProps {
    activeTool: DrawingTool;
    strokeWidth: number;
    strokeColor: string;
    strokeStyle: 'solid' | 'dashed' | 'dotted';
    fontSize: number;
    fontFamily: string;
    textDir?: 'ltr' | 'rtl';
    onStrokeWidthChange: (width: number) => void;
    onStrokeColorChange: (color: string) => void;
    onStrokeStyleChange: (style: 'solid' | 'dashed' | 'dotted') => void;
    onFontSizeChange: (size: number) => void;
    onFontFamilyChange: (family: string) => void;
    onTextDirChange?: (dir: 'ltr' | 'rtl') => void;
    onClose?: () => void;
    onDelete?: () => void;
    selectedShapeType?: string;
}

const widths = [1, 2, 3, 5, 8];
const fontSizes = [12, 16, 20, 24, 32];
const fonts = [
    { id: 'Inter', label: 'Inter' },
    { id: 'Georgia', label: 'Georgia' },
];

const isDrawingTool = (tool: string) =>
    ['pen', 'rectangle', 'diamond', 'circle', 'arrow', 'line'].includes(tool);

const isTextTool = (tool: string) => tool === 'text';

export function DrawingProperties({
    activeTool,
    strokeWidth,
    strokeColor,
    strokeStyle,
    fontSize,
    fontFamily,
    textDir = 'ltr',
    onStrokeWidthChange,
    onStrokeColorChange,
    onStrokeStyleChange,
    onFontSizeChange,
    onFontFamilyChange,
    onTextDirChange,
    onClose,
    onDelete,
    selectedShapeType,
}: DrawingPropertiesProps) {
    const showDrawingProps = isDrawingTool(activeTool) || (activeTool === 'select' && !!selectedShapeType && isDrawingTool(selectedShapeType));
    const showTextProps = isTextTool(activeTool) || (activeTool === 'select' && selectedShapeType === 'text');

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftShadow, setShowLeftShadow] = useState(false);
    const [showRightShadow, setShowRightShadow] = useState(false);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftShadow(scrollLeft > 0);
            setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    useEffect(() => {
        checkScroll();
    }, [activeTool, showTextProps, showDrawingProps]);

    if (!showDrawingProps && !showTextProps) {
        return null;
    }

    return (
        <div className="absolute top-[4.5rem] left-2.5 right-auto md:left-4 md:top-4 z-30 flex flex-col md:flex-col gap-0 rounded-xl bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 min-w-[180px] max-w-[calc(100vw-140px)] md:max-w-none max-h-[calc(100dvh-12rem)] transition-all duration-300">

            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors z-20"
                title="Close"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="relative overflow-hidden rounded-xl p-3">
                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex flex-col gap-3 overflow-auto md:overflow-visible scrollbar-none items-start md:items-stretch flex-1 min-h-0"
                >
                    <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide flex-shrink-0 md:flex-shrink">
                        {showTextProps ? 'Text Properties' : 'Properties'}
                    </div>

                    <div className="flex-shrink-0">
                        <ColorPicker
                            selectedColor={strokeColor}
                            onChange={onStrokeColorChange}
                            label="Color"
                        />
                    </div>

                    {showTextProps && (
                        <div className="flex flex-col gap-3">
                            <div className="space-y-2 flex-shrink-0 w-48 md:w-auto">
                                <label className="text-xs text-zinc-500">Font</label>
                                <div className="flex gap-1">
                                    {fonts.map((font) => (
                                        <button
                                            key={font.id}
                                            onClick={() => onFontFamilyChange(font.id)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${fontFamily === font.id
                                                ? 'bg-[#355ea1] text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                }`}
                                            style={{ fontFamily: font.id }}
                                        >
                                            {font.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {onTextDirChange && (
                                <div className="space-y-2 flex-shrink-0 w-48 md:w-auto">
                                    <label className="text-xs text-zinc-500">Direction</label>
                                    <div className="flex gap-1">
                                        {(['ltr', 'rtl'] as const).map((dir) => (
                                            <button
                                                key={dir}
                                                onClick={() => onTextDirChange(dir)}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all uppercase ${textDir === dir
                                                    ? 'bg-[#355ea1] text-white'
                                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                    }`}
                                            >
                                                {dir}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 flex-shrink-0 w-48 md:w-auto">
                                <label className="text-xs text-zinc-500">Size</label>
                                <div className="flex gap-1">
                                    {fontSizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => onFontSizeChange(size)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${fontSize === size
                                                ? 'bg-[#355ea1] text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {showDrawingProps && (
                        <div className="flex flex-col gap-3">
                            <div className="space-y-2 flex-shrink-0 w-48 md:w-auto">
                                <label className="text-xs text-zinc-500">Stroke Width</label>
                                <div className="flex gap-1">
                                    {widths.map((w) => (
                                        <button
                                            key={w}
                                            onClick={() => onStrokeWidthChange(w)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${strokeWidth === w
                                                ? 'bg-[#355ea1] text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                }`}
                                        >
                                            {w}px
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 flex-shrink-0 w-48 md:w-auto">
                                <label className="text-xs text-zinc-500">Style</label>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => onStrokeStyleChange('solid')}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${strokeStyle === 'solid'
                                            ? 'bg-[#355ea1] text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        ━━━
                                    </button>
                                    <button
                                        onClick={() => onStrokeStyleChange('dashed')}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${strokeStyle === 'dashed'
                                            ? 'bg-[#355ea1] text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        ┅┅┅
                                    </button>
                                    <button
                                        onClick={() => onStrokeStyleChange('dotted')}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${strokeStyle === 'dotted'
                                            ? 'bg-[#355ea1] text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        ┈┈┈
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Left Shadow Overlay (Mobile Only) */}
                <div
                    className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent pointer-events-none transition-opacity duration-200 md:hidden ${showLeftShadow ? 'opacity-100' : 'opacity-0'}`}
                    style={{ paddingLeft: '6px' }}
                />

                {/* Right Shadow Overlay (Mobile Only) */}
                <div
                    className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-zinc-900 via-zinc-900/80 to-transparent pointer-events-none transition-opacity duration-200 md:hidden ${showRightShadow ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>

            <div className="w-full px-3 pb-3 pt-4 flex-shrink-0 w-48 md:w-auto">
                <button
                    onClick={onDelete}
                    className="flex items-center border border-0.5 border-red-600/60 justify-center gap-2 w-full max-w-[100px] py-2 text-red-500 hover:text-red-700 rounded-lg text-xs font-medium transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
            </div>
        </div >
    );
}
