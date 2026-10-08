import Link from 'next/link';
import { ArrowLeft, Home, FileText, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-200">
      <div className="max-w-md space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-blue-400 font-bold text-2xl">
          404
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Page Not Found
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The study board, node, or page you are looking for does not exist or has been moved. Explore our core resources below:
        </p>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#355ea1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#265fbd]"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <FileText className="h-4 w-4" />
            <span>API Docs</span>
          </Link>
        </div>
        <div className="border-t border-zinc-800/80 pt-6 text-xs text-zinc-500 flex flex-wrap justify-center gap-4">
          <Link href="/about" className="hover:text-zinc-300 transition-colors">About</Link>
          <Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact</Link>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
          <Link href="/llms.txt" className="hover:text-zinc-300 transition-colors">llms.txt</Link>
        </div>
      </div>
    </div>
  );
}
