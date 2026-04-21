'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Github } from 'lucide-react';
import { useHomePageLogic } from '@/hooks/useHomePageLogic';

import { Project } from '@/types/knowledge';

import { LoadingScreen, LoadingOverlay } from '@/components/ui/Loading';
import { Navbar } from '@/components/layout/Navbar';
import { ProjectGrid } from '@/components/projects/ProjectCard';
import { ProjectsToolbar } from '@/components/projects/ProjectsToolbar';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { EditProjectModal } from '@/components/projects/EditProjectModal';
import { CreateGroupModal } from '@/components/projects/CreateGroupModal';
import { DeleteGroupModal } from '@/components/projects/DeleteGroupModal';
import { GroupList } from '@/components/projects/GroupList';
import { ProjectInfoPopup } from '@/components/project/ProjectInfoPopup';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { RecentVisitsTab } from '@/components/home/RecentVisitsTab';
import { AuthModal } from '@/components/auth/AuthModal';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import { ProjectCard } from '@/components/projects/ProjectCard';

function AuthErrorHandlerContent({ onSetTab }: { onSetTab: (t: 'all' | 'groups' | 'recent') => void }) {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === 'groups') {
      onSetTab('groups');
    }
  }, [tabParam, onSetTab]);

  useEffect(() => {
    if (errorParam && window.opener) {
      window.opener.postMessage({ type: 'NEXUS_AUTH_ERROR', error: errorParam }, window.location.origin);
      try { window.close(); } catch (e) { }
    }
  }, [errorParam]);

  return null;
}

function AuthErrorHandler({ onSetTab }: { onSetTab: (t: 'all' | 'groups' | 'recent') => void }) {
  return (
    <Suspense fallback={null}>
      <AuthErrorHandlerContent onSetTab={onSetTab} />
    </Suspense>
  );
}

export default function HomePage() {
  const { state, handlers } = useHomePageLogic();
  
  const {
    hasHydrated, isAuthenticated, user, search, viewMode, auth, tabs,
    projects, groups, recent, modals
  } = state;

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen overflow-y-auto bg-zinc-950">
      <Suspense fallback={null}>
        <AuthErrorHandler onSetTab={tabs.setActive} />
      </Suspense>
      <Navbar showSearch={false}>
        <a
          href="https://github.com/Ali-Tamerr/nexus--social-study-mapping-tool"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 border border-zinc-400/50 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
          title="View on GitHub"
        >
          <Github className="h-5 w-5" />
        </a>
      </Navbar>

      <main className={`mx-auto max-w-6xl px-6 py-8 ${!isAuthenticated ? 'relative min-h-[calc(100vh-64px)] flex flex-col justify-center' : ''}`}>
        {!isAuthenticated ? (
          <>
            <div className="absolute top-8 left-6 z-10">
              <RecentVisitsTab />
            </div>
            <WelcomeHero
              onSignup={() => auth.open('signup')}
              onLogin={() => auth.open('login')}
            />
          </>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Projects</h2>
            </div>

            <ProjectsToolbar
              searchQuery={search.query}
              onSearchChange={search.setQuery}
              viewMode={viewMode.mode}
              onViewModeChange={viewMode.setMode}
              onCreateProject={() => modals.createProject.toggle(true)}
              activeTab={tabs.active}
              onTabChange={tabs.setActive}
              selectionMode={false}
              onSelectionModeChange={() => { }}
              selectedCount={0}
              onCreateGroup={() => modals.createGroup.setOpen(true)}
            />

            {projects.isLoading || groups.isLoading || (tabs.active === 'recent' && recent.isLoading) ? (
              <LoadingOverlay message="Loading..." />
            ) : (
              <>
                {tabs.active === 'all' ? (
                  <ProjectGrid
                    projects={projects.filtered}
                    viewMode={viewMode.mode}
                    onProjectClick={handlers.project.open}
                    onProjectEdit={handlers.project.editClick}
                    onProjectDelete={handlers.project.del}
                    currentUserId={user?.id}
                  />
                ) : tabs.active === 'groups' ? (
                  <GroupList
                    groups={groups.filtered}
                    onDelete={handlers.group.delClick}
                    onEdit={handlers.group.editClick}
                    viewMode={viewMode.mode}
                    currentUserId={user?.id}
                  />
                ) : (
                  <div className={viewMode.mode === 'grid' ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"}>
                    {recent.visits.map((visit) => {
                      // Map RecentVisit to a semi-mock Project/Collection for the ProjectCard
                      const mockProject: Project = {
                        id: visit.targetId,
                        name: visit.name,
                        description: visit.description || '',
                        color: visit.color || (visit.targetType === 'collection' ? '#8B5CF6' : '#3B82F6'),
                        userId: user?.id || '',
                        createdAt: visit.visitedAt,
                        updatedAt: visit.visitedAt,
                        user: visit.ownerName ? { displayName: visit.ownerName, avatarUrl: visit.avatarUrl } as any : null
                      };

                      return (
                        <ProjectCard
                          key={`${visit.targetType}-${visit.targetId}`}
                          project={mockProject}
                          onClick={() => {
                            if (visit.targetType === 'project') {
                              state.router.push(`/project/${visit.publicId}/preview`);
                            } else {
                              state.router.push(`/collections/${visit.publicId}/preview`);
                            }
                          }}
                          viewMode={viewMode.mode}
                          isPinned={false}
                        />
                      );
                    })}
                    {recent.visits.length === 0 && !recent.isLoading && (
                      <div className="col-span-full py-20 text-center text-zinc-500">
                        No recent activity found. Explore some projects to see them here!
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <CreateProjectModal
        isOpen={modals.createProject.isOpen}
        onClose={() => modals.createProject.toggle(false)}
        onSubmit={handlers.project.create}
        loading={projects.isLoading}
      />

      <CreateGroupModal
        isOpen={modals.createGroup.isOpen}
        onClose={() => modals.createGroup.setOpen(false)}
        onSubmit={handlers.group.create}
        loading={groups.isLoading}
        availableProjects={projects.all}
      />

      {modals.deleteGroup.group && (
        <DeleteGroupModal
          group={modals.deleteGroup.group}
          isOpen={true}
          onClose={() => modals.deleteGroup.setGroup(null)}
          onDelete={handlers.group.confirmDelete}
          loading={groups.isLoading}
        />
      )}

      {modals.editGroup.group && (
        <CreateGroupModal
          key={`${modals.editGroup.group.id}-${modals.editGroup.group.updatedAt}`}
          isOpen={true}
          onClose={() => modals.editGroup.setId(null)}
          onSubmit={handlers.group.update}
          loading={groups.isLoading}
          availableProjects={projects.all}
          initialData={{
            name: modals.editGroup.group.name,
            description: modals.editGroup.group.description,
            projectIds: handlers.group.getProjectIds(modals.editGroup.group),
            pinnedProjectIds: modals.editGroup.group.items?.filter(i => i.isPinned).map(i => i.projectId) || []
          }}
        />
      )}
      {modals.editProject.project && (
        <EditProjectModal
          isOpen={true}
          onClose={() => modals.editProject.setProject(null)}
          onSubmit={handlers.project.update}
          loading={projects.isLoading}
          initialData={{
            name: modals.editProject.project.name,
            description: modals.editProject.project.description
          }}
        />
      )}

      <AuthModal
        isOpen={auth.showModal}
        onClose={() => auth.setShowModal(false)}
        initialMode={auth.mode}
      />
    </div>
  );
}
