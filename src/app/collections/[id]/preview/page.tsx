import { Metadata, ResolvingMetadata } from 'next';
import { api } from '@/lib/api';
import CollectionPreviewClient from './CollectionPreviewClient';

type Props = {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    try {
        const collection = await api.projectCollections.getById(id);

        if (!collection) {
            return {
                title: 'Collection Not Found | Nexus',
            };
        }

        const title = `${collection.name} | Nexus Group`;
        const description = collection.description || `View the ${collection.name} collection on Nexus.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                // Optional: site name, images, etc.
                siteName: 'Nexus',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
            },
        };
    } catch (error) {
        console.error('Metadata generation error:', error);
        return {
            title: 'Nexus Group',
        };
    }
}

export default function Page() {
    return <CollectionPreviewClient />;
}
