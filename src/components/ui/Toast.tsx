'use client';

import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirmation';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export function Toast({ id, message, type, onClose, onConfirm, onCancel }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay to trigger animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
            handleClose();
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        handleClose(); // Calling handleClose triggers exit anim then onClose, inside onClose we should resolve false if confirm pending
    };

    const styles = {
        success: {
            bg: 'bg-zinc-900',
            border: 'border-green-500/20',
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
            text: 'text-zinc-200',
        },
        error: {
            bg: 'bg-zinc-900',
            border: 'border-red-500/20',
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
            text: 'text-zinc-200',
        },
        warning: {
            bg: 'bg-zinc-900',
            border: 'border-yellow-500/20',
            icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
            text: 'text-zinc-200',
        },
        info: {
            bg: 'bg-zinc-900',
            border: 'border-blue-500/20',
            icon: <Info className="h-5 w-5 text-blue-500" />,
            text: 'text-zinc-200',
        },
        confirmation: {
            bg: 'bg-zinc-900',
            border: 'border-red-500/30', // Like NodeEditor popup
            icon: <AlertCircle className="h-5 w-5 text-red-400" />,
            text: 'text-zinc-200',
        },
    };

    const style = styles[type];

    return (
        <div
            className={`
        w-80 rounded-lg border p-4 shadow-2xl transition-all duration-300 ease-in-out
        ${style.bg} ${style.border}
        ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      `}
            role="alert"
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                        {style.icon}
                    </div>
                    <div className="flex-1">
                        <p className={`${style.text} text-sm font-medium`}>
                            {message}
                        </p>
                    </div>
                    {type !== 'confirmation' && (
                        <button
                            onClick={handleClose}
                            className="shrink-0 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {type === 'confirmation' && (
                    <div className="flex gap-3 pl-8">
                        <button
                            onClick={handleConfirm}
                            className="flex-1 rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex-1 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
