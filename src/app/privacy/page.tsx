import Link from 'next/link';
import { ArrowLeft, Home, ShieldCheck, Lock, EyeOff, Trash2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Nexus SSMT',
  description: 'Understand how Nexus protects your privacy, enforces zero data selling, and safeguards your study graphs.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
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
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Nexus Privacy Policy
              </h1>
            </div>
            <p className="text-xs text-zinc-500">Last updated: October 2026</p>
            <p className="mt-4 text-base text-zinc-300 leading-relaxed">
              At Nexus, we hold a simple philosophy: your knowledge, research notes, and intellectual work belong exclusively to you. We do not sell your personal data, monetize your study graphs, or track your behavior across the web.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-emerald-400" />
              <span>1. Zero Data Selling Guarantee</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              We never sell, rent, monetize, or trade your personal information, study materials, or visual graphs to third-party data brokers, ad networks, or commercial analytics vendors. Nexus is an educational and study visualization platform, not an advertising network.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-400" />
              <span>2. Offline Local Workspace Privacy</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              When using Nexus in Local Workspace mode, you are not required to create an account or sign in. All node texts, links, coordinates, and geometric annotations remain entirely inside your browser's local storage (LocalStorage). This data is never sent to our servers or stored on remote databases.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              <span>3. Cloud Storage &amp; Account Information</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              If you choose to register an account for multi-device synchronization and real-time collaboration, we store your profile email, display name, and study graph structures on our secure backend database. This data is utilized solely to deliver sync services and collaborative editing to you and your authorized collaborators.
            </p>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Google OAuth Authentication: Signing in with Google is supported strictly for your convenience. Nexus only reads your verified email and display name for account identification. We do not inspect your Google Drive or search history.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-400" />
              <span>4. Data Ownership &amp; Right to Deletion</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              You retain 100% full copyright and ownership of all content created on Nexus. You may export your graphs as structured JSON data or delete projects and account profiles at any time. When deleted, your records are purged from active production databases.
            </p>
          </section>

          <footer className="border-t border-zinc-800 pt-8 mt-12 text-xs text-zinc-500 text-center flex flex-wrap justify-center gap-6">
            <Link href="/about" className="hover:text-zinc-300 transition-colors">About Nexus</Link>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact Support</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/docs" className="hover:text-zinc-300 transition-colors">Developer Docs</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
