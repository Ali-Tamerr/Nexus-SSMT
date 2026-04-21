import { useCallback, RefObject } from 'react';
import { useGraphStore } from '@/store/useGraphStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DrawnShape } from '@/types/knowledge';
import { api } from '@/lib/api';
import { realtimeSync } from '@/lib/supabase/realtime';
import { drawShapeOnContext, isPointNearShape, drawSelectionBox, drawMarquee } from '@/components/graph/drawingUtils';
import { getShapeBounds, drawResizeHandles } from '@/components/graph/resizeUtils';
import { detectTextDir } from '@/components/graph/canvasTextScale';

interface UseGraphDrawingHandlersProps {
  graphRef: RefObject<any>;
  containerRef: RefObject<HTMLDivElement | null>;
  previewCanvasRef: RefObject<HTMLCanvasElement | null>;
  shapesRef: RefObject<DrawnShape[]>;
  editingShapeIdRef: RefObject<number | null>;
  resizingShapeIdRef: RefObject<number | null>;
  currentResizingShapeRef: RefObject<DrawnShape | null>;
  textInputPosRef: RefObject<any>;
  textAreaContainerRef: RefObject<HTMLDivElement | null>;
  graphTransform: { k: number; x: number; y: number };
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  isDrawing: boolean;
  setIsDrawing: (v: boolean) => void;
  startPoint: { x: number; y: number } | null;
  setStartPoint: (v: { x: number; y: number } | null) => void;
  currentPoints: { x: number; y: number }[];
  setCurrentPoints: (v: { x: number; y: number }[]) => void;
  filteredShapes: DrawnShape[];
  isMarqueeSelecting: boolean;
  marqueeStart: { x: number; y: number } | null;
  marqueeEnd: { x: number; y: number } | null;
  selectedShapeIds: Set<number>;
  isResizing: boolean;
  resizeUpdateCounter: number;
  editingShapeId: number | null;
  groupsReady: boolean;
  shapeToApiDrawing: (shape: DrawnShape, projectId: number, groupId?: number) => any;
  setSelectedShapeIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
}

