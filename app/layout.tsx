import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Typecade | Type faster. Think clearer.",
  description: "A platform to improve your typing speed and accuracy.",
  keywords: ["typing", "typecade", "typing speed", "typing test", "wpm", "typing game", "touch typing"],
  metadataBase: new URL("https://typecade.pages.dev"),
  openGraph: {
    title: "Typecade | Type faster. Think clearer.",
    description: "A platform to improve your typing speed and accuracy.",
    siteName: "Typecade",
    url: "https://typecade.pages.dev",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Typecade | Type faster. Think clearer.",
    description: "A platform to improve your typing speed and accuracy.",
  },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const store = localStorage.getItem('typecade-storage');
                if (store) {
                  const state = JSON.parse(store).state;
                  if (state && state.theme) {
                    document.documentElement.setAttribute('data-theme', state.theme);
                    if (state.theme === 'light') {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col items-center justify-between text-foreground transition-colors duration-300`}>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
