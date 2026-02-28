import { Metadata, ResolvingMetadata } from 'next';
import { api } from '@/lib/api';
import ProjectPreviewClient from './ProjectPreviewClient';

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
            };
        }

        const title = `${project.name} | Nexus Graph`;
        const description = project.description || `Explore the ${project.name} knowledge graph on Nexus.`;
        const imageUrl = project.wallpaper || undefined;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                siteName: 'Nexus',
                images: imageUrl ? [{ url: imageUrl }] : undefined,
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: imageUrl ? [imageUrl] : undefined,
            },
        };
    } catch (error) {
        console.error('Metadata generation error:', error);
        return {
            title: 'Nexus Graph',
        };
    }
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
    return <ProjectPreviewClient params={params} />;
}
