import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error: "Enter a Minecraft name to hear your fortune." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (upstream.status === 204 || upstream.status === 404) {
      return NextResponse.json(
        { error: "No Minecraft account was found with that username." },
        { status: 404 }
      );
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Mojang lookup is unavailable right now. Please try again." },
        { status: 502 }
      );
    }

    const profile = (await upstream.json()) as { id?: string; name?: string };

    if (!profile?.id || !profile?.name) {
      return NextResponse.json(
        { error: "Mojang returned an unexpected profile response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ id: profile.id, name: profile.name });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach Mojang right now. Check your connection and retry." },
      { status: 502 }
    );
  }
}
