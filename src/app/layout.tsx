import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { HealthProvider } from "@/context/HealthContext";
import MaintenanceGuard from "@/components/MaintenanceGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sculpt N Shine Admin",
  description: "Admin Panel for Sculpt N Shine E-commerce",
  openGraph: {
    title: "Sculpt N Shine Admin",
    description: "Admin Control Center for Sculpt N Shine E-commerce",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sculpt N Shine Admin",
    description: "Admin Control Center for Sculpt N Shine E-commerce",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <HealthProvider>
          <MaintenanceGuard />
          <ToastProvider>{children}</ToastProvider>
        </HealthProvider>
      </body>
    </html>
  );
}
