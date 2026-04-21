import { useEffect, useCallback, RefObject } from 'react';
import { useGraphStore } from '@/store/useGraphStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { realtimeSync } from '@/lib/supabase/realtime';
import { api } from '@/lib/api';
import { DrawnShape } from '@/types/knowledge';

interface UseGraphKeyboardShortcutsProps {
  shapesRef: RefObject<DrawnShape[]>;
  selectedShapeIdsRef: RefObject<Set<number>>;
  selectedNodeIdsRef: RefObject<Set<number>>;
  selectedNodeIdsRefForDelete: RefObject<Set<number>>;
  clipboardRef: RefObject<{ nodes: any[]; shapes: any[] } | null>;
  graphDataRef: RefObject<any>;
  nodeCacheRef: RefObject<Map<string | number, any>>;
  nodeSaveTimeoutsRef: RefObject<Map<string | number, any>>;
  shapeSaveTimeoutsRef: RefObject<Map<string | number, any>>;
  shapeStateSaveTimeoutRef: RefObject<NodeJS.Timeout | null>;
  graphRef: RefObject<any>;
  graphTransform: { k: number; x: number; y: number };
  shapeToApiDrawing: (shape: DrawnShape, projectId: number, groupId?: number) => any;
  setShapes: (shapes: DrawnShape[]) => void;
  setNodes: (nodes: any[]) => void;
  setSelectedShapeIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setSelectedNodeIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setActiveNode: (node: any) => void;
}

