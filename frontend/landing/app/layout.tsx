import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "verifyX - Fight Misinformation with AI",
  description: "Multi-agent AI system that detects misinformation through linguistic analysis, evidence checking, visual verification, and synthesis. Verify text and images in real-time.",
  keywords: ["misinformation detection", "fact checking", "AI verification", "deepfake detection", "linguistic analysis", "evidence checking"],
  authors: [{ name: "verifyX Team" }],
  openGraph: {
    title: "verifyX - Fight Misinformation with AI",
    description: "Multi-agent AI system for real-time misinformation detection",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
