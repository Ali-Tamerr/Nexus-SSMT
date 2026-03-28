'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import NextImage from 'next/image';
import { Info, Users, User, MoreHorizontal, LogOut, UserMinus, AlertTriangle } from 'lucide-react';
import { collaborationApi } from '@/lib/supabase/collaboration';
import { useAuthStore } from '@/store/useAuthStore';
import { useGraphStore } from '@/store/useGraphStore';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { realtimeSync } from '@/lib/supabase/realtime';

interface ProjectInfoPopupProps {
  type: 'project' | 'collection';
  targetId: number;
  description?: string | null;
  updatedAt?: string | null;
  name?: string | null;
  className?: string;
  isPreviewMode?: boolean;
}

export const ProjectInfoPopup = forwardRef<{ open: () => void }, ProjectInfoPopupProps>(({
  type,
  targetId,
  description,
  updatedAt,
  name,
  className = "",
  isPreviewMode = false
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMemberMenu, setActiveMemberMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'kick' | 'leave';
    member: any | null;
  }>({ isOpen: false, type: 'kick', member: null });

  const infoRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { showToast } = useToast();

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true)
  }));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Don't close if clicking inside the main popup
      if (infoRef.current && infoRef.current.contains(target)) return;
      // Don't close if clicking inside a portal-rendered dropdown
      const portalMenu = document.querySelector('[data-member-menu-portal]');
      if (portalMenu && portalMenu.contains(target)) return;
      setIsOpen(false);
      setActiveMemberMenu(null);
      setMenuPosition(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMembers = async () => {
    if (!targetId || isLoading) return;
    setIsLoading(true);
    try {
      let data = await collaborationApi.getMembers(type, targetId);

      // Ensure the list is a valid array
      if (!Array.isArray(data)) {
        data = [];
      }

      // Safety check: ensure current user is in the list if they have access
      if (user) {
        let normalizedData = data.map((m: any) => ({
          ...m,
          userId: m.userId || m.user_id,
          profile: m.profile || {
            displayName: m.display_name || 'Unknown User',
            email: m.email || '',
            avatarUrl: m.avatar_url || null
          }
        }));

        const isInList = normalizedData.some((m: any) => m.userId === user.id);
        if (!isInList) {
          // IMPORTANT: Only re-add to "Members" list if they actually have EDIT access.
          // If they only have View access (e.g. they left the project but are in the collection),
          // they are a "Viewer", not a "Member/Collaborator" in the technical sense for this popup.
          const canEdit = type === 'project'
            ? await collaborationApi.hasProjectEditAccess(targetId, user.id)
            : await collaborationApi.hasCollectionAccess(targetId, user.id);

          if (canEdit) {
            normalizedData.push({
              userId: user.id,
              role: user.id === currentProject?.userId ? 'owner' : 'editor',
              profile: {
                displayName: user.displayName || 'Me',
                email: user.email,
                avatarUrl: user.avatarUrl
              }
            });
          }
        }
        setMembers(normalizedData);
      } else {
        setMembers(data);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    } else {
      setActiveMemberMenu(null);
      setMenuPosition(null);
    }
  }, [isOpen, targetId, type]);

  useEffect(() => {
    const handleScroll = () => {
      setActiveMemberMenu(null);
      setMenuPosition(null);
    };
    if (activeMemberMenu) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [activeMemberMenu]);

  const currentProject = useGraphStore(state => state.currentProject);

  const currentUserMember = members.find(m => (m.userId || m.user_id) === user?.id);
  const isOwner = currentUserMember?.role === 'owner' || (user?.id === currentProject?.userId);

  const handleAction = async (member: any, actionType: 'kick' | 'leave') => {
    setConfirmDialog({
      isOpen: true,
      type: actionType,
      member
    });
    setActiveMemberMenu(null);
    setMenuPosition(null);
  };

  const executeAction = async () => {
    const { type: actionType, member } = confirmDialog;
    if (!member) return;

    const memberId = member.userId || member.user_id;

    try {
      await collaborationApi.removeMember(type, targetId, memberId);
      showToast(
        actionType === 'kick'
          ? `Kicked '${member.profile?.displayName || 'user'}' from the project`
          : `You have left the project as a collaborator`,
        'success'
      );

      if (actionType === 'leave') {
        window.location.href = `/project/${targetId}/preview`;
        return;
      }

      if (actionType === 'kick' && type === 'project') {
        await realtimeSync.notifyAccessRevoked(targetId, memberId);
      }

      fetchMembers();
    } catch (err: any) {
      console.error('Action failed:', err);
      showToast(`Failed to complete action: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  return (
    <div className={`relative ${className}`} ref={infoRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center rounded-full ${isOpen
            ? 'text-white bg-zinc-800'
            : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
          } transition-all w-8 h-8 sm:w-6 sm:h-6 shrink-0 cursor-pointer border border-transparent hover:border-zinc-700/50`}
        title={description ? "Project information" : "No description"}
      >
        <Info className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="fixed md:absolute inset-x-4 md:inset-x-auto md:top-full md:left-0 top-16 md:mt-3 md:w-[550px] rounded-xl border border-zinc-800 shadow-2xl z-100 flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-top-2 zoom-in-95 duration-200 pointer-events-auto max-h-[calc(100vh-100px)] md:max-h-none"
          style={{ backgroundColor: '#18181b', isolation: 'isolate' }}
        >
          {/* Description Section */}
          <div className="flex-1 flex flex-col max-h-[350px] sm:max-h-[350px] border-b sm:border-b-0 sm:border-r border-zinc-800" style={{ backgroundColor: '#18181b' }}>
            <div className="px-4 py-3 border-b border-zinc-800 flex flex-col gap-0.5 bg-zinc-900/50">
              {name && (
                <div className="mb-2 md:hidden">
                  <h3 className="text-base font-bold text-white leading-tight">
                    {name}
                  </h3>
                  {isPreviewMode && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">Preview Mode</p>
                  )}
                </div>
              )}
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
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
          <div className="flex-1 flex flex-col max-h-[350px] sm:max-h-[350px]" style={{ backgroundColor: '#18181b' }}>
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900" style={{ backgroundColor: '#18181b' }}>
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
                        <div className="h-8 w-8 rounded-full bg-zinc-700 shrink-0 flex items-center justify-center overflow-hidden border border-zinc-600">
                          {member.profile?.avatarUrl || member.profile?.avatar_url ? (
                            <NextImage
                              src={member.profile.avatarUrl || member.profile.avatar_url}
                              alt={member.profile.displayName || member.profile.display_name}
                              width={32}
                              height={32}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#355ea1] text-[13px] text-white uppercase">
                              {(member.profile?.displayName || member.profile?.display_name || member.profile?.email || 'U')
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-white truncate">
                            {member.profile?.displayName || member.profile?.display_name || 'Unknown User'}
                            {(member.userId || member.user_id) === user?.id && (
                              <span className="ml-1.5 text-[10px] text-zinc-500 font-normal">(you)</span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate">
                            {member.profile?.email || 'No email provided'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(member.role === 'owner' || member.userId === currentProject?.userId) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-400 shrink-0 ml-2">
                            owner
                          </span>
                        ) : (
                          <div className="relative">
                            {/* Member can leave, Owner can kick */}
                            {((isOwner) || ((member.userId || member.user_id) === user?.id)) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuPosition({
                                    top: rect.bottom + window.scrollY,
                                    left: rect.right + window.scrollX - 176 // 176 is w-44
                                  });
                                  setActiveMemberMenu(activeMemberMenu === (member.userId || member.user_id) ? null : (member.userId || member.user_id));
                                }}
                                className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-500 hover:text-white"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            )}

                            {activeMemberMenu === (member.userId || member.user_id) && menuPosition && createPortal(
                              <div
                                data-member-menu-portal
                                className="fixed w-44 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl p-1 z-200 animate-in fade-in slide-in-from-top-1 duration-150"
                                style={{
                                  top: menuPosition.top + 4,
                                  left: menuPosition.left
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(member.userId || member.user_id) === user?.id ? (
                                  <button
                                    onClick={() => handleAction(member, 'leave')}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                                  >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Leave as collaborator
                                  </button>
                                ) : isOwner && (
                                  <button
                                    onClick={() => handleAction(member, 'kick')}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                                  >
                                    <UserMinus className="h-3.5 w-3.5" />
                                    Kick from project
                                  </button>
                                )}
                              </div>,
                              document.body
                            )}
                          </div>
                        )}
                      </div>
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
      {/* Confirmation Dialog Overlay */}
      {confirmDialog.isOpen && createPortal(
        <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-semibold text-white text-center mb-2">
              {confirmDialog.type === 'kick' ? 'Kick Member?' : 'Leave Project?'}
            </h3>

            <p className="text-sm text-zinc-400 text-center mb-6">
              {confirmDialog.type === 'kick'
                ? `Are you sure you want to remove '${confirmDialog.member?.profile?.displayName || 'this user'}' from the project? They will lose all access.`
                : 'Are you sure you want to leave this project as a collaborator? You will not be able to edit it anymore.'
              }
            </p>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={executeAction}
              >
                {confirmDialog.type === 'kick' ? 'Kick Member' : 'Leave Project'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

ProjectInfoPopup.displayName = 'ProjectInfoPopup';
