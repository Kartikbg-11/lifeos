import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LIFEOS - Personal Growth & Daily Tracker",
  description: "Track your fitness, learning, habits, and daily progress. Your complete personal growth operating system.",
  keywords: ["LIFEOS", "personal growth", "daily tracker", "habits", "fitness", "learning", "productivity"],
  authors: [{ name: "LIFEOS Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "LIFEOS - Personal Growth & Daily Tracker",
    description: "Your complete personal growth operating system",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
