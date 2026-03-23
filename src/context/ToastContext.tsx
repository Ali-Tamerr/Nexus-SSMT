'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from '@/components/ui/Toast';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ToastContextType {
    toasts: ToastMessage[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    showConfirmation: (message: string) => Promise<boolean>;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
        const id = crypto.randomUUID();
        const newToast: ToastMessage = { id, message, type };

        setToasts((prev) => {
            // Prevent duplicate toasts on screen
            if (prev.some((t) => t.message === message)) {
                return prev;
            }
            return [...prev, newToast];
        });

        if (duration > 0 && type !== 'confirmation') {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const showConfirmation = useCallback((message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const id = crypto.randomUUID();
            const handleConfirm = () => {
                resolve(true);
                // removeToast handled by Toast component after animation
            };
            const handleCancel = () => {
                resolve(false);
            };

            // For conformation, we use infinite duration (handled by logic above)
            const newToast: ToastMessage = {
                id,
                message,
                type: 'confirmation',
                onConfirm: handleConfirm,
                onCancel: handleCancel
            };

            setToasts((prev) => [...prev, newToast]);
        });
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, showConfirmation, removeToast }}>
            {children}
            <div className="fixed bottom-4 left-4 z-100 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                        onConfirm={toast.onConfirm}
                        onCancel={toast.onCancel}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