export function useGraphDrawingHandlers({
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
}: UseGraphDrawingHandlersProps) {
  const { user } = useAuthStore();
  const graphSettings = useGraphStore(s => s.graphSettings);
  const currentProject = useGraphStore(s => s.currentProject);
  const activeGroupId = useGraphStore(s => s.activeGroupId);
  const addShape = useGraphStore(s => s.addShape);
  const updateShape = useGraphStore(s => s.updateShape);
  const setShapes = useGraphStore(s => s.setShapes);
  const shapes = useGraphStore(s => s.shapes);
  const links = useGraphStore(s => s.links);
  const nodes = useGraphStore(s => s.nodes);
  const pushToUndoStack = useGraphStore(s => s.pushToUndoStack);

  const isDrawingTool = ['pen', 'rectangle', 'diamond', 'circle', 'arrow', 'line', 'eraser'].includes(graphSettings.activeTool);

  const drawPreview = useCallback((points: { x: number; y: number }[]) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length === 0) return;

    const screenPoints = points.map(p => ({
      x: p.x * graphTransform.k + graphTransform.x,
      y: p.y * graphTransform.k + graphTransform.y,
    }));

    ctx.strokeStyle = graphSettings.strokeColor;
    ctx.lineWidth = graphSettings.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([5, 5]);

    if (screenPoints.length < 2 && graphSettings.activeTool !== 'pen') return;

    ctx.beginPath();

    switch (graphSettings.activeTool) {
      case 'pen':
        if (screenPoints.length === 0) break;
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        for (let i = 1; i < screenPoints.length; i++) {
          ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }
        ctx.stroke();
        break;
      case 'line':
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        ctx.lineTo(screenPoints[1].x, screenPoints[1].y);
        ctx.stroke();
        break;
      case 'arrow': {
        const [start, end] = [screenPoints[0], screenPoints[1]];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = 15;
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        break;
      }
      case 'rectangle':
        ctx.strokeRect(screenPoints[0].x, screenPoints[0].y, screenPoints[1].x - screenPoints[0].x, screenPoints[1].y - screenPoints[0].y);
        break;
      case 'circle': {
        const radiusX = Math.abs(screenPoints[1].x - screenPoints[0].x) / 2;
        const radiusY = Math.abs(screenPoints[1].y - screenPoints[0].y) / 2;
        const centerX = screenPoints[0].x + (screenPoints[1].x - screenPoints[0].x) / 2;
        const centerY = screenPoints[0].y + (screenPoints[1].y - screenPoints[0].y) / 2;
        ctx.ellipse(centerX, centerY, Math.max(0.1, radiusX), Math.max(0.1, radiusY), 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
      case 'diamond': {
        const midX = (screenPoints[0].x + screenPoints[1].x) / 2;
        const midY = (screenPoints[0].y + screenPoints[1].y) / 2;
        ctx.moveTo(midX, screenPoints[0].y);
        ctx.lineTo(screenPoints[1].x, midY);
        ctx.lineTo(midX, screenPoints[1].y);
        ctx.lineTo(screenPoints[0].x, midY);
        ctx.closePath();
        ctx.stroke();
        break;
      }
    }
  }, [graphTransform, graphSettings.activeTool, graphSettings.strokeColor, graphSettings.strokeWidth]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawingTool || e.button !== 0) return;

    if (graphSettings.activeTool === 'eraser') {
      setIsDrawing(true);
      pushToUndoStack();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(screenX, screenY);

    setIsDrawing(true);
    setStartPoint(worldPoint);
    setCurrentPoints([worldPoint]);
  }, [isDrawingTool, screenToWorld, graphSettings.activeTool, pushToUndoStack]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(screenX, screenY);

    if (graphSettings.activeTool === 'eraser') {
      const scale = graphTransform.k || 1;
      const erasedShapes = filteredShapes.filter(s => isPointNearShape(worldPoint, s, scale));
      const remaining = shapes.filter(s => {
        if (activeGroupId !== null && s.groupId !== activeGroupId && s.groupId !== undefined) {
          return true;
        }
        return !isPointNearShape(worldPoint, s, scale);
      });
      if (remaining.length !== shapes.length) {
        setShapes(remaining);
        erasedShapes.forEach(s => {
          if (s.id > 0) {
            api.drawings.delete(s.id).then(() => {
              if (currentProject?.id && user?.id) {
                realtimeSync.notifyUpdate(currentProject.id, user.id);
              }
            }).catch(() => { });
          }
        });
      }
      return;
    }

    if (!startPoint) return;

    let newPoints: { x: number; y: number }[];
    if (graphSettings.activeTool === 'pen') {
      newPoints = [...currentPoints, worldPoint];
    } else {
      newPoints = [startPoint, worldPoint];
    }

    setCurrentPoints(newPoints);

    if (graphRef.current) {
      const z = graphRef.current.zoom();
      graphRef.current.zoom(z * 1.00001, 0);
      graphRef.current.zoom(z, 0);
    }
  }, [isDrawing, startPoint, screenToWorld, graphSettings.activeTool, currentPoints, shapes, setShapes, graphTransform, filteredShapes, activeGroupId, currentProject?.id, user?.id]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing) return;

    if (graphSettings.activeTool === 'eraser') {
      setIsDrawing(false);
      return;
    }

    if (currentPoints.length === 0) {
      setIsDrawing(false);
      return;
    }

    const newShape: DrawnShape = {
      id: Date.now() * -1,
      projectId: currentProject?.id || 0,
      type: graphSettings.activeTool,
      points: [...currentPoints],
      color: graphSettings.strokeColor,
      width: graphSettings.strokeWidth,
      style: graphSettings.strokeStyle,
      groupId: activeGroupId ?? undefined,
      synced: false,
    };

    addShape(newShape);

    if (currentProject?.id) {
      const saveDrawing = async () => {
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

      saveDrawing()
        .then(createdDrawing => {
          updateShape(newShape.id, { id: createdDrawing.id, groupId: createdDrawing.groupId, synced: true });
          
          if (currentProject?.id && user?.id) {
            realtimeSync.notifyUpdate(currentProject.id, user.id);
          }
          setSelectedShapeIds(prev => {
            const next = new Set(prev);
            if (next.has(newShape.id)) {
              next.delete(newShape.id);
              next.add(createdDrawing.id);
            }
            return next;
          });
        })
        .catch(() => { });
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoints([]);
    setSelectedShapeIds(new Set([newShape.id]));
    drawPreview([]);

    setTimeout(() => {
      if (graphRef.current) {
        const currentZoom = graphRef.current.zoom();
        graphRef.current.zoom(currentZoom * 1.0001, 0);
        setTimeout(() => graphRef.current.zoom(currentZoom, 0), 20);
      }
    }, 10);
  }, [isDrawing, currentPoints, graphSettings.activeTool, graphSettings.strokeColor, graphSettings.strokeWidth, graphSettings.strokeStyle, drawPreview, currentProject?.id, shapeToApiDrawing, addShape, activeGroupId, user?.id, updateShape, setSelectedShapeIds]);

  const onRenderFramePost = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!groupsReady) return;

    const currentEditingId = editingShapeIdRef.current;
    const resizingId = resizingShapeIdRef.current;
    const resizingShape = currentResizingShapeRef.current;

    // Move textarea to match canvas if editing
    if (textAreaContainerRef.current && textInputPosRef.current && graphRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pos = graphRef.current.graph2ScreenCoords(textInputPosRef.current.worldX, textInputPosRef.current.worldY);
      textAreaContainerRef.current.style.left = `${pos.x + rect.left}px`;
      textAreaContainerRef.current.style.top = `${pos.y + rect.top}px`;
    }

    const shapesToRender = shapesRef.current;

    shapesToRender.forEach(shape => {
      if (activeGroupId !== null && activeGroupId !== undefined && shape.groupId !== activeGroupId) return;

      if (currentEditingId !== null && String(shape.id) === String(currentEditingId)) return;
      if (isResizing && resizingId !== null && String(shape.id) === String(resizingId)) return;

      drawShapeOnContext(ctx, shape, globalScale);
      if (selectedShapeIds.has(shape.id)) {
        drawSelectionBox(ctx, shape, globalScale);

        if (selectedShapeIds.size === 1) {
          const bounds = getShapeBounds(shape, globalScale);
          if (bounds) {
            drawResizeHandles(ctx, bounds, globalScale);
          }
        }
      }
    });

    if (isResizing && resizingShape) {
      drawShapeOnContext(ctx, resizingShape, globalScale);
      drawSelectionBox(ctx, resizingShape, globalScale);
      const bounds = getShapeBounds(resizingShape, globalScale);
      if (bounds) {
        drawResizeHandles(ctx, bounds, globalScale);
      }
    }

    if (isDrawing && currentPoints.length > 0) {
      const previewShape: DrawnShape = {
        id: -9999,
        projectId: currentProject?.id || 0,
        type: graphSettings.activeTool,
        points: currentPoints,
        color: graphSettings.strokeColor,
        width: graphSettings.strokeWidth,
        style: graphSettings.strokeStyle,
      };
      drawShapeOnContext(ctx, previewShape, globalScale, true);
    }

    if (isMarqueeSelecting && marqueeStart && marqueeEnd) {
      drawMarquee(ctx, marqueeStart, marqueeEnd, globalScale);
    }

    // Draw connection descriptions on top of everything
    const linksData = links;
    if (linksData) {
      linksData.forEach((link: any) => {
        if (!link.description) return;

        const source = typeof link.source === 'object' ? link.source : nodes.find(n => n.id === link.source);
        const target = typeof link.target === 'object' ? link.target : nodes.find(n => n.id === link.target);

        if (!source || !target || typeof source.x !== 'number' || typeof target.x !== 'number') return;

        const curvature = 0.1;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const l = Math.sqrt(dx * dx + dy * dy);
        if (l === 0) return;

        const straightMidX = (source.x + target.x) / 2;
        const straightMidY = (source.y + target.y) / 2;
        const controlPointOffset = curvature * l;
        const controlX = straightMidX + dy / l * controlPointOffset;
        const controlY = straightMidY - dx / l * controlPointOffset;

        const t = 0.5;
        const midX = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * controlX + t * t * target.x;
        const midY = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * controlY + t * t * target.y;

        const fontSize = 8;
        ctx.font = `${fontSize}px Inter, "Amiri", "Segoe UI Arabic", "Noto Sans Arabic", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const nodeDir = detectTextDir(link.description);
        if ('direction' in ctx) ctx.direction = nodeDir === 'rtl' ? 'rtl' : 'ltr';
        const textWidth = ctx.measureText(link.description).width;

        ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
        ctx.beginPath();
        const boxPadding = 4;
        ctx.roundRect(midX - textWidth / 2 - boxPadding, midY - fontSize / 2 - boxPadding, textWidth + boxPadding * 2, fontSize + boxPadding * 2, 3);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.fillText(link.description, midX, midY);
        if ('direction' in ctx) ctx.direction = 'ltr';
      });
    }
  }, [filteredShapes, isDrawing, currentPoints, graphSettings.activeTool, graphSettings.strokeColor, graphSettings.strokeWidth, graphSettings.strokeStyle, selectedShapeIds, isMarqueeSelecting, marqueeStart, marqueeEnd, isResizing, resizeUpdateCounter, drawPreview, currentProject?.id, shapeToApiDrawing, addShape, editingShapeId, groupsReady, links, nodes]);

  return {
    drawPreview,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    onRenderFramePost,
    isDrawingTool,
  };
}
