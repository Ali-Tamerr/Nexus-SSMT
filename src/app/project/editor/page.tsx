'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { useGraphStore, filterNodes } from '@/store/useGraphStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { decodeWallpaper } from '@/lib/imageUtils';

import { LoadingScreen, LoadingOverlay } from '@/components/ui';
import { SearchInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ProjectNavbar } from '@/components/layout';
import { GraphCanvas, GraphCanvasHandle } from '@/components/graph/GraphCanvas';
import { GraphControls } from '@/components/graph/GraphControls';
import { NodeEditor } from '@/components/editor/NodeEditor';
import { NodePreviewPane } from '@/components/editor/NodePreviewPane';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ClassroomIntegration } from '@/components/classroom/ClassroomIntegration';

export default function EditorPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
    const graphCanvasRef = useRef<GraphCanvasHandle>(null);

    const handleExportPNG = () => {
        graphCanvasRef.current?.exportToPNG();
    };

    const handleExportJPG = () => {
        graphCanvasRef.current?.exportToJPG();
    };

    const { user, isAuthenticated, hasHydrated: authHydrated } = useAuthStore();

    const {
        currentProject,
        setCurrentProject,
        currentProjectId,
        nodes,
        setNodes,
        setLinks,
        searchQuery,
        setSearchQuery,
        graphSettings,
        setGraphSettings,
        addNode,
        isLoading,
        setLoading,
        hasHydrated: graphHydrated,
    } = useGraphStore();

    const hasHydrated = authHydrated && graphHydrated;
    const projectId = currentProject?.id || currentProjectId;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (hasHydrated && !isAuthenticated) {
            router.push('/');
        }
    }, [hasHydrated, isAuthenticated, router]);

    useEffect(() => {
        if (hasHydrated && isAuthenticated && !projectId) {
            router.push('/');
        }
    }, [hasHydrated, isAuthenticated, projectId, router]);

    const dataLoadedRef = useRef(false);

    useEffect(() => {
        const loadProjectData = async () => {
            if (!isAuthenticated || !projectId || dataLoadedRef.current) return;

            dataLoadedRef.current = true;

            if (!projectId) {
                setLoading(false);
                setIsInitializing(false);
                return;
            }

            setLoading(true);
            setLoadingProgress(10);
            setError(null);

            try {
                const apiProject = await api.projects.getById(projectId);
                const mergedProject = {
                    ...currentProject,
                    ...apiProject,
                    wallpaper: decodeWallpaper(apiProject.wallpaper) || currentProject?.wallpaper,
                };
                setCurrentProject(mergedProject);
                setLoadingProgress(35);

                const GROUP_COLORS = ['#8B5CF6', '#355ea1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

                const hashString = (numId: number) => {
                    const str = String(numId);
                    let hash = 0;
                    for (let i = 0; i < str.length; i++) {
                        const char = str.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    return Math.abs(hash);
                };

                let projectNodes = await api.nodes.getByProject(projectId);
                projectNodes = projectNodes.map((n) => {
                    const isValid = (c: any) => typeof c === 'string' && c.trim() && c !== 'null' && c !== 'undefined';
                    if (!isValid(n.customColor)) {
                        return { ...n, customColor: GROUP_COLORS[hashString(n.id) % GROUP_COLORS.length] };
                    }
                    return n;
                });
                setNodes(projectNodes);
                setLoadingProgress(75);

                const allLinks = await api.links.getAll();
                const nodeIds = new Set(projectNodes.map(n => n.id));
                const projectLinks = allLinks.filter(
                    l => nodeIds.has(l.sourceId) || nodeIds.has(l.targetId)
                );
                setLinks(projectLinks);
                setLoadingProgress(100);
            } catch (err: any) {
                console.warn('Failed to load project data:', err.message);
                setNodes([]);
                setLinks([]);
            } finally {
                setLoading(false);
                setTimeout(() => setIsInitializing(false), 500);
            }
        };

        if (hasHydrated && isAuthenticated && projectId) {
            loadProjectData();
        }

        return () => {
            dataLoadedRef.current = false;
        };
    }, [projectId, hasHydrated, isAuthenticated, setCurrentProject, setNodes, setLinks, setLoading]);

    const activeGroupId = useGraphStore(state => state.activeGroupId);

    const handleCreateNode = async () => {
        if (!currentProject || !projectId || !user?.id) {
            // console.log('Add node aborted: missing currentProject, projectId, or user.id', { currentProject, projectId, user });
            return;
        }

        let groupId = typeof activeGroupId === 'number' ? activeGroupId : 0;

        if (groupId === 0) {
            try {
                const groups = await api.groups.getByProject(projectId);
                if (groups && groups.length > 0) {
                    groupId = groups[0].id;
                }
            } catch (e) { }

            if (groupId === 0) {
                try {
                    const newGroup = await api.groups.create({
                        name: 'Default',
                        color: '#808080',
                        order: 0,
                        projectId: projectId
                    });
                    if (newGroup) groupId = newGroup.id;
                } catch (e) { }
            }
        }

        const GROUP_COLORS: Record<number, string> = {
            0: '#8B5CF6', 1: '#355ea1', 2: '#10B981', 3: '#F59E0B',
            4: '#EF4444', 5: '#EC4899', 6: '#06B6D4', 7: '#84CC16',
        };
        const colors = Object.values(GROUP_COLORS);
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const randomX = (Math.random() - 0.5) * 150;
        const randomY = (Math.random() - 0.5) * 150;

        const demoNode = {
            id: Date.now() * -1,
            title: 'New Node',
            content: '',

            projectId: projectId,
            groupId: groupId,
            customColor: randomColor,
            x: randomX,
            y: randomY,
            userId: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setLoading(true);
        try {
            const payload = {
                title: 'New Node',
                content: '',

                projectId: projectId,
                groupId: groupId,
                customColor: randomColor,
                x: randomX,
                y: randomY,
                userId: user.id,
            };
            // console.log('Creating node with payload:', payload);
            let newNode = await api.nodes.create(payload);
            // console.log('Node created from API:', newNode);

            // If backend didn't return position/color, force update with full node object
            if (newNode.x === null || newNode.x === undefined || newNode.customColor !== randomColor) {
                newNode = { ...newNode, x: randomX, y: randomY, customColor: randomColor };
                api.nodes.update(newNode.id, {
                    id: newNode.id,
                    title: newNode.title,
                    content: newNode.content || '',

                    groupId: newNode.groupId,
                    projectId: newNode.projectId,
                    userId: newNode.userId,
                    customColor: randomColor,
                    x: randomX,
                    y: randomY,
                }).catch(() => { });
            }

            addNode(newNode);
        } catch (err) {
            // console.error('Error creating node:', err);
            addNode(demoNode);
        } finally {
            setLoading(false);
        }
    };

    const filteredNodes = filterNodes(nodes, searchQuery);

    if (!hasHydrated || !isMounted || !isAuthenticated || isInitializing) {
        return <LoadingScreen progress={hasHydrated ? loadingProgress : 0} />;
    }

    if (!currentProject) {
        return <LoadingScreen progress={loadingProgress} />;
    }

    const isPreviewMode = graphSettings.isPreviewMode;

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-zinc-950">
            {!isPreviewMode && (
                <ProjectNavbar
                    projectName={currentProject?.name}
                    projectColor={currentProject?.color}
                    nodeCount={filteredNodes.length}
                    onExportPNG={handleExportPNG}
                    onExportJPG={handleExportJPG}
                    onAddNode={!isPreviewMode ? handleCreateNode : undefined}
                    onAddNodeFromClassroom={!isPreviewMode ? () => setIsClassroomModalOpen(true) : undefined}
                    isAddingNode={isLoading}
                    isPreviewMode={isPreviewMode}
                />
            )}

            {error && (
                <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="relative flex-1 overflow-hidden">
                {/* Background layer */}
                <div
                    className="absolute inset-0 transition-all duration-300"
                    style={{
                        ...(currentProject?.wallpaper?.startsWith('#')
                            ? { backgroundColor: currentProject.wallpaper }
                            : currentProject?.wallpaper
                                ? {
                                    backgroundImage: `url(data:image/png;base64,${currentProject.wallpaper})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }
                                : undefined)
                    }}
                />

                {/* Content layer - unaffected by brightness */}
                <div className="relative z-10 h-full">
                    <GraphControls
                        settings={graphSettings}
                        onSettingsChange={setGraphSettings}
                    />

                    {isLoading && nodes.length === 0 ? (
                        <LoadingOverlay message="Loading graph..." />
                    ) : (
                        <GraphCanvas ref={graphCanvasRef} />
                    )}
                </div>
            </div>

            {isPreviewMode ? <NodePreviewPane /> : <NodeEditor />}
            <CommandPalette />
            <ClassroomIntegration
                isOpen={isClassroomModalOpen}
                onClose={() => setIsClassroomModalOpen(false)}
            />
        </div>
    );
}
