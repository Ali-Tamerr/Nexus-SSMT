import { useCallback, useRef, useState } from 'react';
import { useGraphStore } from '@/store/useGraphStore';
import { detectTextDir } from '@/components/graph/canvasTextScale';

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

interface UseNodeCanvasRendererProps {
  selectedNodeIds: Set<number>;
  setSelectedNodeIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setSelectedShapeIds: (ids: Set<number>) => void;
  setIsHoveringNode: (v: boolean) => void;
  wasGlobalDragRef: React.RefObject<boolean>;
  dragStartPosRef: React.RefObject<{ x: number; y: number } | null>;
}

export function useNodeCanvasRenderer({
  selectedNodeIds,
  setSelectedNodeIds,
  setSelectedShapeIds,
  setIsHoveringNode,
  wasGlobalDragRef,
  dragStartPosRef,
}: UseNodeCanvasRendererProps) {
  const nodes = useGraphStore(s => s.nodes);
  const links = useGraphStore(s => s.links);
  const activeNode = useGraphStore(s => s.activeNode);
  const setActiveNode = useGraphStore(s => s.setActiveNode);
  const setHoveredNode = useGraphStore(s => s.setHoveredNode);
  const searchQuery = useGraphStore(s => s.searchQuery);
  const groups = useGraphStore(s => s.groups);

  const [selectedLink, setSelectedLink] = useState<any | null>(null);
  const [hoveredLink, setHoveredLink] = useState<any | null>(null);
  const lastHoveredNodeIdRef = useRef<string | null>(null);

  const handleNodeClick = useCallback(
    (nodeObj: { id?: string | number; x?: number; y?: number }, event: MouseEvent) => {
      const state = useGraphStore.getState();
      if (state.isConnectionPickerActive) {
        state.setConnectionPickerResult(Number(nodeObj.id));
        state.setConnectionPickerActive(false);
        return;
      }

      if (wasGlobalDragRef.current) return;

      if (dragStartPosRef.current && event.clientX !== undefined && event.clientY !== undefined) {
        const dx = event.clientX - dragStartPosRef.current.x;
        const dy = event.clientY - dragStartPosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) return;
      }

      const node = nodes.find((n) => n.id === nodeObj.id);
      if (node && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        setActiveNode(node);
      }

      const nodeId = Number(nodeObj.id);
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        setSelectedNodeIds(prev => {
          const next = new Set(prev);
          if (next.has(nodeId)) {
            next.delete(nodeId);
          } else {
            next.add(nodeId);
          }
          return next;
        });
      } else {
        setSelectedShapeIds(new Set());
        setSelectedNodeIds(new Set([nodeId]));
      }
    },
    [nodes, setActiveNode]
  );

  const handleNodeHover = useCallback(
    (nodeObj: { id?: string | number } | null) => {
      if (nodeObj) {
        const nodeId = Number(nodeObj.id);
        lastHoveredNodeIdRef.current = String(nodeId);
        const node = nodes.find((n) => n.id === nodeId);
        setHoveredNode(node || null);
        setIsHoveringNode(true);
      } else {
        setHoveredNode(null);
        setIsHoveringNode(false);
      }
    },
    [nodes, setHoveredNode]
  );

  const handleLinkClick = useCallback((link: any) => {
    const fullLink = links.find(l =>
      (l.sourceId === link.source.id || l.sourceId === link.source) &&
      (l.targetId === link.target.id || l.targetId === link.target)
    );
    if (fullLink) {
      setSelectedLink({
        ...fullLink,
        source: link.source,
        target: link.target,
      });
    }
  }, [links]);

  const handleLinkHover = useCallback((link: any) => {
    if (link) {
      setHoveredLink(link);
    } else {
      setHoveredLink(null);
    }
  }, []);

  const nodeCanvasObject = useCallback(
    (
      node: { id?: string | number; x?: number; y?: number; title?: string; groupId?: number; customColor?: string; visualSize?: number },
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      const label = node.title || '';
      const nodeGroup = node.groupId ?? 0;
      const vSize = node.visualSize || 1.0;
      const fontSize = 13 * Math.sqrt(vSize);
      ctx.font = `500 ${fontSize}px "Amiri", "Segoe UI Arabic", "Noto Sans Arabic", "Times New Roman", Tahoma, Arial, sans-serif`;

      const nodeId = Number(node.id);
      const isActive = activeNode?.id === nodeId;
      const isSelected = selectedNodeIds.has(nodeId);
      const isSearchMatch =
        searchQuery &&
        label.toLowerCase().includes(searchQuery.toLowerCase());

      const baseColor = node.customColor || groups.find(g => g.order === nodeGroup)?.color || groups[0]?.color || '#8B5CF6';
      const nodeRadius = 6 * vSize;
      const x = node.x || 0;
      const y = node.y || 0;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#355ea1';
        ctx.lineWidth = 2 / globalScale;
        ctx.setLineDash([4 / globalScale, 2 / globalScale]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (isActive) {
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.fill();
      }

      if (isSearchMatch) {
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = baseColor;
      ctx.fill();

      ctx.strokeStyle = adjustBrightness(baseColor, -20);
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const nodeDir = detectTextDir(label);
      if ('direction' in ctx) ctx.direction = nodeDir === 'rtl' ? 'rtl' : 'ltr';
      ctx.fillText(label, x, y + nodeRadius + 3);
      if ('direction' in ctx) ctx.direction = 'ltr';
    },
    [activeNode, searchQuery, selectedNodeIds, groups]
  );

  const linkColor = useCallback((link: unknown) => {
    const l = link as { color?: string; source?: any; target?: any };
    // Use a more visible default blue if no color specified
    const baseColor = l.color || '#3b82f6';

    const isHovered = hoveredLink &&
      ((hoveredLink.source === l.source || hoveredLink.source?.id === l.source?.id) &&
        (hoveredLink.target === l.target || hoveredLink.target?.id === l.target?.id));

    if (isHovered) return baseColor;
    
    // Only append alpha if it's a HEX color, otherwise it breaks names like 'blue' or 'violet'
    if (baseColor.startsWith('#') && baseColor.length === 7) {
      return baseColor + '80';
    }
    
    return baseColor;
  }, [hoveredLink]);

  const linkWidth = useCallback(
    (link: unknown) => {
      const l = link as { source?: string | { id?: string }; target?: string | { id?: string } };
      const srcId = typeof l.source === 'string' ? l.source : l.source?.id;
      const tgtId = typeof l.target === 'string' ? l.target : l.target?.id;

      const isHovered = hoveredLink &&
        ((typeof hoveredLink.source === 'string' ? hoveredLink.source === srcId : hoveredLink.source?.id === srcId) &&
          (typeof hoveredLink.target === 'string' ? hoveredLink.target === tgtId : hoveredLink.target?.id === tgtId));

      const isActive = activeNode?.id === srcId || activeNode?.id === tgtId;

      return isHovered ? 3 : (isActive ? 2 : 1);
    },
    [activeNode, hoveredLink]
  );

  return {
    handleNodeClick,
    handleNodeHover,
    handleLinkClick,
    handleLinkHover,
    nodeCanvasObject,
    linkColor,
    linkWidth,
    selectedLink,
    setSelectedLink,
    hoveredLink,
    lastHoveredNodeIdRef,
  };
}
