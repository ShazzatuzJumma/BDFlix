import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BDnFlix — Watch Movies & TV Shows Online",
  description:
    "BDnFlix is a premium streaming platform. Watch unlimited movies, TV series, and anime in HD with no ads. Stream now on any device.",
  keywords: ["BDnFlix", "streaming", "movies", "TV shows", "watch online", "HD movies"],
  authors: [{ name: "BDnFlix" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
  manifest: undefined,
  openGraph: {
    title: "BDnFlix — Premium Streaming",
    description: "Watch unlimited movies, TV series, and anime in HD.",
    siteName: "BDnFlix",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}
