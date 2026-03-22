import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LayoutShell } from "./layout-shell";
import "./globals.css";

const displayFont = Pixelify_Sans({
  weight: "400",
  variable: "--font-outfit",
  subsets: ["latin"],
});

const sansFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Accessibility friendly
};

export const siteDescription = "Free multiplayer typing test with real-time races, leaderboards, and detailed WPM stats. Challenge friends or race strangers.";

export const metadata: Metadata = {
  metadataBase: new URL("https://typecade.com"),
  title: "Typecade | Free Typing Speed Test & WPM Tracker",
  description: siteDescription,
  applicationName: "Typecade",
  authors: [{ name: "Typecade Team", url: "https://typecade.com" }],
  generator: "Next.js",
  keywords: ["typing test", "typecade", "typing speed test", "wpm test", "typing game", "touch typing", "keyboard mastery", "multiplayer typing"],
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://typecade.com",
    siteName: "Typecade",
    title: "Typecade | Type faster. Think clearer.",
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Typecade | Type faster. Think clearer.",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Typecade | Type faster. Think clearer.",
    description: siteDescription,
    creator: "@typecade",
    images: ["/opengraph-image.png"],
  },
  appleWebApp: {
    title: "Typecade",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Typecade',
    url: 'https://typecade.com',
    description: siteDescription,
    applicationCategory: 'EducationalApplication',
    genre: 'Typing Tutor',
    operatingSystem: 'All',
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FB_APP_ID || "1234567890"} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className={`${displayFont.variable} ${sansFont.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col items-center justify-between text-foreground`}>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
