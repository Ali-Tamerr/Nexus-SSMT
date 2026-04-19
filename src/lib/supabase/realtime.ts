import { createClient } from './client';
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

let activeChannel: RealtimeChannel | null = null;
let userChannel: RealtimeChannel | null = null;
let currentProjectId: number | null = null;
let supabaseInstance: SupabaseClient | null = null;

const getSupabase = () => {
    if (!supabaseInstance) {
        supabaseInstance = createClient();
    }
    return supabaseInstance;
};

export const realtimeSync = {
    subscribeToProject: (projectId: number, currentUserId: string, onUpdateReceived: () => void, onAccessRevoked?: () => void) => {
        const supabase = getSupabase();
        
        if (activeChannel && currentProjectId === projectId) {
            return; // Already subscribed
        }
        
        if (activeChannel) {
            supabase.removeChannel(activeChannel);
        }

        currentProjectId = projectId;
        activeChannel = supabase.channel(`project-${projectId}`, {
            config: {
                broadcast: { ack: true }
            }
        });
        
        activeChannel
            .on('broadcast', { event: 'state-changed' }, (payload) => {
                const { userId } = payload.payload;
                if (userId && userId !== currentUserId) {
                    onUpdateReceived();
                }
            })
            .on('broadcast', { event: 'access-revoked' }, (payload) => {
                const { userId } = payload.payload;
                if (userId === currentUserId) {
                    onAccessRevoked?.();
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                }
            });
    },

    unsubscribe: () => {
        if (activeChannel) {
            const supabase = getSupabase();
            supabase.removeChannel(activeChannel);
            activeChannel = null;
            currentProjectId = null;
        }
    },

    subscribeToUserNotifications: (userId: string, onNotification: () => void) => {
        const supabase = getSupabase();
        
        if (userChannel) {
            supabase.removeChannel(userChannel);
        }

        userChannel = supabase.channel(`user-${userId}`);
        
        userChannel
            .on('broadcast', { event: 'new-notification' }, () => {
                onNotification();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                }
            });
    },

    unsubscribeUserNotifications: () => {
        if (userChannel) {
            const supabase = getSupabase();
            supabase.removeChannel(userChannel);
            userChannel = null;
        }
    },

    notifyUser: async (userId: string) => {
        const supabase = getSupabase();
        // Use an ad-hoc channel for the notification broadcast
        const channel = supabase.channel(`user-${userId}-notify`);
        
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'new-notification'
                });
                supabase.removeChannel(channel);
            }
        });
    },

    notifyUpdate: async (projectId: number, userId: string) => {
        if (!activeChannel) {
            console.warn('[Realtime] Cannot notify: no active channel. Using fallback broadcast.');
            const supabase = getSupabase();
            const fallbackChannel = supabase.channel(`project-${projectId}`, {
                config: { broadcast: { ack: true } }
            });
            fallbackChannel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await fallbackChannel.send({
                        type: 'broadcast',
                        event: 'state-changed',
                        payload: { userId }
                    });
                    supabase.removeChannel(fallbackChannel);
                }
            });
            return;
        }
        
        await activeChannel.send({
            type: 'broadcast',
            event: 'state-changed',
            payload: { userId }
        });
    },

    notifyAccessRevoked: async (projectId: number, userId: string) => {
        if (!activeChannel) {
            const supabase = getSupabase();
            const fallbackChannel = supabase.channel(`project-${projectId}`);
            fallbackChannel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await fallbackChannel.send({
                        type: 'broadcast',
                        event: 'access-revoked',
                        payload: { userId }
                    });
                    supabase.removeChannel(fallbackChannel);
                }
            });
            return;
        }

        await activeChannel.send({
            type: 'broadcast',
            event: 'access-revoked',
            payload: { userId }
        });
    }
};
