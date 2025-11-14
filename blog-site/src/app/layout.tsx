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
        {/* Main content area with proper spacing for desktop sidebar and mobile top/bottom bars */}
        <main id="main" className="min-h-screen lg:ml-[275px] pt-14 pb-16 lg:pt-0 lg:pb-0 fade-in">
          {children}
        </main>
        <div className="lg:ml-[275px]">
          <Footer />
        </div>
      </body>
    </html>
  );
}
