"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Analytics {
  totalClicks: number;
  clicksOverTime: { date: string; count: number }[];
  topReferrers: { referrer: string | null; count: number }[];
  deviceBreakdown: { device: string | null; count: number }[];
  browserBreakdown: { browser: string | null; count: number }[];
  osBreakdown: { os: string | null; count: number }[];
  countryBreakdown: { country: string | null; count: number }[];
}

interface LinkData {
  slug: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
}

interface DashboardData {
  link: LinkData;
  analytics: Analytics;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function BreakdownChart({
  title,
  data,
  dataKey,
}: {
  title: string;
  data: { name: string; count: number }[];
  dataKey: string;
}) {
  if (data.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--muted-foreground)] mb-4">{title}</h3>
        <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[var(--muted-foreground)] mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey={dataKey}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
            }}
          />
          <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const token = searchParams.get("token") || "";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/links/${slug}?token=${token}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load.");
        return;
      }
      setData(json);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (data) {
      const shortUrl = `${window.location.origin}/${data.link.slug}`;
      fetch(`/api/qr?url=${encodeURIComponent(shortUrl)}&format=svg`)
        .then((r) => r.text())
        .then((svg) => {
          const blob = new Blob([svg], { type: "image/svg+xml" });
          setQrDataUrl(URL.createObjectURL(blob));
        });
    }
  }, [data]);

  const downloadQr = async () => {
    if (!data) return;
    const shortUrl = `${window.location.origin}/${data.link.slug}`;
    const res = await fetch(`/api/qr?url=${encodeURIComponent(shortUrl)}&format=png`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkforge-${data.link.slug}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[var(--destructive)] text-lg">{error}</p>
        <Link href="/" className="text-[var(--primary)] hover:underline">
          ← Back to Home
        </Link>
      </main>
    );
  }

  if (!data) return null;

  const { link, analytics } = data;
  const shortUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${link.slug}`;

  const referrerData = analytics.topReferrers.map((r) => ({
    name: r.referrer || "Direct",
    count: r.count,
  }));
  const deviceData = analytics.deviceBreakdown.map((d) => ({
    name: d.device || "Unknown",
    count: d.count,
  }));
  const browserData = analytics.browserBreakdown.map((b) => ({
    name: b.browser || "Unknown",
    count: b.count,
  }));
  const osData = analytics.osBreakdown.map((o) => ({
    name: o.os || "Unknown",
    count: o.count,
  }));
  const countryData = analytics.countryBreakdown.map((c) => ({
    name: c.country || "Unknown",
    count: c.count,
  }));

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold mt-2">
            <span className="text-[var(--primary)]">/{link.slug}</span>
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 break-all">→ {link.url}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(shortUrl)}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
          >
            Copy Link
          </button>
          <Link
            href="/my-links"
            className="px-4 py-2 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-lg text-sm font-semibold hover:opacity-80 transition-all"
          >
            My Links
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Clicks" value={analytics.totalClicks} />
        <StatCard
          label="Created"
          value={new Date(link.createdAt).toLocaleDateString()}
        />
        <StatCard
          label="Top Referrer"
          value={referrerData[0]?.name || "—"}
        />
        <StatCard
          label="Top Country"
          value={countryData[0]?.name || "—"}
        />
      </div>

      {/* Clicks Over Time */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 mb-8">
        <h3 className="text-sm font-semibold text-[var(--muted-foreground)] mb-4">Clicks Over Time (30 days)</h3>
        {analytics.clicksOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analytics.clicksOverTime} margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })}
              />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                fill="url(#clickGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-12">
            No clicks yet. Share your link to start tracking!
          </p>
        )}
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <BreakdownChart title="Referrers" data={referrerData} dataKey="name" />
        <BreakdownChart title="Countries" data={countryData} dataKey="name" />
        <BreakdownChart title="Browsers" data={browserData} dataKey="name" />
        <BreakdownChart title="Operating Systems" data={osData} dataKey="name" />
        <BreakdownChart title="Devices" data={deviceData} dataKey="name" />
      </div>

      {/* QR Code Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">QR Code</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Download and share this QR code. It points to your short link.
          </p>
          <button
            onClick={downloadQr}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
          >
            Download PNG
          </button>
        </div>
        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 rounded-lg" />
        )}
      </div>
    </main>
  );
}
