export const encodeWallpaper = (wallpaper: string | null | undefined): string | null => {
  return wallpaper || null;
};

export const decodeWallpaper = (
  wallpaper: string | null | undefined,
): string | undefined => {
  return wallpaper || undefined;
};

export const createColorImage = (color: string): string => {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    // Return base64 string without prefix
    return canvas.toDataURL("image/png").split(",")[1];
  }
  return "";
};
