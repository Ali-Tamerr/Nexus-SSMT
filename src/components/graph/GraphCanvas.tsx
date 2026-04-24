'use client';

import dynamic from 'next/dynamic';
import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { useGraphStore, filterNodes } from '@/store/useGraphStore';
import { useToast } from '@/context/ToastContext';
import { DrawingProperties } from './DrawingProperties';
import { ConnectionProperties } from './ConnectionProperties';
import { drawShapeOnContext, isPointNearShape, drawSelectionBox, isShapeInMarquee, drawMarquee } from './drawingUtils';
import { getShapeBounds, drawResizeHandles, getHandleAtPoint, resizeShape, rotateShape, getCursorForHandle, ResizeHandle, ShapeBounds, getResizeHandlePosition } from './resizeUtils';
import { getCanvasTextScale, detectTextDir } from "./canvasTextScale";
import { SelectionPane } from './SelectionPane';
import { GroupsTabs, getNextGroupColor } from './GroupsTabs';
import { DrawnShape } from '@/types/knowledge';
import { api, ApiDrawing } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { realtimeSync } from '@/lib/supabase/realtime';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
}) as any;

import { forwardRef, useImperativeHandle } from 'react';
import { LoadingOverlay } from '../ui';
import { useGraphExportLogic } from '@/hooks/useGraphExportLogic';
import { useMapZoom } from '@/hooks/useMapZoom';
import { useGraphKeyboardShortcuts } from '@/hooks/useGraphKeyboardShortcuts';
import { useGraphDrawingHandlers } from '@/hooks/useGraphDrawingHandlers';
import { useGraphMouseHandlers } from '@/hooks/useGraphMouseHandlers';
import { useGraphDataEffects } from '@/hooks/useGraphDataEffects';
import { useNodeCanvasRenderer } from '@/hooks/useNodeCanvasRenderer';

export type GraphCanvasHandle = {
  exportToPNG: () => void;
  exportToJPG: () => void;
};

