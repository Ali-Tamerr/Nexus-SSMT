import { DrawnShape } from "@/types/knowledge";

export type ResizeHandle =
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w"
  | "rotate";

export interface ShapeBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

// Helper for text measurement
const tempCtx =
  typeof document !== "undefined"
    ? document.createElement("canvas").getContext("2d")
    : null;

export function getShapeBounds(
  shape: DrawnShape,
  globalScale: number = 1,
): ShapeBounds | null {
  if (shape.points.length === 0) return null;

  if (shape.type === "text" && shape.text) {
    const fontSize = shape.fontSize || 16;
    const lines = shape.text.split("\n");
    const lineHeight = fontSize * 1.2;
    let textWidth = 0;
    const totalHeight = lines.length * lineHeight;

    if (tempCtx) {
      tempCtx.font = `${fontSize}px ${shape.fontFamily || "Inter"}, sans-serif`;
      textWidth = Math.max(
        ...lines.map((line) => tempCtx.measureText(line).width),
      );
    } else {
      // Fallback
      textWidth =
        Math.max(...lines.map((line) => line.length)) * fontSize * 0.6;
    }

    const angle =
      shape.points.length >= 2
        ? Math.atan2(
            shape.points[1].y - shape.points[0].y,
            shape.points[1].x - shape.points[0].x,
          )
        : 0;

    const p0 = shape.points[0];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Calculate vectors for width and height edges
    // Width vector
    const wx = textWidth * cos;
    const wy = textWidth * sin;
    // Height vector (rotated 90 degrees clockwise)
    const hx = -totalHeight * sin;
    const hy = totalHeight * cos;

    // If text direction is RTL, the anchor point is the top-right corner.
    // So the top-left corner is shifted by the width vector reversed.
    const shiftX = shape.textDir === "rtl" ? -wx : 0;
    const shiftY = shape.textDir === "rtl" ? -wy : 0;

    const x1 = p0.x + shiftX;
    const y1 = p0.y + shiftY;
    const x2 = p0.x + shiftX + wx;
    const y2 = p0.y + shiftY + wy;
    const x3 = p0.x + shiftX + wx + hx;
    const y3 = p0.y + shiftY + wy + hy;
    const x4 = p0.x + shiftX + hx;
    const y4 = p0.y + shiftY + hy;

    const xs = [x1, x2, x3, x4];
    const ys = [y1, y2, y3, y4];

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }

  if (shape.type === "circle" && shape.points.length > 2) {
    const p0 = shape.points[0];
    const p1 = shape.points[1];
    const p2 = shape.points[2];

    const cx = (p0.x + p2.x) / 2;
    const cy = (p0.y + p2.y) / 2;

    // U vector (Center -> Right)
    const ux = p1.x - cx;
    const uy = p1.y - cy;
    const radiusX = Math.sqrt(ux * ux + uy * uy);

    // V magnitude from P0 (Center -> Top)
    const vx_raw = p0.x - cx;
    const vy_raw = p0.y - cy;
    const radiusY = Math.sqrt(vx_raw * vx_raw + vy_raw * vy_raw);

    // Angle of U
    const angle = Math.atan2(uy, ux);

    // Calculate implicit orthogonal V vector (W) for the rendered ellipse
    // Use -PI/2 for Top direction relative to Right
    const wx = radiusY * Math.cos(angle - Math.PI / 2);
    const wy = radiusY * Math.sin(angle - Math.PI / 2);

    // Calculate extents based on the specific ellipse equation
    const halfW = Math.sqrt(ux * ux + wx * wx);
    const halfH = Math.sqrt(uy * uy + wy * wy);

    const analyticalMinX = cx - halfW;
    const analyticalMinY = cy - halfH;
    const analyticalMaxX = cx + halfW;
    const analyticalMaxY = cy + halfH;

    // Union with points AABB (to ensure handles are covered)
    const xs = shape.points.map((p) => p.x);
    const ys = shape.points.map((p) => p.y);
    const pointsMinX = Math.min(...xs);
    const pointsMaxX = Math.max(...xs);
    const pointsMinY = Math.min(...ys);
    const pointsMaxY = Math.max(...ys);

    return {
      minX: Math.min(analyticalMinX, pointsMinX) - 1, // Add 1px safety
      minY: Math.min(analyticalMinY, pointsMinY) - 1,
      maxX: Math.max(analyticalMaxX, pointsMaxX) + 1,
      maxY: Math.max(analyticalMaxY, pointsMaxY) + 1,
      width:
        Math.max(analyticalMaxX, pointsMaxX) -
        Math.min(analyticalMinX, pointsMinX) +
        2,
      height:
        Math.max(analyticalMaxY, pointsMaxY) -
        Math.min(analyticalMinY, pointsMinY) +
        2,
    };
  }

  const xs = shape.points.map((p) => p.x);
  const ys = shape.points.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getResizeHandlePosition(
  bounds: ShapeBounds,
  handle: ResizeHandle,
  globalScale: number = 1,
): { x: number; y: number } {
  const { minX, minY, maxX, maxY, width, height } = bounds;
  const padding = 5 / globalScale;

  switch (handle) {
    case "nw":
      return { x: minX - padding, y: minY - padding };
    case "ne":
      return { x: maxX + padding, y: minY - padding };
    case "sw":
      return { x: minX - padding, y: maxY + padding };
    case "se":
      return { x: maxX + padding, y: maxY + padding };
    case "n":
      return { x: minX + width / 2, y: minY - padding };
    case "s":
      return { x: minX + width / 2, y: maxY + padding };
    case "e":
      return { x: maxX + padding, y: minY + height / 2 };
    case "w":
      return { x: minX - padding, y: minY + height / 2 };
    case "rotate":
      return { x: minX + width / 2, y: minY - padding - 25 / globalScale };
  }
}

export function drawResizeHandles(
  ctx: CanvasRenderingContext2D,
  bounds: ShapeBounds,
  globalScale: number,
) {
  ctx.save();

  const handleRadius = 4 / globalScale;
  const handles: ResizeHandle[] = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];

  handles.forEach((handle) => {
    const pos = getResizeHandlePosition(bounds, handle, globalScale);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, handleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#0D99FF";
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();
  });

  ctx.restore();
}

