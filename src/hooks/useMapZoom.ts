import { useEffect, RefObject } from 'react';

export function useMapZoom({
  containerRef,
  graphRef,
  graphTransform
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  graphRef: RefObject<any>;
  graphTransform: { k: number, x: number, y: number };
}) {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent browser zooming/scrolling
      e.preventDefault();
      e.stopPropagation(); // Stop propagation to D3/ForceGraph

      if (e.ctrlKey || e.metaKey) {
        // Zoom Logic (Pinch or Ctrl+Scroll)
        const zoomFactor = e.deltaY > 0 ? 0.88 : 1.12;
        const currentZoom = graphRef.current?.zoom() || 1;
        const newZoom = Math.max(0.1, Math.min(10, currentZoom * zoomFactor));

        graphRef.current?.zoom(newZoom, 0);
      } else {
        // Pan Logic (Trackpad Swipe / Mouse Wheel)
        // User wants Swipe to Pan
        const scale = graphTransform.k || 1;
        const panX = e.deltaX / scale; 
        const panY = e.deltaY / scale;

        const currentCenter = graphRef.current?.centerAt();
        if (currentCenter) {
          graphRef.current.centerAt(
            currentCenter.x + panX,
            currentCenter.y + panY,
            0
          );
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel, { capture: true });
      }
    };
  }, [graphTransform.k, containerRef, graphRef]);
}
