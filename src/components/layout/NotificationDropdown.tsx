'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Loader2, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { collaborationApi } from '@/lib/supabase/collaboration';
import { CollaborationRequest } from '@/types/collaboration';
import { useToast } from '@/context/ToastContext';

export function NotificationDropdown() {
    const { user, isAuthenticated } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [incomingRequests, setIncomingRequests] = useState<CollaborationRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<CollaborationRequest[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [expandedRequests, setExpandedRequests] = useState<Set<number>>(new Set());
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        if (!user || !isAuthenticated) return;
        setIsLoading(true);
        try {
            // 1. Fetch user's projects and collections (now includes collab items)
            const [allProjects, allCollections] = await Promise.all([
                api.projects.getByUser(user.id),
                api.projectCollections.getByUser(user.id).catch(() => [] as any[])
            ]);

            // Only pass OWNED resources to getPendingRequestsForOwner
            const ownedProjects = allProjects.filter((p: any) => p.userId === user.id);
            const ownedCollections = allCollections.filter((c: any) => c.userId === user.id);

            const pIds = ownedProjects.map((p: any) => p.id);
            const cIds = ownedCollections.map((c: any) => c.id);

            // 2. Fetch pending incoming requests (only for owned resources)
            let incoming: any[] = [];
            if (pIds.length > 0 || cIds.length > 0) {
                incoming = await collaborationApi.getPendingRequestsForOwner(pIds, cIds);
                incoming = incoming.map((req: any) => {
                    const targetId = req.targetId || req.target_id;
                    if (req.type === 'project') {
                        req.targetName = ownedProjects.find((p: any) => p.id === targetId)?.name || 'Unknown Project';
                    } else {
                        req.targetName = ownedCollections.find((c: any) => c.id === targetId)?.name || 'Unknown Collection';
                    }
                    return req;
                });
            }

            // 3. Fetch outgoing requests (accepted/rejected) and enrich with target names
            let outgoing = await collaborationApi.getMyRequests(user.id);
            const resolvedRaw = outgoing.filter(r => r.status !== 'pending');

            const enriched = await Promise.all(
                resolvedRaw.map(async (req: any) => {
                    try {
                        if (req.type === 'project') {
                            const proj = await api.projects.getById(req.targetId);
                            return { ...req, targetName: proj?.name || 'a project' };
                        } else {
                            const col = await api.projectCollections.getById(req.targetId);
                            return { ...req, targetName: col?.name || 'a collection' };
                        }
                    } catch {
                        return { ...req, targetName: req.type === 'project' ? 'a project' : 'a collection' };
                    }
                })
            );

            setIncomingRequests(incoming);
            setOutgoingRequests(enriched);
            
            const seenStr = localStorage.getItem('nexus_seen_requests');
            const seenIds = new Set(seenStr ? JSON.parse(seenStr) : []);
            const hasNewOutgoing = enriched.some((r: any) => !seenIds.has(r.id));
            
            setHasUnread(incoming.length > 0 || hasNewOutgoing);
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadNotifications();
        }
    }, [isAuthenticated, isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Mark all current outgoing as seen
            const seenStr = localStorage.getItem('nexus_seen_requests');
            const seenIds = new Set(seenStr ? JSON.parse(seenStr) : []);
            let changed = false;
            outgoingRequests.forEach(r => {
                if (!seenIds.has(r.id)) {
                    seenIds.add(r.id);
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem('nexus_seen_requests', JSON.stringify(Array.from(seenIds)));
            }
            // Clear unread indicator if no incoming (since we just saw the outgoing ones)
            setHasUnread(incomingRequests.length > 0);
        }
    }, [isOpen, outgoingRequests, incomingRequests]);

    const handleRespond = async (req: any, accept: boolean) => {
        try {
            const targetId = req.targetId || req.target_id;
            await collaborationApi.respondToRequest(req.id, req.type, targetId, req.requester.id, accept);
            showToast(`Request ${accept ? 'accepted' : 'rejected'}`, 'success');
            // Remove from list
            setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
            if (incomingRequests.length - 1 === 0) {
                setHasUnread(false);
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to respond', 'error');
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedRequests(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-zinc-900 animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full -right-4 sm:right-0 mt-2 w-[290px] sm:w-80 max-w-[calc(100vw-32px)] rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden z-100 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {isLoading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto hidden-scrollbar">
                        {incomingRequests.length === 0 && outgoingRequests.length === 0 && !isLoading && (
                            <div className="p-8 text-center text-sm text-zinc-500">
                                No new notifications
                            </div>
                        )}

                        {incomingRequests.length > 0 && (
                            <div className="py-2">
                                <div className="px-4 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    Pending Requests
                                </div>
                                {incomingRequests.map((req: any) => {
                                    const isExpanded = expandedRequests.has(req.id);
                                    return (
                                        <div 
                                            key={req.id} 
                                            onClick={() => toggleExpand(req.id)}
                                            className="px-4 py-3 hover:bg-zinc-800/50 flex flex-col gap-2 transition-colors border-b border-zinc-800/50 last:border-0 cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-sm text-zinc-300">
                                                    <span className="font-semibold text-white">{req.requester.displayName}</span> wants to collaborate on{" "}
                                                    <span className="text-white italic">{req.targetName}</span> ({req.type}).
                                                </p>
                                                <ChevronDown 
                                                    className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 mt-0.5 ${isExpanded ? 'rotate-180' : ''}`} 
                                                />
                                            </div>
                                            
                                            {isExpanded && (
                                                <div 
                                                    className="flex items-center gap-2 mt-2"
                                                    onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking buttons
                                                >
                                                    <button
                                                        onClick={() => handleRespond(req, true)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-[#355ea1] hover:bg-[#2563EB] text-white text-xs font-medium transition-colors"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRespond(req, false)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 text-xs font-medium transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {outgoingRequests.length > 0 && (
                            <div className="py-2">
                                <div className="px-4 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    Your Requests
                                </div>
                                {outgoingRequests.map((req: any) => (
                                    <div key={req.id} className="px-4 py-3 hover:bg-zinc-800/50 flex items-center gap-3 transition-colors border-b border-zinc-800/50 last:border-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${req.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {req.status === 'accepted' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm text-zinc-300">
                                                Your request to access <span className="font-semibold text-white">"{req.targetName}"</span> was <span className={`font-semibold ${req.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>{req.status}</span>.
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
