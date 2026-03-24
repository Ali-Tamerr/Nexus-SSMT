'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Info, Search, ChevronDown, Save, ChevronRight, LayoutGrid, X, Share2, Check, Users, User } from 'lucide-react';
import NexusLogo from '@/assets/Logo/Logo with no circle.svg';
import { SearchInput } from '@/components/ui/Input';
import { createColorImage } from '@/lib/imageUtils';
import { ShareModal } from '@/components/ui/ShareModal';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { collaborationApi } from '@/lib/supabase/collaboration';
import { useToast } from '@/context/ToastContext';
import { ProjectInfoPopup } from '@/components/project/ProjectInfoPopup';

interface PreviewNavbarProps {
    projectName: string;
    projectDescription: string;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onExportPNG: () => void;
    onExportJPG: () => void;
    currentWallpaper?: string;
    onWallpaperChange?: (wallpaper: string) => void;
    projectUpdatedAt?: string;
    collectionId?: string | number | null;
    projectId?: number;
}

const WALLPAPER_COLORS = [
    '#000000', // Black
    '#09090b', // Midnight
    '#18181b', // Charcoal
    '#020617', // Deep Navy
    '#0f172a', // Slate
];

export function PreviewNavbar({
    projectName,
    projectDescription,
    searchQuery,
    setSearchQuery,
    onExportPNG,
    onExportJPG,
    currentWallpaper,
    onWallpaperChange,
    projectUpdatedAt,
    collectionId,
    projectId
}: PreviewNavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSaveAsMenuOpen, setIsSaveAsMenuOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'requested' | 'accepted'>('idle');

    const menuRef = useRef<HTMLDivElement>(null);
    const infoPopupRef = useRef<{ open: () => void } | null>(null);

    const { isAuthenticated, user, setReturnUrl } = useAuthStore();
    const { showToast } = useToast();

    const shareUrl = projectId
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/project/${projectId}/preview`
        : '';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as any)) {
                setIsMenuOpen(false);
                setIsSaveAsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, []);

    useEffect(() => {
        const fetchStatus = async () => {
             if (!isAuthenticated || !user?.id || !projectId) return;
             try {
                 // Check if user has access to this project (owner or collaborator)
                 const hasAccess = await collaborationApi.hasProjectAccess(projectId, user.id);
                 if (hasAccess) {
                     setRequestStatus('accepted');
                     return;
                 }

                 // If no direct access, check if there's a pending/requested status for the resource
                 const requests = await collaborationApi.getMyRequests(user.id);
                 const targetId = Number(collectionId || projectId);
                 const type = collectionId ? 'collection' : 'project';
                 const req = requests.find(r => r.targetId === targetId && r.type === type);
                 
                 if (req) {
                     if (req.status === 'pending') setRequestStatus('requested');
                     else if (req.status === 'accepted') setRequestStatus('accepted');
                 }
             } catch (err) {
                 console.error('Failed to fetch request status', err);
             }
        };
        fetchStatus();
    }, [isAuthenticated, user?.id, projectId, collectionId]);

    const handleColorSelect = (color: string) => {
        if (onWallpaperChange) {
            onWallpaperChange(color);
        }
    };

    const handleRequestAccess = async () => {
        if (!isAuthenticated) {
            setReturnUrl(window.location.pathname);
            setIsAuthModalOpen(true);
            return;
        }

        if (!user || (!projectId && !collectionId)) return;

        setRequestStatus('pending');
        try {
            const type = collectionId ? 'collection' : 'project';
            const targetId = Number(collectionId || projectId);
            await collaborationApi.requestAccess(type, targetId, user.id);
            setRequestStatus('requested');
            showToast('Access request sent successfully.', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to request access.', 'error');
            setRequestStatus('idle');
        }
    };

    return (
        <>
        <header 
            className="absolute top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800/10 bg-zinc-900/15 backdrop-blur-md px-4 pointer-events-none"
            style={{ isolation: 'isolate' }}
        >
                <div className="flex items-center gap-3 pointer-events-auto shrink-0">
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-0.5 transition-colors cursor-pointer hover:bg-zinc-800"
                        >
                            <div className="relative h-8 w-8">
                                <NextImage src={NexusLogo} alt="Nexus Logo" fill className="object-contain" />
                            </div>
                            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isMenuOpen && (
                            <div 
                                className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-zinc-800 shadow-xl p-1.5 z-50 flex flex-col gap-1"
                                style={{ backgroundColor: '#18181b', isolation: 'isolate' }}
                            >
                                <button
                                    onClick={() => {
                                        infoPopupRef.current?.open();
                                        setIsMenuOpen(false);
                                    }}
                                    className="sm:hidden flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                                >
                                    <Info className="w-4 h-4" />
                                    <span>Project Info</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setIsShareModalOpen(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="sm:hidden flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>Share</span>
                                </button>

                                <div className="sm:hidden my-1 border-t border-zinc-800" />

                                <div className="px-3 py-2">
                                    <p className="text-xs font-medium text-zinc-500 mb-2">Wallpaper</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {WALLPAPER_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => handleColorSelect(color)}
                                                className="w-6 h-6 rounded-full transition-transform cursor-pointer hover:scale-110 border border-zinc-700"
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="my-1 border-t border-zinc-800" />

                                <div className="relative">
                                    <button
                                        onClick={() => setIsSaveAsMenuOpen(!isSaveAsMenuOpen)}
                                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Save className="w-4 h-4" />
                                            <span>Save as</span>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>

                                    {isSaveAsMenuOpen && (
                                        <div className="absolute left-full top-0 ml-2 w-48 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl p-2 z-50">
                                            <p className="px-2 py-1 text-xs font-medium text-zinc-500 mb-1">Export as</p>
                                            <button
                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setIsSaveAsMenuOpen(false);
                                                    setIsMenuOpen(false);
                                                    onExportPNG();
                                                }}
                                            >
                                                <span>PNG</span>
                                            </button>
                                            <button
                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setIsSaveAsMenuOpen(false);
                                                    setIsMenuOpen(false);
                                                    onExportJPG();
                                                }}
                                            >
                                                <span>JPG</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="my-1 border-t border-zinc-800" />

                                <Link
                                    href={collectionId ? `/collections/${collectionId}/preview` : "/"}
                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    <span className="text-zinc-300">{collectionId ? "Back to Collection" : "Home"}</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="hidden sm:block h-6 w-px bg-zinc-800/50" />

                    <div className='flex items-center gap-3 relative'>
                        {projectId && (
                            <ProjectInfoPopup
                                ref={infoPopupRef}
                                type="project"
                                targetId={projectId}
                                description={projectDescription}
                                updatedAt={projectUpdatedAt}
                            />
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0 mx-4 pointer-events-auto">
                    <h1 className="text-xs sm:text-sm font-semibold text-white truncate">{projectName || 'Project'}</h1>
                    <p className="text-[10px] text-zinc-500">Preview Mode</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0 pointer-events-auto">
                    <div className="hidden sm:block w-48 lg:w-64">
                        <SearchInput
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search nodes..."
                        />
                    </div>

                    {isAuthenticated && user?.id ? (
                        requestStatus === 'accepted' ? (
                            <Link
                                href={`/project/${projectId}`}
                                className="hidden sm:flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/30"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Go to Editor
                            </Link>
                        ) : (
                            <button
                                onClick={handleRequestAccess}
                                disabled={requestStatus !== 'idle'}
                                className="hidden sm:flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {requestStatus === 'requested' ? 'Requested' : 'Request Access'}
                            </button>
                        )
                    ) : (
                        <div className="flex items-center space-x-3">
                           <button
                               onClick={() => {
                                   setReturnUrl(window.location.pathname);
                                   setAuthMode('login');
                                   setIsAuthModalOpen(true);
                               }}
                               className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                           >
                               Sign in
                           </button>
                           <button
                               onClick={() => {
                                   setReturnUrl(window.location.pathname);
                                   setAuthMode('signup');
                                   setIsAuthModalOpen(true);
                               }}
                               className="rounded-lg bg-[#355ea1] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                           >
                               Sign up
                           </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Floating Share Button (matches edit mode layout) */}
            <div className="absolute right-4 top-20 z-30 pointer-events-none sm:block hidden">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-900/90 p-2 backdrop-blur-sm border border-zinc-800 pointer-events-auto shadow-lg">
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-[#355ea1] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#2563EB]"
                        title="Share project"
                    >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                    </button>
                </div>
            </div>



            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareUrl={shareUrl}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
            />
        </>
    );
}
