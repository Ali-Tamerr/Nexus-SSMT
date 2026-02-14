'use client';

import { ProjectCollection } from '@/types/knowledge';
import { Folder, MoreVertical, Trash2, ExternalLink, Share2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { ShareModal } from '@/components/ui/ShareModal';

interface GroupListProps {
    groups: ProjectCollection[];
    onDelete: (id: number) => void;
}

export function GroupList({ groups, onDelete }: GroupListProps) {
    const [shareUrl, setShareUrl] = useState<string | null>(null);

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Folder className="h-16 w-16 text-zinc-700" />
                <p className="mt-4 text-lg text-zinc-400">No groups found</p>
                <p className="text-sm text-zinc-500">Select projects to create a group</p>
            </div>
        );
    }

    const handleShare = (e: React.MouseEvent, group: ProjectCollection) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/collections/${group.id}/preview`;
        setShareUrl(url);
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-white group-hover:text-[#355ea1] transition-colors">
                                    {group.name}
                                </h3>
                                <p className="text-sm text-zinc-500 line-clamp-2">
                                    {group.description || 'No description'}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => handleShare(e, group)}
                                    className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-blue-400 transition-colors"
                                    title="Share Group"
                                >
                                    <Share2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(group.id)}
                                    className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-500 transition-colors"
                                    title="Delete Group"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                            <span>{group.projects?.length || 0} Projects</span>
                            <Link
                                href={`/collections/${group.id}/preview`}
                                className="flex items-center gap-1 hover:text-zinc-300"
                            >
                                View <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <ShareModal
                isOpen={!!shareUrl}
                onClose={() => setShareUrl(null)}
                shareUrl={shareUrl || ''}
            />
        </>
    );
}
