'use client';

import Image from 'next/image';
import NexusLogo from '@/assets/Logo/Logo with no circle.svg';

export function WelcomeHero({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative mb-4 h-24 w-24">
        <div className="absolute -inset-1 rounded-ful" />
        <Image src={NexusLogo} alt="Nexus Logo" fill className="object-contain" />
      </div>
      <h2 className="text-center text-3xl font-bold text-white">
        Welcome to <span className="font-ka1 text-white font-light">Nexus</span>
      </h2>
      <p className="mt-3 max-w-lg text-center text-zinc-400">
       Think beyond the list. Build, link, and share interconnected graphs that turn fragmented data into a structured knowledge base. Visual, dynamic, and designed for deep exploration.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={onSignup}
          className="rounded-lg bg-[#355ea1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#265fbd] sm:px-6 sm:py-3"
        >
          Create free account
        </button>
        <button
          onClick={onLogin}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 sm:px-6 sm:py-3"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
