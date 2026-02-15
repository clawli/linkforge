"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StoredLink {
  slug: string;
  shortUrl: string;
  url: string;
  adminToken: string;
  createdAt: string;
}

interface LinkWithClicks extends StoredLink {
  clicks?: number;
}

export default function MyLinksPage() {
  const [links, setLinks] = useState<LinkWithClicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const stored: StoredLink[] = JSON.parse(localStorage.getItem("linkforge_links") || "[]");

    // Fetch click counts for each link
    Promise.all(
      stored.map(async (link) => {
        try {
          const res = await fetch(`/api/links/${link.slug}?token=${link.adminToken}`);
          if (res.ok) {
            const data = await res.json();
            return { ...link, clicks: data.analytics.totalClicks };
          }
        } catch {}
        return { ...link, clicks: undefined };
      })
    ).then((results) => {
      setLinks(results);
      setLoading(false);
    });
  }, []);

  const deleteLink = async (slug: string, token: string) => {
    if (!confirm("Delete this link? This cannot be undone.")) return;
    setDeleting(slug);

    try {
      const res = await fetch(`/api/links/${slug}?token=${token}`, { method: "DELETE" });
      if (res.ok) {
        const updated = links.filter((l) => l.slug !== slug);
        setLinks(updated);
        localStorage.setItem(
          "linkforge_links",
          JSON.stringify(updated.map(({ clicks, ...rest }) => rest))
        );
      }
    } catch {
      alert("Failed to delete.");
    } finally {
      setDeleting(null);
    }
  };

  const timeAgo = (date: string): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold mt-2">My Links</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Links you&apos;ve created on this device
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          + New Link
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-[var(--muted-foreground)] mb-4">No links yet</p>
          <Link
            href="/"
            className="text-[var(--primary)] hover:underline"
          >
            Create your first short link →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.slug}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--primary)] font-semibold">/{link.slug}</span>
                    {link.clicks !== undefined && (
                      <span className="text-xs bg-[var(--secondary)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">
                        {link.clicks} click{link.clicks !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{link.url}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{timeAgo(link.createdAt)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => navigator.clipboard.writeText(link.shortUrl)}
                    className="px-3 py-1.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-lg text-sm hover:opacity-80 transition-all"
                  >
                    Copy
                  </button>
                  <Link
                    href={`/dashboard/${link.slug}?token=${link.adminToken}`}
                    className="px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm hover:opacity-90 transition-all"
                  >
                    Stats
                  </Link>
                  <button
                    onClick={() => deleteLink(link.slug, link.adminToken)}
                    disabled={deleting === link.slug}
                    className="px-3 py-1.5 bg-[var(--destructive)] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {deleting === link.slug ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