export function getHandleAtPoint(
  point: { x: number; y: number },
  bounds: ShapeBounds,
  globalScale: number,
): ResizeHandle | null {
  const handles: ResizeHandle[] = [
    "rotate",
    "nw",
    "ne",
    "sw",
    "se",
    "n",
    "s",
    "e",
    "w",
  ];

  for (const handle of handles) {
    const pos = getResizeHandlePosition(bounds, handle, globalScale);
    const dx = point.x - pos.x;
    const dy = point.y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check radius based on handle type
    const threshold = handle === "rotate" ? 30 / globalScale : 10 / globalScale;

    if (distance <= threshold) {
      return handle;
    }
  }

  return null;
}

export function resizeShape(
  shape: DrawnShape,
  handle: ResizeHandle,
  currentPoint: { x: number; y: number },
  startPoint: { x: number; y: number },
  startBounds: ShapeBounds,
  shiftKey: boolean = false,
): DrawnShape {
  let dx = currentPoint.x - startPoint.x;
  let dy = currentPoint.y - startPoint.y;

  let newMinX = startBounds.minX;
  let newMinY = startBounds.minY;
  let newMaxX = startBounds.maxX;
  let newMaxY = startBounds.maxY;

  if (shiftKey && ["nw", "ne", "sw", "se"].includes(handle)) {
    const aspectRatio = startBounds.width / startBounds.height;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx / aspectRatio > absDy) {
      dy = (absDx / aspectRatio) * Math.sign(dy);
    } else {
      dx = absDy * aspectRatio * Math.sign(dx);
    }
  }

  switch (handle) {
    case "se":
      newMaxX = startBounds.maxX + dx;
      newMaxY = startBounds.maxY + dy;
      break;
    case "sw":
      newMinX = startBounds.minX + dx;
      newMaxY = startBounds.maxY + dy;
      break;
    case "ne":
      newMaxX = startBounds.maxX + dx;
      newMinY = startBounds.minY + dy;
      break;
    case "nw":
      newMinX = startBounds.minX + dx;
      newMinY = startBounds.minY + dy;
      break;
    case "e":
      newMaxX = startBounds.maxX + dx;
      break;
    case "w":
      newMinX = startBounds.minX + dx;
      break;
    case "s":
      newMaxY = startBounds.maxY + dy;
      break;
    case "n":
      newMinY = startBounds.minY + dy;
      break;
  }

  const scaleX =
    startBounds.width > 0 ? (newMaxX - newMinX) / startBounds.width : 1;
  const scaleY =
    startBounds.height > 0 ? (newMaxY - newMinY) / startBounds.height : 1;

  if (shape.type === "circle" && shape.points.length > 2) {
    const p0 = shape.points[0];
    const p2 = shape.points[2];
    const oldCenterX = (p0.x + p2.x) / 2;
    const oldCenterY = (p0.y + p2.y) / 2;

    const oldRelCX =
      startBounds.width > 0
        ? (oldCenterX - startBounds.minX) / startBounds.width
        : 0.5;
    const oldRelCY =
      startBounds.height > 0
        ? (oldCenterY - startBounds.minY) / startBounds.height
        : 0.5;
    const newCenterX = newMinX + oldRelCX * (newMaxX - newMinX);
    const newCenterY = newMinY + oldRelCY * (newMaxY - newMinY);

    const newPoints = shape.points.map((p) => {
      const offsetX = p.x - oldCenterX;
      const offsetY = p.y - oldCenterY;
      return {
        x: newCenterX + offsetX * scaleX,
        y: newCenterY + offsetY * scaleY,
      };
    });

    return { ...shape, points: newPoints };
  }

  const newPoints = shape.points.map((p) => {
    const relX =
      startBounds.width > 0
        ? (p.x - startBounds.minX) / startBounds.width
        : 0.5;
    const relY =
      startBounds.height > 0
        ? (p.y - startBounds.minY) / startBounds.height
        : 0.5;
    return {
      x: newMinX + relX * (newMaxX - newMinX),
      y: newMinY + relY * (newMaxY - newMinY),
    };
  });

  return {
    ...shape,
    points: newPoints,
  };
}

