"use client";

import html2canvas from "html2canvas";
import { FormEvent, useRef, useState } from "react";
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
  personality: string;
  fortune: string;
  omen: string;
};

function colorNameFromResult(name: string | undefined) {
  return name?.trim() || "Unknown";
}

const locatorDotAsset = "/assets/locator_bar_dot.png";

type ColorBandProfile = {
  band: string;
  archetype: string;
  personality: string;
  future: string;
  omen: string;
};

const colorBandProfiles: ColorBandProfile[] = [
  {
    band: "Crimson",
    archetype: "Forge Herald",
    personality:
      "you tend to become more decisive once something feels important to you, even if you take time to weigh your options first",
    future:
      "something you considered before may return at a time when you are better prepared for it",
    omen:
      "smelt before you sprint; a little preparation may make the next journey easier",
  },
  {
    band: "Scarlet",
    archetype: "Blaze Captain",
    personality:
      "you may be more willing to take a chance than you realize, especially when the potential reward feels meaningful",
    future:
      "a decision that feels uncertain at first may become clearer once you take the first step",
    omen:
      "carry extra food; the longer path may prove more worthwhile than the fastest one",
  },
  {
    band: "Amber",
    archetype: "Lantern Keeper",
    personality:
      "you often appreciate a sense of stability, while still enjoying the occasional change that keeps things interesting",
    future:
      "something familiar may reveal a new use or meaning when you look at it differently",
    omen:
      "leave a few torches behind; the easiest way forward may begin with knowing where you came from",
  },
  {
    band: "Golden",
    archetype: "Sun Cartographer",
    personality:
      "you tend to notice opportunities when they appear and often enjoy seeing gradual effort turn into visible progress",
    future:
      "a small success may lead to something larger if you continue building on it",
    omen:
      "check your map before traveling too far; direction may matter more than distance",
  },
  {
    band: "Lime",
    archetype: "Grove Tactician",
    personality:
      "you are often open to trying something different, but usually feel best when there is still some kind of plan",
    future:
      "something that has felt slow or uncertain may begin moving after a simple adjustment",
    omen:
      "keep one inventory slot open; an unexpected find may be worth keeping",
  },
  {
    band: "Verdant",
    archetype: "Canopy Warden",
    personality:
      "you tend to be patient with the things you care about, even if you sometimes wonder whether your effort is paying off",
    future:
      "a longer-term effort may soon begin showing clearer signs of progress",
    omen:
      "repair what you rely on; maintaining what already works may matter more than replacing it",
  },
  {
    band: "Teal",
    archetype: "Tide Navigator",
    personality:
      "you are often able to adjust when plans shift, even if it takes a little time to settle into a new direction",
    future:
      "an unexpected change may lead you toward something more useful than your original plan",
    omen:
      "trust your compass when the path becomes unclear; the first direction you notice may be worth exploring",
  },
  {
    band: "Cyan",
    archetype: "Prism Diver",
    personality:
      "you tend to notice small details and may enjoy figuring out how different pieces connect",
    future:
      "an idea that feels nearly complete may come together after one last adjustment",
    omen:
      "look a little deeper than usual; something worthwhile may be just beyond where you normally stop",
  },
  {
    band: "Azure",
    archetype: "Sky Oracle",
    personality:
      "you often think about what comes next, even while you are focused on what is happening in the moment",
    future:
      "something that has remained uncertain may become easier to understand with a little more time",
    omen:
      "watch the horizon before your next move; timing may matter more than speed",
  },
  {
    band: "Indigo",
    archetype: "Moon Engineer",
    personality:
      "you tend to understand things better after experimenting with them in your own way",
    future:
      "a complicated situation may become easier once you simplify what you are trying to achieve",
    omen:
      "test your setup twice; the simpler solution may be the stronger one",
  },
  {
    band: "Violet",
    archetype: "Void Seer",
    personality:
      "you may trust your instincts more than you realize, especially when there is no obviously correct choice",
    future:
      "an option that once seemed unimportant may become more appealing as circumstances change",
    omen:
      "keep an escape route in mind; flexibility may matter when the terrain shifts",
  },
  {
    band: "Magenta",
    archetype: "Nebula Artisan",
    personality:
      "you often enjoy adding a personal touch to the things you care about, even when the difference is subtle",
    future:
      "something shared with another person may become more rewarding than you first expected",
    omen:
      "show someone what you are building; a second perspective may spark a new idea",
  },
];

