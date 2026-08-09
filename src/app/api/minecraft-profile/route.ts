import { NextResponse } from "next/server";
import { MojangProfileProvider } from "@/lib/profile-provider";

const profileProvider = new MojangProfileProvider();

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
    const profile = await profileProvider.resolveByUsername(username);

    if (!profile) {
      return NextResponse.json(
        { error: "No Minecraft account was found with that username." },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: profile.id, name: profile.name });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_UPSTREAM_PAYLOAD") {
      return NextResponse.json(
        { error: "Mojang returned an unexpected profile response." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Mojang lookup is unavailable right now. Please try again." },
      { status: 502 }
    );
  }
}
