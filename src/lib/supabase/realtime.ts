import { createClient } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';

let activeChannel: RealtimeChannel | null = null;
let currentProjectId: number | null = null;

export const realtimeSync = {
    subscribeToProject: (projectId: number, currentUserId: string, onUpdateReceived: () => void) => {
        const supabase = createClient();
        
        if (activeChannel && currentProjectId === projectId) {
            return; // Already subscribed
        }
        
        if (activeChannel) {
            supabase.removeChannel(activeChannel);
        }

        currentProjectId = projectId;
        activeChannel = supabase.channel(`project-${projectId}`);
        
        activeChannel
            .on('broadcast', { event: 'state-changed' }, (payload) => {
                const { userId } = payload.payload;
                if (userId && userId !== currentUserId) {
                    onUpdateReceived();
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log(`Subscribed to project ${projectId} realtime sync`);
                }
            });
    },

    unsubscribe: () => {
        if (activeChannel) {
            const supabase = createClient();
            supabase.removeChannel(activeChannel);
            activeChannel = null;
            currentProjectId = null;
        }
    },

    notifyUpdate: (projectId: number, userId: string) => {
        if (!activeChannel) return;
        
        activeChannel.send({
            type: 'broadcast',
            event: 'state-changed',
            payload: { userId }
        });
    }
};
