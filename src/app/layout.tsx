import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "RATE BABA",
  description: "Online Babanuki Game",
  icons: {
    icon: "/icon_716^2.png",
    apple: "/icon_716^2.png",
  }
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full bg-[#FAFAFA]`}
      >
        {children}
      </body>
    </html>
  );
}
