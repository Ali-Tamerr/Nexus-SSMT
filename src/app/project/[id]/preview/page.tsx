import { Metadata, ResolvingMetadata } from 'next';
import { api } from '@/lib/api';
import ProjectPreviewClient from './ProjectPreviewClient';
import { Suspense } from 'react';
import { LoadingScreen } from '@/components/ui';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id: idParam } = await params;
    const id = Number(idParam);

    try {
        const project = await api.projects.getById(id);

        if (!project) {
            return {
                title: 'Project Not Found | Nexus',
                description: 'The requested project could not be found.',
            };
        }

        const title = `${project.name}`;
        const description = (project.description || `Explore ${project.name} on Nexus.`).slice(0, 200);

        // WhatsApp and other platforms don't support base64 images as preview images
        // and large base64 strings can break the meta tag parsing
        const wallpaper = project.wallpaper || '';
        const isUrl = typeof wallpaper === 'string' && (wallpaper.startsWith('http') || wallpaper.startsWith('/'));

        // Use favicon as a fallback - WhatsApp prefers one image to be present
        const imageUrl = isUrl ? wallpaper : '/favicon.ico';

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                siteName: 'Nexus Graph',
                url: `/project/${id}/preview`,
                images: [{
                    url: imageUrl,
                    width: isUrl ? 1200 : 512,
                    height: isUrl ? 630 : 512,
                    alt: project.name
                }]
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [imageUrl],
            },
        };
    } catch (error) {
        // Log the error so it shows up in Vercel function logs
        console.error(`[Metadata Error] Project ${id} fetch failed:`, error);

        return {
            title: 'Nexus Graph',
            description: 'Intelligent Social Study Mapping platform to visualize complex relationships.',
            openGraph: {
                title: 'Nexus Graph',
                description: 'Intelligent Social Study Mapping platform to visualize complex relationships.',
                type: 'website',
                images: ['/favicon.ico']
            }
        };
    }
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <ProjectPreviewClient params={params} />
        </Suspense>
    );
}
