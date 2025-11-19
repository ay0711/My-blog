import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import NotificationBell from "@/components/NotificationBell";
import DarkModeToggle from "@/components/DarkModeToggle";
import Link from "next/link";

// Fallback AuthMenu component when the external module is missing.
// Replace this with the real import once "@/components/AuthMenu" exists.
const AuthMenu = () => {
  return (
    <div className="flex items-center">
      <Link href="/login" className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        Sign in
      </Link>
    </div>
  );
};

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Modern-Blog",
  description: "A modern blog with news integration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const s = localStorage.getItem('theme'); const m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; const d = s ? s === 'dark' : m; const el = document.documentElement; d ? el.classList.add('dark') : el.classList.remove('dark'); } catch(e) {} })();`
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-white dark:bg-gray-950`}>        
        <a href="#main" className="skip-link">Skip to content</a>
        {/* Unified Top Navigation Bar */}
        <header className="fixed top-0 left-0 right-0 h-14 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">ModernBlog</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                <Link href="/" className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Home</Link>
                <Link href="/explore" className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Explore</Link>
                <Link href="/about" className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">About</Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <NotificationBell />
              <AuthMenu />
            </div>
          </div>
        </header>
        <main id="main" className="min-h-screen pt-14 pb-24 fade-in">
          {children}
        </main>
        <MobileBottomNav />
        <Footer />
      </body>
    </html>
  );
}
