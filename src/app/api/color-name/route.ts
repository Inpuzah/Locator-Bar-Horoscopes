import { NextResponse } from "next/server";

type TheColorApiResponse = {
  name?: {
    value?: string;
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hex = searchParams.get("hex")?.replace("#", "").trim();

  if (!hex || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    return NextResponse.json(
      { error: "Provide a valid 6-digit hex color." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "The Color API is unavailable right now." },
        { status: 502 }
      );
    }

    const payload = (await upstream.json()) as TheColorApiResponse;
    const name = payload.name?.value;

    return NextResponse.json({ name: name || "Unknown" });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach The Color API right now." },
      { status: 502 }
    );
  }
}