export function rotateShape(
  shape: DrawnShape,
  currentPoint: { x: number; y: number },
  startPoint: { x: number; y: number },
  bounds: ShapeBounds,
): DrawnShape {
  let centerX = bounds.minX + bounds.width / 2;
  let centerY = bounds.minY + bounds.height / 2;

  if (
    (shape.type === "arrow" || shape.type === "line") &&
    shape.points.length === 2
  ) {
    centerX = (shape.points[0].x + shape.points[1].x) / 2;
    centerY = (shape.points[0].y + shape.points[1].y) / 2;
  }

  if (shape.type === "circle" && shape.points.length >= 4) {
    const p0 = shape.points[0];
    const p2 = shape.points[2];
    centerX = (p0.x + p2.x) / 2;
    centerY = (p0.y + p2.y) / 2;
  } else if (shape.type === "circle" && shape.points.length === 2) {
    const p0 = shape.points[0];
    const p1 = shape.points[1];
    centerX = (p0.x + p1.x) / 2;
    centerY = (p0.y + p1.y) / 2;
  }

  const startAngle = Math.atan2(startPoint.y - centerY, startPoint.x - centerX);
  const currentAngle = Math.atan2(
    currentPoint.y - centerY,
    currentPoint.x - centerX,
  );
  const deltaAngle = currentAngle - startAngle;

  // If text has only 1 point, upgrade it to 2 points to support rotation
  let pointsToRotate = shape.points;
  if (shape.type === "text" && shape.points.length === 1) {
    pointsToRotate = [shape.points[0]];
  } else if (
    (shape.type === "rectangle" ||
      shape.type === "diamond" ||
      shape.type === "circle") &&
    shape.points.length === 2
  ) {
    const p0 = shape.points[0];
    const p1 = shape.points[1];
    const minX = Math.min(p0.x, p1.x);
    const maxX = Math.max(p0.x, p1.x);
    const minY = Math.min(p0.y, p1.y);
    const maxY = Math.max(p0.y, p1.y);

    if (shape.type === "rectangle") {
      pointsToRotate = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];
    } else {
      // For Circle/Diamond, use cardinal points (midpoints of sides)
      // Top, Right, Bottom, Left order
      pointsToRotate = [
        { x: (minX + maxX) / 2, y: minY },
        { x: maxX, y: (minY + maxY) / 2 },
        { x: (minX + maxX) / 2, y: maxY },
        { x: minX, y: (minY + maxY) / 2 },
      ];
    }
  }

  const newPoints = pointsToRotate.map((p) => {
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    const cos = Math.cos(deltaAngle);
    const sin = Math.sin(deltaAngle);
    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
    };
  });

  return {
    ...shape,
    points: newPoints,
  };
}

export function getCursorForHandle(handle: ResizeHandle | null): string {
  if (!handle) return "default";

  switch (handle) {
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "rotate":
      return "grab";
    default:
      return "default";
  }
}
