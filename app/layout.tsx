import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "../styles.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Sloth — Just-in-time authority for agents";
  const description = "Delegate outcomes, not unlimited access. Sloth demonstrates narrow, temporary WebMCP capability grants.";

  return {
    title,
    description,
    applicationName: "Sloth",
    icons: {
      icon: "/logo.png",
      apple: "/logo.png",
      shortcut: "/logo.png"
    },
    openGraph: { title, description, type: "website", url: origin, images: [{ url: `${origin}/og.png`, width: 1792, height: 909, alt: "Sloth — Delegate outcomes, not unlimited access." }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] }
  };
}

export const viewport: Viewport = {
  themeColor: "#11120f"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
