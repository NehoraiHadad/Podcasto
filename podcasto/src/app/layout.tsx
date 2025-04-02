import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "podcasto - Daily News Podcasts",
  description: "Transform daily news content from Telegram channels into accessible podcasts",
  icons: {
    icon: "/podcasto-lcon.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable}`}>
      <body className="antialiased min-h-screen bg-white text-gray-900">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
