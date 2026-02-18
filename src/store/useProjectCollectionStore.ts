import { create } from "zustand";
import { ProjectCollection } from "@/types/knowledge";
import { api } from "@/lib/api";

interface ProjectCollectionState {
  collections: ProjectCollection[];
  isLoading: boolean;
  error: string | null;

  setCollections: (collections: ProjectCollection[]) => void;
  fetchCollections: (userId: string) => Promise<void>;
  createCollection: (data: {
    name: string;
    description?: string;
    userId: string;
    projectIds: number[];
  }) => Promise<void>;
  updateCollection: (
    id: number,
    data: {
      id?: number;
      name?: string;
      description?: string;
      projectIds?: number[];
      userId?: string;
    },
  ) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
}

export const useProjectCollectionStore = create<ProjectCollectionState>(
  (set, get) => ({
    collections: [],
    isLoading: false,
    error: null,

    setCollections: (collections) => set({ collections }),

    fetchCollections: async (userId) => {
      set({ isLoading: true, error: null });
      try {
        const raw = await api.projectCollections.getByUser(userId);
        const collections = raw.map((c: any) => ({
          ...c,
          projectIds:
            c.projectIds || c.items?.map((i: any) => i.projectId) || [],
        }));
        set({ collections, isLoading: false });
      } catch (err) {
        console.error("Failed to fetch collections:", err);
        set({ isLoading: false });
      }
    },

    createCollection: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const newCollection = await api.projectCollections.create(data);
        set((state) => ({
          collections: [newCollection, ...state.collections],
          isLoading: false,
        }));
      } catch (err) {
        console.error("Failed to create collection:", err);
        set({ isLoading: false, error: "Failed to create collection" });
        throw err;
      }
    },

    updateCollection: async (id, data) => {
      set({ isLoading: true, error: null });
      try {
        await api.projectCollections.update(id, {
          ...data,
          id,
        });
        // Manually update the state to reflect changes immediately
        set((state) => {
          const existing = state.collections.find((c) => c.id == id);
          if (!existing) {
            console.warn(
              `Collection with id ${id} not found in store for update`,
            );
            return { isLoading: false };
          }

          const updatedItems =
            data.projectIds?.map((pid) => ({
              collectionId: id,
              projectId: pid,
              order: 0,
            })) || existing.items;

          const updatedCollection = {
            ...existing,
            ...data,
            id, // Ensure ID is preserved
            items: updatedItems,
            updatedAt: new Date().toISOString(),
          };

          return {
            collections: state.collections.map((c) =>
              c.id == id ? updatedCollection : c,
            ),
            isLoading: false,
          };
        });
      } catch (err) {
        console.error("Failed to update collection:", err);
        set({ isLoading: false, error: "Failed to update collection" });
        throw err;
      }
    },

    deleteCollection: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await api.projectCollections.delete(id);
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
          isLoading: false,
        }));
      } catch (err) {
        console.error("Failed to delete collection:", err);
        // Optimistically delete anyway for better UX if it was already gone
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
          isLoading: false,
        }));
      }
    },
  }),
);
