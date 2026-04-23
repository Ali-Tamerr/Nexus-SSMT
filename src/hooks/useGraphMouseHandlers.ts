import { useCallback, useRef, RefObject } from 'react';
import { useGraphStore } from '@/store/useGraphStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DrawnShape } from '@/types/knowledge';
import { api } from '@/lib/api';
import { realtimeSync } from '@/lib/supabase/realtime';
import { isPointNearShape } from '@/components/graph/drawingUtils';
import { getShapeBounds, getHandleAtPoint, resizeShape, rotateShape, ResizeHandle, ShapeBounds } from '@/components/graph/resizeUtils';

interface UseGraphMouseHandlersProps {
  graphRef: RefObject<any>;
  containerRef: RefObject<HTMLDivElement | null>;
  shapesRef: RefObject<DrawnShape[]>;
  graphDataRef: RefObject<{ nodes: any[]; links: any[] }>;
  selectedShapeIdsRef: RefObject<Set<number>>;
  selectedNodeIdsRef: RefObject<Set<number>>;
  dragStartWorldRef: RefObject<{ x: number; y: number } | null>;
  dragNodePrevRef: RefObject<{ x: number; y: number } | null>;
  dragStartPosRef: RefObject<{ x: number; y: number } | null>;
  wasGlobalDragRef: RefObject<boolean>;
  isNodeDraggingRef: RefObject<boolean>;
  isMarqueeSelectingRef: RefObject<boolean>;
  marqueeStartScreenPosRef: RefObject<{ x: number; y: number } | null>;
  lastPinchRef: RefObject<{ dist: number; center: { x: number; y: number } } | null>;
  lastHoveredNodeIdRef: RefObject<string | null>;
  lastNodeClickTimeRef: RefObject<number>;
  lastDragTimeRef: RefObject<number>;
  middleMouseStartRef: RefObject<{ x: number; y: number } | null>;
  activeResizeHandleRef: RefObject<ResizeHandle | null>;
  resizeStartBoundsRef: RefObject<ShapeBounds | null>;
  resizeDragStartRef: RefObject<{ x: number; y: number } | null>;
  resizingShapeIdRef: RefObject<number | null>;
  originalShapeRef: RefObject<DrawnShape | null>;
  currentResizingShapeRef: RefObject<DrawnShape | null>;
  dragGroupRef: RefObject<{
    active: boolean;
    startMouse: { x: number; y: number };
    startNodePos: { x: number; y: number };
    nodeId: string;
    initialNodes: Map<string, { x: number; y: number; fx?: number; fy?: number }>;
    initialShapes: Map<string, DrawnShape['points']>;
  } | null>;
  graphTransform: { x: number; y: number; k: number };
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  filteredShapes: DrawnShape[];
  selectedShapeIds: Set<number>;
  selectedNodeIds: Set<number>;
  isMiddleMousePanning: boolean;
  setIsMiddleMousePanning: (v: boolean) => void;
  isResizing: boolean;
  setIsResizing: (v: boolean) => void;
  setResizeUpdateCounter: (fn: (c: number) => number) => void;
  isDraggingSelection: boolean;
  setIsDraggingSelection: (v: boolean) => void;
  dragStartWorld: { x: number; y: number } | null;
  setDragStartWorld: (v: { x: number; y: number } | null) => void;
  isMarqueeSelecting: boolean;
  setIsMarqueeSelecting: (v: boolean) => void;
  marqueeStart: { x: number; y: number } | null;
  setMarqueeStart: (v: { x: number; y: number } | null) => void;
  marqueeEnd: { x: number; y: number } | null;
  setMarqueeEnd: (v: { x: number; y: number } | null) => void;
  isHoveringShape: boolean;
  setIsHoveringShape: (v: boolean) => void;
  isHoveringNode: boolean;
  hoveredResizeHandle: ResizeHandle | null;
  setHoveredResizeHandle: (v: ResizeHandle | null) => void;
  setIsNodeDragging: (v: boolean) => void;
  isSelectTool: boolean;
  isPanTool: boolean;
  setSelectedShapeIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setSelectedNodeIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setShowSelectionPane: (v: boolean) => void;
  setEditingShapeId: (v: number | null) => void;
  setTextInputValue: (v: string) => void;
  setTextInputPos: (v: { x: number; y: number; worldX: number; worldY: number } | null) => void;
  setIsDrawing: (v: boolean) => void;
  shapeToApiDrawing: (shape: DrawnShape, projectId: number, groupId?: number) => any;
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  handleCanvasMouseMove: (e: React.MouseEvent) => void;
  handleCanvasMouseUp: () => void;
}

