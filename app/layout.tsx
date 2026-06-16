import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HistoryTracker from "@/components/HistoryTracker";
import PWARegistration from "@/components/PWARegistration";
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "Mocaemtui",
  description: "Xem phim online miễn phí",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: process.env.NEXT_PUBLIC_SITE_NAME || "Mocaemtui",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://img.ophim.live" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ophim1.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-outfit: "Outfit", sans-serif;
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        <PWARegistration />
        <HistoryTracker />
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
