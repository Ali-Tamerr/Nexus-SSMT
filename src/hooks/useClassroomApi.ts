import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
  fetchClassroomCourses,
  fetchCourseWork,
  fetchCourseAnnouncements,
  fetchCourseMaterials,
  filterCoursesByName,
  type ClassroomCourse,
  type CourseWork,
  type CourseAnnouncement,
  type CourseWorkMaterial,
} from "@/lib/classroomApi";
import {
  getClassroomToken,
  hasValidClassroomToken,
} from "@/lib/classroomToken";

/**
 * Hook to get the effective access token for Classroom API
 * Checks both the session (for Google-signed-in users) and localStorage (for connected accounts)
 * Priority: localStorage token > session token (so users can override with a different Classroom account)
 */
function useClassroomAccessToken() {
  const { data: session } = useSession();
  const sessionToken = (session?.user as any)?.accessToken;
  const isGoogleUser = (session?.user as any)?.provider === "google";

  // Check localStorage for a connected Classroom token (overrides session token)
  const [storedToken, setStoredToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return getClassroomToken();
    }
    return null;
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh the token check
  const refreshToken = useCallback(() => {
    const token = getClassroomToken();
    console.log("Refreshing classroom token, found:", token ? "yes" : "no");
    setStoredToken(token);
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Check for stored token on mount
    refreshToken();

    // Listen for storage events (in case token is set in another tab/popup)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "classroom_access_token") {
        refreshToken();
      }
    };

    // Listen for custom event from popup
    const handleClassroomAuth = () => {
      console.log("classroom-auth-success event received");
      refreshToken();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("classroom-auth-success", handleClassroomAuth);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("classroom-auth-success", handleClassroomAuth);
    };
  }, [session, refreshToken]);

  // Priority: stored token (user-selected Classroom account) > session token (main Google account)
  // This allows Google users to connect a DIFFERENT Google account just for Classroom
  const accessToken = storedToken || sessionToken;
  const hasAccess = !!accessToken;

  return { accessToken, hasAccess, isGoogleUser, refreshToken };
}

/**
 * Hook to fetch user's Google Classroom courses
 */
export function useClassroomCourses(enabled = true) {
  const { accessToken, hasAccess } = useClassroomAccessToken();

  return useQuery({
    queryKey: ["classroom", "courses", accessToken?.slice(-10)], // Include token suffix for cache invalidation
    queryFn: () => fetchClassroomCourses(accessToken!),
    enabled: enabled && hasAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes("401") || error?.message?.includes("403")) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch coursework for a specific course
 */
export function useCourseWork(courseId: string, enabled = true) {
  const { accessToken, hasAccess } = useClassroomAccessToken();

  return useQuery({
    queryKey: ["classroom", "coursework", courseId, accessToken?.slice(-10)],
    queryFn: () => fetchCourseWork(courseId, accessToken!),
    enabled: enabled && !!courseId && hasAccess,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("401") || error?.message?.includes("403")) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch announcements for a specific course
 */
export function useCourseAnnouncements(courseId: string, enabled = true) {
  const { accessToken, hasAccess } = useClassroomAccessToken();

  return useQuery({
    queryKey: ["classroom", "announcements", courseId, accessToken?.slice(-10)],
    queryFn: () => fetchCourseAnnouncements(courseId, accessToken!),
    enabled: enabled && !!courseId && hasAccess,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("401") || error?.message?.includes("403")) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch course materials (lectures, readings) for a specific course
 */
export function useCourseMaterials(courseId: string, enabled = true) {
  const { accessToken, hasAccess } = useClassroomAccessToken();

  return useQuery({
    queryKey: ["classroom", "materials", courseId, accessToken?.slice(-10)],
    queryFn: () => fetchCourseMaterials(courseId, accessToken!),
    enabled: enabled && !!courseId && hasAccess,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("401") || error?.message?.includes("403")) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to filter courses by search term
 */
export function useFilteredCourses(searchTerm: string) {
  const { data: courses, ...rest } = useClassroomCourses();

  const filteredCourses = courses
    ? filterCoursesByName(courses, searchTerm)
    : undefined;

  return {
    data: filteredCourses,
    ...rest,
  };
}

/**
 * Check if user has Google Classroom access
 * This checks both session tokens (for Google users) and stored tokens (for connected accounts)
 */
export function useHasClassroomAccess() {
  const { data: session, status } = useSession();
  const isGoogleUser = (session?.user as any)?.provider === "google";
  const sessionAccessToken = !!(session?.user as any)?.accessToken;

  // Check for stored Classroom token (for non-Google users who connected their Classroom)
  const [hasStoredToken, setHasStoredToken] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return hasValidClassroomToken();
    }
    return false;
  });

  const checkStoredToken = useCallback(() => {
    const hasToken = hasValidClassroomToken();
    console.log("Checking stored token:", hasToken);
    setHasStoredToken(hasToken);
  }, []);

  useEffect(() => {
    // Check on mount
    checkStoredToken();

    // Listen for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "classroom_access_token") {
        checkStoredToken();
      }
    };

    // Listen for custom event from popup
    const handleClassroomAuth = () => {
      console.log("Classroom auth success event received");
      checkStoredToken();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("classroom-auth-success", handleClassroomAuth);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("classroom-auth-success", handleClassroomAuth);
    };
  }, [session, checkStoredToken]);

  const hasAccess = (isGoogleUser && sessionAccessToken) || hasStoredToken;

  return {
    hasAccess,
    isGoogleUser,
    hasAccessToken: sessionAccessToken || hasStoredToken,
    hasStoredToken,
    isLoading: status === "loading",
    session,
  };
}
