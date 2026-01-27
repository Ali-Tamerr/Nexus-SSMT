'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User, ChevronDown, UserPen, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { ProfileModal, ModalMode } from './ProfileModal';
import { useToast } from '@/context/ToastContext';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('edit_profile');
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-800"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName || 'User'}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#355ea1] text-sm font-semibold text-white">
            {initials}
          </div>
        )}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-white">
            {user.displayName || 'User'}
          </p>
          <p className="text-xs text-zinc-500 truncate max-w-[120px]">
            {user.email}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-99 top-full mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900 py-2 shadow-xl">
          <div className="border-b border-zinc-800 px-4 pb-3 pt-1">
            <p className="font-medium text-white">{user.displayName || 'User'}</p>
            <p className="text-sm text-zinc-500 truncate">{user.email}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                if (user.provider === 'google') {
                  showToast("You can't edit profile because you're signed in with Google account", 'error');
                  setIsOpen(false);
                  return;
                }
                setModalMode('edit_profile');
                setShowProfileModal(true);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              <UserPen className="h-4 w-4" />
              Edit Profile
            </button>
            <button
              onClick={() => {
                if (user.provider === 'google') {
                  showToast("You can't change password because you're signed in with Google account", 'error');
                  setIsOpen(false);
                  return;
                }
                setModalMode('change_password');
                setShowProfileModal(true);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              <Lock className="h-4 w-4" />
              Change Password
            </button>
            {/* <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
              <Settings className="h-4 w-4" />
              Settings
            </button> */}
          </div>

          <div className="border-t border-zinc-800 pt-1">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} initialMode={modalMode} />
    </div>
  );
}
