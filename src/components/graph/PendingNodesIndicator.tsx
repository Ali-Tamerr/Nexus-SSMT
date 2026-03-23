'use client';

import { useGraphStore } from '@/store/useGraphStore';
import { CircleDot, X } from 'lucide-react';

export function PendingNodesIndicator() {
  const { pendingNodes, setPendingNodes, graphSettings } = useGraphStore();
  const count = pendingNodes.length;

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#355ea1]/20 p-1 pr-2 backdrop-blur-sm border border-[#355ea1]/30 animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-blue-400">
        <CircleDot className="h-3.5 w-3.5 animate-pulse" />
        <span>{count} pending node{count > 1 ? 's' : ''}</span>
      </div>
      
      <button
        onClick={() => setPendingNodes([])}
        className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        title="Clear pending nodes"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
