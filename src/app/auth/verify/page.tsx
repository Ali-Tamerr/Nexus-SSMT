'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import Image from 'next/image'
import NexusLogo from '@/assets/Logo/Logo with no circle.svg'

function parseHashParams(hash: string): Record<string, string> {
    const params: Record<string, string> = {}
    if (!hash || hash.length <= 1) return params
    const str = hash.startsWith('#') ? hash.substring(1) : hash
    str.split('&').forEach(pair => {
        const [key, val] = pair.split('=')
        if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || '')
    })
    return params
}

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Verifying your Google account...')
    const { login } = useAuthStore()
    const handled = useRef(false)

    useEffect(() => {
        if (handled.current) return

        const errorDescription = searchParams.get('error_description')
        const errorMsg = searchParams.get('error')
        if (errorDescription || errorMsg) {
            setStatus(`Authentication failed: ${errorDescription || errorMsg}`)
            return
        }

        const handleAuth = async () => {
            const hash = window.location.hash
            const hashParams = parseHashParams(hash)
            const accessToken = hashParams['access_token']
            const refreshToken = hashParams['refresh_token']

            if (!accessToken || !refreshToken) {
                setStatus('No session found. Please try logging in again.')
                return
            }

            const supabase = createClient()

            const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            })

            if (error || !data.session) {
                console.error("Session error:", error)
                setStatus(`Authentication failed: ${error?.message || 'Could not establish session'}`)
                return
            }

            handled.current = true
            const user = data.session.user

            let backendId = user.id
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7007'
                const oauthRes = await fetch(`${apiUrl}/api/auth/oauth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        Provider: 'google',
                        ProviderUserId: user.id,
                        Email: user.email,
                        DisplayName: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0],
                        AvatarUrl: user.user_metadata.avatar_url,
                    }),
                })
                if (oauthRes.ok) {
                    const backendProfile = await oauthRes.json()
                    backendId = backendProfile.id || backendProfile.Id || user.id
                } else {
                    console.error('OAuth map failed:', oauthRes.status, await oauthRes.text());
                    const profileRes = await fetch(`${apiUrl}/api/profiles/email/${encodeURIComponent(user.email || '')}?provider=google`)
                    if (profileRes.ok) {
                        const p = await profileRes.json()
                        backendId = p.id || p.Id || user.id
                    }
                }
            } catch (e) {
                console.error('OAuth map exception:', e);
            }

            const profile = {
                id: backendId,
                email: user.email,
                displayName: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0],
                avatarUrl: user.user_metadata.avatar_url,
                provider: 'google',
                createdAt: user.created_at,
                updatedAt: user.updated_at || user.created_at || new Date().toISOString()
            }

            login(profile)
            setStatus('Success! Redirecting...')

            window.history.replaceState(null, '', '/auth/verify')

            setTimeout(() => {
                router.push('/')
            }, 500)
        }

        handleAuth()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4 text-center">
            {status.startsWith('Authentication failed') || status.startsWith('No session') ? (
                <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg max-w-md">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Authentication Error</h2>
                    <p className="text-zinc-300">{status}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            ) : (
                <>
                    <div className="relative h-12 w-12 mb-4">
                        <Image
                            src={NexusLogo}
                            alt="Verifying..."
                            className="animate-spin object-contain"
                            fill
                            priority
                        />
                    </div>
                    <p className="text-lg text-zinc-300">{status}</p>
                </>
            )}
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>}>
            <VerifyContent />
        </Suspense>
    )
}
