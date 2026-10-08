import type { Metadata } from "next";

export const siteMetadata: Metadata = {
  metadataBase: process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')
    ? new URL(process.env.NEXTAUTH_URL)
    : process.env.VERCEL_URL
      ? new URL(`https://${process.env.VERCEL_URL}`)
      : new URL('https://nexus-ssmt.vercel.app'),
  title: {
    default: "Nexus - Social Study Mapping Tool (SSMT)",
    template: "%s | Nexus SSMT",
  },
  description: "Nexus is an interactive Social Study Mapping platform and dark-themed visual whiteboard designed to visualize complex relationships, notes, and knowledge graphs.",
  keywords: [
    "Nexus",
    "Nexus SSMT",
    "Social Study Mapping Tool",
    "interactive whiteboard",
    "whiteboard",
    "visual whiteboard",
    "dark mode whiteboard",
    "concept mapping whiteboard",
    "knowledge graph",
    "note-taking",
    "study mapping software",
    "visual note taking",
    "interactive graph visualization"
  ],
  authors: [{ name: "Ali Tamer", url: "https://github.com/Ali-Tamerr" }],
  creator: "Ali Tamer",
  publisher: "Nexus",
  manifest: "/manifest.json",
  themeColor: "#09090b",
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nexus SSMT",
  },
  openGraph: {
    title: "Nexus - Social Study Mapping Tool (SSMT)",
    description: "Build, link, and explore interconnected knowledge graphs on an interactive visual whiteboard canvas.",
    url: "https://nexus-ssmt.vercel.app",
    siteName: "Nexus Social Study Mapping Tool",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Nexus - Social Study Mapping Tool",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus - Social Study Mapping Tool",
    description: "Build, link, and explore interconnected knowledge graphs on an interactive visual whiteboard canvas.",
    images: ["/og-image.jpg"],
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://nexus-ssmt.vercel.app/#webapp",
      "name": "Nexus - Social Study Mapping Tool",
      "alternateName": ["Nexus SSMT", "Nexus Study Mapping", "Nexus Interactive Whiteboard"],
      "url": "https://nexus-ssmt.vercel.app",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "All",
      "description": "Nexus is an interactive Social Study Mapping platform and dark-themed visual whiteboard that connects notes, ideas, and study data into dynamic knowledge graphs.",
      "author": {
        "@type": "Person",
        "name": "Ali Tamer",
        "url": "https://github.com/Ali-Tamerr"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://nexus-ssmt.vercel.app/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Nexus Social Study Mapping Tool?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Nexus is a visual Social Study Mapping platform and interactive dark-themed whiteboard that turns fragmented notes and ideas into linked knowledge graphs."
          }
        },
        {
          "@type": "Question",
          "name": "Is Nexus free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Nexus features a 100% free Local Workspace mode with offline storage and zero login requirements, as well as cloud-synced collaboration."
          }
        },
        {
          "@type": "Question",
          "name": "How does Social Study Mapping work in Nexus?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "In Nexus, users create visual nodes on a dark whiteboard canvas, drawing connections, groups, and shapes to map out complex relationships intuitively."
          }
        }
      ]
    }
  ]
};
