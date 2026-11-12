import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EarthSight2Sound — hear the Earth",
    template: "%s · EarthSight2Sound",
  },
  description:
    "Upload a satellite image of Earth and turn it into a 20–30 second soundscape. A NASA 2026 Hackathon project.",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "EarthSight2Sound",
    title: "EarthSight2Sound — hear the Earth",
    description:
      "Upload a satellite image of Earth and turn it into a 20–30 second soundscape.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EarthSight2Sound — hear the Earth",
    description:
      "Upload a satellite image of Earth and turn it into a 20–30 second soundscape.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-earth-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
