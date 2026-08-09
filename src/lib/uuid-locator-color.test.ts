import { describe, expect, it } from "vitest";
import {
  baseRgbFromHash,
  canonicalizeUuid,
  darkenRgbPerChannel,
  darkenRgbForLocatorBar,
  javaUuidHashCode,
  locatorColorFromUuid,
  normalizeUuidInput,
} from "./uuid-locator-color";

describe("UUID normalization", () => {
  it("normalizes hyphenated mixed-case UUID input", () => {
    expect(normalizeUuidInput("  069A79F4-44E9-4726-A5BE-FCA90E38AAF5  ")).toBe(
      "069a79f444e94726a5befca90e38aaf5"
    );
  });

  it("returns canonical 8-4-4-4-12 display form", () => {
    expect(canonicalizeUuid("069a79f444e94726a5befca90e38aaf5")).toBe(
      "069a79f4-44e9-4726-a5be-fca90e38aaf5"
    );
  });

  it("rejects non-32-hex UUID input", () => {
    expect(() => normalizeUuidInput("not-a-uuid")).toThrow();
  });
});

describe("Java UUID hash behavior", () => {
  it("matches expected hash for nil UUID", () => {
    expect(javaUuidHashCode("00000000-0000-0000-0000-000000000000")).toBe(0);
  });

  it("matches expected hash for max UUID", () => {
    expect(javaUuidHashCode("ffffffff-ffff-ffff-ffff-ffffffffffff")).toBe(0);
  });

  it("gives equivalent output for compact and hyphenated forms", () => {
    const compact = locatorColorFromUuid("f94d2668062f4cd8a650f8f142a82475");
    const hyphenated = locatorColorFromUuid("f94d2668-062f-4cd8-a650-f8f142a82475");

    expect(compact.hash).toBe(hyphenated.hash);
    expect(compact.baseHex).toBe(hyphenated.baseHex);
    expect(compact.shadedHex).toBe(hyphenated.shadedHex);
  });
});

describe("Locator color extraction and shading", () => {
  it("extracts low 24 bits as RGB", () => {
    const rgb = baseRgbFromHash(0x1234abcd);
    expect(rgb).toEqual({ r: 0x34, g: 0xab, b: 0xcd });
  });

  it("renders locator color with HSV brightness pinned at 90%", () => {
    const shaded = darkenRgbForLocatorBar({ r: 131, g: 63, b: 88 });
    expect(shaded).toEqual({ r: 230, g: 110, b: 154 });
  });

  it("keeps per-channel 0.9 math available for direct comparison", () => {
    const shaded = darkenRgbPerChannel({ r: 85, g: 240, b: 192 });
    expect(shaded).toEqual({ r: 76, g: 216, b: 172 });
  });

  it("matches known Notch vector", () => {
    const result = locatorColorFromUuid("069a79f4-44e9-4726-a5be-fca90e38aaf5");
    expect(result.hash).toBe(-369792882);
    expect(result.baseHex).toBe("#F5688E");
    expect(result.shadedHex).toBe("#E6618B");
  });

  it("supports versioned and high-bit UUIDs", () => {
    const versioned = locatorColorFromUuid("123e4567-e89b-12d3-a456-426614174000");
    const highBit = locatorColorFromUuid("f0000000-0000-0000-8000-000000000000");

    expect(versioned.shadedHex).toMatch(/^#[0-9A-F]{6}$/);
    expect(highBit.shadedHex).toMatch(/^#[0-9A-F]{6}$/);
  });
});
