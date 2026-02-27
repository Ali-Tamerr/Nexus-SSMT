import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, FileText, Video, Link2, FormInput, Loader2, Calendar, BookOpen, CheckSquare, Square, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCourseWork, useCourseMaterials } from '@/hooks/useClassroomApi';
import { ClassroomCourse, CourseWork, CourseWorkMaterial, extractMaterialInfo } from '@/lib/classroomApi';

interface SectionMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: ClassroomCourse | null;
  onBack: () => void;
  onItemsSelect: (items: { item: CourseWork | CourseWorkMaterial, type: 'assignment' | 'material' }[]) => void;
}

interface MaterialItemProps {
  item: CourseWork | CourseWorkMaterial;
  type: 'assignment' | 'material';
  isSelected: boolean;
  onToggle: () => void;
}

function MaterialItem({ item, type, isSelected, onToggle }: MaterialItemProps) {
  const getIcon = () => {
    if (type === 'assignment') {
      return <FileText className="h-4 w-4 text-blue-400" />;
    }
    return <BookOpen className="h-4 w-4 text-purple-400" />;
  };

  const getTypeLabel = () => {
    return type === 'assignment' ? 'Assignment' : 'Material';
  };

  const getTypeBadgeColor = () => {
    return type === 'assignment'
      ? 'bg-blue-900/50 text-blue-300'
      : 'bg-purple-900/50 text-purple-300';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDueDate = (courseWork: CourseWork) => {
    if (!courseWork.dueDate) return null;

    const { year, month, day } = courseWork.dueDate;
    const dueDate = new Date(year, month - 1, day);

    if (courseWork.dueTime) {
      const { hours, minutes } = courseWork.dueTime;
      dueDate.setHours(hours, minutes);
    }

    return dueDate.toLocaleString();
  };

  return (
    <div
      onClick={onToggle}
      className={`relative border rounded-lg p-4 transition-colors cursor-pointer ${isSelected
          ? 'bg-zinc-800/80 border-blue-500/50'
          : 'border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
        }`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white mb-1 line-clamp-2">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.creationTime)}
            </span>

            {/* {type === 'assignment' && (item as CourseWork).dueDate && (
              <span className="flex items-center gap-1 text-orange-400">
                <Clock className="h-3 w-3" />
                Due: {formatDueDate(item as CourseWork)}
              </span>
            )} */}

            {/* <span className={`px-2 py-0.5 rounded text-xs ${getTypeBadgeColor()}`}>
              {getTypeLabel()}
            </span> */}
          </div>

          {/* Show materials if any */}
          {item.materials && item.materials.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.materials.slice(0, 3).map((material, index) => {
                const materialInfo = extractMaterialInfo(material);
                const getTypeIcon = () => {
                  switch (materialInfo.type) {
                    case 'video': return <Video className="h-3 w-3" />;
                    case 'link': return <Link2 className="h-3 w-3" />;
                    case 'form': return <FormInput className="h-3 w-3" />;
                    default: return <FileText className="h-3 w-3" />;
                  }
                };

                return (
                  <span key={index} className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                    {getTypeIcon()}
                    <span className="truncate max-w-20">{materialInfo.title}</span>
                  </span>
                );
              })}
              {item.materials.length > 3 && (
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                  +{item.materials.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 ml-4 flex items-center self-center">
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-blue-500" />
          ) : (
            <Square className="h-5 w-5 text-zinc-500" />
          )}
        </div>
      </div>
    </div>
  );
}

export function SectionMaterialModal({
  isOpen,
  onClose,
  course,
  onBack,
  onItemsSelect
}: SectionMaterialModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'assignments' | 'materials'>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selection state when modal opens/closes or course changes
  useEffect(() => {
    setSelectedItemIds(new Set());
    setIsSubmitting(false);
  }, [isOpen, course?.id]);

  const {
    data: courseWork = [],
    isLoading: isLoadingWork,
    error: workError
  } = useCourseWork(course?.id || '', isOpen && !!course);

  const {
    data: materials = [],
    isLoading: isLoadingMaterials,
    error: materialsError
  } = useCourseMaterials(course?.id || '', isOpen && !!course);

  const isLoading = isLoadingWork || isLoadingMaterials;
  const hasError = workError || materialsError;

  // Combine and sort items by creation time (newest first)
  const allItems = useMemo(() => {
    const workItems = courseWork.map(item => ({ item, type: 'assignment' as const }));
    const materialItems = materials.map(item => ({ item, type: 'material' as const }));

    return [...workItems, ...materialItems].sort((a, b) =>
      new Date(b.item.creationTime).getTime() - new Date(a.item.creationTime).getTime()
    );
  }, [courseWork, materials]);

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'assignments':
        return allItems.filter(({ type }) => type === 'assignment');
      case 'materials':
        return allItems.filter(({ type }) => type === 'material');
      default:
        return allItems;
    }
  }, [allItems, activeTab]);

  const isAllSelected = filteredItems.length > 0 && filteredItems.every(({ item }) => selectedItemIds.has(item.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all in current view
      const newSelected = new Set(selectedItemIds);
      filteredItems.forEach(({ item }) => newSelected.delete(item.id));
      setSelectedItemIds(newSelected);
    } else {
      // Select all in current view
      const newSelected = new Set(selectedItemIds);
      filteredItems.forEach(({ item }) => newSelected.add(item.id));
      setSelectedItemIds(newSelected);
    }
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedItemIds.size === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const selectedItemsList = allItems.filter(({ item }) => selectedItemIds.has(item.id));

    // We pass the selection up; the parent will handle the creation and close the modal.
    onItemsSelect(selectedItemsList);
  };

  const handleClose = () => {
    setSelectedItemIds(new Set());
    setIsSubmitting(false);
    onClose();
  };

  const handleBack = () => {
    setSelectedItemIds(new Set());
    setIsSubmitting(false);
    onBack();
  };

  if (!course) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="2xl"
    >
      <div className="flex flex-col h-[70vh] sm:h-[600px]">
        {/* Header */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-white">Section Material</h2>
              <p className="text-xs sm:text-sm text-zinc-400 truncate">{course.name}</p>
            </div>
          </div>

          {/* Select All & Action Button */}
          <div className="flex items-center justify-between mb-4 mt-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="h-6 w-6 text-blue-500" />
              ) : (
                <Square className="h-6 w-6 text-zinc-400" />
              )}
              <span className="font-semibold text-lg text-white">Select all</span>
            </button>

            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={selectedItemIds.size === 0}
              icon={<Plus className="h-4 w-4" />}
              className="px-4"
            >
              Add Node/s
            </Button>
          </div>

          {/* Tabs - scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'all'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
            >
              All Sections
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'assignments'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
            >
              Assignments ({courseWork.length})
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'materials'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
            >
              Materials ({materials.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading course materials...</span>
              </div>
            </div>
          ) : hasError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-400 mb-2 text-sm">Failed to load course materials.</p>
                <p className="text-xs sm:text-sm text-zinc-400">Please try again later.</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-zinc-400 text-sm">
                  No {activeTab === 'all' ? 'materials' : activeTab} found for this course.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(({ item, type }, index) => (
                <MaterialItem
                  key={`${type}-${item.id}`}
                  item={item}
                  type={type}
                  isSelected={selectedItemIds.has(item.id)}
                  onToggle={() => handleItemToggle(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}