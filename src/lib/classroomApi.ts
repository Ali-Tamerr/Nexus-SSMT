/**
 * Google Classroom API integration
 * Provides typed interfaces for Classroom data and API calls
 */

export interface ClassroomCourse {
  id: string;
  name: string;
  description?: string;
  descriptionHeading?: string;
  room?: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode?: string;
  courseState: "ACTIVE" | "ARCHIVED" | "PROVISIONED" | "DECLINED" | "SUSPENDED";
  alternateLink?: string;
}

export interface CourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  materials?: CourseMaterial[];
  state: "PUBLISHED" | "DRAFT" | "DELETED";
  alternateLink?: string;
  creationTime: string;
  updateTime: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
    seconds: number;
    nanos: number;
  };
  workType: "ASSIGNMENT" | "SHORT_ANSWER_QUESTION" | "MULTIPLE_CHOICE_QUESTION";
}

export interface CourseMaterial {
  driveFile?: {
    driveFile?: {
      id: string;
      title: string;
      alternateLink?: string;
      thumbnailUrl?: string;
    };
    shareMode?: "UNKNOWN_SHARE_MODE" | "VIEW" | "EDIT" | "STUDENT_COPY";
  };
  youTubeVideo?: {
    id: string;
    title: string;
    alternateLink?: string;
    thumbnailUrl?: string;
  };
  link?: {
    url: string;
    title?: string;
    thumbnailUrl?: string;
  };
  form?: {
    formUrl: string;
    responseUrl?: string;
    title?: string;
    thumbnailUrl?: string;
  };
}

export interface CourseAnnouncement {
  id: string;
  courseId: string;
  title?: string; // Actually 'text' but we'll map it to title for consistency
  text: string;
  description?: string; // For consistency with CourseWork
  materials?: CourseMaterial[];
  state: "PUBLISHED" | "DRAFT" | "DELETED";
  alternateLink?: string;
  creationTime: string;
  updateTime: string;
}

export interface CourseWorkMaterial {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  materials?: CourseMaterial[];
  state: "PUBLISHED" | "DRAFT" | "DELETED";
  alternateLink?: string;
  creationTime: string;
  updateTime: string;
  topicId?: string;
}

/**
 * Fetch user's Google Classroom courses
 */
export async function fetchClassroomCourses(
  accessToken: string,
): Promise<ClassroomCourse[]> {
  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Classroom API error:", response.status, errorText);

    // Throw a specific error code for 401/403 to trigger the correct re-auth UI
    if (response.status === 401 || response.status === 403) {
      throw new Error(`401 UNAUTHENTICATED: ${errorText}`);
    }

    throw new Error(
      `Failed to fetch courses: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.courses || [];
}

/**
 * Fetch coursework (assignments) for a specific course
 */
export async function fetchCourseWork(
  courseId: string,
  accessToken: string,
): Promise<CourseWork[]> {
  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Coursework API error:", response.status, errorText);
    throw new Error(
      `Failed to fetch coursework: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.courseWork || [];
}

/**
 * Fetch announcements for a specific course
 */
export async function fetchCourseAnnouncements(
  courseId: string,
  accessToken: string,
): Promise<CourseAnnouncement[]> {
  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/announcements`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Announcements API error:", response.status, errorText);
    throw new Error(
      `Failed to fetch announcements: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  const announcements = data.announcements || [];

  // Transform announcements to have consistent interface with CourseWork
  return announcements.map((announcement: any) => ({
    ...announcement,
    title: announcement.text, // Map text to title for consistency
    description: announcement.text, // Also map to description
  }));
}

/**
 * Fetch course materials (lectures, readings, etc.) for a specific course
 */
export async function fetchCourseMaterials(
  courseId: string,
  accessToken: string,
): Promise<CourseWorkMaterial[]> {
  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Course Materials API error:", response.status, errorText);
    throw new Error(
      `Failed to fetch course materials: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.courseWorkMaterial || [];
}

/**
 * Search courses by name (client-side filtering)
 */
export function filterCoursesByName(
  courses: ClassroomCourse[],
  searchTerm: string,
): ClassroomCourse[] {
  if (!searchTerm.trim()) return courses;

  const term = searchTerm.toLowerCase();
  return courses.filter(
    (course) =>
      course.name.toLowerCase().includes(term) ||
      course.description?.toLowerCase().includes(term) ||
      course.descriptionHeading?.toLowerCase().includes(term),
  );
}

/**
 * Extract material info for display
 */
export function extractMaterialInfo(material: CourseMaterial): {
  title: string;
  url?: string;
  type: string;
} {
  if (material.driveFile?.driveFile) {
    return {
      title: material.driveFile.driveFile.title,
      url: material.driveFile.driveFile.alternateLink,
      type: "file",
    };
  }

  if (material.youTubeVideo) {
    return {
      title: material.youTubeVideo.title,
      url: material.youTubeVideo.alternateLink,
      type: "video",
    };
  }

  if (material.link) {
    return {
      title: material.link.title || material.link.url,
      url: material.link.url,
      type: "link",
    };
  }

  if (material.form) {
    return {
      title: material.form.title || "Google Form",
      url: material.form.formUrl,
      type: "form",
    };
  }

  return {
    title: "Unknown Material",
    type: "unknown",
  };
}
