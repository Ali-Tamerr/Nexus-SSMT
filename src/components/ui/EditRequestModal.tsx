'use client';

import { X, LayoutGrid, FileText } from 'lucide-react';
import { Button } from './Button';

interface EditRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: 'project' | 'collection') => void;
    projectName: string;
    collectionName?: string;
    isSubmitting?: boolean;
}

export function EditRequestModal({
    isOpen,
    onClose,
    onSelect,
    projectName,
    collectionName,
    isSubmitting = false
}: EditRequestModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white">Send edit request</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        This project is part of a collection. Would you like to request edit access for just this project or the entire collection?
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => onSelect('project')}
                        disabled={isSubmitting}
                        className="flex w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-800/50 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800 group disabled:opacity-50"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-white">Project Only</p>
                            <p className="text-xs text-zinc-500 line-clamp-1">{projectName}</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onSelect('collection')}
                        disabled={isSubmitting}
                        className="flex w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-800/50 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800 group disabled:opacity-50"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
                            <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-white">Entire Collection</p>
                            <p className="text-xs text-zinc-500 line-clamp-1">{collectionName || 'Associated Collection'}</p>
                        </div>
                    </button>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
