import { NextRequest, NextResponse } from "next/server";
import { db, ensureTables } from "@/db";
import { links } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSlug, createAdminToken, isValidUrl, isValidSlug, getBaseUrl } from "@/lib/utils";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 10;
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
    }

    const body = await request.json();
    const { url, slug: customSlug } = body;

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: "Please provide a valid URL (http or https)." }, { status: 400 });
    }

    let slug: string;
    if (customSlug) {
      const normalized = customSlug.toLowerCase().trim();
      if (!isValidSlug(normalized)) {
        return NextResponse.json(
          { error: "Slug must be 3-50 characters: lowercase letters, numbers, and hyphens." },
          { status: 400 }
        );
      }
      // Check if slug is taken
      const existing = await db.select().from(links).where(eq(links.slug, normalized)).get();
      if (existing) {
        return NextResponse.json({ error: "This slug is already taken. Try another one." }, { status: 409 });
      }
      slug = normalized;
    } else {
      slug = createSlug();
    }

    const adminToken = createAdminToken();

    await db.insert(links).values({
      slug,
      url,
      adminToken,
      createdAt: new Date().toISOString(),
    }).run();

    const baseUrl = getBaseUrl();

    return NextResponse.json({
      slug,
      shortUrl: `${baseUrl}/${slug}`,
      url,
      adminToken,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
