import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: "Nexus Social Study Mapping Tool API",
      version: "1.0.0",
      description: "RESTful API and programmatic developer interface for Nexus Social Study Mapping Tool (SSMT). Provides operations for projects, knowledge nodes, links, and collections.",
      contact: {
        name: "Ali Tamer",
        url: "https://github.com/Ali-Tamerr/Nexus-SSMT"
      },
      license: {
        name: "MIT",
        url: "https://github.com/Ali-Tamerr/Nexus-SSMT/blob/main/LICENSE"
      }
    },
    servers: [
      {
        url: "https://nexus-ssmt.vercel.app",
        description: "Production Server"
      }
    ],
    paths: {
      "/api/projects": {
        get: {
          summary: "List user study projects",
          description: "Retrieve all knowledge projects created by or accessible to the current authenticated user.",
          responses: {
            "200": {
              description: "Array of projects",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { "$ref": "#/components/schemas/Project" }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: "Create a new study project",
          description: "Initialize a new knowledge graph project canvas.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    color: { type: "string" },
                    wallpaper: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Project created",
              content: {
                "application/json": {
                  schema: { "$ref": "#/components/schemas/Project" }
                }
              }
            }
          }
        }
      },
      "/api/projects/{id}": {
        get: {
          summary: "Get project graph details",
          description: "Retrieve full project metadata along with connected graph nodes and links.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Project details with graph structure",
              content: {
                "application/json": {
                  schema: { "$ref": "#/components/schemas/ProjectGraph" }
                }
              }
            }
          }
        }
      },
      "/api/nodes/batch": {
        post: {
          summary: "Batch create nodes",
          description: "Create multiple study concept nodes and attachments in a single transaction.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { "$ref": "#/components/schemas/NodeInput" }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Nodes created successfully"
            }
          }
        }
      },
      "/.well-known/mcp": {
        get: {
          summary: "Model Context Protocol Server Discovery",
          description: "Get the MCP manifest and streamable HTTP transport endpoint for AI agent integration.",
          responses: {
            "200": {
              description: "MCP Server Manifest",
              content: {
                "application/json": {
                  schema: { type: "object" }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Project: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            color: { type: "string" },
            wallpaper: { type: "string" },
            userId: { type: "string" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        ProjectGraph: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            nodes: {
              type: "array",
              items: { "$ref": "#/components/schemas/Node" }
            },
            links: {
              type: "array",
              items: { "$ref": "#/components/schemas/Link" }
            }
          }
        },
        Node: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            content: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
            groupId: { type: "string" },
            customColor: { type: "string" }
          }
        },
        NodeInput: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            projectId: { type: "string" },
            x: { type: "number" },
            y: { type: "number" }
          }
        },
        Link: {
          type: "object",
          properties: {
            sourceId: { type: "string" },
            targetId: { type: "string" },
            description: { type: "string" },
            color: { type: "string" }
          }
        }
      }
    }
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
