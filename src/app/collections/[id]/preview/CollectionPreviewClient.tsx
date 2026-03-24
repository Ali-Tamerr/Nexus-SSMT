'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Link2, ExternalLink, Info, X, Edit3, Users, Check, Share2 } from 'lucide-react';
import { ProjectCollection, Project, ProjectCollectionItem, Profile } from '@/types/knowledge';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useAuthStore } from '@/store/useAuthStore';
import { collaborationApi } from '@/lib/supabase/collaboration';
import { ShareModal } from '@/components/ui/ShareModal';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { ProjectInfoPopup } from '@/components/project/ProjectInfoPopup';

export default function CollectionPreviewClient() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params?.id);

    const [collection, setCollection] = useState<ProjectCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [owner, setOwner] = useState<Profile | null>(null);
    const infoPopupRef = (null as any); // We'll use a ref for the component

    const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'requested' | 'accepted'>('idle');
    const [requestId, setRequestId] = useState<number | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const { user, isAuthenticated } = useAuthStore();
    const { showToast } = useToast();

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    useEffect(() => {
        const fetchCollection = async () => {
            if (!id) return;

            try {
                const data = await api.projectCollections.getById(id);
                setCollection(data);
                if (data.projects) {
                    setProjects(data.projects);
                } else if (data.items) {
                    setProjects(data.items.map((i: ProjectCollectionItem) => i.project).filter(Boolean) as Project[]);
                }

                const { user } = useAuthStore.getState();
                if (data.owner) {
                    setOwner(data.owner);
                } else if (data.userId && user?.id === data.userId) {
                    setOwner(user);
                } else {
                    setOwner(null);
                }
            } catch (err) {
                console.error('Failed to fetch collection:', err);
                setError('Failed to load group. It may have been deleted or does not exist.');
            } finally {
                setLoading(false);
            }
        };

        fetchCollection();
    }, [id]);

    useEffect(() => {
        const fetchStatus = async () => {
             if (!isAuthenticated || !user?.id || !id) return;
             try {
                 const hasAccess = await collaborationApi.hasCollectionAccess(id, user.id);
                 if (hasAccess) {
                     setRequestStatus('accepted');
                     return;
                 }

                 const requests = await collaborationApi.getMyRequests(user.id);
                 const req = requests.find(r => r.targetId === id && r.type === 'collection');
                 
                 if (req) {
                     setRequestId(req.id);
                     if (req.status === 'pending') setRequestStatus('requested');
                     else if (req.status === 'accepted') setRequestStatus('accepted');
                 } else {
                     setRequestStatus('idle');
                     setRequestId(null);
                 }
             } catch (err) {
                 console.error('Failed to fetch request status', err);
             }
        };
        fetchStatus();

        let interval: any;
        if (requestStatus === 'requested') {
            interval = setInterval(fetchStatus, 10000); // Poll every 10 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAuthenticated, user?.id, id, requestStatus]);

    const handleRequestAccess = async () => {
        if (!isAuthenticated) {
            router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        if (!user || !id) return;

        setIsRequesting(true);
        try {
            await collaborationApi.requestAccess('collection', id, user.id);
            setRequestStatus('requested');
            showToast('Access request sent successfully.', 'success');
            // Refresh to get ID
            const requests = await collaborationApi.getMyRequests(user.id);
            const req = requests.find(r => r.targetId === id && r.type === 'collection' && r.status === 'pending');
            if (req) setRequestId(req.id);
        } catch (error: any) {
            showToast(error.message || 'Failed to request access.', 'error');
        } finally {
            setIsRequesting(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!requestId || !user?.id) return;
        setIsRequesting(true);
        try {
            await collaborationApi.deleteRequest(requestId, user.id);
            setRequestStatus('idle');
            setRequestId(null);
            showToast('Request withdrawn.', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to withdraw request.', 'error');
        } finally {
            setIsRequesting(false);
        }
    };

    const handleProjectClick = (project: Project) => {
        router.push(`/project/${project.id}/preview?collection=${id}`);
    };

    const handlePinToggle = async (project: Project) => {
        if (!collection || !owner) return;
        const { user } = useAuthStore.getState();
        if (user?.id !== collection.userId) return;

        const currentPinnedIds = collection.items?.filter(i => i.isPinned).map(i => i.projectId) || [];
        const isCurrentlyPinned = currentPinnedIds.includes(project.id);

        let newPinnedIds: number[];
        if (isCurrentlyPinned) {
            newPinnedIds = currentPinnedIds.filter(id => id !== project.id);
        } else {
            newPinnedIds = [...currentPinnedIds, project.id];
        }

        try {
            await api.projectCollections.update(collection.id, {
                pinnedProjectIds: newPinnedIds,
                userId: user.id
            });

            // Optimistic Update
            setCollection(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    items: prev.items?.map(item => ({
                        ...item,
                        isPinned: newPinnedIds.includes(item.projectId)
                    }))
                };
            });
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const resolveOwnerDisplayName = (profile: Profile | null): string => {
        if (!profile) return 'Unknown User';

        const emailLocalPart = profile.email?.split('@')[0]?.trim().toLowerCase() || '';
        const candidates = [
            profile.displayName,
            (profile as any).fullName,
            (profile as any).name,
            (profile as any).display_name,
            (profile as any).full_name,
            (profile as any).userMetadata?.full_name,
            (profile as any).userMetadata?.name,
            (profile as any).user_metadata?.full_name,
            (profile as any).user_metadata?.name,
        ]
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean);

        const nonEmailLike = candidates.find((value) => {
            if (!emailLocalPart) return true;
            return value.toLowerCase() !== emailLocalPart;
        });

        return nonEmailLike || candidates[0] || 'Unknown User';
    };

    const ownerDisplayName = resolveOwnerDisplayName(owner);

    const ownerInitials = ownerDisplayName
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-[#355ea1]" />
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-zinc-950 text-white">
                <h1 className="text-2xl font-bold">Error</h1>
                <p className="text-zinc-400">{error || 'Group not found'}</p>
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-[#355ea1] hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <Navbar showSearch={false} />
            <main className="mx-auto max-w-6xl px-6 py-8">
                <div className="mb-8 space-y-4">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-zinc-400 flex gap-2 items-center border-b border-transparent hover:border-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <ProjectInfoPopup
                            type="collection"
                            targetId={id}
                            name={collection.name}
                            description={collection.description}
                            updatedAt={collection.updatedAt}
                        />
                        <h1 className="text-3xl font-bold text-white max-w-2xl truncate" title={collection.name}>
                            {collection.name}
                        </h1>

                    </div>

                    {owner && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-zinc-500 text-sm">by</span>
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-[#355ea1]/20 flex items-center justify-center overflow-hidden border border-[#355ea1]/30">
                                    {owner.avatarUrl ? (
                                        <img
                                            src={owner.avatarUrl}
                                            alt={ownerDisplayName}
                                            className="h-full w-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span className="text-[10px] font-medium text-[#355ea1]">
                                            {ownerInitials}
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-zinc-200">
                                    {ownerDisplayName}
                                </span>
                            </div>
                        </div>
                    )}

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects
                        .sort((a, b) => {
                            const itemA = collection?.items?.find(i => i.projectId === a.id);
                            const itemB = collection?.items?.find(i => i.projectId === b.id);
                            if (itemA?.isPinned && !itemB?.isPinned) return -1;
                            if (!itemA?.isPinned && itemB?.isPinned) return 1;
                            return (itemA?.order || 0) - (itemB?.order || 0);
                        })
                        .map((project) => {
                            const isPinned = collection?.items?.find(item => item.projectId === project.id)?.isPinned || false;
                            const isOwner = useAuthStore.getState().user?.id === collection?.userId;

                            return (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onClick={handleProjectClick}
                                    viewMode="grid"
                                    isPinned={isPinned}
                                    onPinToggle={isOwner ? handlePinToggle : undefined}
                                />
                            );
                        })}
                </div>

                {projects.length === 0 && (
                    <div className="text-center py-20 text-zinc-500">
                        This group has no projects.
                    </div>
                )}

            </main>

            {/* Floating Buttons area */}
            <div className="fixed right-6 top-24 z-30 pointer-events-none flex-col items-end gap-3 hidden sm:flex">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-900/90 p-2 backdrop-blur-sm border border-zinc-800 pointer-events-auto shadow-lg">
                    {/* Share Button */}
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-[#355ea1] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#2563EB]"
                        title="Share group"
                    >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                    </button>

                    {/* Go to Editor Button (if accepted) */}
                    {requestStatus === 'accepted' && (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 rounded-lg bg-emerald-500/50 px-3 py-1.5 text-xs font-medium text-emerald-100 transition-all hover:bg-emerald-500/70"
                        >
                            <Edit3 className="h-4 w-4" />
                            <span>Edit Group</span>
                        </Link>
                    )}

                    {/* Request Access Button (if not accepted) */}
                    {requestStatus !== 'accepted' && (
                        <button
                            onClick={handleRequestAccess}
                            disabled={requestStatus === 'requested' || isRequesting}
                            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white disabled:opacity-80 disabled:cursor-default"
                        >
                            {requestStatus === 'requested' ? (
                                <>
                                    <Check className="h-4 w-4 text-emerald-400" />
                                    <span>Requested</span>
                                </>
                            ) : (
                                <>
                                    <Users className="h-4 w-4" />
                                    <span>Send edit request</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Cancel Request Link below the main button */}
                {requestStatus === 'requested' && (
                    <button
                        onClick={handleCancelRequest}
                        disabled={isRequesting}
                        className="mr-2 pointer-events-auto text-[11px] font-medium text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                        Cancel Request
                    </button>
                )}
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareUrl={shareUrl}
            />
        </div>
    );
}
