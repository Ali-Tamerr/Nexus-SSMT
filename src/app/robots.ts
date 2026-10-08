import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://nexus-ssmt.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/docs',
          '/.well-known/',
          '/llms.txt',
          '/agent-instructions',
          '/api/mcp',
          '/api/openapi.json',
        ],
        disallow: ['/api/auth/', '/project/editor'],
      },
      {
        userAgent: ['Google-Extended', 'GPTBot', 'PerplexityBot', 'ClaudeBot', 'Applebot-Extended'],
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
