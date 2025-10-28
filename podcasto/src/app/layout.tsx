import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
const inter = {
  /**
   * Use Tailwind's default sans-serif stack as a resilient fallback when the
   * Inter font cannot be fetched during the build step (e.g. restricted
   * network environments).
   */
  variable: "font-sans",
} as const;

export const metadata: Metadata = {
  title: "Podcasto - Daily News Podcasts",
  description: "Transform daily news content from Telegram channels into accessible podcasts",
  manifest: "/manifest.json",
  icons: {
    icon: "/podcasto-icon.webp",
    apple: "/podcasto-icon.webp",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Podcasto",
  },
  applicationName: "Podcasto",
  keywords: ["podcast", "news", "audio", "telegram"],
  creator: "Podcasto Team",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#e279c7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable}`}>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
