import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkForge — Fast, Free URL Shortener",
  description: "Shorten URLs instantly. Get click analytics, QR codes, and custom slugs — no account required.",
  openGraph: {
    title: "LinkForge — Fast, Free URL Shortener",
    description: "Shorten URLs instantly. Get click analytics, QR codes, and custom slugs.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="min-h-screen flex flex-col">
          {children}
          <footer className="mt-auto border-t border-[var(--border)] py-6 text-center text-sm text-[var(--muted-foreground)]">
            <p>
              Built with <span className="text-[var(--primary)]">⚡</span> by{" "}
              <a href="https://github.com/ali-romman" className="underline hover:text-[var(--foreground)] transition-colors">
                LinkForge
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
