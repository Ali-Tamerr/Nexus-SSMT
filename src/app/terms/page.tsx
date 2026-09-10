import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Home } from 'lucide-react';
import { TERMS_SECTIONS, LAST_UPDATED } from '@/lib/termsContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Nexus',
  description: 'Read the Terms and Conditions and data privacy policies for Nexus Social Study Mapping Tool.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Top Header */}
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="space-y-10">
          <header className="border-b border-zinc-800 pb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Terms and Conditions
              </h1>
            </div>
            <p className="text-sm text-zinc-400">
              Last updated: {LAST_UPDATED}
            </p>
            <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
              These Terms and Conditions govern your use of the Nexus Social Study Mapping Tool. Nexus provides an open, privacy-respecting environment for mapping and connecting study concepts.
            </p>
          </header>

          <div className="space-y-10">
            {TERMS_SECTIONS.map((section) => (
              <section key={section.id} className="space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.content.map((paragraph, idx) => (
                    <p key={idx} className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="border-t border-zinc-800 pt-8 mt-12 text-xs text-zinc-500 text-center">
            <p>
              Nexus Social Study Mapping Tool &bull; Free &amp; Open-Source Knowledge Visualization
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}
