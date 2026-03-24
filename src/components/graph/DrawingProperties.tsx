'use client';

import { useState, useRef, useEffect } from 'react';
import { DrawingTool } from '@/types/knowledge';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { X, Trash2, Minus, Plus, ChevronDown } from 'lucide-react';

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
const fontSizes = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96];
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
    const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
    const sizeDropdownRef = useRef<HTMLDivElement>(null);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftShadow(scrollLeft > 0);
            setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
                setIsSizeDropdownOpen(false);
            }
        };

        if (isSizeDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSizeDropdownOpen]);

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
        <div className="absolute top-35 left-2.5 right-auto md:left-4 lg:top-20 z-30 flex flex-col md:flex-col gap-0 rounded-xl bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 min-w-[180px] max-w-[calc(100vw-140px)] md:max-w-none max-h-[calc(100dvh-12rem)] transition-all duration-300 drawing-properties-panel">

            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors z-20"
                title="Close"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="relative rounded-xl p-3">
                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex flex-col gap-3 overflow-auto md:overflow-visible scrollbar-none items-start md:items-stretch flex-1 min-h-0"
                >
                    <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide shrink-0 md:shrink">
                        {showTextProps ? 'Text Properties' : 'Properties'}
                    </div>

                    <div className="shrink-0">
                        <ColorPicker
                            selectedColor={strokeColor}
                            onChange={onStrokeColorChange}
                            label="Color"
                        />
                    </div>

                    {showTextProps && (
                        <div className="flex flex-col gap-3">
                            <div className="space-y-2 shrink-0 w-48 md:w-auto">
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
                                <div className="space-y-2 shrink-0 w-48 md:w-auto">
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

                            <div className="space-y-2 shrink-0 w-48 md:w-64">
                                <label className="text-xs text-zinc-500">Size</label>
                                <div className="flex items-center bg-zinc-800/30 rounded-lg border border-zinc-700/50 h-9 p-0.5" ref={sizeDropdownRef}>
                                    <div className="flex items-center px-1">
                                        <button
                                            onClick={() => onFontSizeChange(Math.max(1, fontSize - 1))}
                                            className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                            title="Decrease size"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="h-4 w-px bg-zinc-700/50" />

                                    <div className="relative flex-1 flex items-center justify-center min-w-[60px]">
                                        <input
                                            type="text"
                                            value={fontSize}
                                            onFocus={() => setIsSizeDropdownOpen(true)}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val)) onFontSizeChange(Math.max(1, val));
                                            }}
                                            className="w-full bg-transparent text-center text-xs font-bold text-white outline-none cursor-pointer hover:bg-zinc-700/30 rounded py-1 transition-colors"
                                        />

                                        {isSizeDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                                {fontSizes.map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => {
                                                            onFontSizeChange(size);
                                                            setIsSizeDropdownOpen(false);
                                                        }}
                                                        className={`w-full px-4 py-1.5 text-xs text-left transition-colors flex items-center justify-between ${fontSize === size
                                                            ? 'bg-[#355ea1] text-white'
                                                            : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                                                            }`}
                                                    >
                                                        <span>{size}</span>
                                                        {fontSize === size && <div className="w-1 h-1 rounded-full bg-white" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="h-4 w-px bg-zinc-700/50" />

                                    <div className="flex items-center px-1">
                                        <button
                                            onClick={() => onFontSizeChange(fontSize + 1)}
                                            className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                            title="Increase size"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="h-4 w-px bg-zinc-700/50" />

                                    <div className="flex items-center px-1">
                                        <button
                                            onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                                            className={`p-1.5 rounded-md hover:bg-zinc-700 transition-colors ${isSizeDropdownOpen ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showDrawingProps && (
                        <div className="flex flex-col gap-3">
                            <div className="space-y-2 shrink-0 w-48 md:w-auto">
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

                            <div className="space-y-2 shrink-0 w-48 md:w-auto">
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
                    className={`absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-zinc-900 via-zinc-900/80 to-transparent pointer-events-none transition-opacity duration-200 md:hidden ${showLeftShadow ? 'opacity-100' : 'opacity-0'}`}
                    style={{ paddingLeft: '6px' }}
                />

                {/* Right Shadow Overlay (Mobile Only) */}
                <div
                    className={`absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-zinc-900 via-zinc-900/80 to-transparent pointer-events-none transition-opacity duration-200 md:hidden ${showRightShadow ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>

            <div className="w-full px-3 pb-3 pt-4 shrink-0 md:w-auto">
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
