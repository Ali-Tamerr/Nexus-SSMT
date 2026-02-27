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

const drawingTools: { id: DrawingTool; icon: typeof Hand; label: string; keyBind?: string }[] = [
  { id: 'pan', icon: Hand, label: 'Pan', keyBind: 'H' },
  { id: 'select', icon: MousePointer2, label: 'Select', keyBind: 'V' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', keyBind: 'M' },
  { id: 'diamond', icon: Diamond, label: 'Diamond', keyBind: 'M' },
  { id: 'circle', icon: Circle, label: 'Circle', keyBind: 'M' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow', keyBind: 'A' },
  { id: 'line', icon: Minus, label: 'Line', keyBind: 'L' },
  { id: 'pen', icon: Pencil, label: 'Draw', keyBind: 'P' },
  { id: 'text', icon: Type, label: 'Text', keyBind: 'T' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', keyBind: 'E' },
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

  const mPressCountRef = useRef<number>(0);
  const mPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (settings.isPreviewMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement || activeEl?.getAttribute('contenteditable') === 'true') {
        return;
      }

      // Prevent triggering if modifiers are pressed (except Shift which might be used intentionally, though usually not)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key.toLowerCase();

      if (key !== 'm') {
        mPressCountRef.current = 0;
      }

      switch (key) {
        case 'h':
          setActiveTool('pan');
          break;
        case 'v':
          setActiveTool('select');
          break;
        case 'a':
          setActiveTool('arrow');
          break;
        case 'l':
          setActiveTool('line');
          break;
        case 'p':
          setActiveTool('pen');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 'm':
          // Increment press count
          mPressCountRef.current += 1;

          if (mPressCountRef.current === 1) {
            setActiveTool('rectangle');
          } else if (mPressCountRef.current === 2) {
            setActiveTool('diamond');
          } else if (mPressCountRef.current >= 3) {
            setActiveTool('circle');
            mPressCountRef.current = 0; // Reset after circle
          }

          // Reset count if not pressed again within 1 second
          if (mPressTimerRef.current) clearTimeout(mPressTimerRef.current);
          mPressTimerRef.current = setTimeout(() => {
            mPressCountRef.current = 0;
          }, 1000);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (mPressTimerRef.current) clearTimeout(mPressTimerRef.current);
    };
  }, [settings.isPreviewMode, setActiveTool]);

  return (
    <>
      {!settings.isPreviewMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center graph-ui-hide max-w-[95vw]">
          <div className="relative flex items-center rounded-xl bg-zinc-900/90 p-1.5 backdrop-blur-sm border border-zinc-800 shadow-sm overflow-hidden">

            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex items-center gap-1 overflow-x-auto scrollbar-none  max-w-full"
            >
              {/* Group 1: Pan, Select */}
              {drawingTools.slice(0, 2).map((tool) => {
                const Icon = tool.icon;
                const isActive = settings.activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`p-2 rounded-lg transition-all flex-shrink-0 flex flex-col items-center justify-center gap-2.5 ${isActive
                      ? 'bg-[#355ea1] text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    title={`${tool.label} (${tool.keyBind})`}
                  >
                    <Icon className="h-4 w-4" />
                    {tool.keyBind && (
                      <span className="text-[10px] leading-none font-medium opacity-60 hidden md:block">
                        {tool.keyBind}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Group 2: Shape shortcuts (Rectangle, Diamond, Circle) combining 'M' */}
              <div className="relative flex items-center gap-1 z-0">
                {/* Visual Pill Background for M keys */}
                <div className="absolute left-[4px] right-[4px] bottom-1 h-[18px] bg-zinc-900/95 backdrop-blur-sm rounded-full pointer-events-none hidden md:block z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.1)] border border-zinc-700/30" />

                {drawingTools.slice(2, 5).map((tool, index) => {
                  const Icon = tool.icon;
                  const isActive = settings.activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`relative p-2 rounded-lg flex-shrink-0 flex flex-col items-center justify-center gap-2.5 transition-colors duration-200 ${isActive
                        ? 'text-white'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white bg-transparent'
                        }`}
                      title={`${tool.label} (${tool.keyBind})`}
                    >
                      {/* Active Background Layer separated to allow precise z-layering with the pill */}
                      {isActive && (
                        <div className="absolute inset-0 bg-[#355ea1] shadow-sm rounded-lg -z-10" />
                      )}

                      <Icon className="h-4 w-4 relative z-20 pointer-events-none" />
                      <span className={`text-[10px] leading-none font-medium hidden md:block relative z-[30] pointer-events-none ${index === 1 ? 'visible text-zinc-500' : 'opacity-0'}`} aria-hidden="true">
                        {tool.keyBind}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Group 3: Remaining tools */}
              {drawingTools.slice(5).map((tool) => {
                const Icon = tool.icon;
                const isActive = settings.activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`p-2 rounded-lg transition-all flex-shrink-0 flex flex-col items-center justify-center gap-2.5 ${isActive
                      ? 'bg-[#355ea1] text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    title={`${tool.label} (${tool.keyBind})`}
                  >
                    <Icon className="h-4 w-4" />
                    {tool.keyBind && (
                      <span className="text-[10px] leading-none font-medium opacity-60 hidden md:block">
                        {tool.keyBind}
                      </span>
                    )}
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
        <div className="absolute max-md:hidden top-[80px] left-1/2 -translate-x-1/2 z-28 text-xs text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800 pointer-events-none w-max shadow-sm graph-ui-hide">
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
