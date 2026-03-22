import { CollaborationRequest } from '@/types/collaboration';
import { api } from '../api';
import { useGraphStore } from '@/store/useGraphStore';

const BASE_URL = '/api/collaboration';

export const collaborationApi = {
  // 1. Request Access (For Guests)
  requestAccess: async (type: 'project' | 'collection', targetId: number, requesterId: string) => {
    return api.fetchApiWithBody<void>(`${BASE_URL}/request`, 'POST', {
      type,
      targetId,
      requesterId
    });
  },

  // 2. Get Pending Requests (For Owners)
  getPendingRequestsForOwner: async (projectIds: number[], collectionIds: number[]) => {
    const pIds = projectIds.join(',');
    const cIds = collectionIds.join(',');
    return api.fetchApi<any[]>(`${BASE_URL}/pending?projectIds=${pIds}&collectionIds=${cIds}`, { method: 'GET' });
  },

  // 3. Get Requests Made By Current User (For Members/Guests)
  getMyRequests: async (userId: string): Promise<CollaborationRequest[]> => {
    return api.fetchApi<CollaborationRequest[]>(`${BASE_URL}/my-requests/${userId}`, { method: 'GET' });
  },

  // 4. Respond to Request (For Owners)
  respondToRequest: async (requestId: number, type: 'project' | 'collection', targetId: number, requesterId: string, accept: boolean) => {
    return api.fetchApiWithBody<void>(`${BASE_URL}/respond?requestId=${requestId}`, 'POST', {
      type,
      targetId,
      requesterId,
      accept
    });
  },

  // 5. Unified Access Check (Projects)
  hasProjectAccess: async (projectId: number, userId: string): Promise<boolean> => {
    return api.fetchApi<boolean>(`${BASE_URL}/access/project/${projectId}?userId=${userId}`, { method: 'GET' }).catch(() => false);
  }
};
