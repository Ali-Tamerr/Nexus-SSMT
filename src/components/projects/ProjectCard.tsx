'use client';

import { useState } from 'react';
import { ChevronRight, FolderOpen, Loader2, Trash2, Pencil } from 'lucide-react';

import { Project } from '@/types/knowledge';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  viewMode?: 'grid' | 'list';
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (project: Project) => void;
}

export function ProjectCard({
  project,
  onClick,
  onDelete,
  onEdit,
  viewMode = 'grid',
  selectable = false,
  isSelected = false,
  onToggleSelect
}: ProjectCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isListView = viewMode === 'list';

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (selectable && onToggleSelect) {
      // If in selection mode, toggle selection instead of navigation
      onToggleSelect(project);
      return;
    }

    setIsLoading(true);
    onClick(project);
  };


  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof onDelete === 'function') onDelete(project);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof onEdit === 'function') onEdit(project);
  };

  return (
    <div
      onClick={isLoading ? undefined : handleClick}
      role="button"
      tabIndex={isLoading ? -1 : 0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      className={`
        group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-left 
        transition-all cursor-pointer
        ${!isLoading ? 'hover:border-zinc-700 hover:bg-zinc-900' : ''}
        ${isLoading ? 'cursor-wait opacity-80' : ''}
        flex items-center justify-between ${!isListView ? 'sm:block' : ''}
      `}
    >
    >
      {selectable && (
        <div className={`absolute top-3 right-3 z-20 h-5 w-5 rounded border ${isSelected ? 'bg-[#355ea1] border-[#355ea1]' : 'border-zinc-600 bg-zinc-900/50'} flex items-center justify-center transition-colors`}>
          {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#355ea1]" />
            <span className="text-sm text-zinc-300">Loading...</span>
          </div>
        </div>
      )}

      <div className={`flex max-sm:flex-col items-center gap-4 ${!isListView ? 'sm:block' : ''} ${selectable && isSelected ? 'opacity-100' : ''}`}>
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            {project.color ? (
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
            ) : null}
            <h3 className="font-semibold text-white group-hover:text-[#355ea1] transition-colors">
              {project.name}
            </h3>
            <ChevronRight className="h-5 w-5 -ml-1 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-zinc-400" />
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        <div className={`flex max-sm:self-start items-center gap-3 text-xs text-zinc-500 ${!isListView ? 'sm:mt-4' : ''}`}>
          <span className="text-zinc-600">
            {new Date(project.updatedAt).toLocaleDateString()}
          </span>
          <button
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-colors"
            title="Edit project"
            onClick={handleEdit}
            tabIndex={-1}
            type="button"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
            title="Delete project"
            onClick={handleDelete}
            tabIndex={-1}
            type="button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProjectGridProps {
  projects: Project[];
  viewMode: 'grid' | 'list';
  onProjectClick: (project: Project) => void;
  onProjectDelete?: (project: Project) => void;
  onProjectEdit?: (project: Project) => void;
  selectable?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (project: Project) => void;
}

export function ProjectGrid({
  projects,
  viewMode,
  onProjectClick,
  onProjectDelete,
  onProjectEdit,
  selectable = false,
  selectedIds,
  onToggleSelect
}: ProjectGridProps) {
  if (projects.length === 0) {
    return <EmptyProjectsState />;
  }

  return (
    <div className={
      viewMode === 'grid'
        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
        : 'flex flex-col gap-3'
    }>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={onProjectClick}
          onDelete={onProjectDelete}
          onEdit={onProjectEdit}
          viewMode={viewMode}
          selectable={selectable}
          isSelected={selectedIds?.has(project.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

export function EmptyProjectsState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <FolderOpen className="h-16 w-16 text-zinc-700" />
      <p className="mt-4 text-lg text-zinc-400">No projects found</p>
      <p className="text-sm text-zinc-500">Create your first project to get started</p>
    </div>
  );
}
