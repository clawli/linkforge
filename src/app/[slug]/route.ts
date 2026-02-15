import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { links, clicks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UAParser } from "ua-parser-js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Skip API routes and Next.js internals
  if (slug.startsWith("api") || slug.startsWith("_next") || slug === "favicon.ico") {
    return NextResponse.next();
  }

  try {
    const link = db.select().from(links).where(eq(links.slug, slug)).get();

    if (!link) {
      return NextResponse.redirect(new URL(`/not-found?slug=${slug}`, request.url));
    }

    // Check if link has expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.redirect(new URL(`/not-found?slug=${slug}&expired=true`, request.url));
    }

    // Parse user agent
    const ua = request.headers.get("user-agent") || "";
    const parser = new UAParser(ua);
    const result = parser.getResult();

    // Log click asynchronously
    try {
      db.insert(clicks).values({
        linkId: link.id,
        referrer: request.headers.get("referer") || null,
        country: request.headers.get("x-vercel-ip-country") || null,
        city: request.headers.get("x-vercel-ip-city") || null,
        device: result.device.type || "desktop",
        browser: result.browser.name || "Unknown",
        os: result.os.name || "Unknown",
      }).run();
    } catch (e) {
      console.error("Failed to log click:", e);
    }

    return NextResponse.redirect(link.url, { status: 302 });
  } catch (error) {
    console.error("Redirect error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
