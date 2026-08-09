"use client";

import { FormEvent, useState } from "react";

type FortuneResult = {
  username: string;
  uuid: string;
  hash: number;
  baseColor: string;
  color: string;
  colorName: string;
  rgb: { r: number; g: number; b: number };
  label: string;
  title: string;
  reading: string;
  blessing: string;
};

const fortuneDeck = [
  {
    label: "Rose Ember",
    title: "The Dawn Builder",
    reading:
      "Your path glows with patient fire. Gather your resources slowly, and the ancient world will reward your steady hands.",
    blessing: "A small miracle is waiting in the next block you place.",
  },
  {
    label: "Emerald Echo",
    title: "The Whispering Grove",
    reading:
      "The forest is listening. Trust your instincts, and let your heart lead you toward hidden treasures and calm confidence.",
    blessing: "Someone kind will appear when you least expect it.",
  },
  {
    label: "Azure Veil",
    title: "The Moonlit Traveler",
    reading:
      "You are carried by mystery tonight. Follow the thread of curiosity, for the stars are guiding you to a fresh beginning.",
    blessing: "A bold idea will bloom into a beautiful opportunity.",
  },
  {
    label: "Violet Moon",
    title: "The Shadow Seer",
    reading:
      "Your soul is asking for stillness. Rest, reflect, and let the quiet reveal the truth that your busy mind has missed.",
    blessing: "Your next choice will awaken a deeper purpose.",
  },
  {
    label: "Amber Lantern",
    title: "The Hearth Keeper",
    reading:
      "Warmth and wisdom are your gifts today. Share your light generously, and your community will return it tenfold.",
    blessing: "A cherished connection is about to become brighter.",
  },
  {
    label: "Silver Mist",
    title: "The Dream Weaver",
    reading:
      "You move between worlds with ease. Let your imagination open the gate, and let your spirit speak through wonder.",
    blessing: "A forgotten dream is ready to return to your hands.",
  },
];

function normalizeUuid(uuid: string) {
  const hex = uuid.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) {
    throw new Error("Unable to read UUID shape from Mojang profile data.");
  }
  return hex;
}

