import Link from 'next/link';
import { ArrowLeft, Home, Code, FileJson, Server, Terminal, Key, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nexus SSMT - Developer Documentation & API Reference',
  description: 'Complete API reference, data schemas, Model Context Protocol (MCP) server endpoints, and developer guides for Nexus Social Study Mapping Tool.',
  alternates: {
    canonical: '/docs',
  },
};

export default function DocsPage() {
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
                <Code className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Nexus SSMT - Developer Documentation &amp; API Reference
              </h1>
            </div>
            <p className="mt-4 text-base text-zinc-300 leading-relaxed">
              Explore the developer resources, programmatic APIs, data models, Model Context Protocol (MCP) endpoints, and integration specifications for the Nexus Social Study Mapping Tool.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/docs/openapi.json"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-zinc-800 transition-colors"
              >
                <FileJson className="h-4 w-4" />
                <span>OpenAPI 3.1 Specification (JSON)</span>
              </a>
              <Link
                href="/.well-known/mcp"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-zinc-800 transition-colors"
              >
                <Server className="h-4 w-4" />
                <span>MCP Server Manifest</span>
              </Link>
              <Link
                href="/llms.txt"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-zinc-800 transition-colors"
              >
                <Terminal className="h-4 w-4" />
                <span>llms.txt Agent Guide</span>
              </Link>
            </div>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-400" />
              <span>1. Architecture &amp; REST API Endpoints</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Nexus uses a RESTful JSON API architecture. All backend responses communicate using PascalCase identifiers internally, transformed into clean camelCase models on client frontends.
            </p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 font-mono text-xs text-zinc-300 space-y-2">
              <div><span className="text-emerald-400 font-bold">GET</span> /api/projects - List user study projects</div>
              <div><span className="text-blue-400 font-bold">POST</span> /api/projects - Create a new knowledge project</div>
              <div><span className="text-emerald-400 font-bold">GET</span> /api/projects/:id - Retrieve project graph with nodes &amp; links</div>
              <div><span className="text-blue-400 font-bold">POST</span> /api/nodes/batch - Batch create graph nodes with attachments</div>
              <div><span className="text-amber-400 font-bold">PUT</span> /api/nodes/batch - Batch update coordinates and labels</div>
              <div><span className="text-emerald-400 font-bold">GET</span> /api/project-collections - List organized project collections</div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-400" />
              <span>2. Authentication &amp; Session Management</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Nexus supports dual operational modes:
            </p>
            <ul className="list-disc pl-5 text-sm sm:text-base text-zinc-400 space-y-2">
              <li><strong>Local-First Mode:</strong> Uses zero authentication. State is serialized to <code className="text-zinc-200">nexus_guest_projects</code> in browser LocalStorage.</li>
              <li><strong>Cloud Authentication:</strong> Uses NextAuth with Credentials and Google OAuth provider routes (<code className="text-zinc-200">/api/auth/*</code>). Bearer JWT authentication is attached to requests.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Terminal className="h-5 w-5 text-emerald-400" />
              <span>3. Model Context Protocol (MCP) Server</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Nexus exposes a first-party Model Context Protocol server supporting Streamable HTTP transport and JSON-RPC 2.0 at <code className="text-zinc-200">/.well-known/mcp</code>. AI agents (such as Claude Desktop, Cursor, ChatGPT, and autonomous coding agents) can discover available tools to inspect graph structures, list collections, and generate study mind maps.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              <span>4. Open Source Developer Resources</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              The full frontend and backend code is available on GitHub under an open-source license. Developers can clone, extend custom force-directed visual algorithms, or contribute new study tools.
            </p>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              GitHub Repository: <a href="https://github.com/Ali-Tamerr/Nexus-SSMT" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">https://github.com/Ali-Tamerr/Nexus-SSMT</a>
            </p>
          </section>

          <footer className="border-t border-zinc-800 pt-8 mt-12 text-xs text-zinc-500 text-center flex flex-wrap justify-center gap-6">
            <Link href="/about" className="hover:text-zinc-300 transition-colors">About Nexus</Link>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact Support</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
