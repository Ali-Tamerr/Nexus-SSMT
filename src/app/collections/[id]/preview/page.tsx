'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Link2, ExternalLink, Info, X, Check, Share2 } from 'lucide-react';
import { ProjectCollection, Project, ProjectCollectionItem, Profile } from '@/types/knowledge';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useAuthStore } from '@/store/useAuthStore';
import { collaborationApi } from '@/lib/supabase/collaboration';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProjectInfoPopup } from '@/components/project/ProjectInfoPopup';
import { useToast } from '@/context/ToastContext';
import { ShareModal } from '@/components/ui/ShareModal';
import { useRecentVisits } from '@/hooks/useRecentVisits';

export default function CollectionPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const { id: idParam } = params as { id: string };
    const [numericId, setNumericId] = useState<number | null>(null);

    const [collection, setCollection] = useState<ProjectCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [owner, setOwner] = useState<Profile | null>(null);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [projectInfo, setProjectInfo] = useState<Project | null>(null);

    const { user, isAuthenticated } = useAuthStore();
    const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'sent' | 'error' | 'accepted'>('idle');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const { trackVisit } = useRecentVisits();

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

    const handleRequestAccess = async () => {
        if (!isAuthenticated || !user) {
            useAuthStore.getState().setReturnUrl(window.location.pathname);
            setAuthMode('login');
            setShowAuthModal(true);
            return;
        }

        try {
            setRequestStatus('loading');
            await collaborationApi.requestAccess('collection', numericId!, user.id);
            setRequestStatus('sent');
        } catch (err: any) {
            console.error('Failed to request access:', err);
            setRequestStatus('error');
        }
    };

    useEffect(() => {
        const fetchCollection = async () => {
            if (!idParam) return;

            try {
                if (/^\d+$/.test(idParam)) {
                    throw new Error("Unauthorized");
                }
                const data = await api.projectCollections.getByPublicId(idParam);
                setCollection(data);
                setNumericId(data.id);
                // If the backend returns populated projects, use them. 
                // Otherwise we might need to fetch them if only IDs are returned.
                // Assuming backend returns populated projects as per spec:
                if (data.projects) {
                    setProjects(data.projects);
                } else if (data.items) {
                    // Fallback if projects are nested in items
                    setProjects(data.items.map((i: ProjectCollectionItem) => i.project).filter(Boolean) as Project[]);
                }

                // Prefer owner object from collection payload (new backend contract)
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
    }, [idParam]);

    useEffect(() => {
        const fetchStatus = async () => {
             if (!isAuthenticated || !user?.id || !numericId) return;
             try {
                 // Check unified access (owner or collaborator)
                 const hasAccess = await collaborationApi.hasCollectionAccess(numericId, user.id);
                 if (hasAccess) {
                     setRequestStatus('accepted');
                     return;
                 }

                 // Check for pending request
                 const requests = await collaborationApi.getMyRequests(user.id);
                 const req = requests.find(r => r.targetId === numericId && r.type === 'collection');
                 
                 if (req) {
                     if (req.status === 'pending') setRequestStatus('sent');
                     else if (req.status === 'accepted') setRequestStatus('accepted');
                 }
             } catch (err) {
                 console.error('Failed to fetch request status:', err);
             }
        };
        fetchStatus();
    }, [isAuthenticated, user?.id, numericId]);
    useEffect(() => {
        if (collection?.name && numericId && idParam) {
            trackVisit({
                targetId: numericId,
                publicId: idParam,
                targetType: 'collection',
                name: collection.name,
                description: collection.description,
                ownerName: ownerDisplayName
            });
        }
    }, [numericId, idParam, collection?.name, collection?.description, ownerDisplayName, trackVisit]);

    const handleProjectClick = (project: Project) => {
        const projectSlug = project.publicId || project.id;
        if (user?.id === collection?.userId || requestStatus === 'accepted') {
            router.push(`/project/${projectSlug}`);
        } else {
            router.push(`/project/${projectSlug}/preview?collection=${idParam}`);
        }
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
                pinnedProjectIds: newPinnedIds
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
        <div className="h-dvh overflow-y-auto bg-zinc-950 touch-pan-y">
            <Navbar showSearch={false}>
                {!isAuthenticated && (
                     <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => {
                                useAuthStore.getState().setReturnUrl(window.location.pathname);
                                setAuthMode('login');
                                setShowAuthModal(true);
                            }}
                            className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={() => {
                                useAuthStore.getState().setReturnUrl(window.location.pathname);
                                setAuthMode('signup');
                                setShowAuthModal(true);
                            }}
                            className="rounded-lg bg-[#355ea1] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                        >
                            Sign up
                        </button>
                    </div>
                )}
            </Navbar>
            <main className="mx-auto max-w-6xl px-6 py-8">
                <div className="mb-8 space-y-4">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-zinc-400 flex gap-2 items-center border-b border-transparent hover:border-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">

                            <ProjectInfoPopup
                                type="collection"
                                targetId={numericId || 0}
                                publicId={idParam}
                                name={collection.name}
                                description={collection.description}
                                updatedAt={collection.updatedAt}
                            />
                            <h1 className="text-3xl font-bold text-white max-w-2xl truncate" title={collection.name}>
                                {collection.name}
                            </h1>
                        </div>
                        
                        {user?.id !== owner?.id && (
                            requestStatus === 'accepted' ? (
                                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 whitespace-nowrap">
                                    <Check className="h-4 w-4" />
                                    Access Granted
                                </div>
                            ) : (
                                <button
                                    onClick={handleRequestAccess}
                                    disabled={requestStatus === 'loading' || requestStatus === 'sent'}
                                    className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {requestStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {requestStatus === 'sent' && <Check className="h-4 w-4 text-green-500" />}
                                    {requestStatus === 'sent' ? 'Request Sent' : 'Send edit request'}
                                </button>
                            )
                        )}
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
                                    onInfoClick={setProjectInfo}
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


                {/* Project Info Modal */}
                {projectInfo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setProjectInfo(null)} />
                        <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
                            <button
                                onClick={() => setProjectInfo(null)}
                                className="group relative flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all hover:bg-white/3 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <h3 className="mb-4 text-xl font-bold text-white pr-8">{projectInfo.name}</h3>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {projectInfo.description ? (
                                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{projectInfo.description}</p>
                                ) : (
                                    <p className="text-zinc-500 italic">No description provided.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    initialMode={authMode}
                />
            </main>
        </div>
    );
}
