import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WindowProvider } from '@/lib/contexts/WindowContext';
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
  title: 'Burst Protection Analysis',
  description: 'Dashboard for analyzing advertising burst protection effectiveness',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WindowProvider>
          {children}
        </WindowProvider>
      </body>
    </html>
  );
}
