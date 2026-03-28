'use client';

import { useState, useRef, useEffect } from 'react';
import { History, X, Clock, FolderKanban, Layers, Search } from 'lucide-react';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import { useRouter } from 'next/navigation';
import { RecentVisit } from '@/types/knowledge';

export function RecentVisitsTab() {
  const { recentVisits, isLoading } = useRecentVisits();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (visit: RecentVisit) => {
    setIsOpen(false);
    if (visit.targetType === 'project') {
      router.push(`/project/${visit.targetId}/preview`);
    } else {
      router.push(`/collection/${visit.targetId}/preview`);
    }
  };

  const filteredVisits = recentVisits.filter(visit => 
    visit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (visit.description && visit.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (visit.ownerName && visit.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs font-semibold text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white glow-border"
        title="Recently Visited"
      >
        <History className="h-4 w-4" />
        <span>Recently Visited</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-3 w-[min(450px,calc(100vw-3rem))] origin-top-left rounded-2xl border border-zinc-800 bg-zinc-900/98 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800/50 pb-3 px-1">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your Activity</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              autoFocus
              type="text"
              placeholder="Search your recent activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:border-zinc-700"
            />
          </div>

          <div className="max-h-[min(500px,70vh)] overflow-y-auto custom-scrollbar pr-1">
            {recentVisits.length === 0 ? (
              <div className="py-12 text-center text-zinc-600">
                <Clock className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm">No recent activity yet</p>
                <p className="mt-1 text-xs opacity-50">Visit a project to track it here!</p>
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="py-12 text-center text-zinc-600">
                <Search className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm">No results for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredVisits.map((visit) => (
                  <button
                    key={`${visit.targetType}-${visit.targetId}`}
                    onClick={() => handleItemClick(visit)}
                    className="group relative flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all hover:bg-white/5"
                  >
                    <div 
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800 group-hover:scale-105 transition-transform"
                      style={{ borderLeft: visit.color ? `4px solid ${visit.color}` : 'none' }}
                    >
                      {visit.targetType === 'project' ? (
                        <FolderKanban className="h-6 w-6 text-zinc-400 group-hover:text-blue-400" />
                      ) : (
                        <Layers className="h-6 w-6 text-zinc-400 group-hover:text-violet-400" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-base font-semibold text-zinc-200 group-hover:text-white">
                          {visit.name}
                        </span>
                        <span className="text-xs text-zinc-600 whitespace-nowrap">
                          {new Date(visit.visitedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <span className="truncate text-xs text-zinc-500">
                        {visit.ownerName ? `by ${visit.ownerName}` : visit.description || 'No description provided'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
