"use client";

import { FormEvent, useState } from "react";
import { locatorColorFromUuid } from "@/lib/uuid-locator-color";

type FortuneResult = {
  username: string;
  uuid: string;
  hash: number;
  baseColor: string;
  baseRgb: { r: number; g: number; b: number };
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
      "Your aura burns like a fresh torch at spawn. Gather your resources slowly, and the ancient world will reward your steady hands.",
    blessing: "A small miracle is waiting in the next block you place.",
  },
  {
    label: "Emerald Echo",
    title: "The Whispering Grove",
    reading:
      "The forest is listening to this green-toned omen. Trust your instincts, and let your heart lead you toward hidden treasures and calm confidence.",
    blessing: "Someone kind will appear when you least expect it.",
  },
  {
    label: "Azure Veil",
    title: "The Moonlit Traveler",
    reading:
      "You are carried by mystery tonight, like diamonds glinting under a cave moon. Follow the thread of curiosity, for the stars are guiding you to a fresh beginning.",
    blessing: "A bold idea will bloom into a beautiful opportunity.",
  },
  {
    label: "Violet Moon",
    title: "The Shadow Seer",
    reading:
      "Your soul is asking for stillness, as if you were standing in the Nether with a full stack of ender pearls. Rest, reflect, and let the quiet reveal the truth that your busy mind has missed.",
    blessing: "Your next choice will awaken a deeper purpose.",
  },
  {
    label: "Amber Lantern",
    title: "The Hearth Keeper",
    reading:
      "Warmth and wisdom are your gifts today, glowing like a lantern in a hidden mineshaft. Share your light generously, and your community will return it tenfold.",
    blessing: "A cherished connection is about to become brighter.",
  },
  {
    label: "Silver Mist",
    title: "The Dream Weaver",
    reading:
      "You move between worlds with ease, like a cart gliding across a long abandoned rail line. Let your imagination open the gate, and let your spirit speak through wonder.",
    blessing: "A forgotten dream is ready to return to your hands.",
  },
];

function colorNameFromResult(name: string | undefined) {
  return name?.trim() || "Unknown";
}

function rgbText(rgb: { r: number; g: number; b: number }) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

const locatorDotAsset = "/assets/locator_bar_dot.png";

function stringSeed(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function fortuneFromColorName(colorName: string) {
  const index = stringSeed(colorName.toLowerCase()) % fortuneDeck.length;
  return fortuneDeck[index];
}

export default function Home() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUndarkened, setShowUndarkened] = useState(false);

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
      const locator = locatorColorFromUuid(data.id);
      const colorNameResponse = await fetch(
        `/api/color-name?hex=${encodeURIComponent(locator.shadedHex)}`
      );

      if (!colorNameResponse.ok) {
        const payload = (await colorNameResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Color naming service is unavailable right now.");
      }

      const colorNamePayload = (await colorNameResponse.json()) as { name?: string };
      const fortune = fortuneFromColorName(colorNameFromResult(colorNamePayload.name));

      setShowUndarkened(false);

      setResult({
        username: data.name,
        uuid: locator.canonicalUuid,
        hash: locator.hash,
        baseColor: locator.baseHex,
        baseRgb: locator.baseRgb,
        color: locator.shadedHex,
        colorName: colorNameFromResult(colorNamePayload.name),
        rgb: locator.shadedRgb,
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

  const activeColor = result
    ? showUndarkened
      ? result.baseColor
      : result.color
    : "#FFFFFF";
  const activeColorLabel = showUndarkened
    ? "Raw UUID color"
    : "In-game color";
  const toggleTooltip = showUndarkened
    ? "Active: Raw UUID color. Click to switch to In-game color."
    : "Active: In-game color. Click to switch to Raw UUID color.";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 border border-white/20 bg-slate-950/55 p-6 text-center shadow-[0_0_80px_rgba(125,211,252,0.25)] backdrop-blur-xl sm:p-10">
        <div className="w-full max-w-3xl space-y-3">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Minecraft Color Horoscope Reader
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
          <section className="grid w-full max-w-4xl gap-4 text-left lg:grid-cols-[1fr_220px]">
            <div className="border border-white/10 bg-slate-900/70 p-6 shadow-[0_0_60px_rgba(244,114,182,0.15)]">
              <div className="mb-6 flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Toggle between in-game darkened color and undarkened hash color"
                  className="group relative h-12 w-12 border-2 border-white/70 shadow-lg"
                  onClick={() => setShowUndarkened((value) => !value)}
                  style={{
                    backgroundColor: activeColor,
                    WebkitMaskImage: `url(${locatorDotAsset})`,
                    maskImage: `url(${locatorDotAsset})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    imageRendering: "pixelated",
                  }}
                >
                  <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 border border-white/20 bg-slate-950 px-2 py-1 text-[10px] text-slate-100 opacity-0 transition-opacity group-hover:opacity-100">
                    {toggleTooltip}
                  </span>
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    Locator Bar Color
                  </p>
                  <h2 className="text-xl font-semibold text-white">{result.colorName}</h2>
                  <p className="text-xs text-slate-300">{activeColor} • {activeColorLabel}</p>
                </div>
              </div>

              <div className="mb-6 h-3" style={{ background: `linear-gradient(90deg, ${activeColor}, #ffffff)` }} />

              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Horoscope tone</p>
              <h3 className="text-2xl font-semibold text-white">{result.title}</h3>
              <p className="mt-3 text-lg leading-8 text-slate-300">{result.reading}</p>
              <p className="mt-6 border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                {result.blessing}
              </p>
            </div>

            <aside className="border border-white/10 bg-slate-900/70 p-4">
              <img
                src={`https://mc-heads.net/body/${encodeURIComponent(result.username)}/left`}
                alt={`${result.username} 3D Minecraft skin render`}
                className="mx-auto h-auto w-full max-w-[180px] object-contain [image-rendering:pixelated]"
                loading="lazy"
              />
            </aside>
          </section>
        ) : (
          <div className="w-full border border-dashed border-white/20 bg-slate-900/40 p-8 text-center text-slate-300">
            Your fortune is waiting in the mist. Try a name and let the locator bar reveal your path.
          </div>
        )}

        <p className="w-full text-center text-xs text-slate-300 sm:text-sm">
          Created by Inpuzah, with inspiration from {" "}
          <a
            href="https://discord.gg/jeffska"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Jeff&apos;s Discord Community
          </a>
        </p>

        <footer className="w-full pt-2 text-center text-[10px] text-slate-300/75 sm:text-xs">
          Made for fun and curiosity only; horoscope results are symbolic and should not be taken as factual guidance.
        </footer>
      </main>
    </div>
  );
}
