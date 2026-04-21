import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGraphStore } from '@/store/useGraphStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectCollectionStore } from '@/store/useProjectCollectionStore';
import { useToast } from '@/context/ToastContext';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import { Project } from '@/types/knowledge';
import { api } from '@/lib/api';
import { getFriendlyErrorMessage } from '@/utils/errorUtils';

export function useHomePageLogic() {
  const router = useRouter();
  const { showToast, showConfirmation } = useToast();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  const collections = useProjectCollectionStore(state => state.collections);
  const fetchCollections = useProjectCollectionStore(state => state.fetchCollections);
  const isGroupsLoading = useProjectCollectionStore(state => state.isLoading);
  const updateCollection = useProjectCollectionStore(state => state.updateCollection);
  const createCollection = useProjectCollectionStore(state => state.createCollection);
  const deleteCollection = useProjectCollectionStore(state => state.deleteCollection);

  const {
    projects,
    setProjects,
    addProject,
    deleteProject,
    setCurrentProject,
    isCreateProjectOpen,
    toggleCreateProject,
    isLoading: isGraphLoading,
    setLoading: setGraphLoading,
    setCurrentUserId,
    setCurrentProjectId
  } = useGraphStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Group Features State
  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'recent'>('all');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { recentVisits, isLoading: isRecentLoading } = useRecentVisits();
  
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const editingGroup = collections.find(c => c.id === editingGroupId);
  const [groupToDelete, setGroupToDelete] = useState<typeof collections[0] | null>(null);

  useEffect(() => {
    if (user?.id && isAuthenticated) {
      setCurrentUserId(user.id);
      fetchCollections(user.id);
    }
  }, [user?.id, isAuthenticated, setCurrentUserId, fetchCollections]);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.id) return;

      setGraphLoading(true);
      try {
        const fetchedProjects = await api.projects.getByUser(user.id);
        setProjects(fetchedProjects);
      } catch (err) {
        setProjects([]);
      } finally {
        setGraphLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadProjects();
    }
  }, [user, isAuthenticated, setProjects, setGraphLoading]);

  const filteredProjects = projects
    .filter((p) =>
      (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const filteredGroups = collections
    .filter((g) =>
      (g.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (g.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleCreateProject = async (data: { name: string; description?: string; color: string }) => {
    if (!user?.id) return;
    setGraphLoading(true);

    try {
      const newProject = await api.projects.create({
        name: data.name,
        description: data.description,
        color: data.color,
        userId: user.id,
      });
      addProject(newProject);
      toggleCreateProject(false);
    } catch (err) {
      console.error('Failed to create project:', err);
      showToast(getFriendlyErrorMessage(err), 'error');
    } finally {
      setGraphLoading(false);
    }
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setCurrentProjectId(project.id);
    router.push('/project/editor');
  };

  const handleEditProjectClick = (project: Project) => {
    setEditingProject(project);
  };

  const handleUpdateProject = async (data: { name: string; description?: string }) => {
    if (!editingProject) return;

    setGraphLoading(true);
    try {
      const updatedProject = { ...editingProject, ...data };
      await api.projects.update(editingProject.id, updatedProject);
      setProjects(projects.map(p => p.id === editingProject.id ? updatedProject : p));
      setEditingProject(null);
      showToast('Project updated successfully');
    } catch (err) {
      console.error('Failed to update project:', err);
      showToast(getFriendlyErrorMessage(err), 'error');
    } finally {
      setGraphLoading(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!await showConfirmation(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    setGraphLoading(true);
    try {
      await api.projects.delete(project.id);
      deleteProject(project.id);
      showToast('Project deleted');
    } catch (err) {
      console.error('Failed to delete project:', err);
      deleteProject(project.id);
      showToast('Project deleted (local)', 'info');
    } finally {
      setGraphLoading(false);
    }
  };

  const handleCreateGroup = async (data: { name: string; description?: string; projectIds: number[]; pinnedProjectIds: number[] }) => {
    if (!user?.id) return;

    try {
      await createCollection({
        name: data.name,
        description: data.description,
        userId: user.id,
        projectIds: data.projectIds,
        pinnedProjectIds: data.pinnedProjectIds
      });
      setIsCreateGroupOpen(false);
      setActiveTab('groups');
      showToast('Collection created successfully');
    } catch (err) {
      showToast(getFriendlyErrorMessage(err), 'error');
    }
  };

  const handleEditGroupClick = (group: typeof collections[0]) => {
    setEditingGroupId(group.id);
  };

  const handleUpdateGroup = async (data: { name: string; description?: string; projectIds: number[]; pinnedProjectIds: number[] }) => {
    if (!editingGroup || !user?.id) return;

    try {
      await updateCollection(editingGroup.id, {
        name: data.name,
        description: data.description || "",
        projectIds: data.projectIds,
        pinnedProjectIds: data.pinnedProjectIds
      });
      setEditingGroupId(null);
      showToast('Collection updated successfully');
    } catch (err) {
      showToast(getFriendlyErrorMessage(err), 'error');
    }
  };

  const getGroupProjectIds = (g: any) => {
    if (g.projectIds && g.projectIds.length > 0) {
      return g.projectIds.map((id: any) => Number(id));
    }
    if (g.items && g.items.length > 0) return g.items.map((i: any) => Number(i.projectId));
    if (g.projects && g.projects.length > 0) return g.projects.map((p: any) => Number(p.id));
    const fallback = g.projectIds || g.items?.map((i: any) => i.projectId) || g.projects?.map((p: any) => p.id) || [];
    return fallback.map((id: any) => Number(id));
  };

  const handleDeleteGroupClick = (group: typeof collections[0]) => {
    setGroupToDelete(group);
  };

  const handleConfirmDeleteGroup = async (withProjects: boolean) => {
    if (!groupToDelete || !user?.id) return;

    try {
      if (withProjects && groupToDelete.items) {
        const projectIds1 = groupToDelete.items.map(item => item.projectId);
        await Promise.all(projectIds1.map(pid => api.projects.delete(pid)));
        projectIds1.forEach(pid => deleteProject(pid));
      }
      await deleteCollection(groupToDelete.id);
      setGroupToDelete(null);
      showToast('Collection deleted successfully');
    } catch (err) {
      console.error('Failed to delete group:', err);
      showToast('Failed to delete collection', 'error');
    }
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return {
    state: {
      hasHydrated, isAuthenticated, user, router, search: { query: searchQuery, setQuery: setSearchQuery },
      viewMode: { mode: viewMode, setMode: setViewMode },
      auth: { showModal: showAuthModal, setShowModal: setShowAuthModal, mode: authMode, open: openAuth },
      tabs: { active: activeTab, setActive: setActiveTab },
      projects: { all: projects, filtered: filteredProjects, isLoading: isGraphLoading },
      groups: { all: collections, filtered: filteredGroups, isLoading: isGroupsLoading },
      recent: { visits: recentVisits, isLoading: isRecentLoading },
      modals: {
        createProject: { isOpen: isCreateProjectOpen, toggle: toggleCreateProject },
        editProject: { project: editingProject, setProject: setEditingProject },
        createGroup: { isOpen: isCreateGroupOpen, setOpen: setIsCreateGroupOpen },
        editGroup: { group: editingGroup, setId: setEditingGroupId },
        deleteGroup: { group: groupToDelete, setGroup: setGroupToDelete }
      }
    },
    handlers: {
      project: {
        create: handleCreateProject, open: handleOpenProject,
        editClick: handleEditProjectClick, update: handleUpdateProject, del: handleDeleteProject
      },
      group: {
        create: handleCreateGroup, editClick: handleEditGroupClick, update: handleUpdateGroup,
        delClick: handleDeleteGroupClick, confirmDelete: handleConfirmDeleteGroup,
        getProjectIds: getGroupProjectIds
      }
    }
  };
}
