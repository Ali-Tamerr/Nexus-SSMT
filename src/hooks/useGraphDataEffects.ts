import { useCallback, useEffect, useRef, RefObject } from 'react';
import { useGraphStore } from '@/store/useGraphStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DrawnShape } from '@/types/knowledge';
import { api, ApiDrawing } from '@/lib/api';
import { realtimeSync } from '@/lib/supabase/realtime';
import { detectTextDir } from '@/components/graph/canvasTextScale';

interface UseGraphDataEffectsProps {
  graphRef: RefObject<any>;
  selectedShapeIds: Set<number>;
  graphData: { nodes: any[]; links: any[] };
  dimensions: { width: number; height: number };
  isResizing: boolean;
  isMarqueeSelecting: boolean;
  isDraggingSelection: boolean;
  isMiddleMousePanning: boolean;
  isNodeDragging: boolean;
  editingShapeId: number | null;
  textInputPos: any;
  setIsOutsideContent: (v: boolean) => void;
  setGroupsReady: (v: boolean) => void;
}

/** 
 * Consolidates shape‐to‐API conversion, data-loading side effects,
 * shape‐property‐sync effects, and miscellaneous graph refresh helpers
 * that were originally inlined in GraphCanvas.
 */
export function useGraphDataEffects({
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
}: UseGraphDataEffectsProps) {
  const { user } = useAuthStore();
  const shapes = useGraphStore(s => s.shapes);
  const graphSettings = useGraphStore(s => s.graphSettings);
  const setGraphSettings = useGraphStore(s => s.setGraphSettings);
  const currentProject = useGraphStore(s => s.currentProject);
  const activeGroupId = useGraphStore(s => s.activeGroupId);
  const setGroups = useGraphStore(s => s.setGroups);
  const setActiveGroupId = useGraphStore(s => s.setActiveGroupId);
  const setShapes = useGraphStore(s => s.setShapes);
  const updateShape = useGraphStore(s => s.updateShape);
  const isPreviewMode = graphSettings.isPreviewMode;
  const prevPreviewModeRef = useRef(isPreviewMode);
  const lastLoadedProjectIdRef = useRef<number | null>(null);

  // ─── Converters ─────────────────────────────────────────────
  const apiDrawingToShape = useCallback((d: ApiDrawing): DrawnShape => {
    const rawDir = (d.textDir || (d as any).text_dir || (d as any).TextDir || (d as any).direction || (d as any).TextDirection || undefined) as "ltr" | "rtl";
    const finalDir = rawDir || detectTextDir(d.text);

    return {
      id: d.id,
      projectId: d.projectId,
      type: d.type as DrawnShape['type'],
      points: d.points,
      color: d.color,
      width: d.width,
      style: d.style as DrawnShape['style'],
      text: d.text || undefined,
      fontSize: d.fontSize || undefined,
      fontFamily: d.fontFamily || undefined,
      textDir: finalDir,
      groupId: d.groupId,
      synced: true,
    };
  }, []);

  const shapeToApiDrawing = useCallback((s: DrawnShape, projectId: number, groupId?: number) => ({
    projectId,
    groupId: groupId ?? s.groupId ?? undefined,
    type: s.type,
    points: s.points,
    color: s.color,
    width: s.width,
    style: s.style,
    text: s.text ?? undefined,
    fontSize: s.fontSize ?? undefined,
    fontFamily: s.fontFamily ?? undefined,
    textDir: s.textDir ?? undefined,
    direction: s.textDir ?? undefined,
  }), []);

  // ─── Group Loading ──────────────────────────────────────────
  useEffect(() => {
    if (!currentProject?.id) return;
    if (lastLoadedProjectIdRef.current === currentProject.id) return;
    lastLoadedProjectIdRef.current = currentProject.id;

    setGroups([]);
    setGroupsReady(false);

    const colorNames = ['violet', 'blue', 'green', 'yellow', 'red', 'pink', 'cyan', 'lime', 'orange', 'purple', 'teal', 'amber', 'emerald', 'sky', 'indigo', 'rose', 'fuchsia'];

    api.groups.getByProject(currentProject.id)
      .then((backendGroups) => {
        const hidden = JSON.parse(localStorage.getItem('nexus_hidden_groups') || '[]');
        const visibleGroups = backendGroups.filter(g => !hidden.includes(g.id));

        const groupsWithOrder = visibleGroups.map((g, i) => {
          const isColorName = colorNames.includes(g.name.toLowerCase());
          const newName = isColorName ? `Group ${i + 1}` : g.name;

          if (isColorName && g.name !== newName && g.id !== 0) {
            api.groups.update(g.id, { name: newName }).catch(() => { });
          }

          return { ...g, name: newName, order: i };
        });
        setGroups(groupsWithOrder);

        if (groupsWithOrder.length > 0) {
          setActiveGroupId(groupsWithOrder[0].id);
        }
        setGroupsReady(true);
      })
      .catch(() => {
        setGroupsReady(true);
      });
  }, [setGroups, setActiveGroupId, currentProject?.id]);

  // ─── Shape Settings Sync (single helper for all 6 properties) ───
  const syncSelectedShapeProp = useCallback((prop: string, value: any) => {
    if (selectedShapeIds.size > 0) {
      selectedShapeIds.forEach(id => {
        updateShape(id, { [prop]: value });
        const s = shapes.find(sh => sh.id === id);
        if (s && s.synced !== false) {
          api.drawings.update(id, shapeToApiDrawing({ ...s, [prop]: value }, currentProject?.id || 0, activeGroupId ?? undefined));
        }
      });
      if (currentProject?.id && user?.id) {
        realtimeSync.notifyUpdate(currentProject.id, user.id);
      }
    }
  }, [selectedShapeIds, shapes, updateShape, shapeToApiDrawing, currentProject?.id, activeGroupId, user?.id]);

  useEffect(() => { syncSelectedShapeProp('color', graphSettings.strokeColor); }, [graphSettings.strokeColor]);
  useEffect(() => { syncSelectedShapeProp('width', graphSettings.strokeWidth); }, [graphSettings.strokeWidth]);
  useEffect(() => { syncSelectedShapeProp('style', graphSettings.strokeStyle); }, [graphSettings.strokeStyle]);
  useEffect(() => { syncSelectedShapeProp('fontSize', graphSettings.fontSize); }, [graphSettings.fontSize]);
  useEffect(() => { syncSelectedShapeProp('fontFamily', graphSettings.fontFamily); }, [graphSettings.fontFamily]);
  useEffect(() => { syncSelectedShapeProp('textDir', graphSettings.textDir); }, [graphSettings.textDir]);

  // ─── Sync Toolbar With Selection ────────────────────────────
  useEffect(() => {
    if (selectedShapeIds.size === 1) {
      const id = Array.from(selectedShapeIds)[0];
      const s = shapes.find(sh => sh.id === id);
      if (s) {
        if (s.fontSize) setGraphSettings({ fontSize: s.fontSize });
        if (s.fontFamily) setGraphSettings({ fontFamily: s.fontFamily });
        if (s.textDir && (s.textDir === 'ltr' || s.textDir === 'rtl')) {
          setGraphSettings({ textDir: s.textDir as "ltr" | "rtl" });
        }
        if (s.color) setGraphSettings({ strokeColor: s.color });
        if (s.width) setGraphSettings({ strokeWidth: s.width });
        if (s.style) setGraphSettings({ strokeStyle: s.style });
      }
    }
  }, [selectedShapeIds]);

  // ─── Outside Content Detection ──────────────────────────────
  useEffect(() => {
    const checkIfOutsideContent = () => {
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

      if (allPoints.length === 0) {
        setIsOutsideContent(false);
        return;
      }

      const minX = Math.min(...allPoints.map(p => p.x));
      const maxX = Math.max(...allPoints.map(p => p.x));
      const minY = Math.min(...allPoints.map(p => p.y));
      const maxY = Math.max(...allPoints.map(p => p.y));
      const padding = 200;
      const contentBounds = {
        minX: minX - padding, maxX: maxX + padding,
        minY: minY - padding, maxY: maxY + padding,
      };

      try {
        const center = graphRef.current.centerAt();
        const zoom = graphRef.current.zoom();
        const viewWidth = dimensions.width / zoom;
        const viewHeight = dimensions.height / zoom;

        const viewBounds = {
          minX: center.x - viewWidth / 2, maxX: center.x + viewWidth / 2,
          minY: center.y - viewHeight / 2, maxY: center.y + viewHeight / 2,
        };

        const isIntersecting = !(
          viewBounds.maxX < contentBounds.minX ||
          viewBounds.minX > contentBounds.maxX ||
          viewBounds.maxY < contentBounds.minY ||
          viewBounds.minY > contentBounds.maxY
        );

        setIsOutsideContent(!isIntersecting);
      } catch (e) {
        setIsOutsideContent(false);
      }
    };

    const interval = setInterval(checkIfOutsideContent, 500);
    checkIfOutsideContent();

    return () => clearInterval(interval);
  }, [graphData.nodes, shapes, dimensions]);

  // ─── Reheat Simulation on Shape Changes ─────────────────────
  useEffect(() => {
    if (graphRef.current) {
      const z = graphRef.current.zoom();
      graphRef.current.zoom(z * 1.00001, 0);
      graphRef.current.zoom(z, 0);
    }
  }, [shapes]);

  // ─── Resize Refresh Loop ────────────────────────────────────
  useEffect(() => {
    if (!isResizing || !graphRef.current) return;

    let animationFrameId: number;
    const refresh = () => {
      if (graphRef.current) {
        const z = graphRef.current.zoom() || 1;
        graphRef.current.zoom(z * 1.00001, 0);
        graphRef.current.zoom(z, 0);
      }
      animationFrameId = requestAnimationFrame(refresh);
    };

    animationFrameId = requestAnimationFrame(refresh);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isResizing]);

  // ─── Graph Interaction Class Toggle ─────────────────────────
  useEffect(() => {
    const isInteracting = isMarqueeSelecting || isDraggingSelection || isMiddleMousePanning || isNodeDragging || isResizing;

    let timeoutId: NodeJS.Timeout;

    if (isInteracting) {
      timeoutId = setTimeout(() => {
        document.body.classList.add('graph-interacting');
      }, 200);
    } else {
      document.body.classList.remove('graph-interacting');
    }

    return () => clearTimeout(timeoutId);
  }, [isMarqueeSelecting, isDraggingSelection, isMiddleMousePanning, isNodeDragging, isResizing]);

  // ─── Drawings Loading ───────────────────────────────────────
  useEffect(() => {
    if (!currentProject?.id) return;

    api.drawings.getByProject(currentProject.id)
      .then(drawings => {
        const loadedShapes = drawings.map(apiDrawingToShape);
        setShapes(loadedShapes);
      })
      .catch(() => { });
  }, [currentProject?.id, apiDrawingToShape, setShapes]);

  // ─── Preview Mode Reheat ────────────────────────────────────
  useEffect(() => {
    if (isPreviewMode && !prevPreviewModeRef.current && graphRef.current) {
      graphRef.current.d3ReheatSimulation?.();
    }
    prevPreviewModeRef.current = isPreviewMode;
  }, [isPreviewMode]);

  // ─── Force Redraw on Group / Edit Mode Changes ──────────────
  useEffect(() => {
    if (graphRef.current) {
      const z = graphRef.current.zoom() || 1;
      graphRef.current.zoom(z * 1.00001, 0);
      setTimeout(() => graphRef.current?.zoom(z, 0), 20);
    }
  }, [activeGroupId, editingShapeId, textInputPos ? true : false]);

  return {
    apiDrawingToShape,
    shapeToApiDrawing,
  };
}
