/**
 * Utility functions for managing the separate Google Classroom access token
 * This token is stored in localStorage and is independent of the main session
 */

const STORAGE_KEY_TOKEN = "classroom_access_token";
const STORAGE_KEY_REFRESH_TOKEN = "classroom_refresh_token";
const STORAGE_KEY_EXPIRES = "classroom_token_expires_at";

/**
 * Get the stored Classroom access token
 */
export function getClassroomToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiresAt = localStorage.getItem(STORAGE_KEY_EXPIRES);

  if (!token || !expiresAt) {
    if (token || expiresAt) {
      console.log(
        "[ClassroomToken] Missing one of token/expiresAt, clearing. Token:",
        !!token,
        "ExpiresAt:",
        !!expiresAt,
      );
      clearClassroomToken();
    }
    return null;
  }

  // Check if token is expired (strictly, 2 minute buffer)
  const expiresAtMs = parseInt(expiresAt, 10);
  const now = Date.now();
  const buffer = 2 * 60 * 1000;

  if (isNaN(expiresAtMs)) {
    console.warn("[ClassroomToken] Invalid expiresAt value:", expiresAt);
    clearClassroomToken();
    return null;
  }

  if (now > expiresAtMs - buffer) {
    console.log("[ClassroomToken] Access token expired or near expiry.");
    // If we have a refresh token, we don't necessarily want to clear everything yet
    // But we'll return null to signal that current access token is not valid
    return null;
  }

  return token;
}

/**
 * Get the stored refresh token
 */
export function getClassroomRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);
}

/**
 * Store the Classroom access tokens
 */
export function setClassroomToken(
  accessToken: string,
  expiresAt: number,
  refreshToken?: string,
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, refreshToken);
  }
}

/**
 * Clear the stored Classroom tokens
 */
export function clearClassroomToken(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_EXPIRES);
  localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN);
}

/**
 * Refresh the Classroom access token using a refresh token
 */
export async function refreshClassroomToken(): Promise<string | null> {
  const refreshToken = getClassroomRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch("/api/auth/classroom-refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    setClassroomToken(data.accessToken, data.expiresAt);
    return data.accessToken;
  } catch (error) {
    console.error("Error refreshing Classroom token:", error);
    // If refresh fails, it might be due to revoked access
    // clearClassroomToken(); // Keep for now, maybe don't clear if network error?
    return null;
  }
}

/**
 * Check if a valid Classroom token exists
 */
export function hasValidClassroomToken(): boolean {
  return getClassroomToken() !== null;
}

/**
 * Get the Google OAuth URL for Classroom-only access
 * @param forceAccountSelection - If true, forces Google to show account selection
 */
export function getClassroomOAuthUrl(forceAccountSelection = false): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/classroom-callback`;

  const scopes = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me",
    "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
    "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: forceAccountSelection ? "select_account consent" : "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
