import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { RecentVisit } from '@/types/knowledge';

const LOCAL_STORAGE_KEY = 'nexus_recent_visits';

export function useRecentVisits() {
  const { user, isAuthenticated } = useAuthStore();
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecent = useCallback(async () => {
    if (isAuthenticated && user?.id) {
      setIsLoading(true);
      try {
        const visits = await api.recentVisits.getRecent(user.id);
        setRecentVisits(visits);
      } catch (err) {
        // Fallback or just empty
      } finally {
        setIsLoading(false);
      }
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          setRecentVisits(JSON.parse(stored));
        } catch (e) {
          setRecentVisits([]);
        }
      }
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const trackVisit = useCallback(async (item: Omit<RecentVisit, 'id' | 'visitedAt'>) => {
    const visitedAt = new Date().toISOString();
    
    if (isAuthenticated && user?.id) {
      try {
        await api.recentVisits.trackVisit({
          userId: user.id,
          targetId: item.targetId,
          targetType: item.targetType
        });
        fetchRecent();
      } catch (err) {
        console.error('Failed to track visit in API:', err);
      }
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      let list: RecentVisit[] = stored ? JSON.parse(stored) : [];
      
      // Remove existing visit for same target
      list = list.filter(v => !(v.targetId === item.targetId && v.targetType === item.targetType));
      
      const newVisit: RecentVisit = {
        ...item,
        id: Date.now(),
        visitedAt
      };
      
      list = [newVisit, ...list].slice(0, 10);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      setRecentVisits(list);
    }
  }, [isAuthenticated, user?.id, fetchRecent]);

  return {
    recentVisits,
    isLoading,
    trackVisit,
    refreshRecent: fetchRecent
  };
}