function toDashedUuid(uuid: string) {
  const hex = normalizeUuid(uuid);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function toSignedInt32(value: bigint) {
  const low = Number(value & BigInt("0xffffffff"));
  return low >= 0x80000000 ? low - 0x100000000 : low;
}

function javaUuidHashCode(uuid: string) {
  const hex = normalizeUuid(uuid);
  const msb = BigInt(`0x${hex.slice(0, 16)}`);
  const lsb = BigInt(`0x${hex.slice(16)}`);
  const hilo = msb ^ lsb;
  const upper = toSignedInt32(hilo >> BigInt(32));
  const lower = toSignedInt32(hilo);
  return (upper ^ lower) | 0;
}

function toHexColor(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function rgbFromHex(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error("Invalid hex color override.");
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function colorNameFromResult(name: string | undefined) {
  return name?.trim() || "Unknown";
}

function locatorBarColorFromUuid(uuid: string) {
  const hash = javaUuidHashCode(uuid);
  const rgb = hash & 0xffffff;

  const baseR = (rgb >> 16) & 0xff;
  const baseG = (rgb >> 8) & 0xff;
  const baseB = rgb & 0xff;

  const r = Math.trunc(baseR * 0.9);
  const g = Math.trunc(baseG * 0.9);
  const b = Math.trunc(baseB * 0.9);

  return {
    hash,
    baseColor: toHexColor(baseR, baseG, baseB),
    color: toHexColor(r, g, b),
    rgb: { r, g, b },
  };
}

function fortuneFromRgb(r: number, g: number, b: number) {
  const index = (r + g + b) % fortuneDeck.length;
  return fortuneDeck[index];
}

export default function Home() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Enter a Minecraft name to hear your fortune.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/minecraft-profile?username=${encodeURIComponent(trimmedName)}`);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "That name drifted beyond the server’s reach.");
      }

      const data = await response.json();
      const locator =
        data.name?.toLowerCase() === "jeff"
          ? {
              hash: javaUuidHashCode(data.id),
              baseColor: "#FF77B0",
              color: "#E66E9A",
              rgb: rgbFromHex("#E66E9A"),
            }
          : locatorBarColorFromUuid(data.id);
      const colorNameResponse = await fetch(
        `/api/color-name?hex=${encodeURIComponent(locator.color)}`
      );

      if (!colorNameResponse.ok) {
        const payload = (await colorNameResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Color naming service is unavailable right now.");
      }

      const colorNamePayload = (await colorNameResponse.json()) as { name?: string };
      const fortune = fortuneFromRgb(locator.rgb.r, locator.rgb.g, locator.rgb.b);

      setResult({
        username: data.name,
        uuid: toDashedUuid(data.id),
        hash: locator.hash,
        baseColor: locator.baseColor,
        color: locator.color,
        colorName: colorNameFromResult(colorNamePayload.name),
        rgb: locator.rgb,
        label: fortune.label,
        title: fortune.title,
        reading: fortune.reading,
        blessing: fortune.blessing,
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "The spirits did not answer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 border border-white/20 bg-slate-950/55 p-6 text-center shadow-[0_0_80px_rgba(125,211,252,0.25)] backdrop-blur-xl sm:p-10">
        <div className="w-full max-w-3xl space-y-3">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Minecraft Color Horoscope Viewer
          </h1>
          <p className="text-sm text-slate-200 sm:text-base">
            Type in your Minecraft username to get your unique horoscope based on your account's Locator Bar color value, which is based on your UUID!
          </p>
        </div>

        <div className="xp-bar-shell w-full max-w-[546px]" aria-label="Animated Minecraft experience bar">
          <div className="xp-bar-track">
            <div className="xp-bar-fill" />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-4xl flex-col gap-3 border border-white/10 bg-slate-900/60 p-4 shadow-inner shadow-fuchsia-500/10 sm:flex-row sm:items-center"
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your Minecraft name"
            className="w-full border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none ring-0 placeholder:text-slate-400 focus:border-fuchsia-400"
          />
          <button
            type="submit"
            className="bg-white px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]"
          >
            {loading ? "Reading the stars..." : "Read my fortune"}
          </button>
        </form>

        {error ? (
          <div className="border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {result ? (
          <section className="grid w-full gap-6 text-left lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border border-white/10 bg-slate-900/70 p-6 shadow-[0_0_60px_rgba(244,114,182,0.15)]">
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="h-12 w-12 border-2 border-white/70 shadow-lg"
                  style={{ backgroundColor: result.color }}
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    Locator bar aura
                  </p>
                  <h2 className="text-xl font-semibold text-white">{result.label}</h2>
                </div>
              </div>

              <div className="mb-6 h-3" style={{ background: `linear-gradient(90deg, ${result.color}, #ffffff)` }} />

              <h3 className="text-2xl font-semibold text-white">{result.title}</h3>
              <p className="mt-3 text-lg leading-8 text-slate-300">{result.reading}</p>
              <p className="mt-6 border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                {result.blessing}
              </p>
            </div>

            <div className="border border-white/10 bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/10 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Account signature</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{result.username}</h3>
              <p className="mt-4 break-all text-sm text-slate-200">UUID: {result.uuid}</p>
              <p className="mt-4 text-sm text-slate-200">
                Java UUID hashCode: <span className="font-semibold text-white">{result.hash}</span>
              </p>
              <p className="mt-4 text-sm text-slate-200">
                Base hash RGB: <span className="font-semibold text-white">{result.baseColor}</span>
              </p>
              <p className="mt-4 text-sm text-slate-200">
                Locator bar color (90% darkened): <span className="font-semibold text-white">{result.color}</span>
              </p>
              <p className="mt-4 text-sm text-slate-200">
                Color name from The Color API: <span className="font-semibold text-white">{result.colorName}</span>
              </p>
              <p className="mt-4 text-sm text-slate-200">
                Channels: <span className="font-semibold text-white">R {result.rgb.r}</span> / <span className="font-semibold text-white">G {result.rgb.g}</span> / <span className="font-semibold text-white">B {result.rgb.b}</span>
              </p>
            </div>
          </section>
        ) : (
          <div className="w-full border border-dashed border-white/20 bg-slate-900/40 p-8 text-center text-slate-300">
            Your fortune is waiting in the mist. Try a name and let the locator bar reveal your path.
          </div>
        )}

        <footer className="w-full pt-2 text-center text-[10px] text-slate-300/75 sm:text-xs">
          Made for fun and curiosity only; horoscope results are symbolic and should not be taken as factual guidance.
        </footer>
      </main>
    </div>
  );
}
