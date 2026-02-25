'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause,
  Hand, MousePointer2, Square, Diamond, Circle,
  ArrowRight, Minus, Pencil, Type, Eraser,
  Undo2, Redo2, Share2
} from 'lucide-react';
import { GraphSettings, DrawingTool } from '@/types/knowledge';

import { useGraphStore } from '@/store/useGraphStore';
import { ShareModal } from '@/components/ui/ShareModal';

interface GraphControlsProps {
  settings: GraphSettings;
  onSettingsChange: (settings: Partial<GraphSettings>) => void;
}

const drawingTools: { id: DrawingTool; icon: typeof Hand; label: string }[] = [
  { id: 'pan', icon: Hand, label: 'Pan' },
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'diamond', icon: Diamond, label: 'Diamond' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'pen', icon: Pencil, label: 'Draw' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export function GraphControls({ settings, onSettingsChange }: GraphControlsProps) {
  const undo = useGraphStore(state => state.undo);
  const redo = useGraphStore(state => state.redo);
  const canUndo = useGraphStore(state => state.undoStack.length > 0);
  const canRedo = useGraphStore(state => state.redoStack.length > 0);
  const currentProject = useGraphStore(state => state.currentProject);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftShadow(scrollLeft > 0);
      // Use a small tolerance of 1px for floating point scroll values
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // Update shadows when resizing or mode switching might change content width
  useEffect(() => {
    checkScroll();
  }, [settings.activeTool, settings.isPreviewMode]);

  const setActiveTool = (tool: DrawingTool) => {
    onSettingsChange({ activeTool: tool });
  };

  return (
    <>
      {!settings.isPreviewMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center graph-ui-hide max-w-[95vw]">
          <div className="relative flex items-center rounded-xl bg-zinc-900/90 p-1.5 backdrop-blur-sm border border-zinc-800 shadow-sm overflow-hidden">

            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full"
            >
              {drawingTools.map((tool) => {
                const Icon = tool.icon;
                const isActive = settings.activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`p-2 rounded-lg transition-all flex-shrink-0 ${isActive
                      ? 'bg-[#355ea1] text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    title={tool.label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            {/* Left Shadow Overlay */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-zinc-900 to-transparent pointer-events-none transition-opacity duration-200 rounded-l-xl ${showLeftShadow ? 'opacity-100' : 'opacity-0'}`}
              style={{ paddingLeft: '6px' }} // Match container padding roughly
            />

            {/* Right Shadow Overlay */}
            <div
              className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-zinc-900 to-transparent pointer-events-none transition-opacity duration-200 rounded-r-xl ${showRightShadow ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        </div>
      )}

      {!settings.isPreviewMode && settings.activeTool === 'pen' && (
        <div className="absolute max-md:hidden top-[80px] left-1/2 -translate-x-1/2 z-30 text-xs text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800 pointer-events-none w-max shadow-sm graph-ui-hide">
          Click and drag, release when you're finished
        </div>
      )}

      {settings.isPreviewMode && (
        <div className="absolute max-md:hidden top-6 left-1/2 -translate-x-1/2 z-30 text-xs text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800 pointer-events-none w-max shadow-sm graph-ui-hide">
          Click on a node to view the details and links
        </div>
      )}

      <div className="absolute right-2.5 top-[4.5rem] z-30 flex flex-col items-end gap-2 graph-ui-hide md:top-4">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-900/90 p-2 backdrop-blur-sm border border-zinc-800">
          <PreviewControl
            enabled={settings.isPreviewMode}
            onToggle={() => onSettingsChange({ isPreviewMode: !settings.isPreviewMode })}
          />

          <div className="h-6 w-px bg-zinc-700" />

          <ShareControl projectId={currentProject?.id} />
        </div>

        {!settings.isPreviewMode && (
          <div className="flex items-center gap-2 rounded-xl bg-zinc-900/90 p-2 backdrop-blur-sm border border-zinc-800">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${canUndo
                ? 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            <div className="h-6 w-px bg-zinc-700" />

            <button
              onClick={redo}
              disabled={!canRedo}
              className={`flex items-center justify-center gap-2 flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${canRedo
                ? 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Redo</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

interface PreviewControlProps {
  enabled: boolean;
  onToggle: () => void;
}

function PreviewControl({ enabled, onToggle }: PreviewControlProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${enabled
        ? 'bg-green-600 text-white'
        : 'bg-zinc-800 text-zinc-400 hover:text-white'
        }`}
      title={enabled ? "Exit preview mode" : "Enter preview mode - view as visitors will see it"}
    >
      {enabled ? (
        <Pause className="h-3.5 w-3.5" />
      ) : (
        <Play className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{enabled ? 'Exit Preview' : 'Preview'}</span>
    </button>
  );
}

interface ShareControlProps {
  projectId?: number;
}

function ShareControl({ projectId }: ShareControlProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shareUrl = projectId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/project/${projectId}/preview`
    : '';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={!projectId}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-[#355ea1] text-white hover:bg-[#2563EB] ${!projectId ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Share project"
      >
        <Share2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shareUrl={shareUrl}
      />
    </>
  );
}
