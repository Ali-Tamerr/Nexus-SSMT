import { useState, useEffect, useRef } from 'react';
import { useGraphStore } from '@/store/useGraphStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Attachment, Tag as TagType, Link as LinkType } from '@/types/knowledge';
import { api } from '@/lib/api';
import { realtimeSync } from '@/lib/supabase/realtime';

export function useNodeEditorLogic() {
  const activeNode = useGraphStore((s) => s.activeNode);
  const updateNode = useGraphStore((s) => s.updateNode);
  const deleteNode = useGraphStore((s) => s.deleteNode);
  const setActiveNode = useGraphStore((s) => s.setActiveNode);
  const isEditorOpen = useGraphStore((s) => s.isEditorOpen);
  const toggleEditor = useGraphStore((s) => s.toggleEditor);
  const addAttachmentToNode = useGraphStore((s) => s.addAttachmentToNode);
  const removeAttachmentFromNode = useGraphStore((s) => s.removeAttachmentFromNode);
  const addTagToNode = useGraphStore((s) => s.addTagToNode);
  const removeTagFromNode = useGraphStore((s) => s.removeTagFromNode);
  const currentUserId = useGraphStore((s) => s.currentUserId);
  const nodes = useGraphStore((s) => s.nodes);
  const links = useGraphStore((s) => s.links);
  const addLink = useGraphStore((s) => s.addLink);
  const updateLink = useGraphStore((s) => s.updateLink);
  const deleteLink = useGraphStore((s) => s.deleteLink);
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);

  const isConnectionPickerActive = useGraphStore(s => s.isConnectionPickerActive);
  const setConnectionPickerActive = useGraphStore(s => s.setConnectionPickerActive);
  const connectionPickerResult = useGraphStore(s => s.connectionPickerResult);
  const setConnectionPickerResult = useGraphStore((s) => s.setConnectionPickerResult);

  const { user } = useAuthStore();
  const { showToast, showConfirmation } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(activeNode?.content || '');
  const [customColor, setCustomColor] = useState(activeNode?.customColor || undefined);
  const [visualSize, setVisualSize] = useState(activeNode?.visualSize || 1.0);
  
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showConnectionMenu, setShowConnectionMenu] = useState(false);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8B5CF6');
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState<number | ''>('');
  const [connectionDescription, setConnectionDescription] = useState('');
  const [connectionColor, setConnectionColor] = useState('#355ea1');
  const [editingConnectionId, setEditingConnectionId] = useState<number | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const connectionMenuRef = useRef<HTMLDivElement>(null);
  const customColorPickerRef = useRef<HTMLDivElement>(null);

  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [tempCustomColor, setTempCustomColor] = useState('#355ea1');
  const [showUnsavedPopup, setShowUnsavedPopup] = useState(false);
  const lastNodeIdRef = useRef<number | null>(null);

  const [editingAttachmentId, setEditingAttachmentId] = useState<number | null>(null);

  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [deletedAttachments, setDeletedAttachments] = useState<Map<number, Attachment>>(new Map());

  const [pendingLinks, setPendingLinks] = useState<LinkType[]>([]);
  const [deletedLinks, setDeletedLinks] = useState<Map<number, LinkType>>(new Map());
  const [editedLinks, setEditedLinks] = useState<Map<number, LinkType>>(new Map());
  const [originalLinks, setOriginalLinks] = useState<Map<number, LinkType>>(new Map());

  const originalColorRef = useRef<string | undefined>(undefined);
  const originalVisualSizeRef = useRef<number>(1.0);

  useEffect(() => {
    setPendingAttachments([]);
    setDeletedAttachments(new Map());
    setPendingLinks([]);
    setDeletedLinks(new Map());
    setEditedLinks(new Map());
    setOriginalLinks(new Map());
  }, [activeNode?.id]);

  useEffect(() => {
    if (connectionPickerResult !== null) {
      setSelectedTargetNodeId(connectionPickerResult);
      setConnectionPickerResult(null);
    }
  }, [connectionPickerResult, setConnectionPickerResult]);

  const isTitleDirty = activeNode ? title !== activeNode.title : false;
  const isContentDirty = activeNode ? content !== (activeNode.content || '') : false;

  useEffect(() => {
    if (activeNode) {
      const isActuallyNewNode = activeNode.id !== lastNodeIdRef.current;
      
      if (isActuallyNewNode || !isTitleDirty) {
        setTitle(activeNode.title);
      }
      if (isActuallyNewNode || !isContentDirty) {
        setContent(activeNode.content || '');
      }

      if (isActuallyNewNode) {
        setCustomColor(activeNode.customColor || undefined);
        setVisualSize(activeNode.visualSize || 1.0);
        originalColorRef.current = activeNode.customColor || undefined;
        originalVisualSizeRef.current = activeNode.visualSize || 1.0;
      }

      lastNodeIdRef.current = activeNode.id;
    }
  }, [activeNode, isTitleDirty, isContentDirty]);

  useEffect(() => {
    const nodeId = activeNode?.id;
    if (!nodeId) return;

    return () => {
      const currentNode = useGraphStore.getState().nodes.find(n => n.id === nodeId);
      if (currentNode) {
        const updates: any = {};
        if (currentNode.customColor !== originalColorRef.current) updates.customColor = originalColorRef.current;
        if (currentNode.visualSize !== originalVisualSizeRef.current) updates.visualSize = originalVisualSizeRef.current;
        
        if (Object.keys(updates).length > 0) {
          useGraphStore.getState().updateNode(nodeId, updates);
        }
      }
    };
  }, [activeNode?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target as Node)) {
        setShowAttachmentMenu(false);
      }
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setShowTagMenu(false);
      }
      if (connectionMenuRef.current && !connectionMenuRef.current.contains(e.target as Node)) {
        setShowConnectionMenu(false);
      }
      if (customColorPickerRef.current && !customColorPickerRef.current.contains(e.target as Node)) {
        setShowCustomColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!activeNode) return;

    setIsSaving(true);
    setError(null);

    try {
      if (title !== activeNode.title || content !== (activeNode.content || '') || customColor !== originalColorRef.current || visualSize !== originalVisualSizeRef.current) {
        await api.nodes.update(activeNode.id, {
          id: activeNode.id,
          title,
          content: content || '',
          groupId: activeNode.groupId,
          customColor: customColor || undefined,
          visualSize: visualSize,
          projectId: activeNode.projectId,
          userId: activeNode.userId,
          group: activeNode.group ? { id: activeNode.group.id, name: activeNode.group.name, color: activeNode.group.color, order: activeNode.group.order } : { id: activeNode.groupId ?? 0, name: 'Default', color: '#808080', order: 0 },
          x: activeNode.x,
          y: activeNode.y,
        });
        updateNode(activeNode.id, { title, content, customColor, visualSize });
      }

      for (const [id] of deletedAttachments) await api.attachments.delete(id);
      for (const att of pendingAttachments) {
        const newAtt = await api.attachments.create({ nodeId: activeNode.id, fileName: att.fileName, fileUrl: att.fileUrl });
        removeAttachmentFromNode(activeNode.id, att.id);
        addAttachmentToNode(activeNode.id, newAtt);
      }

      for (const [id] of deletedLinks) await api.links.delete(id);
      for (const link of pendingLinks) {
        const newLink = await api.links.create({
          sourceId: link.sourceId, targetId: link.targetId, color: link.color,
          description: link.description || undefined, userId: link.userId || activeNode.userId || user?.id || ''
        });
        deleteLink(link.id);
        addLink(newLink);
      }
      for (const [id, link] of editedLinks) {
        const updated = await api.links.update(id, {
          id: id, sourceId: link.sourceId, targetId: link.targetId, color: link.color,
          description: link.description || undefined, userId: link.userId || activeNode.userId || user?.id || ''
        });
        updateLink(id, updated);
      }

      setPendingAttachments([]); setDeletedAttachments(new Map());
      setPendingLinks([]); setDeletedLinks(new Map()); setEditedLinks(new Map()); setOriginalLinks(new Map());

      originalColorRef.current = customColor;
      originalVisualSizeRef.current = visualSize;

      setSearchQuery('');
      showToast('Node saved successfully');
      toggleEditor(false);

      if (activeNode.projectId && user?.id) realtimeSync.notifyUpdate(activeNode.projectId, user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      showToast('Failed to save node', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeNode) return;
    if (!await showConfirmation('Are you sure you want to delete this node?')) return;

    setIsDeleting(true);
    try {
      await api.nodes.delete(activeNode.id);
      deleteNode(activeNode.id);
      toggleEditor(false);
      showToast('Node deleted successfully');
      if (activeNode.projectId && user?.id) realtimeSync.notifyUpdate(activeNode.projectId, user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      showToast('Failed to delete node', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isColorDirty = activeNode ? activeNode.customColor !== originalColorRef.current : false;
  const isSizeDirty = activeNode ? activeNode.visualSize !== visualSize : false;
  const isAttachmentsDirty = pendingAttachments.length > 0 || deletedAttachments.size > 0;
  const isLinksDirty = pendingLinks.length > 0 || deletedLinks.size > 0 || editedLinks.size > 0;
  const isDirty = (isTitleDirty || isContentDirty || isColorDirty || isSizeDirty || isAttachmentsDirty || isLinksDirty);

  const handleDiscardAndClose = () => {
    if (activeNode && activeNode.customColor !== originalColorRef.current) {
      useGraphStore.getState().updateNode(activeNode.id, { customColor: originalColorRef.current });
    }

    if (activeNode) {
      pendingAttachments.forEach(a => removeAttachmentFromNode(activeNode.id, a.id));
      deletedAttachments.forEach(a => addAttachmentToNode(activeNode.id, a));
    }

    pendingLinks.forEach(l => deleteLink(l.id));
    deletedLinks.forEach(l => addLink(l));
    originalLinks.forEach((l, id) => updateLink(id, l));

    setPendingAttachments([]); setDeletedAttachments(new Map());
    setPendingLinks([]); setDeletedLinks(new Map()); setEditedLinks(new Map()); setOriginalLinks(new Map());

    setActiveNode(null);
    toggleEditor(false);
    setShowUnsavedPopup(false);
  };

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedPopup(true);
      return;
    }
    setActiveNode(null);
    toggleEditor(false);
  };

  const getContentTypeFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const ext = urlObj.pathname.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
        pdf: 'application/pdf', doc: 'application/msword', txt: 'text/plain',
      };
      if (ext && mimeTypes[ext]) return mimeTypes[ext];
    } catch {}
    return 'text/html';
  };

  const handleAddAttachment = () => {
    if (!newAttachmentUrl.trim() || !activeNode) return;

    let url = newAttachmentUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const fileName = newAttachmentName.trim() || url.split('/').pop() || 'attachment.file';
    const contentType = getContentTypeFromUrl(url);

    if (editingAttachmentId !== null) {
      const id = editingAttachmentId;
      const updatedAtt: Attachment = { id, nodeId: activeNode.id, fileName, fileUrl: url, contentType, createdAt: new Date().toISOString(), fileSize: 0 };

      if (id < 0) {
        setPendingAttachments(prev => prev.map(a => a.id === id ? updatedAtt : a));
      } else {
        setPendingAttachments(prev => [...prev.filter(a => a.id !== id), updatedAtt]);
        const oldAtt = activeNode.attachments?.find(a => a.id === id);
        if (oldAtt) setDeletedAttachments(prev => new Map(prev).set(id, oldAtt));
      }

      removeAttachmentFromNode(activeNode.id, id);
      addAttachmentToNode(activeNode.id, updatedAtt);
      setEditingAttachmentId(null);
    } else {
      const attachment: Attachment = { id: -Date.now(), nodeId: activeNode.id, fileName, fileUrl: url, contentType, createdAt: new Date().toISOString(), fileSize: 0 };
      setPendingAttachments(prev => [...prev, attachment]);
      addAttachmentToNode(activeNode.id, attachment);
    }

    setNewAttachmentUrl(''); setNewAttachmentName(''); setShowAttachmentMenu(false);
  };

  const handleRemoveAttachment = (attachmentId: number) => {
    if (!activeNode) return;
    if (attachmentId === editingAttachmentId) {
      setEditingAttachmentId(null); setNewAttachmentUrl(''); setNewAttachmentName('');
    }
    if (attachmentId < 0) {
      setPendingAttachments(prev => prev.filter(a => a.id !== attachmentId));
      removeAttachmentFromNode(activeNode.id, attachmentId);
    } else {
      const att = activeNode.attachments?.find(a => a.id === attachmentId);
      if (att) {
        setDeletedAttachments(prev => new Map(prev).set(attachmentId, att));
        removeAttachmentFromNode(activeNode.id, attachmentId);
      }
    }
  };

  const handleEditAttachment = (attachment: Attachment) => {
    setEditingAttachmentId(attachment.id);
    setNewAttachmentUrl(attachment.fileUrl);
    setNewAttachmentName(attachment.fileName);
    setShowAttachmentMenu(true);
  };

  const handleAddTag = async () => {
    if (!newTagName.trim() || !activeNode) return;
    try {
      let tag: TagType;
      try { tag = await api.tags.getByName(newTagName.trim()); } catch {
        tag = await api.tags.create({ name: newTagName.trim(), color: newTagColor, userId: currentUserId || user?.id || undefined });
      }
      await api.nodes.addTag(activeNode.id, tag.id);
      addTagToNode(activeNode.id, tag);
      setNewTagName(''); setShowTagMenu(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!activeNode) return;
    try {
      await api.nodes.removeTag(activeNode.id, tagId);
      removeTagFromNode(activeNode.id, tagId);
    } catch {}
  };

  const handleAddConnection = () => {
    if (!activeNode || !selectedTargetNodeId) return;

    const userId = currentUserId || user?.id;
    if (!userId) { setError('User ID is required'); return; }

    const targetNode = nodes.find(n => n.id === selectedTargetNodeId);
    if (!targetNode) { setError('Target node not found'); return; }

    const sanitizeNode = (n: any) => ({
      id: n.id, title: n.title, groupId: n.groupId ?? 0, projectId: n.projectId, userId: n.userId,
      group: n.group ? { id: n.group.id, name: n.group.name, color: n.group.color, order: n.group.order } : { id: n.groupId ?? 0, name: 'Default', color: '#808080', order: 0 },
      createdAt: n.createdAt || new Date().toISOString(), updatedAt: n.updatedAt || new Date().toISOString()
    });

    const link: LinkType = {
      id: -Date.now(), sourceId: activeNode.id, targetId: selectedTargetNodeId as number,
      source: sanitizeNode(activeNode), target: sanitizeNode(targetNode), color: connectionColor,
      description: connectionDescription.trim() || undefined, userId, createdAt: new Date().toISOString()
    };

    setPendingLinks(prev => [...prev, link]);
    addLink(link);

    setSelectedTargetNodeId(''); setConnectionDescription(''); setConnectionColor('#355ea1');
    setShowConnectionMenu(false); setError(null);
  };

  const handleRemoveConnection = (linkId: number) => {
    if (linkId < 0) {
      setPendingLinks(prev => prev.filter(l => l.id !== linkId));
      deleteLink(linkId);
    } else {
      const link = links.find(l => l.id === linkId);
      if (link) {
        setDeletedLinks(prev => new Map(prev).set(linkId, link));
        deleteLink(linkId);
      }
    }
  };

  const handleEditConnection = (link: LinkType) => {
    setEditingConnectionId(link.id);
    const connectedNodeId = link.sourceId === activeNode?.id ? link.targetId : link.sourceId;
    setSelectedTargetNodeId(connectedNodeId);
    setConnectionDescription(link.description || '');
    setConnectionColor(link.color || '#355ea1');
    setShowConnectionMenu(true);
  };

  const handleUpdateConnection = () => {
    if (!editingConnectionId || !activeNode) return;
    const link = links.find(l => l.id === editingConnectionId);
    if (!link) return;

    const updatedLink: LinkType = { ...link, color: connectionColor, description: connectionDescription.trim() || undefined };

    if (editingConnectionId < 0) {
      setPendingLinks(prev => prev.map(l => l.id === editingConnectionId ? updatedLink : l));
      updateLink(editingConnectionId, updatedLink);
    } else {
      if (!originalLinks.has(editingConnectionId)) setOriginalLinks(prev => new Map(prev).set(editingConnectionId, link));
      setEditedLinks(prev => new Map(prev).set(editingConnectionId, updatedLink));
      updateLink(editingConnectionId, updatedLink);
    }

    setSelectedTargetNodeId(''); setConnectionDescription(''); setConnectionColor('#355ea1');
    setEditingConnectionId(null); setShowConnectionMenu(false); setError(null);
  };

  const handleCancelEdit = () => {
    setEditingConnectionId(null); setSelectedTargetNodeId(''); setConnectionDescription(''); setConnectionColor('#355ea1'); setShowConnectionMenu(false);
  };

  return {
    state: {
      activeNode, isEditorOpen, error,
      title, setTitle, content, setContent, visualSize, setVisualSize, customColor, setCustomColor,
      isSaving, isDeleting, isDirty,
      attachments: activeNode?.attachments || [], tags: activeNode?.tags || [],
      showAttachmentMenu, setShowAttachmentMenu, showTagMenu, setShowTagMenu, showConnectionMenu, setShowConnectionMenu,
      attachmentMenuRef, tagMenuRef, connectionMenuRef, customColorPickerRef,
      newAttachmentUrl, setNewAttachmentUrl, newAttachmentName, setNewAttachmentName,
      newTagName, setNewTagName, newTagColor, setNewTagColor,
      selectedTargetNodeId, setSelectedTargetNodeId, connectionDescription, setConnectionDescription,
      connectionColor, setConnectionColor, editingConnectionId, editingAttachmentId, setEditingAttachmentId,
      showCustomColorPicker, setShowCustomColorPicker, tempCustomColor, setTempCustomColor,
      showUnsavedPopup, setShowUnsavedPopup,
      isConnectionPickerActive, setConnectionPickerActive, updateNode, nodes, links,
    },
    handlers: {
      handleSave, handleDelete, handleClose, handleDiscardAndClose,
      handleAddAttachment, handleRemoveAttachment, handleEditAttachment,
      handleAddTag, handleRemoveTag,
      handleAddConnection, handleRemoveConnection, handleEditConnection, handleUpdateConnection, handleCancelEdit
    }
  };
}
