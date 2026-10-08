import Link from 'next/link';
import { ArrowLeft, Home, BookOpen, Shield, Globe } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Nexus - Social Study Mapping Tool',
  description: 'Learn about the mission, architecture, and open-source vision behind Nexus Social Study Mapping Tool.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Nexus</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="space-y-10">
          <header className="border-b border-zinc-800 pb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                About Nexus SSMT
              </h1>
            </div>
            <p className="mt-4 text-base text-zinc-300 leading-relaxed">
              Nexus (Social Study Mapping Tool) is an open-source knowledge graph visualization platform designed to help students, researchers, and multidisciplinary teams turn fragmented study materials into clear, interconnected visual maps.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              1. Our Mission: Transforming How People Learn
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Traditional linear note-taking apps force thoughts into hierarchical folders, lists, and isolated pages. Real knowledge, however, is a network of interconnected principles, historical contexts, and cause-and-effect relationships. Nexus was founded to bridge the gap between abstract academic concepts and visual understanding by treating study notes as living, force-directed graph nodes.
            </p>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              By representing topics as visual nodes on an infinite canvas, learners can quickly spot recurring themes, discover hidden prerequisites between topics, and organize complex semester syllabi into intuitive mental models.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              2. Privacy &amp; Local-First Architecture
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              We strongly believe that access to powerful educational tools should never require sacrificing personal privacy. Nexus provides a 100% free Local Workspace mode where notes, diagrams, and geometric shapes are stored strictly inside your browser's local storage. No tracking cookies, no mandatory user accounts, and zero transmission of private notes to third parties.
            </p>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              For teams and study partners requiring collaborative workflows, Nexus offers end-to-end synchronized cloud projects powered by Supabase Realtime, while maintaining an uncompromised commitment to user data ownership.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              3. Open Source &amp; Community Driven
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Created by developer Ali Tamer, Nexus is proudly developed in the open on GitHub. Contributions from students, educators, and software engineers worldwide help shape our visual graph algorithms, export systems, and classroom integrations.
            </p>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Visit our open-source codebase on <a href="https://github.com/Ali-Tamerr/Nexus-SSMT" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">GitHub (Nexus-SSMT)</a> to report issues, suggest feature requests, or explore our developer documentation.
            </p>
          </section>

          <footer className="border-t border-zinc-800 pt-8 mt-12 text-xs text-zinc-500 text-center flex flex-wrap justify-center gap-6">
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact Support</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/docs" className="hover:text-zinc-300 transition-colors">Developer Docs</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