function hueFromRgb(rgb: { r: number; g: number; b: number }) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  let hue = 0;

  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  const degrees = hue * 60;
  return degrees < 0 ? degrees + 360 : degrees;
}

function colorBandFromRgb(rgb: { r: number; g: number; b: number }) {
  const hue = hueFromRgb(rgb);
  const index = Math.floor(hue / 30) % colorBandProfiles.length;
  return colorBandProfiles[index];
}

function fortuneFromColor(
  username: string,
  colorName: string,
  rgb: { r: number; g: number; b: number }
) {
  const band = colorBandFromRgb(rgb);

  return {
    label: `${band.band} Band`,
    title: `${band.archetype} of ${colorName}`,
    personality: `${username}, your ${colorName} locator color places you in the ${band.band} band. This suggests ${band.personality}.`,
    fortune: `${username}, over the next cycle ${band.future}.`,
    omen: `Minecraft omen: ${band.omen}.`,
  };
}

export default function Home() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUndarkened, setShowUndarkened] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [copyOutputState, setCopyOutputState] = useState<"idle" | "copied" | "downloaded" | "error">("idle");
  const outputRef = useRef<HTMLElement | null>(null);

  async function handleCopyHex() {
    try {
      await navigator.clipboard.writeText(activeColor);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1200);
    }
  }

  function downloadOutputPng(imageBlob: Blob) {
    const downloadUrl = URL.createObjectURL(imageBlob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `minecraft-zodiac-${name.trim() || "output"}.png`;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  }

  async function waitForOutputImages(container: HTMLElement) {
    const images = Array.from(container.querySelectorAll("img"));

    await Promise.all(
      images.map(async (image) => {
        if (image.complete && image.naturalWidth > 0) {
          return;
        }

        await new Promise<void>((resolve) => {
          const done = () => {
            image.removeEventListener("load", done);
            image.removeEventListener("error", done);
            resolve();
          };

          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
        });
      })
    );
  }

  function blobFromCanvas(canvas: HTMLCanvasElement) {
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        const dataUrl = canvas.toDataURL("image/png");
        const parts = dataUrl.split(",");

        if (parts.length !== 2) {
          resolve(null);
          return;
        }

        const base64 = parts[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }

        resolve(new Blob([bytes], { type: "image/png" }));
      }, "image/png");
    });
  }

  function isCanvasBlank(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");

    if (!context) {
      return true;
    }

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

    for (let index = 3; index < data.length; index += 4) {
      if (data[index] !== 0) {
        return false;
      }
    }

    return true;
  }

  async function captureOutputPngBlob() {
    if (!outputRef.current) {
      throw new Error("Output container not found.");
    }

    const source = outputRef.current;
    await waitForOutputImages(source);

    const rect = source.getBoundingClientRect();
    const captureWidth = Math.max(1, Math.ceil(rect.width));
    const captureHeight = Math.max(1, Math.ceil(rect.height));

    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-100000px";
    host.style.top = "0";
    host.style.pointerEvents = "none";
    host.style.backgroundColor = activeColor;
    host.style.padding = "10px";
    host.style.border = "1px solid rgba(255,255,255,0.25)";
    host.style.boxSizing = "border-box";
    host.style.width = `${captureWidth}px`;
    host.style.overflow = "visible";

    const clone = source.cloneNode(true) as HTMLElement;
    clone.style.width = `${captureWidth}px`;
    clone.style.maxWidth = "none";
    clone.style.margin = "0";
    clone.style.boxSizing = "border-box";

    host.appendChild(clone);
    document.body.appendChild(host);

    const captureAttempts = [
      {
        backgroundColor: activeColor,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        imageTimeout: 15000,
      },
      {
        backgroundColor: activeColor,
        scale: 2,
        useCORS: false,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        imageTimeout: 15000,
      },
    ] as const;

    try {
      await waitForOutputImages(clone);
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      for (const options of captureAttempts) {
        try {
          const canvas = await html2canvas(host, {
            ...options,
            width: host.offsetWidth,
            height: host.offsetHeight || captureHeight,
            windowWidth: host.offsetWidth,
            windowHeight: host.offsetHeight || captureHeight,
            scrollX: 0,
            scrollY: 0,
          });

          if (isCanvasBlank(canvas)) {
            continue;
          }

          const imageBlob = await blobFromCanvas(canvas);

          if (imageBlob) {
            return imageBlob;
          }
        } catch {
          // Continue to next strategy.
        }
      }
    } finally {
      host.remove();
    }

    throw new Error("Unable to create PNG image.");
  }

  async function handleCopyOutputPng() {
    try {
      const imageBlob = await captureOutputPngBlob();

      const canWritePng =
        typeof ClipboardItem !== "undefined" &&
        !!navigator.clipboard?.write &&
        window.isSecureContext;

      if (canWritePng) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": imageBlob,
            }),
          ]);

          setCopyOutputState("copied");
          window.setTimeout(() => setCopyOutputState("idle"), 1200);
          return;
        } catch {
          // Fall through to a download fallback if clipboard write fails.
        }
      }

      downloadOutputPng(imageBlob);
      setCopyOutputState("downloaded");
      window.setTimeout(() => setCopyOutputState("idle"), 1400);
    } catch {
      setCopyOutputState("error");
      window.setTimeout(() => setCopyOutputState("idle"), 1200);
    }
  }

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
      const colorName = colorNameFromResult(colorNamePayload.name);
      const fortune = fortuneFromColor(data.name, colorName, locator.shadedRgb);

      setShowUndarkened(false);
      setCopyState("idle");
      setCopyOutputState("idle");

      setResult({
        username: data.name,
        uuid: locator.canonicalUuid,
        hash: locator.hash,
        baseColor: locator.baseHex,
        baseRgb: locator.baseRgb,
        color: locator.shadedHex,
        colorName,
        rgb: locator.shadedRgb,
        label: fortune.label,
        title: fortune.title,
        personality: fortune.personality,
        fortune: fortune.fortune,
        omen: fortune.omen,
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
    ? "Click to toggle color mode. Active: Raw UUID color."
    : "Click to toggle color mode. Active: In-game color.";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 border border-white/20 bg-slate-950/55 p-6 text-center shadow-[0_0_80px_rgba(125,211,252,0.25)] backdrop-blur-xl sm:p-10">
        <div className="w-full max-w-3xl space-y-3">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            MINECRAFT ZODIAC
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
            {loading ? "Reading the stars..." : "GO!"}
          </button>
        </form>

        {error ? (
          <div className="border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {result ? (
          <section ref={outputRef} className="grid w-full max-w-4xl items-start gap-4 text-left lg:grid-cols-[1fr_220px]">
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
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-400">
                    Locator Bar Color
                  </p>
                  <h2 className="text-xl font-semibold text-white">{result.colorName}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <button
                      type="button"
                      onClick={handleCopyHex}
                      className="underline underline-offset-2 hover:text-white"
                      aria-label="Copy active hex value"
                      title="Click to copy hex value"
                    >
                      {activeColor}
                    </button>
                    <span>• {activeColorLabel}</span>
                    {copyState === "copied" ? <span className="text-cyan-300">Copied</span> : null}
                    {copyState === "error" ? <span className="text-rose-300">Copy failed</span> : null}
                  </div>
                </div>
              </div>

              <div className="mb-6 h-3" style={{ background: `linear-gradient(90deg, ${activeColor}, #ffffff)` }} />

              <h3 className="text-2xl font-semibold text-white">{result.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-300">
                <span className="font-semibold text-white">Who you are:</span> {result.personality}
              </p>
              <p className="mt-3 text-base leading-7 text-slate-300">
                <span className="font-semibold text-white">Your fortune:</span> {result.fortune}
              </p>
            </div>

            <div className="self-start">
              <aside className="border border-white/10 bg-slate-900/70 p-4">
                <img
                  src={`/api/skin-render?username=${encodeURIComponent(result.username)}&view=left`}
                  alt={`${result.username} 3D Minecraft skin render`}
                  className="mx-auto h-auto max-h-[340px] w-full max-w-[180px] object-contain [image-rendering:pixelated]"
                  loading="lazy"
                />
              </aside>
            </div>
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
