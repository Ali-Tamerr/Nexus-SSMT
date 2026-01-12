'use client';

import {
  Lock, Unlock, Play, Pause,
  Hand, MousePointer2, Square, Diamond, Circle,
  ArrowRight, Minus, Pencil, Type, Image, Eraser
} from 'lucide-react';
import { GraphSettings, DrawingTool } from '@/types/knowledge';

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
  { id: 'image', icon: Image, label: 'Image' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export function GraphControls({ settings, onSettingsChange }: GraphControlsProps) {
  const setActiveTool = (tool: DrawingTool) => {
    onSettingsChange({ activeTool: tool });
  };

  return (
    <>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-xl bg-zinc-900/90 p-1.5 backdrop-blur-sm border border-zinc-800">
        {drawingTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = settings.activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-2 rounded-lg transition-all ${isActive
                ? 'bg-[#3B82F6] text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              title={tool.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {settings.activeTool === 'pen' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 text-xs text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
          Click and drag, release when you're finished
        </div>
      )}

      <div className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-xl bg-zinc-900/90 p-2 backdrop-blur-sm border border-zinc-800">
        <PreviewControl
          enabled={settings.isPreviewMode}
          onToggle={() => onSettingsChange({ isPreviewMode: !settings.isPreviewMode })}
        />

        <div className="h-6 w-px bg-zinc-700" />

        <LockControl
          enabled={settings.lockAllMovement}
          onToggle={() => onSettingsChange({ lockAllMovement: !settings.lockAllMovement })}
        />
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
        ? 'bg-zinc-800 text-zinc-400 hover:text-white'
        : 'bg-green-600 text-white'
        }`}
      title="When enabled, nodes can move freely with physics simulation"
    >
      {enabled ? (
        <Pause className="h-3.5 w-3.5" />
      ) : (
        <Play className="h-3.5 w-3.5" />
      )}
      <span>Preview</span>
    </button>
  );
}

interface LockControlProps {
  enabled: boolean;
  onToggle: () => void;
}

function LockControl({ enabled, onToggle }: LockControlProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${enabled
        ? 'bg-red-600 text-white'
        : 'bg-zinc-800 text-zinc-400 hover:text-white'
        }`}
      title="When enabled, all nodes are locked and cannot be moved"
    >
      {enabled ? (
        <Lock className="h-3.5 w-3.5" />
      ) : (
        <Unlock className="h-3.5 w-3.5" />
      )}
      <span>Lock All</span>
    </button>
  );
}