export function useGraphMouseHandlers(props: UseGraphMouseHandlersProps) {
  const {
    graphRef, containerRef, shapesRef, graphDataRef,
    selectedShapeIdsRef, selectedNodeIdsRef,
    dragStartWorldRef, dragNodePrevRef, dragStartPosRef,
    wasGlobalDragRef, isNodeDraggingRef, isMarqueeSelectingRef,
    marqueeStartScreenPosRef, lastPinchRef,
    lastHoveredNodeIdRef, lastNodeClickTimeRef, lastDragTimeRef,
    middleMouseStartRef,
    activeResizeHandleRef, resizeStartBoundsRef, resizeDragStartRef,
    resizingShapeIdRef, originalShapeRef, currentResizingShapeRef,
    dragGroupRef,
    graphTransform, screenToWorld,
    filteredShapes, selectedShapeIds, selectedNodeIds,
    isMiddleMousePanning, setIsMiddleMousePanning,
    isResizing, setIsResizing, setResizeUpdateCounter,
    isDraggingSelection, setIsDraggingSelection,
    dragStartWorld, setDragStartWorld,
    isMarqueeSelecting, setIsMarqueeSelecting,
    marqueeStart, setMarqueeStart,
    marqueeEnd, setMarqueeEnd,
    isHoveringShape, setIsHoveringShape,
    isHoveringNode, hoveredResizeHandle, setHoveredResizeHandle,
    setIsNodeDragging,
    isSelectTool, isPanTool,
    setSelectedShapeIds, setSelectedNodeIds,
    setShowSelectionPane,
    setEditingShapeId, setTextInputValue, setTextInputPos,
    setIsDrawing,
    shapeToApiDrawing,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
  } = props;

  const { user } = useAuthStore();
  const graphSettings = useGraphStore(s => s.graphSettings);
  const currentProject = useGraphStore(s => s.currentProject);
  const activeGroupId = useGraphStore(s => s.activeGroupId);
  const shapes = useGraphStore(s => s.shapes);
  const nodes = useGraphStore(s => s.nodes);
  const setShapes = useGraphStore(s => s.setShapes);
  const setActiveNode = useGraphStore(s => s.setActiveNode);
  const pushToUndoStack = useGraphStore(s => s.pushToUndoStack);
  const graphData = useGraphStore(s => s.nodes); // just for dep

  // Container Mouse Move
  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    // 1. Middle Mouse Pan (High Priority)
    if (!isMiddleMousePanning && middleMouseStartRef.current) {
      const dx = e.clientX - middleMouseStartRef.current.x;
      const dy = e.clientY - middleMouseStartRef.current.y;
      if (dx * dx + dy * dy > 25) {
        setIsMiddleMousePanning(true);
      }
    }

    if (isMiddleMousePanning && middleMouseStartRef.current && graphRef.current) {
      const dx = e.clientX - middleMouseStartRef.current.x;
      const dy = e.clientY - middleMouseStartRef.current.y;

      const currentCenter = graphRef.current.centerAt();
      const currentZoom = graphRef.current.zoom();

      graphRef.current.centerAt(
        currentCenter.x - dx / currentZoom,
        currentCenter.y - dy / currentZoom,
        0
      );
      middleMouseStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // 2. Resizing Logic
    if (isResizing && activeResizeHandleRef.current && resizeStartBoundsRef.current && resizeDragStartRef.current && originalShapeRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPoint = screenToWorld(screenX, screenY);

      let transformedShape;
      if (activeResizeHandleRef.current === 'rotate') {
        transformedShape = rotateShape(originalShapeRef.current, worldPoint, resizeDragStartRef.current, resizeStartBoundsRef.current);
      } else {
        transformedShape = resizeShape(originalShapeRef.current, activeResizeHandleRef.current, worldPoint, resizeDragStartRef.current, resizeStartBoundsRef.current, e.shiftKey);
      }
      currentResizingShapeRef.current = transformedShape;
      setResizeUpdateCounter(c => c + 1);
      return;
    }

    // 3. Manual Group Drag Logic (Nodes)
    if (dragGroupRef.current?.active) {
      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPoint = screenToWorld(screenX, screenY);

      const dx = worldPoint.x - dragGroupRef.current.startMouse.x;
      const dy = worldPoint.y - dragGroupRef.current.startMouse.y;

      // Update Nodes
      const initialNodes = dragGroupRef.current.initialNodes;
      graphDataRef.current.nodes.forEach((n: any) => {
        const initPos = initialNodes.get(String(n.id));
        if (initPos) {
          const newX = (initPos.fx ?? initPos.x ?? 0) + dx;
          const newY = (initPos.fy ?? initPos.y ?? 0) + dy;
          n.fx = newX;
          n.fy = newY;
          n.x = newX;
          n.y = newY;
        }
      });

      // Update Shapes
      const initialShapes = dragGroupRef.current.initialShapes;
      if (initialShapes.size > 0) {
        shapesRef.current = shapesRef.current.map(s => {
          const initPoints = initialShapes.get(String(s.id));
          if (initPoints) {
            return {
              ...s,
              points: initPoints.map(p => ({ x: p.x + dx, y: p.y + dy }))
            };
          }
          return s;
        });
        setShapes(shapesRef.current);
      }
      return;
    }

    // 4. Shape Selection Drag (Select Tool)
    if (isDraggingSelection && dragStartWorldRef.current && selectedShapeIds.size > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const worldPoint = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const dx = worldPoint.x - dragStartWorldRef.current.x;
      const dy = worldPoint.y - dragStartWorldRef.current.y;

      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        shapesRef.current = shapesRef.current.map(s => {
          if (selectedShapeIds.has(s.id)) {
            return { ...s, points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
          }
          return s;
        });
        if (graphRef.current) {
          // @ts-ignore
          if (graphRef.current.d3ReheatSimulation) graphRef.current.d3ReheatSimulation();
        }

        if (selectedNodeIds.size > 0) {
          const currentGraphNodes = graphDataRef.current.nodes as Array<{ id: string | number; x?: number; y?: number; fx?: number; fy?: number }>;
          currentGraphNodes.forEach(n => {
            if (selectedNodeIds.has(Number(n.id))) {
              const newX = (n.fx ?? n.x ?? 0) + dx;
              const newY = (n.fy ?? n.y ?? 0) + dy;
              n.fx = newX; n.fy = newY; n.x = newX; n.y = newY;
            }
          });
        }
        dragStartWorldRef.current = worldPoint;
        setDragStartWorld(worldPoint);
      }
      return;
    }

    // 5. Marquee selection update
    if (isMarqueeSelecting || isMarqueeSelectingRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPoint = screenToWorld(screenX, screenY);
      setMarqueeEnd(worldPoint);
      if (graphRef.current) {
        const z = graphRef.current.zoom();
        graphRef.current.zoom(z * 1.00001, 0);
        graphRef.current.zoom(z, 0);
      }
      return;
    }

    // Check for marquee start threshold
    if (marqueeStartScreenPosRef.current && !isMarqueeSelecting && !isMarqueeSelectingRef.current) {
      const dx = e.clientX - marqueeStartScreenPosRef.current.x;
      const dy = e.clientY - marqueeStartScreenPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        isMarqueeSelectingRef.current = true;
        setIsMarqueeSelecting(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPoint = screenToWorld(screenX, screenY);
        setMarqueeEnd(worldPoint);
      }
      return;
    }

    if (graphSettings.activeTool !== 'select') return;

    // Hover Logic
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(screenX, screenY);
    const scale = graphTransform.k || 1;

    if (dragNodePrevRef.current) return;

    // Hover Resize Handle
    if (selectedShapeIds.size === 1 && !isDraggingSelection) {
      const selectedShape = filteredShapes.find(s => selectedShapeIds.has(s.id));
      if (selectedShape) {
        const bounds = getShapeBounds(selectedShape, scale);
        if (bounds) {
          const handle = getHandleAtPoint(worldPoint, bounds, scale);
          setHoveredResizeHandle(handle);
        } else { setHoveredResizeHandle(null); }
      }
    } else { setHoveredResizeHandle(null); }

    const isNear = filteredShapes.some(s => isPointNearShape(worldPoint, s, scale, 10));
    if (isNear !== isHoveringShape) {
      setIsHoveringShape(isNear);
    }
  }, [graphSettings.activeTool, graphTransform, filteredShapes, screenToWorld, isHoveringShape, isMarqueeSelecting, isMiddleMousePanning, isResizing, isDraggingSelection, dragStartWorld, selectedShapeIds, shapes, setShapes, selectedNodeIds]);

  // Container Mouse Down Capture
  const handleContainerMouseDownCapture = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.graph-ui-hide') || target.closest('button') || target.closest('nav') || target.closest('header')) {
      return;
    }

    if (e.button === 1) {
      e.preventDefault();
      middleMouseStartRef.current = { x: e.clientX, y: e.clientY };
      setIsMiddleMousePanning(true);
      return;
    }

    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    const currentSelectedNodeIds = selectedNodeIdsRef.current;

    if (graphSettings.activeTool !== 'select') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(screenX, screenY);
    const scale = graphTransform.k || 1;

    const isOverShape = filteredShapes.some(s => isPointNearShape(worldPoint, s, scale, 10));

    let isOverHandle = false;
    const currentSelectedIds = selectedShapeIdsRef.current;
    if (currentSelectedIds.size === 1) {
      const selectedShape = filteredShapes.find(s => currentSelectedIds.has(s.id));
      if (selectedShape) {
        const bounds = getShapeBounds(selectedShape, scale);
        if (bounds) {
          const handle = getHandleAtPoint(worldPoint, bounds, scale);
          if (handle) isOverHandle = true;
        }
      }
    }

    if (isOverShape || isOverHandle) return;

    const nodeHitRadius = 15 / scale;
    let clickedNodeId: number | null = null;
    let closestDist = Infinity;
    let draggedNodePos = { x: 0, y: 0 };

    graphDataRef.current.nodes.forEach((n: any) => {
      const dx = (n.x ?? 0) - worldPoint.x;
      const dy = (n.y ?? 0) - worldPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= nodeHitRadius && dist < closestDist) {
        closestDist = dist;
        clickedNodeId = Number(n.id);
        draggedNodePos = { x: n.x ?? 0, y: n.y ?? 0 };
      }
    });

    if (clickedNodeId && currentSelectedNodeIds.has(clickedNodeId)) {
      lastHoveredNodeIdRef.current = String(clickedNodeId);
      lastNodeClickTimeRef.current = Date.now();

      const initialNodes = new Map();
      graphDataRef.current.nodes.forEach((n: any) => {
        if (currentSelectedNodeIds.has(Number(n.id)) && Number(n.id) !== clickedNodeId) {
          initialNodes.set(String(n.id), { x: n.x, y: n.y, fx: n.fx, fy: n.fy });
        }
      });

      const initialShapes = new Map();
      if (selectedShapeIdsRef.current.size > 0) {
        shapesRef.current.forEach(s => {
          if (selectedShapeIdsRef.current.has(s.id)) {
            initialShapes.set(String(s.id), s.points.map(p => ({ ...p })));
          }
        });
      }

      dragGroupRef.current = {
        active: true,
        startMouse: worldPoint,
        startNodePos: draggedNodePos,
        nodeId: clickedNodeId,
        initialNodes,
        initialShapes
      };

      return;
    }

    if (clickedNodeId && !currentSelectedNodeIds.has(clickedNodeId)) {
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        return;
      }
      lastHoveredNodeIdRef.current = String(clickedNodeId);
      lastNodeClickTimeRef.current = Date.now();

      setSelectedShapeIds(new Set());
      setSelectedNodeIds(new Set([clickedNodeId]));
      return;
    }
  }, [screenToWorld, graphTransform, graphSettings.activeTool, shapes, nodes, setActiveNode, setSelectedNodeIds, setSelectedShapeIds]);

  // Container Mouse Up Capture
  const handleContainerMouseUpCapture = useCallback((e: React.MouseEvent) => {
    if (middleMouseStartRef.current) {
      setIsMiddleMousePanning(false);
      middleMouseStartRef.current = null;
    }

    if (isResizing && resizingShapeIdRef.current) {
      const resizedShape = currentResizingShapeRef.current;
      if (resizedShape) {
        const updatedShapes = shapes.map(s => s.id === resizedShape.id ? resizedShape : s);
        setShapes(updatedShapes);
        if (resizedShape.synced !== false) {
          api.drawings.update(resizedShape.id, shapeToApiDrawing(resizedShape, currentProject?.id || 0, activeGroupId ?? undefined))
            .catch(() => { });
        }
      }
      setIsResizing(false);
      activeResizeHandleRef.current = null;
      resizeStartBoundsRef.current = null;
      resizeDragStartRef.current = null;
      resizingShapeIdRef.current = null;
      currentResizingShapeRef.current = null;
    }

    if (isDraggingSelection) {
      const finalShapes = shapesRef.current;
      setShapes(finalShapes);

      (async () => {
        if (selectedShapeIds.size > 0) {
          const shapeUpdates = finalShapes
            .filter(s => selectedShapeIds.has(s.id) && s.synced !== false)
            .map(s => ({ ...shapeToApiDrawing(s, currentProject?.id || 0, activeGroupId ?? undefined), id: s.id }));

          if (shapeUpdates.length > 0) {
            try {
              await api.drawings.batchUpdate(shapeUpdates as any);
            } catch { }
          }
        }

        if (selectedNodeIds.size > 0) {
          const currentGraphNodes = (graphDataRef.current?.nodes || []) as any[];
          const nodeUpdates: any[] = [];
          const updateNode = useGraphStore.getState().updateNode;
          for (const n of currentGraphNodes) {
            if (selectedNodeIds.has(Number(n.id))) {
              updateNode(n.id, { x: n.x, y: n.y });
              const fullNode = nodes.find(sn => sn.id === n.id);
              if (fullNode) {
                nodeUpdates.push({ n, fullNode });
              }
            }
          }

          const updatesToPush = nodeUpdates.map(({ n, fullNode }) => ({
            ...fullNode,
            id: n.id,
            x: n.x,
            y: n.y
          }));

          if (updatesToPush.length > 0) {
            try {
              await api.nodes.batchUpdate(updatesToPush);
            } catch { }
          }
        }
      })();

      setIsDraggingSelection(false);
      setDragStartWorld(null);
    }

    if (dragStartPosRef.current) {
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 7) {
        wasGlobalDragRef.current = true;
        setTimeout(() => { wasGlobalDragRef.current = false; }, 200);
      }
    }
    dragStartPosRef.current = null;

    if (dragGroupRef.current?.active) {
      if (!isNodeDraggingRef.current) {
        dragGroupRef.current = null;
      }
    }

    if ((isMarqueeSelecting || isMarqueeSelectingRef.current) && marqueeStart && marqueeEnd) {
      const minX = Math.min(marqueeStart.x, marqueeEnd.x);
      const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
      const minY = Math.min(marqueeStart.y, marqueeEnd.y);
      const maxY = Math.max(marqueeStart.y, marqueeEnd.y);

      const newSelectedNodes = new Set<number>();
      graphDataRef.current.nodes.forEach((n: any) => {
        if (n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY) {
          newSelectedNodes.add(Number(n.id));
        }
      });

      const newSelectedShapes = new Set<number>();
      filteredShapes.forEach(s => {
        const cx = s.points.reduce((sum, p) => sum + p.x, 0) / s.points.length;
        const cy = s.points.reduce((sum, p) => sum + p.y, 0) / s.points.length;
        if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) {
          newSelectedShapes.add(s.id);
        }
      });

      setSelectedNodeIds(newSelectedNodes);
      setSelectedShapeIds(newSelectedShapes);
      setIsMarqueeSelecting(false);
      isMarqueeSelectingRef.current = false;
      setMarqueeStart(null);
      setMarqueeEnd(null);
    }

    marqueeStartScreenPosRef.current = null;
  }, [setShapes, isMarqueeSelecting, marqueeStart, marqueeEnd, filteredShapes, isResizing, isDraggingSelection, selectedShapeIds, selectedNodeIds, nodes, currentProject?.id, activeGroupId, shapeToApiDrawing, setSelectedNodeIds, setSelectedShapeIds, setIsMarqueeSelecting]);

  // Node Drag
  const handleNodeDrag = useCallback((node: any) => {
    isNodeDraggingRef.current = true;
    setIsNodeDragging(true);
    lastDragTimeRef.current = Date.now();
    if (!dragGroupRef.current?.active) return;
    if (node.id !== dragGroupRef.current.nodeId) return;

    const initialNodes = dragGroupRef.current.initialNodes;
    const draggedNodeInitial = dragGroupRef.current.startNodePos;
    const dx = (node.x ?? 0) - draggedNodeInitial.x;
    const dy = (node.y ?? 0) - draggedNodeInitial.y;

    graphDataRef.current.nodes.forEach((n: any) => {
      const initPos = initialNodes.get(String(n.id));
      if (initPos) {
        const newX = (initPos.x ?? 0) + dx;
        const newY = (initPos.y ?? 0) + dy;
        n.fx = newX;
        n.fy = newY;
        n.x = newX;
        n.y = newY;
      }
    });

    const initialShapes = dragGroupRef.current.initialShapes;
    if (initialShapes.size > 0) {
      shapesRef.current = shapesRef.current.map(s => {
        const initPoints = initialShapes.get(String(s.id));
        if (initPoints) {
          return {
            ...s,
            points: initPoints.map(p => ({ x: p.x + dx, y: p.y + dy }))
          };
        }
        return s;
      });
      if (graphRef.current) {
        // @ts-ignore
        if (graphRef.current.d3ReheatSimulation) graphRef.current.d3ReheatSimulation();
      }
    }
  }, []);

  // Node Drag End
  const handleNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;

    setTimeout(() => {
      isNodeDraggingRef.current = false;
      setIsNodeDragging(false);
    }, 250);

    const storeNodes = useGraphStore.getState().nodes;
    const updateNode = useGraphStore.getState().updateNode;

    if (dragGroupRef.current?.active) {
      const currentSelectedNodeIds = selectedNodeIdsRef.current;

      (async () => {
        const nodeUpdates: any[] = [];
        for (const n of graphDataRef.current.nodes) {
          if (currentSelectedNodeIds.has(Number(n.id))) {
            updateNode(n.id, { x: n.x, y: n.y });

            const fullNode = storeNodes.find(sn => sn.id === n.id);
            if (fullNode) {
              nodeUpdates.push({ n, fullNode });
            }
          }
        }

        const updatesToPush = nodeUpdates.map(({ n, fullNode }) => ({
          id: fullNode.id,
          title: fullNode.title,
          content: fullNode.content || '',
          groupId: fullNode.groupId,
          projectId: fullNode.projectId,
          userId: fullNode.userId,
          customColor: fullNode.customColor,
          group: fullNode.group ? { id: fullNode.group.id, name: fullNode.group.name, color: fullNode.group.color, order: fullNode.group.order } : { id: fullNode.groupId ?? 0, name: 'Default', color: '#808080', order: 0 },
          x: n.x,
          y: n.y
        }));

        if (updatesToPush.length > 0) {
          try {
            await api.nodes.batchUpdate(updatesToPush);
            if (currentProject?.id && user?.id) {
              realtimeSync.notifyUpdate(currentProject.id, user.id);
            }
          } catch { }
        }

        const currentSelectedShapeIds = selectedShapeIdsRef.current;
        if (currentSelectedShapeIds.size > 0) {
          const finalShapes = shapesRef.current;
          setShapes(finalShapes);

          const shapeUpdates = finalShapes
            .filter(s => currentSelectedShapeIds.has(s.id))
            .map(s => {
              const dto = shapeToApiDrawing(s, currentProject?.id || 0, activeGroupId ?? undefined);
              return { ...dto, id: s.id, text: s.text, fontSize: s.fontSize, fontFamily: s.fontFamily, textDir: s.textDir };
            });

          if (shapeUpdates.length > 0) {
            try {
              await api.drawings.batchUpdate(shapeUpdates as any);
            } catch { }
          }
        }
      })();

      dragGroupRef.current = null;
    } else if (node) {
      const nodeId = Number(node.id);
      updateNode(nodeId, { x: node.x, y: node.y });

      const fullNode = storeNodes.find(sn => sn.id === nodeId);
      if (fullNode) {
        api.nodes.update(nodeId, {
          id: fullNode.id,
          title: fullNode.title,
          content: fullNode.content || '',
          groupId: fullNode.groupId,
          projectId: fullNode.projectId,
          userId: fullNode.userId,
          customColor: fullNode.customColor,
          group: fullNode.group ? { id: fullNode.group.id, name: fullNode.group.name, color: fullNode.group.color, order: fullNode.group.order } : { id: fullNode.groupId ?? 0, name: 'Default', color: '#808080', order: 0 },
          x: node.x,
          y: node.y
        }).catch(() => { });
      }
    }
  }, [setShapes]);

  // Select Mouse Down
  const handleSelectMouseDown = useCallback((e: React.MouseEvent) => {
    if (useGraphStore.getState().isConnectionPickerActive) return;
    if (!isSelectTool) return;
    if (isHoveringNode) return;

    if (e.button === 1) {
      e.preventDefault();
      middleMouseStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button !== 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(screenX, screenY);
    const scale = graphRef.current?.zoom() || graphTransform.k || 1;

    const selectedIds = selectedShapeIdsRef.current;

    if (selectedIds.size === 1) {
      const selectedShape = filteredShapes.find(s => selectedIds.has(s.id));
      if (selectedShape) {
        const bounds = getShapeBounds(selectedShape, scale);
        if (bounds) {
          const handle = getHandleAtPoint(worldPoint, bounds, scale);

          if (handle) {
            setIsResizing(true);
            activeResizeHandleRef.current = handle;
            resizeStartBoundsRef.current = bounds;
            resizeDragStartRef.current = worldPoint;
            resizingShapeIdRef.current = selectedShape.id;
            originalShapeRef.current = { ...selectedShape, points: [...selectedShape.points] };
            currentResizingShapeRef.current = { ...selectedShape, points: [...selectedShape.points] };
            pushToUndoStack();
            return;
          }
        }
      }
    }

    let clickedNodeId: number | null = null;
    let closestDist = Infinity;
    const nodeHitRadius = 15 / scale;
    const currentNodes = (graphDataRef.current?.nodes || []) as any[];
    currentNodes.forEach((n: any) => {
      const dx = (n.x ?? 0) - worldPoint.x;
      const dy = (n.y ?? 0) - worldPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= nodeHitRadius && dist < closestDist) {
        closestDist = dist;
        clickedNodeId = Number(n.id);
      }
    });

    if (clickedNodeId) return;

    const clickedShape = filteredShapes.find(s => isPointNearShape(worldPoint, s, scale, 10));

    if (clickedShape) {
      lastNodeClickTimeRef.current = Date.now();
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        setSelectedShapeIds(prev => {
          const next = new Set(prev);
          if (next.has(clickedShape.id)) {
            next.delete(clickedShape.id);
          } else {
            next.add(clickedShape.id);
          }
          return next;
        });
      } else {
        if (!selectedShapeIds.has(clickedShape.id)) {
          setSelectedShapeIds(new Set([clickedShape.id]));
          setSelectedNodeIds(new Set());
        }
      }
      setIsDraggingSelection(true);
      dragStartWorldRef.current = worldPoint;
      setDragStartWorld(worldPoint);
      pushToUndoStack();
    } else {
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setSelectedShapeIds(new Set());
        setSelectedNodeIds(new Set());
        setShowSelectionPane(false);
      }
      isMarqueeSelectingRef.current = false;
      setIsMarqueeSelecting(false);
      marqueeStartScreenPosRef.current = { x: e.clientX, y: e.clientY };
      setMarqueeStart(worldPoint);
      setMarqueeEnd(worldPoint);
    }
  }, [isSelectTool, isHoveringNode, filteredShapes, selectedShapeIds, screenToWorld, graphTransform.k, pushToUndoStack, shapes]);

  // Touch Handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      lastPinchRef.current = { dist: 0, center };
      return;
    }

    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    const target = e.target as HTMLElement;
    if (target.closest('.graph-ui-hide') || target.closest('button')) return;

    if (!isPanTool) {
      if (graphSettings.activeTool !== 'pan' && graphSettings.activeTool !== 'select') {
        e.preventDefault();
      }
    }

    const syntheticEvent = {
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 1,
      target: e.target,
      currentTarget: e.currentTarget,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
    } as unknown as React.MouseEvent;

    handleContainerMouseDownCapture(syntheticEvent);
    handleSelectMouseDown(syntheticEvent);
  }, [handleContainerMouseDownCapture, handleSelectMouseDown, isPanTool, graphSettings.activeTool]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchRef.current && graphRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      const { center: startCenter } = lastPinchRef.current;
      const zoom = graphRef.current.zoom();

      const dx = currCenter.x - startCenter.x;
      const dy = currCenter.y - startCenter.y;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const currentCenter = graphRef.current.centerAt();
        graphRef.current.centerAt(
          currentCenter.x - dx / zoom,
          currentCenter.y - dy / zoom,
          0
        );
        lastPinchRef.current.center = currCenter;
      }
      return;
    }

    if (e.touches.length !== 1) return;
    if (!isPanTool) e.preventDefault();

    const touch = e.touches[0];
    const syntheticEvent = {
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: e.target,
      currentTarget: e.currentTarget,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      shiftKey: e.shiftKey,
    } as unknown as React.MouseEvent;

    handleContainerMouseMove(syntheticEvent);
  }, [handleContainerMouseMove, isPanTool]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];

    const syntheticEvent = {
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      target: e.target,
      currentTarget: e.currentTarget,
      preventDefault: () => { },
      stopPropagation: () => e.stopPropagation(),
    } as unknown as React.MouseEvent;

    handleContainerMouseUpCapture(syntheticEvent);
  }, [handleContainerMouseUpCapture]);

  // Double Click (text shape edit)
  const handleContainerDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isSelectTool) return;
    if (useGraphStore.getState().isConnectionPickerActive) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(screenX, screenY);
    const scale = graphRef.current?.zoom() || graphTransform.k || 1;

    const clickedTextShape = [...filteredShapes].reverse().find(s =>
      s.type === 'text' && isPointNearShape(worldPoint, s, scale, 15)
    );

    if (clickedTextShape && graphRef.current) {
      setEditingShapeId(clickedTextShape.id);
      setTextInputValue(clickedTextShape.text || '');
      setSelectedShapeIds(new Set([clickedTextShape.id]));
      setSelectedNodeIds(new Set());

      const screenPos = graphRef.current.graph2ScreenCoords(clickedTextShape.points[0].x, clickedTextShape.points[0].y);
      setTextInputPos({
        x: screenPos.x + rect.left,
        y: screenPos.y + rect.top,
        worldX: clickedTextShape.points[0].x,
        worldY: clickedTextShape.points[0].y
      });
    }
  }, [isSelectTool, screenToWorld, filteredShapes, graphTransform.k]);

  // Canvas Touch Handlers (drawing tool)
  const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsDrawing(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      lastPinchRef.current = { dist, center };
      return;
    }

    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const syntheticEvent = {
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: e.target,
      currentTarget: e.currentTarget
    } as unknown as React.MouseEvent;
    handleCanvasMouseDown(syntheticEvent);
  }, [handleCanvasMouseDown]);

  const getLastCenter = () => lastPinchRef.current?.center || { x: 0, y: 0 };

  const handleCanvasTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchRef.current && graphRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currDist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
      const currCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      const { dist: startDist, center: startCenter } = lastPinchRef.current;
      const zoomFactor = currDist / startDist;

      const currentZoom = graphRef.current.zoom();
      const newZoom = currentZoom * zoomFactor;

      graphRef.current.zoom(newZoom, 0);

      const dx = currCenter.x - startCenter.x;
      const dy = currCenter.y - startCenter.y;

      const graphDx = dx / newZoom;
      const graphDy = dy / newZoom;

      const center = graphRef.current.centerAt();
      graphRef.current.centerAt(center.x - graphDx, center.y - graphDy, 0);

      lastPinchRef.current = { dist: currDist, center: currCenter };
      return;
    }

    if (e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const syntheticEvent = {
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: e.target,
      currentTarget: e.currentTarget
    } as unknown as React.MouseEvent;
    handleCanvasMouseMove(syntheticEvent);
  }, [handleCanvasMouseMove]);

  const handleCanvasTouchEnd = useCallback((_e: React.TouchEvent) => {
    lastPinchRef.current = null;
    handleCanvasMouseUp();
  }, [handleCanvasMouseUp]);

  return {
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
  };
}
