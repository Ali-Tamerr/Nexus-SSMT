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
    data: { name?: string; description?: string; projectIds?: number[] },
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
        const collections = await api.projectCollections.getByUser(userId);
        set({ collections, isLoading: false });
      } catch (err) {
        console.error("Failed to fetch collections:", err);
        // Don't set error state for 404s or network errors to avoid UI clutter, just log
        set({ collections: [], isLoading: false });
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
        const updated = await api.projectCollections.update(id, data);
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === id ? updated : c,
          ),
          isLoading: false,
        }));
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
