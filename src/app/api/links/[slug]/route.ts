import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { links, clicks } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Admin token required." }, { status: 401 });
    }

    const link = db
      .select()
      .from(links)
      .where(and(eq(links.slug, slug), eq(links.adminToken, token)))
      .get();

    if (!link) {
      return NextResponse.json({ error: "Link not found or invalid token." }, { status: 404 });
    }

    // Get total clicks
    const totalClicks = db
      .select({ count: sql<number>`count(*)` })
      .from(clicks)
      .where(eq(clicks.linkId, link.id))
      .get();

    // Get clicks over time (last 30 days, grouped by day)
    const clicksOverTime = db
      .select({
        date: sql<string>`date(${clicks.timestamp})`,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(
        and(
          eq(clicks.linkId, link.id),
          sql`${clicks.timestamp} >= datetime('now', '-30 days')`
        )
      )
      .groupBy(sql`date(${clicks.timestamp})`)
      .orderBy(sql`date(${clicks.timestamp})`)
      .all();

    // Get top referrers
    const topReferrers = db
      .select({
        referrer: clicks.referrer,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.referrer)
      .orderBy(sql`count(*) DESC`)
      .limit(10)
      .all();

    // Get device breakdown
    const deviceBreakdown = db
      .select({
        device: clicks.device,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.device)
      .orderBy(sql`count(*) DESC`)
      .limit(10)
      .all();

    // Get browser breakdown
    const browserBreakdown = db
      .select({
        browser: clicks.browser,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.browser)
      .orderBy(sql`count(*) DESC`)
      .limit(10)
      .all();

    // Get OS breakdown
    const osBreakdown = db
      .select({
        os: clicks.os,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.os)
      .orderBy(sql`count(*) DESC`)
      .limit(10)
      .all();

    // Get country breakdown
    const countryBreakdown = db
      .select({
        country: clicks.country,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.country)
      .orderBy(sql`count(*) DESC`)
      .limit(10)
      .all();

    return NextResponse.json({
      link: {
        slug: link.slug,
        url: link.url,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
      },
      analytics: {
        totalClicks: totalClicks?.count ?? 0,
        clicksOverTime,
        topReferrers,
        deviceBreakdown,
        browserBreakdown,
        osBreakdown,
        countryBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching link analytics:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Admin token required." }, { status: 401 });
    }

    const link = db
      .select()
      .from(links)
      .where(and(eq(links.slug, slug), eq(links.adminToken, token)))
      .get();

    if (!link) {
      return NextResponse.json({ error: "Link not found or invalid token." }, { status: 404 });
    }

    db.delete(links).where(eq(links.id, link.id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