export function useGraphKeyboardShortcuts({
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
}: UseGraphKeyboardShortcutsProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const { 
    undo, redo, pushToUndoStack,
    currentProject, activeGroupId, currentUserId,
    graphSettings
  } = useGraphStore();

  const syncUndoRedo = useCallback(async (isUndo: boolean) => {
    const state = useGraphStore.getState();
    const oldShapes = state.shapes;
    const oldNodes = state.nodes;
    const stack = isUndo ? state.undoStack : state.redoStack;
    if (stack.length === 0) return;

    const targetSnapshot = stack[stack.length - 1];
    const targetShapes = targetSnapshot.shapes;
    const targetNodes = targetSnapshot.nodes;

    if (isUndo) {
      undo();
    } else {
      redo();
    }

    // Sync Shapes
    const oldShapeIds = new Set(oldShapes.map(s => s.id));
    const newShapeIds = new Set(targetShapes.map(s => s.id));

    const reappearedShapes = targetShapes.filter(s => !oldShapeIds.has(s.id));
    const disappearedShapes = oldShapes.filter(s => !newShapeIds.has(s.id));

    for (const shape of disappearedShapes) {
      try { await api.drawings.delete(shape.id); } catch { }
    }

    const shapeIdMap = new Map<number, number>();
    for (const shape of reappearedShapes) {
      try {
        const payload = shapeToApiDrawing(shape, currentProject?.id || 0, activeGroupId ?? undefined);
        const newShape = await api.drawings.create(payload);
        shapeIdMap.set(shape.id, newShape.id);
      } catch { }
    }

    // Sync Nodes
    const oldNodeIds = new Set(oldNodes.map((n: any) => n.id));
    const newNodeIds = new Set(targetNodes.map((n: any) => n.id));

    const reappearedNodes = targetNodes.filter((n: any) => !oldNodeIds.has(n.id));
    const disappearedNodes = oldNodes.filter((n: any) => !newNodeIds.has(n.id));

    for (const node of disappearedNodes) {
      try { await api.nodes.delete(node.id); } catch { }
    }

    const nodeIdMap = new Map<number, number>();
    for (const node of reappearedNodes) {
      try {
        const payload = {
          title: node.title,
          content: node.content || '',
          projectId: node.projectId,
          groupId: node.groupId,
          userId: node.userId,
          customColor: node.customColor,
          x: node.x,
          y: node.y
        };
        const newNode = await api.nodes.create(payload);
        nodeIdMap.set(node.id, newNode.id);
      } catch { }
    }

    // Apply ID mappings if items were re-created with new IDs
    if (shapeIdMap.size > 0 || nodeIdMap.size > 0) {
      setTimeout(() => {
        const currentState = useGraphStore.getState();
        let updatedShapes = currentState.shapes;
        let updatedNodes = currentState.nodes;

        if (shapeIdMap.size > 0) {
          updatedShapes = updatedShapes.map(s => {
            const newId = shapeIdMap.get(s.id);
            return newId !== undefined ? { ...s, id: newId } : s;
          });
        }

        if (nodeIdMap.size > 0) {
          updatedNodes = updatedNodes.map((n: any) => {
            const newId = nodeIdMap.get(n.id);
            return newId !== undefined ? { ...n, id: newId } : n;
          });
        }

        setShapes(updatedShapes);
        setNodes(updatedNodes);
      }, 50);
    }

    if (currentProject?.id && user?.id) {
      realtimeSync.notifyUpdate(currentProject.id, user.id);
    }
  }, [undo, redo, setShapes, setNodes, currentProject?.id, activeGroupId, shapeToApiDrawing, user?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 0. Focus Check
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable) {
        return;
      }

      // Handle Modifier Keys (Ctrl/Meta)
      const mod = e.ctrlKey || e.metaKey;

      // 1. Undo/Redo
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        syncUndoRedo(true);
        return;
      }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        syncUndoRedo(false);
        return;
      }

      // 2. Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const hasSelectedShapes = selectedShapeIdsRef.current?.size ?? 0 > 0;
        const hasSelectedNodes = selectedNodeIdsRefForDelete.current?.size ?? 0 > 0;

        if (hasSelectedShapes || hasSelectedNodes) {
          e.preventDefault();
          // Delete selected shapes
          if (hasSelectedShapes && shapesRef.current && selectedShapeIdsRef.current) {
            pushToUndoStack();
            const toDelete = shapesRef.current.filter(s => selectedShapeIdsRef.current!.has(s.id));
            const remaining = shapesRef.current.filter(s => !selectedShapeIdsRef.current!.has(s.id));
            setShapes(remaining);
            toDelete.forEach(s => api.drawings.delete(s.id).catch(() => { }));
            setSelectedShapeIds(new Set());
          }
          // Delete selected nodes
          if (hasSelectedNodes && selectedNodeIdsRefForDelete.current) {
            const deleteNode = useGraphStore.getState().deleteNode;
            selectedNodeIdsRefForDelete.current.forEach(nodeId => {
              deleteNode(nodeId);
              api.nodes.delete(nodeId).catch(() => { });
            });
            setSelectedNodeIds(new Set());
            setActiveNode(null);
          }

          if (currentProject?.id && user?.id) {
            realtimeSync.notifyUpdate(currentProject.id, user.id);
          }
        }
        return;
      }

      // 3. Copy / Paste
      if (mod && e.key.toLowerCase() === 'c') {
        const selectedNodes = graphDataRef.current?.nodes.filter((n: any) => selectedNodeIdsRef.current?.has(Number(n.id))) || [];
        const selectedShapes = shapesRef.current?.filter(s => selectedShapeIdsRef.current?.has(s.id)) || [];

        if (selectedNodes.length === 0 && selectedShapes.length === 1 && selectedShapes[0].type === 'text' && selectedShapes[0].text) {
          navigator.clipboard.writeText(selectedShapes[0].text).catch(() => { });
        }

        if (selectedNodes.length > 0 || selectedShapes.length > 0) {
          e.preventDefault();
          const data = {
            nodes: selectedNodes.map((n: any) => ({
              title: n.title,
              content: n.content,
              customColor: n.customColor,
              x: n.x,
              y: n.y,
              groupId: n.groupId,
              attachments: n.attachments?.map((a: any) => ({
                fileName: a.fileName,
                fileUrl: a.fileUrl
              })) || [],
              tags: n.tags?.map((t: any) => ({
                name: t.name,
                color: t.color
              })) || []
            })),
            shapes: selectedShapes.map((s: any) => ({
              type: s.type,
              points: [...s.points],
              color: s.color,
              width: s.width,
              style: s.style,
              text: s.text,
              fontSize: s.fontSize,
              fontFamily: s.fontFamily,
              textDir: s.textDir,
              groupId: s.groupId
            }))
          };
          if (clipboardRef.current !== undefined) {
             (clipboardRef as any).current = data;
          }
          localStorage.setItem('nexus-graph-clipboard', JSON.stringify(data));
          showToast(`Copied ${data.nodes.length} nodes and ${data.shapes.length} drawings`, 'success');
        }
        return;
      }

      if (mod && e.key.toLowerCase() === 'v') {
        const { currentProject, currentUserId, graphSettings, addShape, activeGroupId, tags: allProjectTags } = useGraphStore.getState();
        if (!currentProject) return;

        e.preventDefault();

        let cpNodes = [];
        let cpShapes = [];

        if (clipboardRef.current && (clipboardRef.current.nodes.length > 0 || clipboardRef.current.shapes.length > 0)) {
          cpNodes = clipboardRef.current.nodes;
          cpShapes = clipboardRef.current.shapes;
        } else {
          const raw = localStorage.getItem('nexus-graph-clipboard');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              cpNodes = parsed.nodes || [];
              cpShapes = parsed.shapes || [];
            } catch (err) { }
          }
        }

        if (cpNodes.length > 0 || cpShapes.length > 0) {
          setSelectedNodeIds(new Set());
          setSelectedShapeIds(new Set());
          const offset = 50;

          (async () => {
            // Paste Nodes
            const nodeIds: number[] = [];
            if (cpNodes.length > 0) {
              const payloads = cpNodes.map((n: any) => ({
                title: n.title,
                content: n.content || '',
                projectId: currentProject.id,
                groupId: activeGroupId !== null ? activeGroupId : (n.groupId || 0),
                userId: currentUserId || n.userId,
                customColor: n.customColor,
                x: (n.x || 0) + offset,
                y: (n.y || 0) + offset,
              }));

              let createdNodes: any[] = [];
              try {
                createdNodes = await api.nodes.batchCreate(payloads);
              } catch (err) {
                // Fallback to sequential
                for (const p of payloads) {
                  try {
                    const node = await api.nodes.create(p);
                    createdNodes.push(node);
                  } catch (e) { }
                }
              }

              for (let i = 0; i < createdNodes.length; i++) {
                const node = createdNodes[i];
                const originalNodeData = cpNodes[i];

                useGraphStore.getState().addNode(node);
                nodeIds.push(node.id);

                if (originalNodeData.attachments && originalNodeData.attachments.length > 0) {
                  for (const att of originalNodeData.attachments) {
                    try {
                      await api.attachments.create({
                        nodeId: node.id,
                        fileName: att.fileName,
                        fileUrl: att.fileUrl
                      });
                    } catch (err) { }
                  }
                }

                if (originalNodeData.tags && originalNodeData.tags.length > 0) {
                  for (const tagData of originalNodeData.tags) {
                    try {
                      let tag = allProjectTags.find(t => t.name.toLowerCase() === tagData.name.toLowerCase());
                      if (!tag) {
                        tag = await api.tags.create({
                          name: tagData.name,
                          color: tagData.color,
                          userId: currentUserId || undefined
                        });
                        useGraphStore.getState().setTags([...allProjectTags, tag]);
                      }
                      await api.nodes.addTag(node.id, tag.id);
                    } catch (err) { }
                  }
                }

                if ((originalNodeData.attachments?.length > 0) || (originalNodeData.tags?.length > 0)) {
                  try {
                    const updatedNode = await api.nodes.getById(node.id);
                    useGraphStore.getState().updateNode(node.id, updatedNode);
                  } catch (err) { }
                }
              }
            }

            // Paste Shapes
            const shapeIds: number[] = [];
            for (const s of cpShapes) {
              try {
                const newPoints = (s.points || []).map((p: any) => ({ x: (p.x || 0) + offset, y: (p.y || 0) + offset }));
                const payload = {
                  projectId: currentProject.id,
                  type: s.type,
                  points: newPoints,
                  color: s.color,
                  width: s.width,
                  style: s.style,
                  text: s.text,
                  fontSize: s.fontSize,
                  fontFamily: s.fontFamily,
                  textDir: s.textDir,
                  direction: s.textDir,
                  groupId: activeGroupId !== null ? activeGroupId : s.groupId
                };
                const newShape = await api.drawings.create(payload);
                useGraphStore.getState().addShape(newShape);
                shapeIds.push(newShape.id);
              } catch (err) { }
            }

            setSelectedNodeIds(new Set(nodeIds));
            setSelectedShapeIds(new Set(shapeIds));

            const nextClipboard = {
              nodes: cpNodes.map((n: any) => ({ ...n, x: (n.x || 0) + offset, y: (n.y || 0) + offset })),
              shapes: cpShapes.map((s: any) => ({
                ...s,
                points: (s.points || []).map((p: any) => ({ x: (p.x || 0) + offset, y: (p.y || 0) + offset }))
              })),
            };
            if (clipboardRef.current !== undefined) {
               (clipboardRef as any).current = nextClipboard;
            }
            localStorage.setItem('nexus-graph-clipboard', JSON.stringify(nextClipboard));

            showToast(`Pasted ${nodeIds.length} nodes and ${shapeIds.length} drawings`, 'info');

            if (currentProject.id && currentUserId) {
              realtimeSync.notifyUpdate(currentProject.id, currentUserId);
            }
          })();
        } else {
          navigator.clipboard.readText().then(text => {
            if (!text || text.trim() === '') return;
            const center = graphRef.current?.centerAt() || { x: 0, y: 0 };
            const payload = {
              projectId: currentProject.id,
              type: 'text',
              points: [{ x: center.x, y: center.y }],
              color: graphSettings.strokeColor || '#355ea1',
              width: graphSettings.strokeWidth || 2,
              style: graphSettings.strokeStyle || 'solid',
              text: text.trim(),
              fontSize: graphSettings.fontSize || 16,
              fontFamily: graphSettings.fontFamily || 'Inter',
              textDir: graphSettings.textDir || 'ltr',
              direction: graphSettings.textDir || 'ltr',
              groupId: activeGroupId ?? undefined
            };
            api.drawings.create(payload).then(newShape => {
              addShape(newShape);
              setSelectedShapeIds(new Set([newShape.id]));
              setSelectedNodeIds(new Set());
            }).catch(() => { });
          }).catch(() => { });
        }
        return;
      }

      // 4. Arrow Key Movement
      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (isArrowKey && !graphSettings.isPreviewMode) {
        const scale = graphTransform.k || 1;
        const step = (e.shiftKey ? 2 : 1) / scale;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          const selectedNodes = selectedNodeIdsRef.current;
          const selectedShapes = selectedShapeIdsRef.current;

          // Move Nodes
          if (selectedNodes && selectedNodes.size > 0 && nodeCacheRef.current && nodeSaveTimeoutsRef.current) {
            const cache = nodeCacheRef.current;
            selectedNodes.forEach(id => {
              const cachedNode = cache.get(id);
              if (cachedNode) {
                cachedNode.fx = (cachedNode.fx ?? cachedNode.x ?? 0) + dx;
                cachedNode.fy = (cachedNode.fy ?? cachedNode.y ?? 0) + dy;
                const timeouts = nodeSaveTimeoutsRef.current!;
                if (timeouts.has(id)) clearTimeout(timeouts.get(id));
                timeouts.set(id, setTimeout(() => {
                  const fullNode = useGraphStore.getState().nodes.find(n => n.id === id);
                  if (fullNode) api.nodes.update(id, { ...fullNode, x: cachedNode.fx, y: cachedNode.fy }).catch(() => { });
                  timeouts.delete(id);
                }, 300));
              }
            });
            if (graphRef.current?.d3ReheatSimulation) graphRef.current.d3ReheatSimulation();
          }

          // Move Shapes
          if (selectedShapes && selectedShapes.size > 0 && shapesRef.current && shapeSaveTimeoutsRef.current) {
            let updated = false;
            const { currentProject, activeGroupId } = useGraphStore.getState();
            const newShapes = shapesRef.current.map((s: any) => {
              if (selectedShapes.has(s.id)) {
                updated = true;
                const newPoints = s.points.map((p: any) => ({ x: p.x + dx, y: p.y + dy }));
                const timeouts = shapeSaveTimeoutsRef.current!;
                if (timeouts.has(s.id)) clearTimeout(timeouts.get(s.id));
                timeouts.set(s.id, setTimeout(() => {
                  const dto = shapeToApiDrawing({ ...s, points: newPoints }, currentProject?.id || 0, activeGroupId ?? undefined);
                  api.drawings.update(s.id, dto).catch(() => { });
                  timeouts.delete(s.id);
                }, 300));
                return { ...s, points: newPoints };
              }
              return s;
            });
            if (updated) {
               (shapesRef as any).current = newShapes;
              if (shapeStateSaveTimeoutRef.current) clearTimeout(shapeStateSaveTimeoutRef.current);
               (shapeStateSaveTimeoutRef as any).current = setTimeout(() => setShapes(newShapes), 300);
              if (graphRef.current?.d3ReheatSimulation) graphRef.current.d3ReheatSimulation();
            }
          }
        }
        return;
      }

      // 5. General Controls
      if (e.key === 'Escape') {
        setSelectedShapeIds(new Set());
        setSelectedNodeIds(new Set());
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, pushToUndoStack, setShapes, setActiveNode, graphTransform, graphSettings.isPreviewMode, syncUndoRedo, shapesRef, selectedShapeIdsRef, selectedNodeIdsRef, selectedNodeIdsRefForDelete, clipboardRef, graphDataRef, nodeCacheRef, nodeSaveTimeoutsRef, shapeSaveTimeoutsRef, shapeStateSaveTimeoutRef, graphRef, shapeToApiDrawing, setNodes, setSelectedShapeIds, setSelectedNodeIds]);
}
