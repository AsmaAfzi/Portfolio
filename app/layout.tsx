import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LavaLamp } from "@/components/LavaLamp";
import { PointerSpotlight } from "@/components/PointerSpotlight";
import { ThemeStyles } from "@/components/ThemeStyles";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Projects managed through a tiny GitHub-backed CMS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeStyles />
        <LavaLamp />
        <PointerSpotlight />
        {children}
        <div id="site-top-layer" className="site-top-layer" />
      </body>
    </html>
  );
}
