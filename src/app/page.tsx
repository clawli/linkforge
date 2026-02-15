"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface LinkResult {
  slug: string;
  shortUrl: string;
  url: string;
  adminToken: string;
  createdAt: string;
}

interface StoredLink {
  slug: string;
  shortUrl: string;
  url: string;
  adminToken: string;
  createdAt: string;
}

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Generate QR code when we have a result
  useEffect(() => {
    if (result) {
      fetch(`/api/qr?url=${encodeURIComponent(result.shortUrl)}&format=svg`)
        .then((r) => r.text())
        .then((svg) => {
          const blob = new Blob([svg], { type: "image/svg+xml" });
          setQrDataUrl(URL.createObjectURL(blob));
        });
    }
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setCopied(false);
    setLoading(true);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          slug: customSlug.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult(data);

      // Save to localStorage
      const stored: StoredLink[] = JSON.parse(localStorage.getItem("linkforge_links") || "[]");
      stored.unshift({
        slug: data.slug,
        shortUrl: data.shortUrl,
        url: data.url,
        adminToken: data.adminToken,
        createdAt: data.createdAt,
      });
      localStorage.setItem("linkforge_links", JSON.stringify(stored));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = async () => {
    if (!result) return;
    const res = await fetch(`/api/qr?url=${encodeURIComponent(result.shortUrl)}&format=png`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkforge-${result.slug}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setResult(null);
    setUrl("");
    setCustomSlug("");
    setError("");
    setQrDataUrl("");
    inputRef.current?.focus();
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
          <span className="text-[var(--primary)]">Link</span>Forge
        </h1>
        <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-md mx-auto">
          Shorten URLs instantly. Track every click. No signup required.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl">
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your long URL here..."
                className="w-full px-5 py-4 bg-[var(--card)] border border-[var(--border)] rounded-xl text-lg placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
              />
            </div>

            {/* Advanced Options */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Custom slug (optional)
            </button>

            {showAdvanced && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--muted-foreground)] whitespace-nowrap">linkforge.app/</span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-link"
                  maxLength={50}
                  className="flex-1 px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                />
              </div>
            )}

            {error && (
              <p className="text-[var(--destructive)] text-sm px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full py-4 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold text-lg rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Shorten URL ⚡"
              )}
            </button>
          </form>
        ) : (
          /* Result Card */
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <div className="text-center">
              <p className="text-sm text-[var(--muted-foreground)] mb-2">Your short link</p>
              <p className="text-2xl font-bold text-[var(--primary)] break-all">{result.shortUrl}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-2 truncate">→ {result.url}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:opacity-90 transition-all"
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
              <Link
                href={`/dashboard/${result.slug}?token=${result.adminToken}`}
                className="flex-1 py-3 bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold rounded-lg hover:opacity-80 transition-all text-center"
              >
                View Stats →
              </Link>
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 rounded-lg" />
                <button
                  onClick={downloadQr}
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors underline"
                >
                  Download QR Code (PNG)
                </button>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-3 border border-[var(--border)] text-[var(--muted-foreground)] rounded-lg hover:bg-[var(--secondary)] transition-all text-sm"
            >
              Shorten Another URL
            </button>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-8 flex gap-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/my-links" className="hover:text-[var(--foreground)] transition-colors">
          My Links
        </Link>
        <span>•</span>
        <span>Free forever</span>
        <span>•</span>
        <span>No signup</span>
      </div>
    </main>
  );
}
