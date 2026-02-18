
'use client';

import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGraphStore } from '@/store/useGraphStore';
import { useProjectCollectionStore } from '@/store/useProjectCollectionStore';
import { useEffect } from 'react';
import { api } from '@/lib/api';

export function AuthSync() {
    const { data: session, status } = useSession();
    const setUser = useAuthStore((s) => s.setUser);
    const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
    const setProjects = useGraphStore((s) => s.setProjects);
    const setCurrentProject = useGraphStore((s) => s.setCurrentProject);
    const setCollections = useProjectCollectionStore((s) => s.setCollections);

    useEffect(() => {
        const syncUser = async () => {
            if (status === 'loading') {
                setAuthLoading(true);
                return;
            }

            if (status === 'authenticated' && session?.user?.email) {
                let userId = session.user.id;

                // Fallback: If session doesn't have ID (race condition or JWT issue), fetch from API
                if (!userId) {
                    try {
                        const provider = (session.user as any).provider || 'email';
                        const profile = await api.profiles.getByEmail(session.user.email, provider);
                        if (profile) userId = profile.id;
                    } catch (e) {
                        console.error('Failed to fetch user profile for sync', e);
                    }
                }

                const user = {
                    id: userId || '',
                    email: session.user.email,
                    displayName: session.user.name,
                    avatarUrl: session.user.image,
                    provider: (session.user as any).provider || 'email',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                setUser(user);
            } else if (status === 'unauthenticated') {
                setUser(null);
                setProjects([]);
                setCurrentProject(null);
                setCollections([]);
            }

            setAuthLoading(false);
        };

        syncUser();
    }, [session, status, setUser, setAuthLoading, setProjects, setCurrentProject, setCollections]);

    return null;
}
