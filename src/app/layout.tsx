import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: false,
});

const ka1 = localFont({
  src: "../fonts/ka1.ttf",
  variable: "--font-ka1",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')
    ? new URL(process.env.NEXTAUTH_URL)
    : process.env.VERCEL_URL
      ? new URL(`https://${process.env.VERCEL_URL}`)
      : undefined,
  title: "Nexus - Social Study Mapping Tool",
  description: "A collaborative Social Study Mapping platform built with Next.js 16 and D3-force to visualize complex relationships.",
  keywords: ["knowledge graph", "note-taking", "second brain", "Social Study Mapping", "mind map", "Study Mapping", "Data Visualization"],
  authors: [{ name: "Ali Tamer" }],
  manifest: "/manifest.json",
  themeColor: "#09090b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nexus",
  },
  openGraph: {
    title: "Nexus - Social Study Mapping Tool",
    description: "A collaborative Social Study Mapping platform built with Next.js 16 and D3-force to visualize complex relationships.",
    type: "website",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${ka1.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
