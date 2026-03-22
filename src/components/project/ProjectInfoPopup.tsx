'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import NextImage from 'next/image';
import { Info, Users, User } from 'lucide-react';
import { collaborationApi } from '@/lib/supabase/collaboration';

interface ProjectInfoPopupProps {
  type: 'project' | 'collection';
  targetId: number;
  description?: string | null;
  updatedAt?: string | null;
  className?: string;
}

export const ProjectInfoPopup = forwardRef<{ open: () => void }, ProjectInfoPopupProps>(({ 
  type, 
  targetId, 
  description, 
  updatedAt,
  className = ""
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true)
  }));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMembers = async () => {
    if (!targetId || isLoading) return;
    setIsLoading(true);
    try {
      const data = await collaborationApi.getMembers(type, targetId);
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, targetId, type]);

  return (
    <div className={`relative ${className}`} ref={infoRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center rounded-full ${
          isOpen 
            ? 'text-white bg-zinc-800' 
            : 'text-zinc-500 hover:text-white'
        } transition-all w-8 h-8 sm:w-5 sm:h-5 shrink-0 cursor-pointer`}
        title={description ? "Project information" : "No description"}
      >
        <Info className="w-full h-full" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-[95%] sm:w-[550px] rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl z-[100] flex flex-col sm:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          {/* Description Section */}
          <div className="flex-1 flex flex-col max-h-[350px] sm:max-h-[350px] border-b sm:border-b-0 sm:border-r border-zinc-800">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/50">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {type === 'project' ? 'Project Description' : 'Collection Description'}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-700 min-h-[100px]">
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {description || (
                  <span className="text-zinc-600 italic">No description provided for this {type}.</span>
                )}
              </p>
            </div>
            {updatedAt && (
              <div className="p-3 border-t border-zinc-800/50 text-[10px] text-zinc-500 bg-zinc-900/30">
                Last edit: {new Date(updatedAt).toLocaleDateString()}
              </div>
            )}
          </div>
          
          {/* Members Section */}
          <div className="flex-1 flex flex-col max-h-[350px] sm:max-h-[350px]">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {type === 'project' ? 'Project Members' : 'Collection Members'}
              </span>
              {isLoading && (
                <div className="h-3 w-3 animate-spin rounded-full border border-zinc-600 border-t-zinc-300" />
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700 min-h-[150px]">
              {members.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {members.map((member) => (
                    <div 
                      key={member.userId || member.user_id} 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center overflow-hidden border border-zinc-600">
                          {member.profile?.avatarUrl || member.profile?.avatar_url ? (
                            <NextImage 
                              src={member.profile.avatarUrl || member.profile.avatar_url} 
                              alt={member.profile.displayName || member.profile.display_name} 
                              width={32} 
                              height={32} 
                            />
                          ) : (
                            <User className="h-4 w-4 text-zinc-400" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-white truncate">
                            {member.profile?.displayName || member.profile?.display_name || 'Unknown User'}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate">
                            {member.profile?.email || 'No email provided'}
                          </span>
                        </div>
                      </div>
                      {member.role === 'owner' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-400 shrink-0 ml-2">
                          owner
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Users className="h-6 w-6 text-zinc-700 mb-2" />
                  <p className="text-xs text-zinc-500">No members found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ProjectInfoPopup.displayName = 'ProjectInfoPopup';
