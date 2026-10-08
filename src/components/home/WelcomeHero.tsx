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
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed">
        {description}
      </p>
    </article>
  );
}

const FEATURES: FeatureCardProps[] = [
  {
    title: 'Dynamic Force Graphs',
    titleColor: 'text-blue-400',
    description: 'Visualize relationships dynamically using interactive graph engines with drag-and-drop nodes, customizable colors, and custom shapes.',
  },
  {
    title: 'Real-Time Sync',
    titleColor: 'text-indigo-400',
    description: 'Collaborate instantly with team members, share study collections, and track changes live across multiple active participants.',
  },
  {
    title: 'Offline Local Mode',
    titleColor: 'text-emerald-400',
    description: 'Work 100% offline with zero sign-in required. All graphs, nodes, and drawings stay strictly on your device via browser LocalStorage.',
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
          <Image src={NexusLogo} alt="Nexus Logo" fill className="object-contain" priority />
        </div>
        <h1 className="text-center text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Nexus - <span className="font-ka1 text-white font-light">Social Study Mapping Tool</span>
        </h1>
        <p className="mt-2 text-base font-medium text-blue-400">
          Interactive Knowledge Visualization &amp; Dark-Themed Concept Whiteboard
        </p>

        {/* Direct Answer Paragraph for AI Overviews / Crawlers */}
        <p className="mt-4 text-center text-zinc-300 text-sm sm:text-base leading-relaxed bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-sm">
          <strong>Nexus Social Study Mapping Tool</strong> is an open-source, interactive web platform designed to transform fragmented notes and study data into dynamic, interconnected knowledge graphs. Connect ideas with force-directed layouts, real-time collaboration, and drawing overlays for deep research, course curriculum planning, and study visualization.
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

      {/* Sequential Heading Level 2 for Core Features */}
      <section aria-label="Nexus Key Features" className="mt-10 max-w-4xl w-full text-left">
        <h2 className="text-lg font-semibold text-white mb-4 text-center sm:text-left">
          Core Features and Capabilities
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Semantic explanatory section for search engines and AI agents */}
      <section aria-label="About Nexus Methodology" className="mt-8 max-w-4xl w-full text-left bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-5 text-sm text-zinc-400 space-y-3">
        <h2 className="text-base font-semibold text-zinc-200">
          Visual Knowledge Mapping for Deep Study
        </h2>
        <p className="leading-relaxed">
          Nexus provides students, researchers, and knowledge workers with an infinite concept whiteboard. You can create topic nodes, draw directed relationships, cluster materials by academic discipline, and overlay freehand geometric shapes. With local-first persistence and optional cloud synchronization, your research stays accessible anywhere while giving you full control of your private study data.
        </p>
      </section>

      {/* NoScript block ensuring 100% crawler visibility without JS */}
      <noscript>
        <div className="mt-6 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 max-w-4xl w-full">
          <p className="font-semibold mb-2">JavaScript Disabled or Unavailable:</p>
          <p className="mb-2">Nexus is fully indexable without JavaScript. Access public documentation and legal resources directly:</p>
          <ul className="flex flex-wrap gap-4 underline text-blue-400">
            <li><Link href="/about">About Nexus</Link></li>
            <li><Link href="/contact">Contact &amp; Support</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms &amp; Conditions</Link></li>
            <li><Link href="/docs">Developer API Documentation</Link></li>
            <li><Link href="/llms.txt">LLMs Context Guide</Link></li>
            <li><Link href="/sitemap.xml">XML Sitemap</Link></li>
          </ul>
        </div>
      </noscript>

      {/* Trust Anchor & Resource Footer */}
      <footer className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-zinc-500">
        <Link href="/about" className="hover:text-zinc-300 transition-colors">
          About
        </Link>
        <Link href="/contact" className="hover:text-zinc-300 transition-colors">
          Contact
        </Link>
        <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-zinc-300 transition-colors">
          Terms &amp; Conditions
        </Link>
        <Link href="/docs" className="hover:text-zinc-300 transition-colors">
          Developer Docs
        </Link>
        <Link href="/llms.txt" className="hover:text-zinc-300 transition-colors">
          llms.txt
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