export const GraphCanvas = forwardRef<GraphCanvasHandle>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isMounted, setIsMounted] = useState(false);

  const { processExport } = useGraphExportLogic({ containerRef, graphRef });

  useImperativeHandle(ref, () => ({
    exportToPNG: () => processExport('png'),
    exportToJPG: () => processExport('jpg'),
  }));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const nodes = useGraphStore((s) => s.nodes);
  const links = useGraphStore((s) => s.links);
  const shapes = useGraphStore((s) => s.shapes);
  const activeNode = useGraphStore((s) => s.activeNode);
  const setActiveNode = useGraphStore((s) => s.setActiveNode);
  const setHoveredNode = useGraphStore((s) => s.setHoveredNode);
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const graphSettings = useGraphStore((s) => s.graphSettings);
  const setGraphSettings = useGraphStore((s) => s.setGraphSettings);
  const { showToast, showConfirmation } = useToast();

  const groups = useGraphStore(state => state.groups);
  const activeGroupId = useGraphStore(state => state.activeGroupId);
  const setGroups = useGraphStore(state => state.setGroups);
  const setActiveGroupId = useGraphStore(state => state.setActiveGroupId);
  const addGroup = useGraphStore(state => state.addGroup);
  const updateGroup = useGraphStore(state => state.updateGroup);
  const deleteGroup = useGraphStore(state => state.deleteGroup);

  const { user } = useAuthStore();
  const pendingNodes = useGraphStore(s => s.pendingNodes);
  const setPendingNodes = useGraphStore(s => s.setPendingNodes);
  const addNode = useGraphStore(s => s.addNode);
  const setNodes = useGraphStore(s => s.setNodes);
  const setShapes = useGraphStore(s => s.setShapes);
  const undo = useGraphStore(s => s.undo);
  const redo = useGraphStore(s => s.redo);
  const pushToUndoStack = useGraphStore(s => s.pushToUndoStack);
  const deleteNode = useGraphStore(s => s.deleteNode);
  const deleteShape = useGraphStore(s => s.deleteShape);

  const [selectedNodeIds, _setSelectedNodeIds] = useState<Set<number>>(new Set());
  const [isOutsideContent, setIsOutsideContent] = useState(false);

  // Hoisted State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number; worldX: number; worldY: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState('');

  const [selectedShapeIds, _setSelectedShapeIds] = useState<Set<number>>(new Set());
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isHoveringShape, setIsHoveringShape] = useState(false);
  const [isHoveringNode, setIsHoveringNode] = useState(false);
  const dragStartWorldRef = useRef<{ x: number; y: number } | null>(null);
  const [dragStartWorld, setDragStartWorld] = useState<{ x: number; y: number } | null>(null);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const dragNodePrevRef = useRef<{ x: number; y: number } | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const activeResizeHandleRef = useRef<ResizeHandle | null>(null);
  const resizeStartBoundsRef = useRef<ShapeBounds | null>(null);
  const resizeDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizingShapeIdRef = useRef<number | null>(null);
  const originalShapeRef = useRef<DrawnShape | null>(null);
  const currentResizingShapeRef = useRef<DrawnShape | null>(null);
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeUpdateCounter, setResizeUpdateCounter] = useState(0);
  const [editingShapeId, setEditingShapeId] = useState<number | null>(null);

  const [isMiddleMousePanning, setIsMiddleMousePanning] = useState(false);
  const middleMouseStartRef = useRef<{ x: number; y: number } | null>(null);

  const [showSelectionPane, setShowSelectionPane] = useState(false);
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const textInputPosRef = useRef(textInputPos);
  const textAreaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textInputPosRef.current = textInputPos;
  }, [textInputPos]);

  const [groupsReady, setGroupsReady] = useState(false);

  const filteredNodes = useMemo(
    () => {
      let result = filterNodes(nodes, searchQuery);
      if (activeGroupId !== null) {
        // Filter nodes by the active group ID. 
        // We handle the case where n.groupId might be undefined by defaulting to 0 or another fallback if needed.
        // Assuming backend uses 0 for default.
        result = result.filter(n => n.groupId === activeGroupId);
      }
      return result;
    },
    [nodes, searchQuery, activeGroupId]
  );

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);



  const nodeCacheRef = useRef<Map<string | number, any>>(new Map());
  const linkCacheRef = useRef<Map<string | number, any>>(new Map());
  const nodeSaveTimeoutsRef = useRef<Map<string | number, any>>(new Map());
  const shapeSaveTimeoutsRef = useRef<Map<string | number, any>>(new Map());
  const shapeStateSaveTimeoutRef = useRef<any>(null);

  const graphDataObjRef = useRef<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const lastDataChangeFitTimeRef = useRef<number>(0);

  const graphData = useMemo(() => {
    // 1. Process Nodes with Cache
    const nodeCache = nodeCacheRef.current;

    // Create a set of active IDs for cleanup (optional, but good practice)
    // const activeNodeIds = new Set(filteredNodes.map(n => n.id));

    const graphNodes = filteredNodes.map((n) => {
      let cached = nodeCache.get(n.id);
      if (!cached) {
        cached = { id: n.id };
        nodeCache.set(n.id, cached);
      }

      // Update properties on stable object
      cached.title = n.title;
      cached.content = n.content;
      cached.groupId = n.groupId;
      cached.customColor = n.customColor;
      cached.visualSize = n.visualSize;
      cached.attachments = n.attachments;
      cached.tags = n.tags;

      // Update positions
      // We update fx/fy to control position (ForceGraph treats fx/fy as fixed/pinned)
      // We also update x/y to ensure current position reflects store state immediately
      cached.fx = n.x;
      cached.fy = n.y;
      cached.x = n.x;
      cached.y = n.y;

      return cached;
    });

    const filteredNodeIds = new Set(graphNodes.map((n) => n.id));

    // 2. Process Links with Cache
    const linkCache = linkCacheRef.current;

    const graphLinks = links
      .filter(
        (l) => filteredNodeIds.has(l.sourceId) && filteredNodeIds.has(l.targetId)
      )
      .map((l) => {
        let cached = linkCache.get(l.id);
        if (!cached) {
          cached = { id: l.id };
          linkCache.set(l.id, cached);
        }

        // Check if source/target changed (topology update)
        // ForceGraph mutates source/target to Objects. We check ID.
        const currentSourceId = (typeof cached.source === 'object' && cached.source) ? cached.source.id : cached.source;
        const currentTargetId = (typeof cached.target === 'object' && cached.target) ? cached.target.id : cached.target;

        if (currentSourceId !== l.sourceId) cached.source = l.sourceId;
        if (currentTargetId !== l.targetId) cached.target = l.targetId;

        // Update props
        cached.color = l.color;
        cached.description = l.description;

        return cached;
      });

    graphDataObjRef.current.nodes = graphNodes;
    graphDataObjRef.current.links = graphLinks;

    return graphDataObjRef.current;
  }, [filteredNodes, links]);

  const isNodeDraggingRef = useRef(false);
  const lastDragTimeRef = useRef(0);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const wasGlobalDragRef = useRef(false);
  const isMarqueeSelectingRef = useRef(false);
  const marqueeStartScreenPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchRef = useRef<{ dist: number; center: { x: number; y: number } } | null>(null);











  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [graphTransform, setGraphTransform] = useState({ x: 0, y: 0, k: 1 });

  const currentProject = useGraphStore(state => state.currentProject);
  const addShape = useGraphStore(state => state.addShape);
  const updateShape = useGraphStore(state => state.updateShape);
  const updateNode = useGraphStore(state => state.updateNode);

  // Sync shapesRef with shapes state
  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);








  const isDrawingTool = ['pen', 'rectangle', 'diamond', 'circle', 'arrow', 'line', 'eraser'].includes(graphSettings.activeTool);
  const isTextTool = graphSettings.activeTool === 'text';
  const isSelectTool = graphSettings.activeTool === 'select';
  const isPanTool = graphSettings.activeTool === 'pan' || (!isDrawingTool && !isTextTool && !isSelectTool);

  const getToolCursor = () => {
    if (useGraphStore.getState().isConnectionPickerActive) return 'crosshair';

    if (graphSettings.isPreviewMode) {
      return isHoveringNode ? 'pointer' : 'default';
    }

    if (isSelectTool) {
      if (isMiddleMousePanning) return 'grabbing';
      if (hoveredResizeHandle) return getCursorForHandle(hoveredResizeHandle);
      if (isHoveringNode || isHoveringShape) return 'pointer';
      return 'default';
    }

    if (isPanTool) {
      if (isHoveringNode || isHoveringShape) return 'pointer';
      return 'grab';
    }

    if (isTextTool) return 'text';
    if (graphSettings.activeTool === 'node') return 'crosshair';
    if (graphSettings.activeTool === 'eraser') return 'crosshair';
    if (isDrawingTool) return 'crosshair';
    return 'default';
  };







  useMapZoom({ containerRef, graphRef, graphTransform });

  const {
    apiDrawingToShape,
    shapeToApiDrawing,
  } = useGraphDataEffects({
    graphRef,
    selectedShapeIds,
    graphData,
    dimensions,
    isResizing,
    isMarqueeSelecting,
    isDraggingSelection,
    isMiddleMousePanning,
    isNodeDragging,
    editingShapeId,
    textInputPos,
    setIsOutsideContent,
    setGroupsReady,
  });


  // Handle Undo/Redo and Delete shortcuts
  // Filter shapes strictly by active group (match node filtering)
  const filteredShapes = useMemo(() => {
    if (activeGroupId === null || activeGroupId === undefined) {
      return shapes;
    }
    return shapes.filter(s => s.groupId === activeGroupId);
  }, [shapes, activeGroupId]);

  const editingShape = useMemo(() => {
    return editingShapeId ? shapes.find(s => s.id === editingShapeId) : null;
  }, [shapes, editingShapeId]);

  // Removed aggressive data cleanup block that caused node deletions
  // due to race conditions during page hydration and component mounting.
  // Group-related node & shape deletions are now strictly handled by GroupsTabs.tsx

  const shapesRef = useRef(filteredShapes);
  const selectedShapeIdsRef = useRef(selectedShapeIds);
  const selectedNodeIdsRefForDelete = useRef(selectedNodeIds);
  const selectedNodeIdsRef = useRef(selectedNodeIds);

  const setSelectedNodeIds = useCallback((value: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (typeof value === 'function') {
      _setSelectedNodeIds(prev => {
        const next = value(prev);
        selectedNodeIdsRef.current = next;
        selectedNodeIdsRefForDelete.current = next;
        return next;
      });
    } else {
      selectedNodeIdsRef.current = value;
      selectedNodeIdsRefForDelete.current = value;
      _setSelectedNodeIds(value);
    }
  }, []);

  const setSelectedShapeIds = useCallback((value: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (typeof value === 'function') {
      _setSelectedShapeIds(prev => {
        const next = value(prev);
        selectedShapeIdsRef.current = next;
        return next;
      });
    } else {
      selectedShapeIdsRef.current = value;
      _setSelectedShapeIds(value);
    }
  }, []);

  const {
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
  } = useNodeCanvasRenderer({
    selectedNodeIds,
    setSelectedNodeIds,
    setSelectedShapeIds,
    setIsHoveringNode,
    wasGlobalDragRef,
    dragStartPosRef,
  });

  const lastNodeClickTimeRef = useRef<number>(0);

  // Clipboard Ref for Copy/Paste
  const clipboardRef = useRef<{ nodes: any[]; shapes: any[] } | null>(null);

  // selectedShapeIdsRef is already defined above
  const graphDataRef = useRef(graphData);
  graphDataRef.current = graphData; // Update immediately in render body
  useGraphKeyboardShortcuts({
    shapesRef,
    selectedShapeIdsRef,
    selectedNodeIdsRef,
    selectedNodeIdsRefForDelete,
    clipboardRef,
    graphDataRef,
    nodeCacheRef,
    nodeSaveTimeoutsRef,
    shapeSaveTimeoutsRef,
    shapeStateSaveTimeoutRef,
    graphRef,
    graphTransform,
    shapeToApiDrawing,
    setShapes,
    setNodes,
    setSelectedShapeIds,
    setSelectedNodeIds,
    setActiveNode
  });


  /* Sync Refs for Render Loop */
  const editingShapeIdRef = useRef(editingShapeId);
  editingShapeIdRef.current = editingShapeId;

  // Ensure shapesRef is up to date for the render loop
  // DISABLED: Overwrites manual mutations before state syncs
  // shapesRef.current = shapes;

  /* Manual Group Drag Refs */
  const hoveredNode = useGraphStore(s => s.hoveredNode);
  const dragGroupRef = useRef<{
    active: boolean;
    startMouse: { x: number; y: number };
    startNodePos: { x: number; y: number };
    nodeId: string;
    initialNodes: Map<string, { x: number; y: number; fx?: number; fy?: number }>;
    initialShapes: Map<string, DrawnShape['points']>;
  } | null>(null);

  const handleZoom = useCallback((transform: { x: number; y: number; k: number }) => {
    setTimeout(() => setGraphTransform(transform), 0);
  }, []);

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!graphRef.current?.screen2GraphCoords) {
      const k = graphTransform.k || 1;
      return {
        x: (screenX - graphTransform.x) / k,
        y: (screenY - graphTransform.y) / k
      };
    }
    const coords = graphRef.current.screen2GraphCoords(screenX, screenY);
    return { x: coords.x, y: coords.y };
  }, [graphTransform]);

  const {
    drawPreview,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    onRenderFramePost,
  } = useGraphDrawingHandlers({
    graphRef,
    containerRef,
    previewCanvasRef,
    shapesRef,
    editingShapeIdRef,
    resizingShapeIdRef,
    currentResizingShapeRef,
    textInputPosRef,
    textAreaContainerRef,
    graphTransform,
    screenToWorld,
    isDrawing,
    setIsDrawing,
    startPoint,
    setStartPoint,
    currentPoints,
    setCurrentPoints,
    filteredShapes,
    isMarqueeSelecting,
    marqueeStart,
    marqueeEnd,
    selectedShapeIds,
    isResizing,
    resizeUpdateCounter,
    editingShapeId,
    groupsReady,
    shapeToApiDrawing,
    setSelectedShapeIds,
  });

  const {
    handleContainerMouseMove,
    handleContainerMouseDownCapture,
    handleContainerMouseUpCapture,
    handleSelectMouseDown,
    handleNodeDrag,
    handleNodeDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContainerDoubleClick,
    handleCanvasTouchStart,
    handleCanvasTouchMove,
    handleCanvasTouchEnd,
  } = useGraphMouseHandlers({
    graphRef,
    containerRef,
    shapesRef,
    graphDataRef,
    selectedShapeIdsRef,
    selectedNodeIdsRef,
    dragStartWorldRef,
    dragNodePrevRef,
    dragStartPosRef,
    wasGlobalDragRef,
    isNodeDraggingRef,
    isMarqueeSelectingRef,
    marqueeStartScreenPosRef,
    lastPinchRef,
    lastHoveredNodeIdRef,
    lastNodeClickTimeRef,
    lastDragTimeRef,
    middleMouseStartRef,
    activeResizeHandleRef,
    resizeStartBoundsRef,
    resizeDragStartRef,
    resizingShapeIdRef,
    originalShapeRef,
    currentResizingShapeRef,
    dragGroupRef,
    graphTransform,
    screenToWorld,
    filteredShapes,
    selectedShapeIds,
    selectedNodeIds,
    isMiddleMousePanning,
    setIsMiddleMousePanning,
    isResizing,
    setIsResizing,
    setResizeUpdateCounter,
    isDraggingSelection,
    setIsDraggingSelection,
    dragStartWorld,
    setDragStartWorld,
    isMarqueeSelecting,
    setIsMarqueeSelecting,
    marqueeStart,
    setMarqueeStart,
    marqueeEnd,
    setMarqueeEnd,
    isHoveringShape,
    setIsHoveringShape,
    isHoveringNode,
    hoveredResizeHandle,
    setHoveredResizeHandle,
    setIsNodeDragging,
    isSelectTool,
    isPanTool,
    setSelectedShapeIds,
    setSelectedNodeIds,
    setShowSelectionPane,
    setEditingShapeId,
    setTextInputValue,
    setTextInputPos,
    setIsDrawing,
    shapeToApiDrawing,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  });


  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-transparent overflow-hidden"
      style={{
        cursor: getToolCursor(),
        overscrollBehavior: 'none',
        touchAction: 'none',
      }}
      suppressHydrationWarning
      onMouseMove={handleContainerMouseMove}
      onMouseDownCapture={handleContainerMouseDownCapture}
      onMouseDown={handleSelectMouseDown}
      onMouseUpCapture={handleContainerMouseUpCapture}
      onDoubleClick={handleContainerDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isMounted ? (
        <>
          <div
            style={{
              cursor: getToolCursor(),
            }}
            className="[&_canvas]:cursor-[inherit]! overflow-hidden"
          >
            <ForceGraph2D
              ref={graphRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeCanvasObject={nodeCanvasObject}
              nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                if (!node.x || !node.y) return;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI, false);
                ctx.fill();
              }}
              nodeLabel={() => ''}
              linkColor={linkColor}
              linkWidth={linkWidth}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.1}
              onRenderFramePost={onRenderFramePost}
              onNodeClick={(node: any, event: MouseEvent) => {
                const state = useGraphStore.getState();
                if (state.isConnectionPickerActive) {
                  state.setConnectionPickerResult(Number(node.id));
                  state.setConnectionPickerActive(false);
                  return;
                }
                handleNodeClick(node, event);
              }}
              onNodeHover={handleNodeHover}
              onNodeDrag={handleNodeDrag}
              onNodeDragEnd={handleNodeDragEnd}
              onLinkClick={handleLinkClick}
              onLinkHover={handleLinkHover}
              onBackgroundClick={(evt: any) => {
                if (useGraphStore.getState().isConnectionPickerActive) return;
                if (wasGlobalDragRef.current) return;
                const timeSinceNodeClick = Date.now() - lastNodeClickTimeRef.current;
                if (timeSinceNodeClick < 300) return;

                if (graphSettings.activeTool === 'node') {
                   const screenX = evt.clientX;
                   const screenY = evt.clientY;
                   const rect = containerRef.current!.getBoundingClientRect();
                   const worldPoint = screenToWorld(screenX - rect.left, screenY - rect.top);
                   (async () => {
                     const projectId = currentProject?.id;
                     if (!projectId || !user?.id) return;
                     let groupId = typeof activeGroupId === 'number' ? activeGroupId : 0;
                     if (groupId === 0) {
                        try {
                          const groups = await api.groups.getByProject(projectId);
                          if (groups && groups.length > 0) groupId = groups[0].id;
                        } catch (e) {}
                     }
                     
                     if (pendingNodes && pendingNodes.length > 0) {
                        const radius = Math.sqrt(pendingNodes.length) * 40;
                        const batchToCreate = pendingNodes.map(p => ({ ...p, x: worldPoint.x + (Math.random()-0.5)*radius, y: worldPoint.y + (Math.random()-0.5)*radius, groupId, userId: user.id }));
                        try {
                          const newNodes = await api.nodes.batchCreate(batchToCreate);
                          if (newNodes) { newNodes.forEach(n => addNode(n)); setPendingNodes([]); }
                        } catch (e) {}
                     } else {
                        try {
                          const newNode = await api.nodes.create({ title: 'New Node', content: '', projectId, groupId, customColor: '#8B5CF6', visualSize: 1.0, x: worldPoint.x, y: worldPoint.y, userId: user.id });
                          if (newNode) { addNode(newNode); setActiveNode(newNode); useGraphStore.getState().toggleEditor(true); }
                        } catch (e) {}
                     }
                     setGraphSettings({ activeTool: 'select' });
                   })();
                   return;
                }
                setActiveNode(null);
                setSelectedLink(null);
                setSelectedNodeIds(new Set());
                setSelectedShapeIds(new Set());
                setShowSelectionPane(false);
              }}
              nodeId="id"
              onZoom={handleZoom}
              enableNodeDrag={!graphSettings.lockAllMovement && !isDrawingTool && !isPanTool}
              enableZoomInteraction={isSelectTool || isPanTool}
              enablePanInteraction={isPanTool}
              cooldownTicks={100}
              d3AlphaDecay={0.05}
              d3VelocityDecay={0.4}
              backgroundColor="transparent"
            />
            <style>{`
              body.graph-interacting .graph-ui-hide {
                opacity: 0 !important;
                pointer-events: none !important;
                transition: opacity 0.2s;
              }
            `}</style>
          </div>
          <canvas
            ref={previewCanvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 15 }}
          />
          {isDrawingTool && (
            <div
              className="absolute inset-0"
              style={{
                cursor: getToolCursor(),
                pointerEvents: 'auto'
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onTouchStart={handleCanvasTouchStart}
              onTouchMove={handleCanvasTouchMove}
              onTouchEnd={handleCanvasTouchEnd}
            />
          )}
          {isSelectTool && (
            <div
              className="absolute inset-0"
              style={{
                pointerEvents: 'none',
                cursor: getToolCursor()
              }}

            />
          )}
          {isTextTool && (
            <div
              className="absolute inset-0 z-20 cursor-text"
              onTouchStart={handleCanvasTouchStart}
              onTouchMove={handleCanvasTouchMove}
              onTouchEnd={handleCanvasTouchEnd}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const screenX = e.clientX - rect.left;
                const screenY = e.clientY - rect.top;
                const worldPoint = screenToWorld(screenX, screenY);
                const scale = graphRef.current?.zoom() || graphTransform.k || 1;

                // Check if we clicked on an existing text shape
                const clickedTextShape = [...filteredShapes].reverse().find(s =>
                  s.type === 'text' && isPointNearShape(worldPoint, s, scale, 10)
                );

                if (clickedTextShape && graphRef.current) {
                  setEditingShapeId(clickedTextShape.id);
                  setTextInputValue(clickedTextShape.text || '');
                  setSelectedShapeIds(new Set([clickedTextShape.id]));
                  setSelectedNodeIds(new Set());

                  // Position input at shape anchor
                  const screenPos = graphRef.current.graph2ScreenCoords(clickedTextShape.points[0].x, clickedTextShape.points[0].y);
                  setTextInputPos({
                    x: screenPos.x + rect.left,
                    y: screenPos.y + rect.top,
                    worldX: clickedTextShape.points[0].x,
                    worldY: clickedTextShape.points[0].y
                  });
                } else {
                  setEditingShapeId(null);
                  setSelectedShapeIds(new Set());
                  setSelectedNodeIds(new Set());
                  setTextInputPos({ x: e.clientX, y: e.clientY, worldX: worldPoint.x, worldY: worldPoint.y });
                  setTextInputValue('');
                }
              }}
            />
          )}
          {textInputPos && (() => {
            const currentEditingId = editingShapeId;
            let screenPos = { x: textInputPos.x, y: textInputPos.y };
            if (graphRef.current && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const updatedScreen = graphRef.current.graph2ScreenCoords(textInputPos.worldX, textInputPos.worldY);
              screenPos = {
                x: updatedScreen.x + rect.left,
                y: updatedScreen.y + rect.top
              };
            }
            return (
              <div
                ref={textAreaContainerRef}
                key={currentEditingId || 'new'}
                className="absolute z-50 text-area-container"
                style={{
                  left: screenPos.x,
                  top: screenPos.y,
                  transform: (editingShape?.textDir || graphSettings.textDir || detectTextDir(editingShape?.text || textInputValue)) === 'rtl' ? 'translateX(-100%)' : 'none',
                  pointerEvents: 'auto',
                  display: 'grid',
                  width: 'max-content'
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    gridArea: '1 / 1',
                    visibility: 'hidden',
                    opacity: 0,
                    color: 'transparent',
                    pointerEvents: 'none',
                    whiteSpace: 'pre',
                    wordBreak: 'normal',
                    fontSize: ((editingShape?.fontSize || graphSettings.fontSize || 16) * (graphTransform.k || 1)),
                    fontFamily: `${editingShape?.fontFamily || graphSettings.fontFamily || 'Inter'}, "Amiri", "Segoe UI Arabic", "Noto Sans Arabic", "Times New Roman", Tahoma, Arial, sans-serif`,
                    lineHeight: 1.2,
                    minWidth: '50px',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                  }}
                >
                  {textInputValue + ' '}
                </div>
                <textarea
                  autoFocus
                  value={textInputValue}
                  onChange={(e) => {
                    setTextInputValue(e.target.value);
                  }}
                  rows={(textInputValue.match(/\n/g) || []).length + 1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.shiftKey) {
                        // Allow Shift+Enter for newline, don't prevent default
                        return;
                      } else {
                        // Enter to save and exit edit mode
                        e.preventDefault();
                        e.currentTarget.blur(); // Trigger save via onBlur
                      }
                    } else if (e.key === 'Escape') {
                      setTextInputPos(null);
                      setTextInputValue('');
                      setEditingShapeId(null);
                    }
                    e.stopPropagation();
                  }}
                  onBlur={(e) => {
                    const related = e.relatedTarget as HTMLElement;
                    if (related && (related.closest('.drawing-properties-panel') || related.closest('.color-picker-container'))) {
                      return;
                    }
                    const fallbackPos = textInputPos;
                    if (textInputValue.trim()) {
                      if (editingShapeId !== null) {
                        const finalDir = editingShape?.textDir || graphSettings.textDir;
                        updateShape(editingShapeId, { text: textInputValue.trim(), textDir: finalDir, fontFamily: editingShape?.fontFamily || graphSettings.fontFamily });
                        api.drawings.update(editingShapeId, {
                          ...(editingShape ? shapeToApiDrawing(editingShape, currentProject?.id || 0, activeGroupId ?? undefined) : {}),
                          text: textInputValue.trim(),
                          textDir: finalDir,
                          fontFamily: editingShape?.fontFamily || graphSettings.fontFamily
                        } as any)
                          .then(() => {
                            if (currentProject?.id && user?.id) {
                              realtimeSync.notifyUpdate(currentProject.id, user.id);
                            }
                          })
                          .catch();
                      } else if (fallbackPos) {
                        const newShape: DrawnShape = {
                          id: Date.now() * -1,
                          projectId: currentProject?.id || 0,
                          type: 'text',
                          points: [{ x: fallbackPos.worldX, y: fallbackPos.worldY }],
                          color: graphSettings.strokeColor,
                          width: 0,
                          style: 'solid',
                          text: textInputValue.trim(),
                          fontSize: graphSettings.fontSize || 16,
                          fontFamily: graphSettings.fontFamily || 'Inter',
                          textDir: graphSettings.textDir,
                          groupId: activeGroupId ?? undefined,
                          synced: false,
                        };
                        addShape(newShape);
                        if (currentProject?.id) {
                          const saveText = async () => {
                            let groupId = activeGroupId;
                            if (!groupId || groupId === 0) {
                              try {
                                const groups = await api.groups.getByProject(currentProject.id);
                                if (groups && groups.length > 0) groupId = groups[0].id;
                                else {
                                  const newGroup = await api.groups.create({ name: 'Default', color: '#808080', order: 0, projectId: currentProject.id });
                                  if (newGroup) groupId = newGroup.id;
                                }
                              } catch (e) { }
                            }
                            return api.drawings.create(shapeToApiDrawing(newShape, currentProject.id, groupId ?? undefined));
                          };

                          saveText()
                            .then(createdDrawing => {
                              updateShape(newShape.id, { id: createdDrawing.id });
                              if (currentProject?.id && user?.id) {
                                realtimeSync.notifyUpdate(currentProject.id, user.id);
                              }
                            })
                            .catch(() => { });
                        }
                      }
                    }
                    setTextInputPos(null);
                    setTextInputValue('');
                    setEditingShapeId(null);
                    setTimeout(() => {
                      if (graphRef.current) {
                        const z = graphRef.current.zoom();
                        graphRef.current.zoom(z * 1.00001, 0);
                        graphRef.current.zoom(z, 0);
                      }
                    }, 50);
                  }}
                  className="bg-transparent border-none outline-none text-white p-0 resize-none overflow-hidden"
                  style={{
                    gridArea: '1 / 1',
                    width: '100%',
                    height: '100%',
                    fontSize: ((editingShape?.fontSize || graphSettings.fontSize || 16) * (graphTransform.k || 1)),
                    fontFamily: `${editingShape?.fontFamily || graphSettings.fontFamily || 'Inter'}, "Amiri", "Segoe UI Arabic", "Noto Sans Arabic", "Times New Roman", Tahoma, Arial, sans-serif`,
                    color: editingShape?.color || graphSettings.strokeColor,
                    lineHeight: 1.2,
                    textAlign: (editingShape?.textDir || graphSettings.textDir || detectTextDir(editingShape?.text || textInputValue)) === 'rtl' ? 'right' : 'left',
                    whiteSpace: 'pre',
                    wordBreak: 'normal',
                    display: 'block',
                    willChange: 'width, height',
                    transform: 'translateZ(0)',
                  }}
                  placeholder="Type here..."
                  dir={(editingShape?.textDir || graphSettings.textDir || detectTextDir(editingShape?.text || textInputValue)) === 'rtl' ? 'rtl' : 'ltr'}
                />
              </div>
            );
          })()}
          <div
            className="graph-ui-hide"
            onMouseDown={(e) => {
              e.stopPropagation();
              if ((e.target as HTMLElement).tagName !== 'INPUT') {
                e.preventDefault();
              }
            }}
          >
            <DrawingProperties
              activeTool={graphSettings.activeTool}
              selectedShapeType={selectedShapeIds.size === 1 ? shapes.find(s => s.id === Array.from(selectedShapeIds)[0])?.type : undefined}
              strokeWidth={graphSettings.strokeWidth}
              strokeColor={graphSettings.strokeColor}
              strokeStyle={graphSettings.strokeStyle}
              fontSize={graphSettings.fontSize}
              fontFamily={graphSettings.fontFamily}
              textDir={graphSettings.textDir}
              onStrokeWidthChange={(w) => setGraphSettings({ strokeWidth: w })}
              onStrokeColorChange={(c) => setGraphSettings({ strokeColor: c })}
              onStrokeStyleChange={(s) => setGraphSettings({ strokeStyle: s })}
              onFontSizeChange={(s) => setGraphSettings({ fontSize: s })}
              onFontFamilyChange={(f) => setGraphSettings({ fontFamily: f })}
              onTextDirChange={(dir) => setGraphSettings({ textDir: dir })}
              onClose={() => setGraphSettings({ activeTool: 'select' })}
              onDelete={async () => {
                if (selectedShapeIds.size === 0 && !editingShapeId) {
                  showToast("No shape selected", "error");
                  return;
                }

                if (await showConfirmation("Are you sure you want to delete the selected item(s)?")) {
                  if (selectedShapeIds.size > 0) {
                    const ids = Array.from(selectedShapeIds);
                    ids.forEach(id => {
                      deleteShape(id);
                      api.drawings.delete(id).catch(() => { });
                    });
                    setSelectedShapeIds(new Set());
                  } else if (editingShapeId) {
                    deleteShape(editingShapeId);
                    api.drawings.delete(editingShapeId).catch(() => { });
                    setEditingShapeId(null);
                    setTextInputPos(null);
                  }
                  showToast("Deleted successfully");
                  if (currentProject?.id && user?.id) {
                    realtimeSync.notifyUpdate(currentProject.id, user.id);
                  }
                }
              }}
            />
          </div>
        </>
      ) : (
        <LoadingOverlay message="Loading graph..." />
      )}


      <div className="graph-ui-hide" onMouseDown={(e) => e.stopPropagation()}>
        <GroupsTabs
          groups={groups}
          activeGroupId={activeGroupId}
          onSelectGroup={setActiveGroupId}
          onAddGroup={async () => {
            const newName = `Group ${groups.length + 1}`;
            const newColor = getNextGroupColor(groups);

            try {
              const newGroup = await api.groups.create({ name: newName, color: newColor, projectId: currentProject!.id });
              const groupWithOrder = { ...newGroup, order: groups.length };
              addGroup(groupWithOrder);
              setActiveGroupId(newGroup.id);
              if (user?.id) {
                realtimeSync.notifyUpdate(currentProject?.id || 0, user.id);
              }
            } catch (err: any) {
              // console.error("Failed to create group:", err.message);
              showToast("Failed to create group. Please try again.", "error");
            }
          }}
          onRenameGroup={(id, newName) => {
            updateGroup(id, { name: newName });
            api.groups.update(id, { name: newName })
              .then(() => {
                if (currentProject?.id && user?.id) {
                  realtimeSync.notifyUpdate(currentProject.id, user.id);
                }
              })
              .catch(
              // rr => console.warn("Backend sync failed (Rename Group):", err.message)
            );
          }}
          onDeleteGroup={async (id) => {
            const groupToDelete = groups.find(g => g.id === id);
            const groupOrder = groupToDelete?.order;
            const nodesInGroup = nodes.filter(n => n.groupId === groupOrder);
            const shapesInGroup = shapes.filter(s => s.groupId === groupOrder);
            const nodeCount = nodesInGroup.length;
            const shapeCount = shapesInGroup.length;

            const groupName = groupToDelete?.name || 'this group';
            let message = `Are you sure you want to delete "${groupName}"?`;
            if (nodeCount > 0 || shapeCount > 0) {
              message += '\n\nThis will permanently delete:';
              if (nodeCount > 0) message += `\n• ${nodeCount} node${nodeCount > 1 ? 's' : ''}`;
              if (shapeCount > 0) message += `\n• ${shapeCount} drawing${shapeCount > 1 ? 's' : ''}`;
            }

            if (!await showConfirmation(message)) {
              return;
            }

            // Delete all nodes in this group
            for (const node of nodesInGroup) {
              deleteNode(node.id);
              api.nodes.delete(node.id).catch(() => { });
            }

            // Delete all shapes/drawings in this group
            for (const shape of shapesInGroup) {
              deleteShape(shape.id);
              api.drawings.delete(shape.id).catch(() => { });
            }

            // Delete the group locally
            deleteGroup(id);

            // Try backend delete silently, fall back to local hide
            try {
              await api.groups.delete(id);
              if (currentProject?.id && user?.id) {
                realtimeSync.notifyUpdate(currentProject.id, user.id);
              }
            } catch {
              const hidden = JSON.parse(localStorage.getItem('nexus_hidden_groups') || '[]');
              if (!hidden.includes(id)) {
                hidden.push(id);
                localStorage.setItem('nexus_hidden_groups', JSON.stringify(hidden));
              }
            }
          }}
          onReorderGroups={(newGroups) => {
            setGroups(newGroups);
            api.groups.reorder(newGroups.map(g => g.id))
              .then(() => {
                if (currentProject?.id && user?.id) {
                  realtimeSync.notifyUpdate(currentProject.id, user.id);
                }
              })
              .catch(
              // err => console.warn("Backend sync failed (Reorder Groups):", err.message)
            );
          }}
        />
      </div>

      {isOutsideContent && (
        <button
          onClick={() => {
            if (!graphRef.current) return;

            const allPoints: { x: number; y: number }[] = [];

            const currentGraphNodes = graphData.nodes as Array<{ x?: number; y?: number }>;
            currentGraphNodes.forEach(n => {
              if (n.x !== undefined && n.y !== undefined) {
                allPoints.push({ x: n.x, y: n.y });
              }
            });

            shapes.forEach(shape => {
              if (activeGroupId !== null && activeGroupId !== undefined && shape.groupId !== activeGroupId) return;

              let points = shape.points;
              if (typeof points === 'string') {
                try { points = JSON.parse(points); } catch (e) { points = []; }
              }
              if (Array.isArray(points)) {
                points.forEach(p => {
                  allPoints.push({ x: p.x, y: p.y });
                });
              }
            });

            if (allPoints.length === 0) return;

            const sumX = allPoints.reduce((acc, p) => acc + p.x, 0);
            const sumY = allPoints.reduce((acc, p) => acc + p.y, 0);
            const centerX = sumX / allPoints.length;
            const centerY = sumY / allPoints.length;

            graphRef.current.centerAt(centerX, centerY, 500);
            // graphRef.current.zoom(1, 500); // Removed to prevent automatic zooming/snapping
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-zinc-800/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all graph-ui-hide"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go back to content
        </button>
      )}

      <button
        onClick={() => setShowSelectionPane(!showSelectionPane)}
        onMouseDown={(e) => e.stopPropagation()}
        className={`absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-30 flex items-center gap-2 rounded-lg px-3 h-9 text-sm shadow-lg backdrop-blur-sm border transition-all graph-ui-hide ${showSelectionPane

          ? 'bg-zinc-700 text-white border-zinc-600'
          : 'bg-zinc-800/90 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white hover:border-zinc-600'
          }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="hidden sm:inline">Selection Pane</span>
      </button>

      {/* Selection Pane */}
      {showSelectionPane && (
        <div className="graph-ui-hide" onMouseDown={(e) => e.stopPropagation()}>
          <SelectionPane
            key={activeGroupId !== null ? `group-${activeGroupId}` : 'all'}
            isPreviewMode={graphSettings.isPreviewMode}
            nodes={activeGroupId !== null ? nodes.filter(n => n.groupId === activeGroupId) : nodes}
            shapes={activeGroupId !== null ? shapes.filter(s => s.groupId === activeGroupId) : shapes}
            selectedNodeIds={selectedNodeIds}
            selectedShapeIds={selectedShapeIds}
            onClose={() => setShowSelectionPane(false)}
            onLocateNode={(nodeId, x, y) => {
              if (graphRef.current) {
                graphRef.current.centerAt(x, y, 500);
                graphRef.current.zoom(1.5, 500);
              }
            }}
            onLocateShape={(shapeId) => {
              const shape = shapes.find(s => s.id === shapeId);
              if (shape && graphRef.current) {
                // Approximate center of shape
                let cx = 0, cy = 0;
                shape.points.forEach(p => { cx += p.x; cy += p.y; });
                cx /= shape.points.length;
                cy /= shape.points.length;
                graphRef.current.centerAt(cx, cy, 500);
                graphRef.current.zoom(1.5, 500);
              }
            }}
            onSelectNode={(nodeId) => {
              const node = nodes.find(n => n.id === nodeId);
              if (node) {
                setActiveNode(node);
                setSelectedNodeIds(new Set([nodeId]));
                setSelectedShapeIds(new Set());
              }
            }}
            onSelectShape={(shapeId) => {
              setSelectedShapeIds(new Set([shapeId]));
              setSelectedNodeIds(new Set());
              setActiveNode(null);
            }}
            onDeleteNode={(nodeId) => {
              const nodeToDelete = nodes.find(n => n.id === nodeId);
              if (nodeToDelete && currentProject?.id) {
                pushToUndoStack();
                deleteNode(nodeId);
                api.nodes.delete(nodeId).then(() => {
                  if (user?.id) {
                    realtimeSync.notifyUpdate(currentProject.id, user.id);
                  }
                }).catch(() => { });
                setSelectedNodeIds(new Set());
                setActiveNode(null);
              }
            }}
            onDeleteShape={(shapeId) => {
              if (currentProject?.id) {
                pushToUndoStack();
                deleteShape(shapeId);
                api.drawings.delete(shapeId).then(() => {
                  if (user?.id) {
                    realtimeSync.notifyUpdate(currentProject.id, user.id);
                  }
                }).catch(() => { });
                setSelectedShapeIds(new Set());
              }
            }}
          />
        </div>
      )}

      {selectedLink && (
        <div className="graph-ui-hide" onMouseDown={(e) => e.stopPropagation()}>
          <ConnectionProperties
            link={selectedLink}
            onClose={() => setSelectedLink(null)}
          />
        </div>
      )}
    </div>
  );
});

