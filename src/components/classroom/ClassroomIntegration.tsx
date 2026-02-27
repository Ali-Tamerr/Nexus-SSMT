import { useState, useEffect } from 'react';
import { useGraphStore } from '@/store/useGraphStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { useHasClassroomAccess } from '@/hooks/useClassroomApi';
import { GoogleAuthPromptModal } from './GoogleAuthPromptModal';
import { ClassroomSelectionModal } from './ClassroomSelectionModal';
import { SectionMaterialModal } from './SectionMaterialModal';
import { ClassroomCourse, CourseWork, CourseWorkMaterial, extractMaterialInfo } from '@/lib/classroomApi';

interface ClassroomIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'auth-prompt' | 'course-selection' | 'section-material' | null;

export function ClassroomIntegration({ isOpen, onClose }: ClassroomIntegrationProps) {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  const { hasAccess } = useHasClassroomAccess();
  const { user } = useAuthStore();
  const {
    addNode,
    setActiveNode,
    currentProject,
    currentUserId,
    toggleEditor,
    activeGroupId
  } = useGraphStore();
  const { showToast } = useToast();

  // Get the user ID from either the graph store or auth store
  const effectiveUserId = currentUserId || user?.id;

  // Determine initial modal state when opened
  const getInitialModalState = (): ModalState => {
    // hasAccess now checks both session token and stored token
    if (!hasAccess) {
      return 'auth-prompt';
    }
    return 'course-selection';
  };

  // Set modal state when opened
  useEffect(() => {
    if (isOpen) {
      const initialState = getInitialModalState();
      setModalState(initialState);
    } else {
      setModalState(null);
      setSelectedCourse(null);
    }
  }, [isOpen, hasAccess, forceRefresh]);

  const handleClose = () => {
    setModalState(null);
    setSelectedCourse(null);
    onClose();
  };

  const handleAuthSuccess = () => {
    // After successful auth, force a refresh and show course selection
    setForceRefresh(prev => prev + 1);
    setModalState('course-selection');
  };

  const handleCourseSelect = (course: ClassroomCourse) => {
    setSelectedCourse(course);
    setModalState('section-material');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setModalState('course-selection');
  };

  const handleItemsSelect = async (
    items: { item: CourseWork | CourseWorkMaterial, type: 'assignment' | 'material' }[]
  ) => {
    if (!currentProject || !effectiveUserId) {
      console.error('Missing data:', { currentProject, effectiveUserId, currentUserId, userId: user?.id });
      showToast('Error: Missing project or user information', 'error');
      return;
    }

    try {
      // Get or create a valid group for the node
      // Prefer the activeGroupId (currently selected tab) if available
      let groupId = activeGroupId || 0;

      // If no active group, fetch existing groups
      if (!groupId) {
        try {
          const groups = await api.groups.getByProject(currentProject.id);
          if (groups && groups.length > 0) {
            groupId = groups[0].id;
          }
        } catch (e) {
          console.error('Failed to fetch groups:', e);
        }
      }

      // If no groups exist, create a default one
      if (groupId === 0) {
        try {
          const newGroup = await api.groups.create({
            name: 'Default',
            color: '#808080',
            order: 0,
            projectId: currentProject.id
          });
          if (newGroup) groupId = newGroup.id;
        } catch (e) {
          console.error('Failed to create default group:', e);
        }
      }

      if (groupId === 0) {
        showToast('Error: Could not find or create a group for the node', 'error');
        return;
      }

      // Prepare payload for batch creation
      const batchPayload = items.map(({ item, type }) => {
        // Helper function to safely get title and content
        const getItemData = (i: CourseWork | CourseWorkMaterial) => {
          if (type === 'assignment') {
            const courseWork = i as CourseWork;
            return {
              title: courseWork.title || 'Untitled Assignment',
              content: courseWork.description || ''
            };
          } else {
            const material = i as CourseWorkMaterial;
            return {
              title: material.title || 'Untitled Material',
              content: material.description || ''
            };
          }
        };

        const { title: nodeTitle, content: nodeContent } = getItemData(item);

        // Generate random position for the node
        const randomX = (Math.random() - 0.5) * 150;
        const randomY = (Math.random() - 0.5) * 150;

        // Generate a random color
        const GROUP_COLORS = ['#8B5CF6', '#355ea1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
        const randomColor = GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];

        // Handle attachments
        const nodeAttachments: any[] = [];

        if (item.materials && item.materials.length > 0) {
          item.materials.forEach(material => {
            const materialInfo = extractMaterialInfo(material);
            if (materialInfo.url) {
              nodeAttachments.push({
                fileName: materialInfo.title || 'Untitled',
                fileUrl: materialInfo.url,
              });
            }
          });
        }

        // Add Classroom source link as attachment
        if (item.alternateLink) {
          let itemTitle: string;
          let typeLabel: string;

          if (type === 'assignment') {
            itemTitle = (item as CourseWork).title;
            typeLabel = 'Assignment';
          } else {
            itemTitle = (item as CourseWorkMaterial).title;
            typeLabel = 'Material';
          }

          nodeAttachments.push({
            fileName: `${typeLabel}: ${itemTitle || 'Untitled'}`,
            fileUrl: item.alternateLink,
          });
        }

        return {
          title: nodeTitle,
          content: nodeContent,
          projectId: currentProject.id,
          groupId: groupId,
          userId: effectiveUserId,
          x: randomX,
          y: randomY,
          customColor: randomColor,
          attachments: nodeAttachments
        };
      });

      // Call batch endpoint
      const newNodes = await api.nodes.batchCreate(batchPayload);

      // Add to store and set as active
      if (newNodes && newNodes.length > 0) {
        newNodes.forEach(node => addNode(node));
        setActiveNode(newNodes[newNodes.length - 1]);
        toggleEditor(true);
      }

      showToast(`Successfully added ${items.length} node(s) from Classroom`, 'success');

      handleClose();
    } catch (error) {
      console.error('Failed to create nodes from Classroom items:', error);
      showToast('Failed to create nodes from Classroom items', 'error');
    }
  };

  return (
    <>
      <GoogleAuthPromptModal
        isOpen={isOpen && modalState === 'auth-prompt'}
        onClose={handleClose}
        onSuccess={handleAuthSuccess}
      />

      <ClassroomSelectionModal
        isOpen={isOpen && modalState === 'course-selection'}
        onClose={handleClose}
        onCourseSelect={handleCourseSelect}
      />

      <SectionMaterialModal
        isOpen={isOpen && modalState === 'section-material'}
        onClose={handleClose}
        course={selectedCourse}
        onBack={handleBackToCourses}
        onItemsSelect={handleItemsSelect}
      />
    </>
  );
}