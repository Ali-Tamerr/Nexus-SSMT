import { RefObject } from 'react';
import { useGraphStore, filterNodes } from '@/store/useGraphStore';

export function useGraphExportLogic({ 
  containerRef, 
  graphRef 
}: { 
  containerRef: RefObject<HTMLDivElement | null>; 
  graphRef: RefObject<any>;
}) {
  const processExport = async (type: 'png' | 'jpg') => {
    const graphCanvas = containerRef.current?.querySelector('canvas');
    if (!graphCanvas || !graphRef.current) return;

    // 1. Save View
    const prevZoom = graphRef.current.zoom() || 1;
    const prevCenter = graphRef.current.centerAt() || { x: 0, y: 0 };

    // 2. Get Data State
    const state = useGraphStore.getState();
    const { nodes, shapes, activeGroupId, searchQuery, currentProject } = state;

    // 3. Calc Bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // Filtered Nodes
    let exportNodes = filterNodes(nodes, searchQuery);
    if (activeGroupId !== null && activeGroupId !== undefined) {
      exportNodes = exportNodes.filter(n => n.groupId === activeGroupId);
    }

    exportNodes.forEach(n => {
      const x = n.x || 0, y = n.y || 0;
      const r = 20;
      minX = Math.min(minX, x - r);
      maxX = Math.max(maxX, x + r);
      minY = Math.min(minY, y - r);
      maxY = Math.max(maxY, y + r);
    });

    // Filtered Shapes
    let exportShapes = shapes;
    if (activeGroupId !== null && activeGroupId !== undefined) {
      exportShapes = exportShapes.filter(s => s.groupId === activeGroupId);
    }

    exportShapes.forEach(s => {
      try {
        const pts = s.points;
        const padding = 5;
        pts.forEach((p: any) => {
          minX = Math.min(minX, p.x - padding);
          maxX = Math.max(maxX, p.x + padding);
          minY = Math.min(minY, p.y - padding);
          maxY = Math.max(maxY, p.y + padding);
        });
      } catch (e) { }
    });

    // 4. Apply Zoom to Fit
    if (minX !== Infinity) {
      const PADDING = 50;
      const rect = containerRef.current!.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width && height) {
        const contentW = maxX - minX;
        const contentH = maxY - minY;
        if (contentW > 0 && contentH > 0) {
          const kx = (width - PADDING * 2) / contentW;
          const ky = (height - PADDING * 2) / contentH;
          const k = Math.min(kx, ky, 2);
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;

          graphRef.current.zoom(k, 0);
          graphRef.current.centerAt(cx, cy, 0);
        }
      }
    }

    // Capture Screen Coords for Crop
    await new Promise(r => setTimeout(r, 100)); // Wait for render

    // We need to calculate screen bounds AFTER the zoom
    const tl = graphRef.current.graph2ScreenCoords(minX, minY);
    const tr = graphRef.current.graph2ScreenCoords(maxX, minY);
    const bl = graphRef.current.graph2ScreenCoords(minX, maxY);
    const br = graphRef.current.graph2ScreenCoords(maxX, maxY);

    // Find bounding box in screen pixels
    const screenMinX = Math.min(tl.x, tr.x, bl.x, br.x);
    const screenMaxX = Math.max(tl.x, tr.x, bl.x, br.x);
    const screenMinY = Math.min(tl.y, tr.y, bl.y, br.y);
    const screenMaxY = Math.max(tl.y, tr.y, bl.y, br.y);

    const dpr = window.devicePixelRatio || 1;
    const cropPadding = 20;

    const sx = (screenMinX - cropPadding) * dpr;
    const sy = (screenMinY - cropPadding) * dpr;
    const sw = (screenMaxX - screenMinX + cropPadding * 2) * dpr;
    const sh = (screenMaxY - screenMinY + cropPadding * 2) * dpr;

    // 5. Draw & Download
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sw;
    tempCanvas.height = sh;
    const ctx = tempCanvas.getContext('2d');

    const download = () => {
      const a = document.createElement('a');
      a.download = `nexus-graph-${currentProject?.name || 'export'}.${type}`;
      a.href = tempCanvas.toDataURL(`image/${type}`);
      a.click();

      // Restore
      graphRef.current.zoom(prevZoom, 0);
      graphRef.current.centerAt(prevCenter.x, prevCenter.y, 0);
    };

    if (ctx) {
      const drawGraph = () => {
        ctx.drawImage(graphCanvas as HTMLCanvasElement, sx, sy, sw, sh, 0, 0, sw, sh);
      };

      if (type === 'jpg') {
        const wallpaper = currentProject?.wallpaper;
        const drawBg = (color?: string | CanvasImageSource) => {
          if (typeof color === 'string') {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          } else if (color) {
            ctx.drawImage(color as CanvasImageSource, 0, 0, tempCanvas.width, tempCanvas.height);
          }
          drawGraph();
          download();
        };

        if (wallpaper) {
          if (wallpaper.startsWith('#')) {
            drawBg(wallpaper);
          } else {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => drawBg(img);
            img.onerror = () => drawBg('#09090b');
            img.src = wallpaper.startsWith('data:') ? wallpaper : `data:image/png;base64,${wallpaper}`;
          }
        } else {
          drawBg('#09090b');
        }
      } else {
        drawGraph();
        download();
      }
    } else {
      graphRef.current.zoom(prevZoom, 0);
      graphRef.current.centerAt(prevCenter.x, prevCenter.y, 0);
    }
  };

  return { processExport };
}
