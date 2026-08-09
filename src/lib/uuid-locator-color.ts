export type Rgb = {
  r: number;
  g: number;
  b: number;
};

export type LocatorColorResult = {
  normalizedUuid: string;
  canonicalUuid: string;
  hash: number;
  baseHex: string;
  shadedHex: string;
  baseRgb: Rgb;
  shadedRgb: Rgb;
};

export function normalizeUuidInput(uuidInput: string) {
  const normalized = uuidInput.trim().replace(/-/g, "").toLowerCase();

  if (!/^[0-9a-f]{32}$/.test(normalized)) {
    throw new Error("UUID input must contain exactly 32 hexadecimal digits.");
  }

  return normalized;
}

export function canonicalizeUuid(uuidInput: string) {
  const normalized = normalizeUuidInput(uuidInput);

  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
}

function toSignedInt32(value: bigint) {
  const low = Number(value & BigInt("0xffffffff"));
  return low >= 0x80000000 ? low - 0x100000000 : low;
}

export function javaUuidHashCode(uuidInput: string) {
  const normalized = normalizeUuidInput(uuidInput);
  const msb = BigInt(`0x${normalized.slice(0, 16)}`);
  const lsb = BigInt(`0x${normalized.slice(16)}`);
  const hilo = msb ^ lsb;

  const upper = toSignedInt32(hilo >> BigInt(32));
  const lower = toSignedInt32(hilo);

  return (upper ^ lower) | 0;
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, value));
}

function toHexColor(rgb: Rgb) {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => clampByte(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function rgbToHsv(rgb: Rgb) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;

  if (delta !== 0) {
    if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      hue = 60 * ((b - r) / delta + 2);
    } else {
      hue = 60 * ((r - g) / delta + 4);
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  const saturation = max === 0 ? 0 : delta / max;

  return { h: hue, s: saturation, v: max };
}

function hsvToRgb(h: number, s: number, v: number): Rgb {
  const chroma = v * s;
  const hueSegment = h / 60;
  const x = chroma * (1 - Math.abs((hueSegment % 2) - 1));
  const match = v - chroma;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hueSegment >= 0 && hueSegment < 1) {
    rPrime = chroma;
    gPrime = x;
  } else if (hueSegment < 2) {
    rPrime = x;
    gPrime = chroma;
  } else if (hueSegment < 3) {
    gPrime = chroma;
    bPrime = x;
  } else if (hueSegment < 4) {
    gPrime = x;
    bPrime = chroma;
  } else if (hueSegment < 5) {
    rPrime = x;
    bPrime = chroma;
  } else {
    rPrime = chroma;
    bPrime = x;
  }

  return {
    r: clampByte(Math.round((rPrime + match) * 255)),
    g: clampByte(Math.round((gPrime + match) * 255)),
    b: clampByte(Math.round((bPrime + match) * 255)),
  };
}

export function renderRgbForLocatorBar(rgb: Rgb) {
  const hsv = rgbToHsv(rgb);

  return hsvToRgb(hsv.h, hsv.s, 0.9);
}

export function darkenRgbForLocatorBar(rgb: Rgb) {
  // Legacy export name kept for compatibility; rendering now uses pinned HSV brightness.
  return renderRgbForLocatorBar(rgb);
}

export function darkenRgbPerChannel(rgb: Rgb) {
  return {
    r: Math.trunc(rgb.r * 0.9),
    g: Math.trunc(rgb.g * 0.9),
    b: Math.trunc(rgb.b * 0.9),
  };
}

export function baseRgbFromHash(hash: number) {
  const rgb = hash & 0xffffff;

  return {
    r: (rgb >> 16) & 0xff,
    g: (rgb >> 8) & 0xff,
    b: rgb & 0xff,
  };
}

export function locatorColorFromUuid(uuidInput: string): LocatorColorResult {
  const normalizedUuid = normalizeUuidInput(uuidInput);
  const hash = javaUuidHashCode(normalizedUuid);
  const baseRgb = baseRgbFromHash(hash);
  const shadedRgb = renderRgbForLocatorBar(baseRgb);

  return {
    normalizedUuid,
    canonicalUuid: canonicalizeUuid(normalizedUuid),
    hash,
    baseHex: toHexColor(baseRgb),
    shadedHex: toHexColor(shadedRgb),
    baseRgb,
    shadedRgb,
  };
}
