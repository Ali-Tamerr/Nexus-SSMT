'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus, ChevronDown } from 'lucide-react';

interface SizePickerProps {
    value: number;
    onChange: (newValue: number) => void;
    min?: number;
    max?: number;
    step?: number;
    presets?: number[];
    unit?: string;
    label?: string;
    className?: string;
}

export function SizePicker({
    value,
    onChange,
    min = 1,
    max = 200,
    step = 1,
    presets = [],
    unit = '',
    label,
    className = ''
}: SizePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleIncrement = () => {
        const newValue = parseFloat((value + step).toFixed(2));
        if (newValue <= max) onChange(newValue);
    };

    const handleDecrement = () => {
        const newValue = parseFloat((value - step).toFixed(2));
        if (newValue >= min) onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            onChange(val);
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && <label className="text-xs text-zinc-500 font-medium">{label}</label>}
            <div className="flex items-center bg-zinc-800/30 rounded-lg border border-zinc-700/50 h-9 p-0.5" ref={dropdownRef}>
                <div className="flex items-center px-1">
                    <button
                        onClick={handleDecrement}
                        disabled={value <= min}
                        className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Decrease size"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="h-4 w-px bg-zinc-700/50" />

                <div className="relative flex-1 flex items-center justify-center min-w-[60px]">
                    <div className="flex items-center justify-center w-full group">
                        <input
                            type="text"
                            value={value}
                            onFocus={() => setIsOpen(true)}
                            onChange={handleInputChange}
                            className="w-full bg-transparent text-center text-xs font-bold text-white outline-none cursor-pointer hover:bg-zinc-700/30 rounded py-1 transition-colors"
                        />
                        {unit && <span className="text-[10px] text-zinc-500 ml-0.5 group-hover:text-zinc-400 transition-colors">{unit}</span>}
                    </div>

                    {isOpen && presets.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar min-w-[100px]">
                            {presets.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => {
                                        onChange(size);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-1.5 text-xs text-left transition-colors flex items-center justify-between ${value === size
                                        ? 'bg-[#355ea1] text-white'
                                        : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    <span>{size}{unit}</span>
                                    {value === size && <div className="w-1 h-1 rounded-full bg-white" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-4 w-px bg-zinc-700/50" />

                <div className="flex items-center px-1">
                    <button
                        onClick={handleIncrement}
                        disabled={value >= max}
                        className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Increase size"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="h-4 w-px bg-zinc-700/50" />

                <div className="flex items-center px-1">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-1.5 rounded-md hover:bg-zinc-700 transition-colors ${isOpen ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Presets"
                    >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
}
