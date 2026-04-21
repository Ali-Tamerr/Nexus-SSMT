'use client';

import { ProjectCollection } from '@/types/knowledge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface DeleteGroupModalProps {
    group: ProjectCollection;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (withProjects: boolean) => Promise<void>;
    loading?: boolean;
}

export function DeleteGroupModal({ group, isOpen, onClose, onDelete, loading }: DeleteGroupModalProps) {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete Collection"
            size="md"
        >
            <p className="mb-6 text-zinc-400">
                You are about to delete <strong>{group.name}</strong>.
                <br />
                There are {group.projects?.length || 0} projects in this collection.
            </p>

            <div className="space-y-3">
                <Button
                    onClick={() => onDelete(true)}
                    disabled={loading}
                    loading={loading}
                    className="w-full flex justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                >
                    Delete Collection AND Projects
                </Button>

                <Button
                    variant="secondary"
                    onClick={() => onDelete(false)}
                    disabled={loading}
                    loading={loading}
                    className="w-full flex justify-center"
                >
                    Delete Collection Only (Keep Projects)
                </Button>

                <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={loading}
                    className="w-full flex justify-center text-zinc-500 hover:text-zinc-300 hover:bg-transparent"
                >
                    Cancel
                </Button>
            </div>
        </Modal>
    );
}
