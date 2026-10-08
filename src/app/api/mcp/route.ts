import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MCP_MANIFEST = {
  $schema: "https://modelcontextprotocol.io/schema/mcp-server.json",
  name: "nexus-ssmt",
  title: "Nexus Social Study Mapping Tool MCP Server",
  description: "Model Context Protocol server for querying and managing Nexus study graphs, projects, nodes, and whiteboard concepts.",
  version: "1.0.0",
  protocolVersion: "2024-11-05",
  transport: {
    type: "streamable-http",
    url: "https://nexus-ssmt.vercel.app/api/mcp"
  },
  capabilities: {
    tools: {
      listChanged: false
    },
    resources: {
      subscribe: false,
      listChanged: false
    }
  },
  tools: [
    {
      name: "list_projects",
      description: "List knowledge projects and study boards in Nexus.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of projects to return" }
        }
      }
    },
    {
      name: "get_project_graph",
      description: "Retrieve project graph with all nodes, links, and layout positions.",
      inputSchema: {
        type: "object",
        required: ["projectId"],
        properties: {
          projectId: { type: "string", description: "ID of the study project" }
        }
      }
    },
    {
      name: "search_nodes",
      description: "Search knowledge graph nodes by keyword or topic.",
      inputSchema: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string", description: "Search query string" }
        }
      }
    },
    {
      name: "export_study_graph",
      description: "Export study map as Markdown or JSON structure.",
      inputSchema: {
        type: "object",
        required: ["projectId"],
        properties: {
          projectId: { type: "string", description: "ID of the project" },
          format: { type: "string", enum: ["markdown", "json"], default: "markdown" }
        }
      }
    }
  ]
};

export async function GET(req: NextRequest) {
  // If client requests event-stream for streamable-http connection
  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/event-stream')) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const initEvent = `event: endpoint\ndata: ${JSON.stringify({ url: "https://nexus-ssmt.vercel.app/api/mcp" })}\n\n`;
        controller.enqueue(encoder.encode(initEvent));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  return NextResponse.json(MCP_MANIFEST, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Cache-Control': 'public, max-age=300',
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id ?? null;
    const method = body.method;

    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {
              listChanged: false
            },
            resources: {
              subscribe: false,
              listChanged: false
            }
          },
          serverInfo: {
            name: "nexus-ssmt",
            version: "1.0.0"
          }
        }
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (method === 'notifications/initialized') {
      return NextResponse.json({ jsonrpc: "2.0", result: "ok" }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (method === 'ping') {
      return NextResponse.json({ jsonrpc: "2.0", id, result: {} }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: MCP_MANIFEST.tools
        }
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (method === 'tools/call') {
      const toolName = body.params?.name;
      const args = body.params?.arguments || {};

      let responseText = "";

      if (toolName === 'list_projects') {
        responseText = JSON.stringify({
          status: "success",
          projects: [
            { id: "local-demo", name: "Introduction to Knowledge Graphs", nodeCount: 12, mode: "Local Workspace" },
            { id: "sample-curriculum", name: "Social Study Syllabus Map", nodeCount: 24, mode: "Collaborative" }
          ]
        }, null, 2);
      } else if (toolName === 'get_project_graph') {
        responseText = JSON.stringify({
          projectId: args.projectId,
          nodes: [
            { id: "1", title: "Core Thesis", x: 0, y: 0 },
            { id: "2", title: "Supporting Evidence", x: 120, y: 80 }
          ],
          links: [
            { sourceId: "1", targetId: "2", description: "supports" }
          ]
        }, null, 2);
      } else if (toolName === 'search_nodes') {
        responseText = JSON.stringify({
          query: args.query,
          matches: [
            { id: "1", title: `Match for "${args.query}"`, content: "Study topic summary" }
          ]
        }, null, 2);
      } else if (toolName === 'export_study_graph') {
        responseText = `# Study Graph: ${args.projectId}\n- Nodes: 12\n- Relationships: 18\n- Format: ${args.format || 'markdown'}`;
      } else {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown tool: ${toolName}` }
        }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        }
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    }, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error: any) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error", data: error?.message }
    }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    }
  });
}
