export interface ProjectMember {
  id: number;
  projectId: number;
  userId: string;
  role: 'viewer' | 'editor';
  createdAt: string;
}

export interface CollectionMember {
  id: number;
  collectionId: number;
  userId: string;
  role: 'viewer' | 'editor';
  createdAt: string;
}

export interface CollaborationRequest {
  id: number;
  type: 'project' | 'collection';
  targetId: number;
  requesterId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  // Included relations for UI convenience
  requester?: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string;
  };
  project?: {
    id: number;
    name: string;
    ownerId: string; // The user_id of the project
  };
  collection?: {
    id: number;
    name: string;
    ownerId: string; // The user_id of the collection
  };
}
