import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LayoutShell } from "./layout-shell";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
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

export const metadata: Metadata = {
  metadataBase: new URL("https://typecade.pages.dev"),
  title: {
    default: "Typecade | Type faster. Think clearer.",
    template: "%s | Typecade",
  },
  description: "A platform to improve your typing speed and accuracy. Play typing games, track your speed in WPM, and compete with friends.",
  applicationName: "Typecade",
  authors: [{ name: "Typecade Team", url: "https://typecade.pages.dev" }],
  generator: "Next.js",
  keywords: ["typing", "typecade", "typing speed", "typing test", "wpm", "typing game", "touch typing", "keyboard mastery", "learn typing"],
  referrer: "origin-when-cross-origin",
  creator: "Typecade Team",
  publisher: "Typecade Team",
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
    url: "https://typecade.pages.dev",
    siteName: "Typecade",
    title: "Typecade | Type faster. Think clearer.",
    description: "A platform to improve your typing speed and accuracy. Play typing games, track your speed in WPM, and compete with friends.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Typecade | Type faster. Think clearer.",
    description: "A platform to improve your typing speed and accuracy.",
    creator: "@typecade", 
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
    url: 'https://typecade.pages.dev',
    description: 'A platform to improve your typing speed and accuracy. Play typing games, track your speed in WPM, and compete with friends.',
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
      <body suppressHydrationWarning className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col items-center justify-between text-foreground`}>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
