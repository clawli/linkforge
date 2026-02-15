import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    const fg = request.nextUrl.searchParams.get("fg") || "#ffffff";
    const bg = request.nextUrl.searchParams.get("bg") || "#09090b";
    const format = request.nextUrl.searchParams.get("format") || "png";

    if (!url) {
      return NextResponse.json({ error: "URL parameter required." }, { status: 400 });
    }

    if (format === "svg") {
      const svg = await QRCode.toString(url, {
        type: "svg",
        color: { dark: fg, light: bg },
        margin: 2,
        width: 300,
      });
      return new NextResponse(svg, {
        headers: { "Content-Type": "image/svg+xml" },
      });
    }

    const buffer = await QRCode.toBuffer(url, {
      type: "png",
      color: { dark: fg, light: bg },
      margin: 2,
      width: 300,
      scale: 4,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="qr-${Date.now()}.png"`,
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json({ error: "Failed to generate QR code." }, { status: 500 });
  }
}
