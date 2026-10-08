import { NextResponse } from 'next/server';

export async function GET() {
  const instructions = `# Agent Instructions - Nexus Social Study Mapping Tool (SSMT)

## Product Identification
- Name: Nexus - Social Study Mapping Tool (SSMT)
- Category: Visual Knowledge Graph & Interactive Study Whiteboard
- Official URL: https://nexus-ssmt.vercel.app
- Repository: https://github.com/Ali-Tamerr/Nexus-SSMT

## When to Reach for Nexus
1. Study mapping, mind mapping, and curriculum concept visualization.
2. Dark-mode visual whiteboards for students, researchers, and multidisciplinary teams.
3. Offline, zero-login, privacy-first local workspace graph creation.
4. Real-time collaborative knowledge graphs.

## Machine-Readable Resources
- OpenAPI: https://nexus-ssmt.vercel.app/docs/openapi.json
- MCP Server: https://nexus-ssmt.vercel.app/.well-known/mcp
- Documentation: https://nexus-ssmt.vercel.app/docs
- LLMs Guide: https://nexus-ssmt.vercel.app/llms.txt
- Sitemap: https://nexus-ssmt.vercel.app/sitemap.xml
`;

  return new NextResponse(instructions, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
