import Link from 'next/link';
import { ArrowLeft, Home, Mail, MessageSquare, Bug, ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact & Support | Nexus SSMT',
  description: 'Get in touch with the Nexus development team, report bugs, request features, or submit security inquiries.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
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
                <Mail className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Contact &amp; Support
              </h1>
            </div>
            <p className="mt-4 text-base text-zinc-300 leading-relaxed">
              We welcome questions, feedback, security reports, and technical inquiries from students, researchers, developers, and institutions using Nexus.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Bug className="h-5 w-5 text-blue-400" />
              <span>1. Technical Support &amp; Bug Reports</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Because Nexus is an open-source project, our primary platform for bug tracking and troubleshooting is our public issue tracker on GitHub. If you encounter rendering anomalies, synchronization errors, or performance issues, please open an issue with reproduction details.
            </p>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Official Issue Tracker: <a href="https://github.com/Ali-Tamerr/Nexus-SSMT/issues" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">github.com/Ali-Tamerr/Nexus-SSMT/issues</a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
              <span>2. Feature Requests &amp; Community Ideas</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Have an idea for new node layout algorithms, classroom integrations, or export formats? We actively discuss roadmap ideas with our user community. You can join discussions, propose whiteboard tools, or share screenshots of study maps on GitHub Discussions.
            </p>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              GitHub Discussions: <a href="https://github.com/Ali-Tamerr/Nexus-SSMT/discussions" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">github.com/Ali-Tamerr/Nexus-SSMT/discussions</a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <span>3. Security &amp; Vulnerability Reporting</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              We treat user privacy and platform security with the highest seriousness. If you discover a security vulnerability or potential data leak in Nexus, please do not post it publicly on issue trackers. Instead, report it privately to our development team via GitHub Security Advisories or by emailing the project maintainer directly.
            </p>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Maintainer: <strong>Ali Tamer</strong> &bull; Response Time: Typically within 48 to 72 business hours.
            </p>
          </section>

          <footer className="border-t border-zinc-800 pt-8 mt-12 text-xs text-zinc-500 text-center flex flex-wrap justify-center gap-6">
            <Link href="/about" className="hover:text-zinc-300 transition-colors">About Nexus</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/docs" className="hover:text-zinc-300 transition-colors">Developer Docs</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
