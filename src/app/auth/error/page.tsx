'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';

function ErrorMessage() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const router = useRouter();
    const [decodedError, setDecodedError] = useState<string>('');

    useEffect(() => {
        if (error) {
            try {
                setDecodedError(decodeURIComponent(error));
            } catch (e) {
                setDecodedError(error);
            }
        }
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-white">Authentication Error</h1>

            <div className="bg-zinc-900 border border-red-900/50 rounded-lg p-6 max-w-2xl w-full">
                <p className="text-red-400 font-mono text-sm break-words whitespace-pre-wrap">
                    {decodedError || "An unknown error occurred during authentication."}
                </p>
            </div>

            <p className="text-zinc-400 max-w-md">
                We encountered an issue while trying to sign you in. Please check the error details above or try again later.
            </p>

            <div className="flex gap-4">
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                    Return Home
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <div className="min-h-screen bg-zinc-950">
            <Navbar showSearch={false} />
            <Suspense fallback={<div className="text-center p-10 text-zinc-500">Loading error details...</div>}>
                <ErrorMessage />
            </Suspense>
        </div>
    );
}
