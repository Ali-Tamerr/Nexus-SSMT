import { Metadata } from 'next';
import { api } from '@/lib/api';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id: idParam } = await params;
    const id = Number(idParam);

    try {
        const project = await api.projects.getById(id);
        const title = `${project.name} - Nexus Preview`;
        const description = project.description || 'View this knowledge graph project on Nexus.';

        return {
            title,
            description,
            openGraph: {
                title: project.name,
                description,
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: project.name,
                description,
            }
        };
    } catch (e) {
        return {
            title: 'Project Preview - Nexus',
        };
    }
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
