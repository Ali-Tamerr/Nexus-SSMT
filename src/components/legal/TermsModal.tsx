'use client';

import { X, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { TERMS_SECTIONS, LAST_UPDATED } from '@/lib/termsContent';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="terms-modal-title" className="text-base font-semibold text-white">
                Terms and Conditions
              </h2>
              <p className="text-xs text-zinc-400">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Close Terms modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm text-zinc-300 leading-relaxed">
          <p className="text-zinc-400 text-xs">
            Please read these terms carefully before creating an account or using the Nexus platform.
          </p>

          {TERMS_SECTIONS.map((section) => (
            <div key={section.id} className="space-y-2">
              <h3 className="font-semibold text-white text-sm">
                {section.title}
              </h3>
              {section.content.map((paragraph, idx) => (
                <p key={idx} className="text-zinc-400 text-xs sm:text-sm">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/60 shrink-0">
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>Open full page</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
