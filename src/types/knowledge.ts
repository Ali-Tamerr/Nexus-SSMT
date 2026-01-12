export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  nodes?: Node[];
}

export interface Attachment {
  id: string;
  nodeId: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  userId?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  userId?: string;
  createdAt: string;
}

export interface Node {
  id: string;
  projectId?: string;
  title: string;
  content?: string;
  excerpt?: string;
  groupId: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;
  tags?: Tag[];
  attachments?: Attachment[];
}

export interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: 'supports' | 'contradicts' | 'neutral' | string;
  userId?: string;
  createdAt?: string;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export type DrawingTool = 
  | 'pan' 
  | 'select' 
  | 'rectangle' 
  | 'diamond' 
  | 'circle' 
  | 'arrow' 
  | 'line' 
  | 'pen' 
  | 'text' 
  | 'image' 
  | 'eraser';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface GraphSettings {
  isPreviewMode: boolean;
  lockAllMovement: boolean;
  activeTool: DrawingTool;
  strokeWidth: number;
  strokeColor: string;
  strokeStyle: StrokeStyle;
}

export interface PresenceState {
  sessionId: string;
  nodeId: string;
  userId: string;
  lastSeen: string;
}

export interface Profile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  password: string;
}

export type RelationshipType = Link['relationshipType'];

export { RELATIONSHIP_COLORS, GROUP_COLORS, BRAND_COLOR, NODE_COLORS } from '@/lib/constants';
