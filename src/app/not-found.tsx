import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-6xl font-bold text-[var(--primary)] mb-4">404</h1>
      <p className="text-xl text-[var(--muted-foreground)] mb-8">
        This link doesn&apos;t exist or has expired.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-semibold hover:opacity-90 transition-all"
      >
        ← Back to LinkForge
      </Link>
    </main>
  );
}
