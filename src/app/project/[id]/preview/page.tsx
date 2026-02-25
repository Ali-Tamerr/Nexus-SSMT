'use client';

import { use, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { api, ApiDrawing } from '@/lib/api';
import { NODE_COLORS } from '@/lib/constants';
import { LoadingScreen } from '@/components/ui';
import { Node, Link as LinkType, DrawnShape, Group } from '@/types/knowledge';
import { NodePreviewPaneContent } from '@/components/editor/NodePreviewPane';
import { drawShapeOnContext } from '@/components/graph/drawingUtils';
import { PreviewNavbar } from '@/components/layout/PreviewNavbar';
import { useGraphExport } from '@/hooks/useGraphExport';
import { GroupsTabs } from '@/components/graph/GroupsTabs';
import { SelectionPane } from '@/components/graph/SelectionPane';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false }) as any;

function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idParam } = use(params);
    const id = Number(idParam);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [wallpaper, setWallpaper] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<LinkType[]>([]);
    const [shapes, setShapes] = useState<DrawnShape[]>([]);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const [isHoveringNode, setIsHoveringNode] = useState(false);
    const [activeNode, setActiveNode] = useState<Node | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    const [showSelectionPane, setShowSelectionPane] = useState(false);
    const [isOutsideContent, setIsOutsideContent] = useState(false);
    const [graphTransform, setGraphTransform] = useState({ x: 0, y: 0, k: 1 });

    const { exportToPNG, exportToJPG } = useGraphExport(
        containerRef,
        graphRef,
        nodes,
        shapes,
        searchQuery,
        projectName
    );

    useEffect(() => {
        setIsMounted(true);

        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        const loadProjectData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const project = await api.projects.getById(id);
                setProjectName(project.name);
                setProjectDescription(project.description || '');
                setWallpaper(project.wallpaper || '');

                let projectNodes = await api.nodes.getByProject(id);

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

                projectNodes = projectNodes.map((n) => {
                    const pickPalette = () => NODE_COLORS[hashString(n.id) % NODE_COLORS.length];
                    const isValid = (c: any) => typeof c === 'string' && c.trim() && c !== 'null' && c !== 'undefined';

                    let customColor = n.customColor;
                    if (!isValid(customColor)) {
                        // Check for legacy color property safely
                        const legacyColor = (n as any).color;
                        if (isValid(legacyColor)) {
                            customColor = legacyColor;
                        } else {
                            customColor = pickPalette();
                        }
                    }
                    return {
                        ...n,
                        customColor,
                    };
                });
                setNodes(projectNodes);

                const allLinks = await api.links.getAll();
                const nodeIds = new Set(projectNodes.map(n => n.id));
                const projectLinks = allLinks.filter(
                    l => nodeIds.has(l.sourceId) || nodeIds.has(l.targetId)
                );
                setLinks(projectLinks);

                const drawings = await api.drawings.getByProject(id);
                const loadedShapes: DrawnShape[] = drawings.map((d: ApiDrawing) => ({
                    id: d.id,
                    projectId: d.projectId,
                    type: d.type as DrawnShape['type'],
                    points: d.points,
                    color: d.color,
                    width: d.width,
                    style: d.style as DrawnShape['style'],
                    text: d.text === null ? undefined : d.text,
                    fontSize: d.fontSize === null ? undefined : d.fontSize,
                    fontFamily: d.fontFamily === null ? undefined : d.fontFamily,
                    groupId: d.groupId,
                }));
                setShapes(loadedShapes);

                const projectGroups = await api.groups.getByProject(id);
                const sortedGroups = projectGroups.sort((a: Group, b: Group) => (a.order ?? 0) - (b.order ?? 0));
                setGroups(sortedGroups);
                if (sortedGroups.length > 0) {
                    setActiveGroupId(sortedGroups[0].id);
                }
            } catch (err) {
                setError('Failed to load project. It may not exist or you may not have access.');
            } finally {
                setIsLoading(false);
            }
        };

        loadProjectData();
    }, [id]);

    const handleWallpaperChange = async (newWallpaper: string) => {
        setWallpaper(newWallpaper);
        try {
            await api.projects.update(id, { wallpaper: newWallpaper });
        } catch (e) {
        }
    };

    const filteredNodes = useMemo(() => {
        if (activeGroupId === null) return nodes;
        return nodes.filter(n => n.groupId === activeGroupId);
    }, [nodes, activeGroupId]);

    const filteredShapes = useMemo(() => {
        if (activeGroupId === null) return shapes;
        return shapes.filter(s => s.groupId === activeGroupId);
    }, [shapes, activeGroupId]);

    const checkIfOutsideContent = useCallback(() => {
        if (!graphRef.current) return;
        const allPoints = [
            ...filteredNodes.map(n => ({ x: n.x ?? 0, y: n.y ?? 0 })),
            ...filteredShapes.flatMap(s => s.points)
        ];
        if (allPoints.length === 0) {
            setIsOutsideContent(false);
            return;
        }
        const minX = Math.min(...allPoints.map(p => p.x));
        const maxX = Math.max(...allPoints.map(p => p.x));
        const minY = Math.min(...allPoints.map(p => p.y));
        const maxY = Math.max(...allPoints.map(p => p.y));
        const centerX = graphTransform.x;
        const centerY = graphTransform.y;
        const scale = graphTransform.k;
        const viewWidth = dimensions.width / scale;
        const viewHeight = dimensions.height / scale;
        const left = centerX - viewWidth / 2;
        const right = centerX + viewWidth / 2;
        const top = centerY - viewHeight / 2;
        const bottom = centerY + viewHeight / 2;
        const outside = maxX < left || minX > right || maxY < top || minY > bottom;
        setIsOutsideContent(outside);
    }, [filteredNodes, filteredShapes, graphTransform, dimensions]);

    useEffect(() => {
        checkIfOutsideContent();
    }, [checkIfOutsideContent]);

    const handleZoom = useCallback((transform: { x: number; y: number; k: number }) => {
        setTimeout(() => {
            setGraphTransform(transform);
        }, 0);
    }, []);

    const graphData = useMemo(() => {
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = links.filter(l => nodeIds.has(l.sourceId) && nodeIds.has(l.targetId));
        return {
            nodes: filteredNodes.map(n => ({
                id: n.id,
                title: n.title,
                groupId: n.groupId,
                customColor: n.customColor,
                x: n.x,
                y: n.y,
                fx: n.x,
                fy: n.y,
            })),
            links: filteredLinks.map(l => ({
                source: l.sourceId,
                target: l.targetId,
                color: l.color,
                description: l.description,
            })),
        };
    }, [filteredNodes, links]);

    const nodeCanvasObject = useCallback((
        node: { id?: string | number; x?: number; y?: number; title?: string; customColor?: string },
        ctx: CanvasRenderingContext2D,
        globalScale: number
    ) => {
        const label = node.title || String(node.id);
        const fontSize = Math.max(12 / globalScale, 4);
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

        const isMatch = !searchQuery || label.toLowerCase().includes(searchQuery.toLowerCase());
        const opacity = isMatch ? 1 : 0.1;
        ctx.globalAlpha = opacity;

        const baseColor = node.customColor || '#8B5CF6';
        const nodeRadius = 6;
        const x = node.x || 0;
        const y = node.y || 0;

        const gradient = ctx.createRadialGradient(
            x - nodeRadius / 3,
            y - nodeRadius / 3,
            0,
            x,
            y,
            nodeRadius
        );
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, adjustBrightness(baseColor, -30));

        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'transparent';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(label, x, y + nodeRadius + 3);
    }, [searchQuery]);

    const onRenderFramePost = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
        filteredShapes.forEach(shape => {
            drawShapeOnContext(ctx, shape, globalScale);
        });
    }, [filteredShapes]);

    const handleNodeHover = useCallback((node: any) => {
        setIsHoveringNode(!!node);
    }, []);

    const handleNodeClick = useCallback(async (node: any) => {
        const foundNode = nodes.find(n => n.id === node.id);
        if (foundNode) {
            setActiveNode(foundNode);
            try {
                const attachments = await api.attachments.getByNode(foundNode.id);
                const updatedNode = { ...foundNode, attachments };
                setActiveNode(updatedNode);
            } catch (e) {
                // console.error('Failed to fetch attachments:', e);
            }
        }
    }, [nodes]);

    if (!isMounted || isLoading) {
        return <LoadingScreen />;
    }

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 text-white">
                <p className="mb-4 text-red-400">{error}</p>
                <Link
                    href="/"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go back home
                </Link>
            </div>
        );
    }

    return (
        <div
            className="relative h-screen w-full overflow-hidden bg-zinc-950 bg-cover bg-center"
            style={{
                backgroundImage: wallpaper
                    ? (wallpaper.startsWith('http') || wallpaper.startsWith('url')
                        ? `url(${wallpaper})`
                        : `url(data:image/png;base64,${wallpaper})`)
                    : undefined
            }}
        >
            <PreviewNavbar
                projectName={projectName}
                projectDescription={projectDescription}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onExportPNG={exportToPNG}
                onExportJPG={exportToJPG}
                currentWallpaper={wallpaper}
                onWallpaperChange={handleWallpaperChange}
            />

            <div
                ref={containerRef}
                className="absolute inset-0 z-10 [&_canvas]:!cursor-[inherit]"
                style={{ cursor: isHoveringNode ? 'pointer' : 'default' }}
            >
                <ForceGraph2D
                    ref={graphRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeId="id"
                    nodeCanvasObject={nodeCanvasObject}
                    nodePointerAreaPaint={(node: { x?: number; y?: number }, color: string, ctx: CanvasRenderingContext2D) => {
                        if (!node.x || !node.y) return;
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI, false);
                        ctx.fill();
                    }}
                    linkColor={(link: any) => (link.color || '#355ea1') + '80'}
                    linkWidth={1}
                    linkCurvature={0.1}
                    linkDirectionalArrowLength={6}
                    linkDirectionalArrowRelPos={1}
                    onRenderFramePost={onRenderFramePost}
                    enableNodeDrag={false}
                    enableZoomInteraction={true}
                    enablePanInteraction={true}
                    cooldownTicks={0}
                    d3AlphaDecay={1}
                    onNodeHover={handleNodeHover}
                    onNodeClick={handleNodeClick}
                    onBackgroundClick={() => setActiveNode(null)}
                    onZoom={handleZoom}
                />

                {activeNode && (
                    <NodePreviewPaneContent
                        activeNode={activeNode}
                        nodes={nodes}
                        links={links}
                        onClose={() => setActiveNode(null)}
                    />
                )}
            </div>

            <div className="absolute max-md:hidden top-6 left-1/2 -translate-x-1/2 z-30 text-xs text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800 pointer-events-none w-max shadow-sm">
                Click on a node to view the details and links
            </div>

            {groups.length > 0 && (
                <GroupsTabs
                    groups={groups}
                    activeGroupId={activeGroupId}
                    onSelectGroup={setActiveGroupId}
                    onAddGroup={() => { }}
                    onRenameGroup={() => { }}
                    onDeleteGroup={() => { }}
                    onReorderGroups={() => { }}
                    isPreviewMode={true}
                />
            )}

            {isOutsideContent && (
                <button
                    onClick={() => {
                        if (!graphRef.current) return;
                        const allPoints = [
                            ...filteredNodes.map(n => ({ x: n.x ?? 0, y: n.y ?? 0 })),
                            ...filteredShapes.flatMap(s => s.points)
                        ];
                        if (allPoints.length === 0) return;
                        const sumX = allPoints.reduce((acc, p) => acc + p.x, 0);
                        const sumY = allPoints.reduce((acc, p) => acc + p.y, 0);
                        const centerX = sumX / allPoints.length;
                        const centerY = sumY / allPoints.length;
                        graphRef.current.centerAt(centerX, centerY, 500);
                        graphRef.current.zoom(1, 500);
                    }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-zinc-800/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Go back to content
                </button>
            )}

            <button
                onClick={() => setShowSelectionPane(!showSelectionPane)}
                className={`absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-lg px-3 h-9 text-sm shadow-lg backdrop-blur-sm border transition-all ${showSelectionPane
                    ? 'bg-zinc-700 text-white border-zinc-600'
                    : 'bg-zinc-800/90 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white hover:border-zinc-600'
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Selection Pane</span>
            </button>

            {showSelectionPane && (
                <div>
                    <SelectionPane
                        key={`${activeGroupId}-${filteredNodes.length}-${filteredShapes.length}`}
                        isPreviewMode={true}
                        nodes={filteredNodes}
                        shapes={filteredShapes}
                        onLocateNode={(nodeId, x, y) => {
                            const node = filteredNodes.find(n => n.id === nodeId);
                            if (node) setActiveNode(node);
                            if (graphRef.current) {
                                graphRef.current.centerAt(x, y, 500);
                            }
                        }}
                        onLocateShape={(shapeId, x, y) => {
                            if (graphRef.current) {
                                graphRef.current.centerAt(x, y, 500);
                            }
                        }}
                        onSelectNode={() => { }}
                        onSelectShape={() => { }}
                        onDeleteNode={() => { }}
                        onDeleteShape={() => { }}
                        selectedNodeIds={new Set()}
                        selectedShapeIds={new Set()}
                        onClose={() => setShowSelectionPane(false)}
                    />
                </div>
            )}
        </div>
    );
}
