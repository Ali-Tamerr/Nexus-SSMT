'use client';

import Image from 'next/image';
import Link from 'next/link';
import NexusLogo from '@/assets/Logo/Logo with no circle.svg';
import { HardDrive } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  titleColor: string;
  description: string;
}

function FeatureCard({ title, titleColor, description }: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
      <div className={`mb-2 flex items-center gap-2 font-semibold text-sm ${titleColor}`}>
        <h3>{title}</h3>
      </div>
      <p className="text-xs text-zinc-400">
        {description}
      </p>
    </article>
  );
}

const FEATURES: FeatureCardProps[] = [
  {
    title: 'Dynamic Force Graphs',
    titleColor: 'text-blue-400',
    description: 'Visualize relationships dynamically using interactive graph engines with drag-and-drop nodes and custom shapes.',
  },
  {
    title: 'Real-Time Sync',
    titleColor: 'text-indigo-400',
    description: 'Collaborate instantly with team members, share collections, and track changes live on the canvas.',
  },
  {
    title: 'Offline Local Mode',
    titleColor: 'text-emerald-400',
    description: 'Work 100% offline with zero sign-in required. Your data stays saved locally on your device.',
  },
];

export function WelcomeHero({
  onSignup,
  onLogin,
  onGuest,
}: {
  onSignup: () => void;
  onLogin: () => void;
  onGuest: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <header className="flex flex-col items-center justify-center text-center max-w-3xl">
        <div className="relative mb-4 h-24 w-24">
          <div className="absolute -inset-1 rounded-full" />
          <Image src={NexusLogo} alt="Nexus Logo" fill className="object-contain" priority />
        </div>
        <h1 className="text-center text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Welcome to <span className="font-ka1 text-white font-light">Nexus</span>
        </h1>
        <p className="mt-2 text-base font-medium text-blue-400">
          The Interactive Social Study Mapping Tool (SSMT)
        </p>

        {/* Direct Answer Paragraph for AI Overviews / GEO */}
        <p className="mt-4 text-center text-zinc-300 text-sm sm:text-base leading-relaxed bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-sm">
          <strong>Nexus Social Study Mapping Tool</strong> is an interactive web platform designed to transform fragmented notes and study data into dynamic, interconnected knowledge graphs. Connect ideas with force-directed layouts, real-time collaboration, and drawing overlays for deep research and study visualization.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            onClick={onSignup}
            className="rounded-lg bg-[#355ea1] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#265fbd] shadow-lg shadow-blue-900/30 cursor-pointer"
          >
            Create free account
          </button>
          <button
            onClick={onLogin}
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800 cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </header>

      {/* Feature Highlights for AI Crawling & Search intent */}
      <section aria-label="Nexus Key Features" className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-4xl text-left">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <footer className="mt-10 text-center text-xs text-zinc-500">
        <Link
          href="/terms"
          className="hover:text-zinc-300 transition-colors underline-offset-4 hover:underline"
        >
          Terms &amp; Conditions
        </Link>
      </footer>

      <button
        onClick={onGuest}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-40 flex items-center justify-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white cursor-pointer shadow-xl"
      >
        <HardDrive className="h-4 w-4 text-zinc-400" />
        <span>Local Workspace (No login required)</span>
      </button>
    </div>
  );
}
