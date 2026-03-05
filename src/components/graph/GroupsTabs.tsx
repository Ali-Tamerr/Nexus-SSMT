'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, GripVertical, Check } from 'lucide-react';

export interface Group {
    id: number;
    name: string;
    color: string;
    order: number;
}

interface GroupsTabsProps {
    groups: Group[];
    activeGroupId: number | null;
    onSelectGroup: (groupId: number | null) => void;
    onAddGroup: () => void;
    onRenameGroup: (groupId: number, newName: string) => void;
    onDeleteGroup: (groupId: number) => void;
    onReorderGroups: (groups: Group[]) => void;
    isPreviewMode?: boolean;
}

const DEFAULT_COLORS = [
    '#8B5CF6', '#355ea1', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899', '#06B6D4', '#84CC16'
];

export function GroupsTabs({
    groups,
    activeGroupId,
    onSelectGroup,
    onAddGroup,
    onRenameGroup,
    onDeleteGroup,
    onReorderGroups,
    isPreviewMode = false,
}: GroupsTabsProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const handleStartEdit = (group: Group) => {
        setEditingId(group.id);
        setEditValue(group.name);
    };

    const handleSaveEdit = () => {
        if (editingId && editValue.trim()) {
            onRenameGroup(editingId, editValue.trim());
        }
        setEditingId(null);
        setEditValue('');
    };

    const handleDragStart = (e: React.DragEvent, groupId: number) => {
        setDraggedId(groupId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, groupId: number) => {
        e.preventDefault();
        if (draggedId !== groupId) {
            setDragOverId(groupId);
        }
    };

    const handleDragEnd = () => {
        if (draggedId && dragOverId && draggedId !== dragOverId) {
            const newGroups = [...groups];
            const draggedIndex = newGroups.findIndex(g => g.id === draggedId);
            const dropIndex = newGroups.findIndex(g => g.id === dragOverId);

            const [draggedGroup] = newGroups.splice(draggedIndex, 1);
            newGroups.splice(dropIndex, 0, draggedGroup);

            const reorderedGroups = newGroups.map((g, i) => ({ ...g, order: i }));
            onReorderGroups(reorderedGroups);
        }
        setDraggedId(null);
        setDragOverId(null);
    };

    const itemsRef = useRef<Map<number, HTMLDivElement>>(new Map());
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isTouchDraggingRef = useRef(false);
    const touchStartPosRef = useRef<{ x: number, y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent, group: Group) => {
        if (editingId) return;

        const touch = e.touches[0];
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
        isTouchDraggingRef.current = false;

        longPressTimerRef.current = setTimeout(() => {
            isTouchDraggingRef.current = true;
            setDraggedId(group.id);
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500); // 0.5s hold to drag
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartPosRef.current) return;

        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

        // If moved before timer fires, cancel timer (it's a scroll)
        if (!isTouchDraggingRef.current) {
            if (dx > 10 || dy > 10) {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }
            }
            return;
        }

        // If dragging, prevent scroll and handle reorder
        if (e.cancelable) e.preventDefault();

        if (draggedId) {
            // Check collision with other items
            const draggedElement = itemsRef.current.get(draggedId);
            if (!draggedElement) return;

            const draggedRect = draggedElement.getBoundingClientRect();
            const draggedCenter = draggedRect.left + draggedRect.width / 2;

            // Simple swap logic based on X position
            // We want to find the item we are hovering over
            // Use pointer position for more direct control? 
            // Actually, comparing touch X to other items' centers works best.

            const touchX = touch.clientX;

            for (const targetGroup of groups) {
                if (targetGroup.id === draggedId) continue;

                const targetElement = itemsRef.current.get(targetGroup.id);
                if (!targetElement) continue;

                const targetRect = targetElement.getBoundingClientRect();
                const targetCenter = targetRect.left + targetRect.width / 2;

                // If overlapping significantly (crossing centers)
                // Determine direction
                const isAfter = targetGroup.order > (groups.find(g => g.id === draggedId)?.order || 0);

                if (
                    (isAfter && touchX > targetCenter) ||
                    (!isAfter && touchX < targetCenter)
                ) {
                    // Swap
                    const newGroups = [...groups];
                    const draggedIndex = newGroups.findIndex(g => g.id === draggedId);
                    const targetIndex = newGroups.findIndex(g => g.id === targetGroup.id);

                    if (draggedIndex !== -1 && targetIndex !== -1) {
                        const [removed] = newGroups.splice(draggedIndex, 1);
                        newGroups.splice(targetIndex, 0, removed);

                        const reordered = newGroups.map((g, i) => ({ ...g, order: i }));
                        onReorderGroups(reordered);
                        break; // One swap per move frame usually enough
                    }
                }
            }
        }
    };

    const handleTouchEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        isTouchDraggingRef.current = false;
        setDraggedId(null);
        touchStartPosRef.current = null;
    };

    const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

    return (

        <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-16 sm:right-44 flex items-center gap-1.5 sm:gap-0 pointer-events-none z-30">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pointer-events-auto pr-1" onWheel={(e) => {
                // Determine if we are at the ends of the scroll
                const element = e.currentTarget;
                const isAtLeft = element.scrollLeft === 0;
                const isAtRight = Math.abs(element.scrollWidth - element.clientWidth - element.scrollLeft) < 1;

                // If scrolling vertically (deltaY), convert to horizontal scroll
                if (e.deltaY !== 0) {
                    // Only prevent default if we can scroll in that direction
                    if ((e.deltaY > 0 && !isAtRight) || (e.deltaY < 0 && !isAtLeft)) {
                        // e.preventDefault(); // React synthetic events might complain, but usually fine for scrolling
                    }
                    element.scrollLeft += e.deltaY;
                }
            }}>
               
                {sortedGroups.map((group) => (
                    <div
                        key={group.id}
                        ref={(el) => {
                            if (el) itemsRef.current.set(group.id, el);
                            else itemsRef.current.delete(group.id);
                        }}
                        draggable={!isPreviewMode && editingId !== group.id}
                        onDragStart={(e) => handleDragStart(e, group.id)}
                        onDragOver={(e) => handleDragOver(e, group.id)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart(e, group)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className={`flex-none h-9 flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs backdrop-blur-sm border cursor-pointer group transition-all Select-none user-select-none ${activeGroupId === group.id
                            ? 'bg-zinc-700/80 border-zinc-600 text-white'
                            : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-300'
                            } ${draggedId === group.id && isTouchDraggingRef.current ? 'scale-110 shadow-xl z-50 ring-2 ring-blue-500/50' : ''} ${dragOverId === group.id ? 'border-blue-500' : ''}`}
                        onClick={() => !editingId && onSelectGroup(group.id)}
                        onDoubleClick={() => !isPreviewMode && handleStartEdit(group)}
                    >
                        {!isPreviewMode && sortedGroups.length > 1 && (
                            <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 cursor-grab" />
                        )}

                        {editingId === group.id ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') {
                                        setEditingId(null);
                                        setEditValue('');
                                    }
                                }}
                                className="bg-transparent border-none outline-none text-white text-xs w-20"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="truncate max-w-24">{group.name}</span>
                        )}

                        {!isPreviewMode && sortedGroups.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteGroup(group.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-600/50 transition-all"
                                title="Delete group"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {!isPreviewMode && (
                <button
                    onClick={onAddGroup}
                    className="flex-none h-9 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs bg-zinc-800/80 backdrop-blur-sm border border-dashed border-zinc-700 text-zinc-500 hover:bg-zinc-700/80 hover:text-zinc-300 hover:border-zinc-600 transition-all pointer-events-auto shadow-sm"
                    title="Add new group"
                >
                    <Plus className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}

// Ensure new groups always get a unique id
let nextGroupId = 1;
export function getNextGroupColor(existingGroups: Group[]): string {
    const usedColors = new Set(existingGroups.map(g => g.color));
    // Find max id to ensure uniqueness
    const maxId = existingGroups.reduce((max, g) => Math.max(max, g.id), 0);
    nextGroupId = maxId + 1;
    return DEFAULT_COLORS.find(c => !usedColors.has(c)) || DEFAULT_COLORS[existingGroups.length % DEFAULT_COLORS.length];
}
