import { describe, expect, it } from "bun:test";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_UPLOAD_BYTES,
} from "@es2s/shared";
import {
  validateDescription,
  validateHeadObject,
  validateImageDimensions,
} from "../src/validators";

const okHead = {
  contentLength: 1024,
  contentType: "image/jpeg",
};

describe("validateHeadObject", () => {
  it("accepts a valid head object", () => {
    const result = validateHeadObject(okHead);
    expect(result.ok).toBe(true);
  });

  it("accepts exactly MAX_UPLOAD_BYTES", () => {
    expect(
      validateHeadObject({ ...okHead, contentLength: MAX_UPLOAD_BYTES }).ok,
    ).toBe(true);
  });

  it("rejects MAX_UPLOAD_BYTES + 1 with 413", () => {
    const result = validateHeadObject({
      ...okHead,
      contentLength: MAX_UPLOAD_BYTES + 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
      expect(result.error).toContain("too large");
    }
  });

  it("rejects a zero-length object with 413", () => {
    const result = validateHeadObject({ ...okHead, contentLength: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("rejects a negative length with 413", () => {
    const result = validateHeadObject({ ...okHead, contentLength: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("rejects a missing content length with 413", () => {
    const result = validateHeadObject({ ...okHead, contentLength: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it.each(["image/png", "image/jpeg", "image/webp"])(
    "accepts %s",
    (contentType) => {
      expect(validateHeadObject({ ...okHead, contentType }).ok).toBe(true);
    },
  );

  it.each(["image/gif", "image/svg+xml", "application/pdf", "text/plain"])(
    "rejects %s with 415",
    (contentType) => {
      const result = validateHeadObject({ ...okHead, contentType });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(415);
        expect(result.error).toContain("Unsupported");
      }
    },
  );

  it("rejects a missing content type with 415", () => {
    const result = validateHeadObject({ ...okHead, contentType: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(415);
  });

  it("checks size before mime type", () => {
    const result = validateHeadObject({
      contentLength: MAX_UPLOAD_BYTES + 1,
      contentType: "image/gif",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("normalises the mime type case", () => {
    expect(
      validateHeadObject({ ...okHead, contentType: "IMAGE/JPEG" }).ok,
    ).toBe(true);
  });

  it("ignores mime type parameters", () => {
    expect(
      validateHeadObject({ ...okHead, contentType: "image/jpeg; charset=binary" })
        .ok,
    ).toBe(true);
  });
});

describe("validateImageDimensions", () => {
  it("accepts a normal image", () => {
    expect(validateImageDimensions({ width: 1024, height: 768 }).ok).toBe(true);
  });

  it("accepts exactly MAX_IMAGE_PIXELS", () => {
    expect(
      validateImageDimensions({ width: 10_000, height: 5_000 }).ok,
    ).toBe(true);
  });

  it("rejects MAX_IMAGE_PIXELS + 1 with 413", () => {
    const result = validateImageDimensions({ width: 10_000, height: 5_001 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
      expect(result.error).toContain("too large");
    }
  });

  it("rejects a decompression bomb", () => {
    const result = validateImageDimensions({ width: 50_000, height: 50_000 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("rejects zero or negative dimensions with 422", () => {
    for (const dims of [
      { width: 0, height: 100 },
      { width: 100, height: 0 },
      { width: -1, height: 100 },
    ]) {
      const result = validateImageDimensions(dims);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(422);
    }
  });

  it("rejects missing dimensions with 422", () => {
    const result = validateImageDimensions({ width: undefined, height: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });
});

describe("validateDescription", () => {
  it("accepts a valid description", () => {
    const result = validateDescription("Clouds over the Pacific");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("Clouds over the Pacific");
  });

  it("trims the description", () => {
    const result = validateDescription("  hello  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("hello");
  });

  it("accepts exactly MAX_DESCRIPTION_LENGTH", () => {
    expect(validateDescription("a".repeat(MAX_DESCRIPTION_LENGTH)).ok).toBe(
      true,
    );
  });

  it("rejects MAX_DESCRIPTION_LENGTH + 1 with 422", () => {
    const result = validateDescription("a".repeat(MAX_DESCRIPTION_LENGTH + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.error).toContain("at most");
    }
  });

  it("rejects an empty string with 422", () => {
    const result = validateDescription("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });

  it("rejects whitespace-only with 422", () => {
    const result = validateDescription("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });

  it("rejects a missing description with 422", () => {
    const result = validateDescription(undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });

  it("rejects a non-string with 422", () => {
    const result = validateDescription(42);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });
});
