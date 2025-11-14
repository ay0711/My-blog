import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Modern-Blog",
  description: "A modern blog with news integration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Initial theme script to avoid flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const s = localStorage.getItem('theme'); const m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; const d = s ? s === 'dark' : m; const el = document.documentElement; d ? el.classList.add('dark') : el.classList.remove('dark'); } catch(e) {} })();`
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>        
        <a href="#main" className="skip-link">Skip to content</a>
        <Navbar />
        <main id="main" className="min-h-screen fade-in">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
