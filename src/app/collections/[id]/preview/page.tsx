'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Link2, ExternalLink } from 'lucide-react';
import { ProjectCollection, Project } from '@/types/knowledge';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout';
import { ProjectCard } from '@/components/projects/ProjectCard';

export default function CollectionPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params?.id);

    const [collection, setCollection] = useState<ProjectCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const fetchCollection = async () => {
            if (!id) return;

            try {
                const data = await api.projectCollections.getById(id);
                setCollection(data);
                // If the backend returns populated projects, use them. 
                // Otherwise we might need to fetch them if only IDs are returned.
                // Assuming backend returns populated projects as per spec:
                if (data.projects) {
                    setProjects(data.projects);
                } else if (data.items) {
                    // Fallback if projects are nested in items
                    setProjects(data.items.map(i => i.project).filter(Boolean) as Project[]);
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

    const handleProjectClick = (project: Project) => {
        // Open project in preview mode or editor
        // Since this is a public view, maybe open in a read-only preview? 
        // For now, redirect to project preview if possible, or editor.
        // Ideally: /project/[id]/preview
        router.push(`/project/${project.id}/preview`);
    };

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
            <Navbar showSearch={false}>
                <button
                    onClick={() => router.push('/')}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    Back to Dashboard
                </button>
            </Navbar>

            <main className="mx-auto max-w-6xl px-6 py-8">
                <div className="mb-8 space-y-2">
                    <div className="flex items-center gap-3">
                        <Link2 className="h-6 w-6 text-[#355ea1]" />
                        <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
                    </div>
                    {collection.description && (
                        <p className="text-lg text-zinc-400 max-w-2xl">{collection.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-zinc-500 pt-2">
                        <span>Created {new Date(collection.createdAt).toLocaleDateString()}</span>
                        {collection.userId && <span>• by User ID: {collection.userId.slice(0, 8)}...</span>}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={handleProjectClick}
                            viewMode="grid"
                        // Read only view, no delete/edit
                        />
                    ))}
                </div>

                {projects.length === 0 && (
                    <div className="text-center py-20 text-zinc-500">
                        This group has no projects.
                    </div>
                )}
            </main>
        </div>
    );
}
