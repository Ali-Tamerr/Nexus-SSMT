import { NextRequest, NextResponse } from 'next/server';

const KNOWN_EXACT_ROUTES = new Set([
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/docs',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.json',
  '/llms.txt',
  '/agent-instructions',
  '/sw.js',
  '/favicon.ico',
  '/og-image.jpg',
]);

const KNOWN_PREFIXES = [
  '/api/',
  '/auth/',
  '/collections/',
  '/project/',
  '/.well-known/',
  '/_next/',
  '/icons/',
  '/assets/',
];

function isKnownRoute(pathname: string): boolean {
  if (KNOWN_EXACT_ROUTES.has(pathname)) return true;
  for (const prefix of KNOWN_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

function prefersMarkdown(request: NextRequest): boolean {
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/markdown')) return false;
  const mdIndex = accept.indexOf('text/markdown');
  const htmlIndex = accept.indexOf('text/html');
  if (htmlIndex === -1) return true;
  return mdIndex < htmlIndex;
}

const HOMEPAGE_MARKDOWN = `# Nexus - Social Study Mapping Tool (SSMT)

> Nexus is an interactive, open-source Social Study Mapping platform and dark-themed visual whiteboard designed to transform fragmented notes, ideas, and study data into dynamic, interconnected knowledge graphs.

## Core Capabilities
- **Dynamic Force-Directed Graphs:** Interactive visual network graph engine powered by D3-force with draggable nodes, custom colors, and shapes.
- **Offline Local Workspace:** 100% free client-side workspace operating purely in browser LocalStorage with zero authentication required.
- **Real-Time Collaboration:** Synchronized project sharing, multi-user live editing, and group workspaces powered by Supabase.
- **Drawing & Annotation Canvas:** Freehand drawing, geometric shapes, lines, groupings, and text overlays on graphs.
- **Command Palette (Ctrl+K):** Instant navigation and quick-creation tools across projects, groups, and nodes.

## When to Use Nexus
1. **Visual Concept Mapping:** Organizing study notes, research papers, and curriculum concepts into interconnected graphs.
2. **Dark-Themed Concept Whiteboard:** Infinite diagramming and idea clustering.
3. **Privacy-First Local Note Mapping:** 100% offline note-taking with zero server transmission.
4. **Study Group Collaboration:** Live multi-user study graph co-editing.

## Developer & Machine-Readable Resources
- **Developer Documentation:** https://nexus-ssmt.vercel.app/docs
- **OpenAPI 3.1 Specification:** https://nexus-ssmt.vercel.app/docs/openapi.json
- **Model Context Protocol (MCP) Manifest:** https://nexus-ssmt.vercel.app/.well-known/mcp
- **Agent Instructions:** https://nexus-ssmt.vercel.app/agent-instructions
- **LLMs Guide:** https://nexus-ssmt.vercel.app/llms.txt
- **XML Sitemap:** https://nexus-ssmt.vercel.app/sitemap.xml
- **About Nexus:** https://nexus-ssmt.vercel.app/about
- **Contact & Support:** https://nexus-ssmt.vercel.app/contact
- **Privacy Policy:** https://nexus-ssmt.vercel.app/privacy
- **Terms of Service:** https://nexus-ssmt.vercel.app/terms
- **GitHub Repository:** https://github.com/Ali-Tamerr/Nexus-SSMT
`;

const ABOUT_MARKDOWN = `# About Nexus SSMT

Nexus (Social Study Mapping Tool) is an open-source knowledge graph visualization platform designed to help students, researchers, and multidisciplinary teams turn fragmented study materials into clear, interconnected visual maps.

## Mission
Bridging the gap between abstract academic concepts and visual understanding by treating study notes as living, force-directed graph nodes on an infinite dark whiteboard canvas.

## Key Principles
- **100% Local-First Privacy:** Notes and diagrams can be kept entirely in your browser without mandatory accounts.
- **Open Source:** Publicly maintained on GitHub by developer Ali Tamer.
- **Full User Ownership:** Users own all created study graphs and notes.

Links:
- Website: https://nexus-ssmt.vercel.app/
- Documentation: https://nexus-ssmt.vercel.app/docs
- GitHub: https://github.com/Ali-Tamerr/Nexus-SSMT
`;

const CONTACT_MARKDOWN = `# Contact & Support - Nexus SSMT

Get in touch with the Nexus development team:

- **Technical Support & Bug Reports:** Open an issue on GitHub at https://github.com/Ali-Tamerr/Nexus-SSMT/issues
- **Community Discussions & Ideas:** Join discussions at https://github.com/Ali-Tamerr/Nexus-SSMT/discussions
- **Security Disclosures:** Report security vulnerabilities privately to project maintainer Ali Tamer via GitHub Security Advisories.
- **Documentation:** https://nexus-ssmt.vercel.app/docs
`;

const PRIVACY_MARKDOWN = `# Privacy Policy - Nexus SSMT

Nexus enforces a strict user privacy policy:

1. **Zero Data Selling:** We never sell, rent, monetize, or trade your personal information or study notes to advertisers or brokers.
2. **Local Workspace Mode:** 100% offline note-taking in browser LocalStorage. Zero server transmission.
3. **Cloud Synchronization:** Only used when signing in to enable cross-device access and live collaboration.
4. **User Ownership:** You retain 100% copyright and intellectual property of your graphs.
5. **Right to Deletion:** Delete projects or accounts at any time.

Links:
- Terms of Service: https://nexus-ssmt.vercel.app/terms
- Contact: https://nexus-ssmt.vercel.app/contact
`;

const TERMS_MARKDOWN = `# Terms and Conditions - Nexus SSMT

By accessing or using Nexus, you agree to these terms:

1. **Service Nature:** Nexus provides study mapping and interactive whiteboard tools for learning and research.
2. **100% User Ownership:** You retain complete ownership and copyright of your content.
3. **Zero Data Selling:** Nexus does not sell or monetize personal data.
4. **Acceptable Use:** You agree not to abuse infrastructure or upload malicious material.
5. **Disclaimer:** Nexus is provided "AS IS" without warranties.

Links:
- Privacy Policy: https://nexus-ssmt.vercel.app/privacy
- Full Page: https://nexus-ssmt.vercel.app/terms
`;

const DOCS_MARKDOWN = `# Developer Documentation - Nexus SSMT

Programmatic APIs and integration guides for Nexus Social Study Mapping Tool.

## Resources
- OpenAPI 3.1 Spec: https://nexus-ssmt.vercel.app/docs/openapi.json
- Model Context Protocol (MCP): https://nexus-ssmt.vercel.app/.well-known/mcp
- llms.txt: https://nexus-ssmt.vercel.app/llms.txt
- GitHub Repo: https://github.com/Ali-Tamerr/Nexus-SSMT

## Core Endpoints
- GET /api/projects - List study projects
- POST /api/projects - Create project
- GET /api/projects/:id - Get project graph nodes and links
- POST /api/nodes/batch - Batch create nodes
- PUT /api/nodes/batch - Batch update coordinates
- GET /.well-known/mcp - MCP Discovery Manifest
`;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (prefersMarkdown(request)) {
    // 1. Homepage negotiation
    if (pathname === '/') {
      return new NextResponse(HOMEPAGE_MARKDOWN, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 2. Specific markdown content routes
    if (pathname === '/about') {
      return new NextResponse(ABOUT_MARKDOWN, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (pathname === '/contact') {
      return new NextResponse(CONTACT_MARKDOWN, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (pathname === '/privacy') {
      return new NextResponse(PRIVACY_MARKDOWN, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (pathname === '/terms') {
      return new NextResponse(TERMS_MARKDOWN, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (pathname === '/docs') {
      return new NextResponse(DOCS_MARKDOWN, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 3. Unknown paths: return agent-friendly 404 in Markdown
    if (!isKnownRoute(pathname)) {
      const errorBody = `# 404 - Not Found

The requested resource at '${pathname}' was not found on Nexus Social Study Mapping Tool.

Please check the following available resources:
- Homepage: https://nexus-ssmt.vercel.app/
- Developer Documentation: https://nexus-ssmt.vercel.app/docs
- OpenAPI Specification: https://nexus-ssmt.vercel.app/docs/openapi.json
- Agent Guidance (llms.txt): https://nexus-ssmt.vercel.app/llms.txt
- XML Sitemap: https://nexus-ssmt.vercel.app/sitemap.xml
- About Nexus: https://nexus-ssmt.vercel.app/about
- Contact & Support: https://nexus-ssmt.vercel.app/contact
`;

      return new NextResponse(errorBody, {
        status: 404,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept',
          'Cache-Control': 'no-cache, no-store',
        },
      });
    }
  }

  // Standard request: pass through and ensure Vary: Accept is included
  const response = NextResponse.next();
  const existingVary = response.headers.get('Vary');
  if (!existingVary) {
    response.headers.set('Vary', 'Accept');
  } else if (!existingVary.toLowerCase().includes('accept')) {
    response.headers.set('Vary', `${existingVary}, Accept`);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff|woff2)).*)',
  ],
};
