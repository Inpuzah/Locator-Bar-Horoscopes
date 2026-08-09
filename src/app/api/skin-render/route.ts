import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();
  const view = searchParams.get("view") === "front" ? "front" : "left";

  if (!username) {
    return NextResponse.json({ error: "Missing username." }, { status: 400 });
  }

  // Keep this strict to avoid path injection in the upstream URL.
  if (!/^[A-Za-z0-9_]{1,16}$/.test(username)) {
    return NextResponse.json({ error: "Invalid username format." }, { status: 400 });
  }

  const upstreamUrl = `https://mc-heads.net/body/${encodeURIComponent(username)}/${view}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Unable to fetch skin render." }, { status: 502 });
    }

    const bytes = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/png";

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to reach skin render provider." }, { status: 502 });
  }
}
