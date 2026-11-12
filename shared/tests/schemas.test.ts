import { describe, expect, it } from "bun:test";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_PAGE_SIZE,
  DescriptionSchema,
  FeedItemSchema,
  FeedQuerySchema,
  FeedResponseSchema,
  HealthResponseSchema,
  ImageMimeTypeSchema,
  JobStatusResponseSchema,
  JobStatusSchema,
  MAX_AUDIO_BYTES,
  MAX_AUDIO_SECONDS,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_PIXELS,
  MAX_PAGE_SIZE,
  MAX_UPLOAD_BYTES,
  MIN_AUDIO_SECONDS,
  SocialLinksSchema,
  TeamMemberSchema,
  TeamSchema,
  UploadResponseSchema,
  UploadSchema,
} from "../src/schemas";

const validFeedItem = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  image_url: "https://pub-c5312941d1a24d1883e646aab4436e22.r2.dev/images/a.jpg",
  audio_url: "https://pub-c5312941d1a24d1883e646aab4436e22.r2.dev/audio/a.wav",
  description: "Aurora over the North Atlantic",
  created_at: "2026-11-12T19:50:34.740Z",
};

describe("constants", () => {
  it("exposes the documented limits", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10_000_000);
    expect(MAX_IMAGE_PIXELS).toBe(50_000_000);
    expect(MAX_AUDIO_BYTES).toBe(1_000_000);
    expect(MIN_AUDIO_SECONDS).toBe(20);
    expect(MAX_AUDIO_SECONDS).toBe(30);
    expect(MAX_DESCRIPTION_LENGTH).toBe(100);
    expect(DEFAULT_PAGE_SIZE).toBe(20);
    expect(MAX_PAGE_SIZE).toBe(100);
  });

  it("allows exactly png, jpeg and webp", () => {
    expect([...ALLOWED_IMAGE_MIME_TYPES]).toEqual([
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);
  });
});

describe("ImageMimeTypeSchema", () => {
  it.each(["image/png", "image/jpeg", "image/webp"])("accepts %s", (mime) => {
    expect(ImageMimeTypeSchema.safeParse(mime).success).toBe(true);
  });

  it.each([
    "image/gif",
    "image/svg+xml",
    "image/tiff",
    "application/pdf",
    "text/plain",
    "",
    "IMAGE/PNG",
  ])("rejects %p", (mime) => {
    expect(ImageMimeTypeSchema.safeParse(mime).success).toBe(false);
  });
});

describe("DescriptionSchema", () => {
  it("accepts a single character", () => {
    expect(DescriptionSchema.safeParse("a").success).toBe(true);
  });

  it("accepts exactly MAX_DESCRIPTION_LENGTH characters", () => {
    expect(DescriptionSchema.safeParse("a".repeat(100)).success).toBe(true);
  });

  it("rejects MAX_DESCRIPTION_LENGTH + 1 characters", () => {
    expect(DescriptionSchema.safeParse("a".repeat(101)).success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(DescriptionSchema.safeParse("").success).toBe(false);
  });

  it("rejects whitespace-only strings", () => {
    expect(DescriptionSchema.safeParse("   ").success).toBe(false);
  });

  it("trims surrounding whitespace", () => {
    const parsed = DescriptionSchema.parse("  hello  ");
    expect(parsed).toBe("hello");
  });

  it("rejects non-strings", () => {
    expect(DescriptionSchema.safeParse(42).success).toBe(false);
    expect(DescriptionSchema.safeParse(null).success).toBe(false);
    expect(DescriptionSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("UploadSchema", () => {
  const base = {
    description: "Clouds over the Pacific",
    mimeType: "image/jpeg" as const,
    sizeBytes: 1024,
  };

  it("accepts a valid payload", () => {
    expect(UploadSchema.safeParse(base).success).toBe(true);
  });

  it("accepts exactly MAX_UPLOAD_BYTES", () => {
    expect(
      UploadSchema.safeParse({ ...base, sizeBytes: MAX_UPLOAD_BYTES }).success,
    ).toBe(true);
  });

  it("rejects MAX_UPLOAD_BYTES + 1", () => {
    expect(
      UploadSchema.safeParse({ ...base, sizeBytes: MAX_UPLOAD_BYTES + 1 })
        .success,
    ).toBe(false);
  });

  it("rejects zero and negative sizes", () => {
    expect(UploadSchema.safeParse({ ...base, sizeBytes: 0 }).success).toBe(
      false,
    );
    expect(UploadSchema.safeParse({ ...base, sizeBytes: -1 }).success).toBe(
      false,
    );
  });

  it("rejects non-integer sizes", () => {
    expect(UploadSchema.safeParse({ ...base, sizeBytes: 1.5 }).success).toBe(
      false,
    );
  });

  it("rejects a disallowed mime type", () => {
    expect(
      UploadSchema.safeParse({ ...base, mimeType: "image/gif" }).success,
    ).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(UploadSchema.safeParse({ ...base, description: "" }).success).toBe(
      false,
    );
  });

  it("rejects a missing field", () => {
    const { description: _description, ...withoutDescription } = base;
    expect(UploadSchema.safeParse(withoutDescription).success).toBe(false);
  });
});

describe("JobStatusSchema", () => {
  it.each(["queued", "processing", "done", "failed"])("accepts %s", (s) => {
    expect(JobStatusSchema.safeParse(s).success).toBe(true);
  });

  it.each(["unknown", "pending", "DONE", ""])("rejects %p", (s) => {
    expect(JobStatusSchema.safeParse(s).success).toBe(false);
  });
});

describe("FeedItemSchema", () => {
  it("accepts a valid item", () => {
    expect(FeedItemSchema.safeParse(validFeedItem).success).toBe(true);
  });

  it("coerces created_at into a Date", () => {
    const parsed = FeedItemSchema.parse(validFeedItem);
    expect(parsed.created_at).toBeInstanceOf(Date);
    expect(parsed.created_at.toISOString()).toBe("2026-11-12T19:50:34.740Z");
  });

  it("rejects a non-uuid id", () => {
    expect(
      FeedItemSchema.safeParse({ ...validFeedItem, id: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("rejects a missing audio_url", () => {
    const { audio_url: _audioUrl, ...withoutAudio } = validFeedItem;
    expect(FeedItemSchema.safeParse(withoutAudio).success).toBe(false);
  });

  it("rejects a missing image_url", () => {
    const { image_url: _imageUrl, ...withoutImage } = validFeedItem;
    expect(FeedItemSchema.safeParse(withoutImage).success).toBe(false);
  });

  it("rejects non-url values", () => {
    expect(
      FeedItemSchema.safeParse({ ...validFeedItem, image_url: "not a url" })
        .success,
    ).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(
      FeedItemSchema.safeParse({ ...validFeedItem, description: "" }).success,
    ).toBe(false);
  });

  it("rejects a description over the limit", () => {
    expect(
      FeedItemSchema.safeParse({
        ...validFeedItem,
        description: "a".repeat(MAX_DESCRIPTION_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid created_at", () => {
    expect(
      FeedItemSchema.safeParse({ ...validFeedItem, created_at: "not a date" })
        .success,
    ).toBe(false);
  });
});

describe("FeedQuerySchema", () => {
  it("defaults page and pageSize when absent", () => {
    expect(FeedQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("coerces numeric strings from query params", () => {
    expect(FeedQuerySchema.parse({ page: "2", pageSize: "5" })).toEqual({
      page: 2,
      pageSize: 5,
    });
  });

  it("rejects page 0", () => {
    expect(FeedQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it("rejects a negative page", () => {
    expect(FeedQuerySchema.safeParse({ page: -1 }).success).toBe(false);
  });

  it("rejects pageSize 0", () => {
    expect(FeedQuerySchema.safeParse({ pageSize: 0 }).success).toBe(false);
  });

  it("accepts pageSize 1 and MAX_PAGE_SIZE", () => {
    expect(FeedQuerySchema.safeParse({ pageSize: 1 }).success).toBe(true);
    expect(FeedQuerySchema.safeParse({ pageSize: MAX_PAGE_SIZE }).success).toBe(
      true,
    );
  });

  it("rejects pageSize above MAX_PAGE_SIZE", () => {
    expect(
      FeedQuerySchema.safeParse({ pageSize: MAX_PAGE_SIZE + 1 }).success,
    ).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(FeedQuerySchema.safeParse({ page: "abc" }).success).toBe(false);
  });

  it("rejects non-integer values", () => {
    expect(FeedQuerySchema.safeParse({ page: 1.5 }).success).toBe(false);
  });
});

describe("FeedResponseSchema", () => {
  it("accepts an empty page", () => {
    expect(FeedResponseSchema.safeParse({ items: [], total: 0 }).success).toBe(
      true,
    );
  });

  it("accepts a populated page", () => {
    expect(
      FeedResponseSchema.safeParse({ items: [validFeedItem], total: 1 }).success,
    ).toBe(true);
  });

  it("rejects a negative total", () => {
    expect(
      FeedResponseSchema.safeParse({ items: [], total: -1 }).success,
    ).toBe(false);
  });

  it("rejects an invalid item inside the array", () => {
    expect(
      FeedResponseSchema.safeParse({
        items: [{ ...validFeedItem, id: "nope" }],
        total: 1,
      }).success,
    ).toBe(false);
  });
});

describe("JobStatusResponseSchema", () => {
  it("accepts a queued job with no error and no feed item", () => {
    expect(
      JobStatusResponseSchema.safeParse({
        status: "queued",
        error: null,
        feedItem: null,
      }).success,
    ).toBe(true);
  });

  it("accepts a done job with a feed item", () => {
    expect(
      JobStatusResponseSchema.safeParse({
        status: "done",
        error: null,
        feedItem: validFeedItem,
      }).success,
    ).toBe(true);
  });

  it("accepts a failed job with an error message", () => {
    expect(
      JobStatusResponseSchema.safeParse({
        status: "failed",
        error: "sonification timed out",
        feedItem: null,
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(
      JobStatusResponseSchema.safeParse({
        status: "unknown",
        error: null,
        feedItem: null,
      }).success,
    ).toBe(false);
  });

  it("rejects a missing error field", () => {
    expect(
      JobStatusResponseSchema.safeParse({ status: "queued", feedItem: null })
        .success,
    ).toBe(false);
  });
});

describe("UploadResponseSchema", () => {
  it("accepts a queued response", () => {
    expect(
      UploadResponseSchema.safeParse({
        job_id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
        status: "queued",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-queued status", () => {
    expect(
      UploadResponseSchema.safeParse({
        job_id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
        status: "done",
      }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid job_id", () => {
    expect(
      UploadResponseSchema.safeParse({ job_id: "123", status: "queued" })
        .success,
    ).toBe(false);
  });
});

describe("HealthResponseSchema", () => {
  it("accepts ok", () => {
    expect(HealthResponseSchema.safeParse({ status: "ok" }).success).toBe(true);
  });

  it("rejects any other status", () => {
    expect(HealthResponseSchema.safeParse({ status: "degraded" }).success).toBe(
      false,
    );
  });
});

describe("SocialLinksSchema", () => {
  it("accepts an empty object", () => {
    expect(SocialLinksSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a partial set of links", () => {
    expect(
      SocialLinksSchema.safeParse({ instagram: "https://instagram.com/x" })
        .success,
    ).toBe(true);
  });

  it("accepts all five links", () => {
    expect(
      SocialLinksSchema.safeParse({
        instagram: "https://instagram.com/x",
        facebook: "https://facebook.com/x",
        discord: "https://discord.gg/x",
        youtube: "https://youtube.com/@x",
        snapchat: "https://snapchat.com/add/x",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-url value", () => {
    expect(SocialLinksSchema.safeParse({ instagram: "x" }).success).toBe(false);
  });
});

describe("TeamMemberSchema", () => {
  const member = {
    id: "ada",
    name: "Ada Lovelace",
    role: "Sonification Engineer",
    bio: "Turns satellite imagery into sound.",
    imageUrl: "/team/ada.jpg",
    socials: { instagram: "https://instagram.com/ada" },
  };

  it("accepts a valid member", () => {
    expect(TeamMemberSchema.safeParse(member).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(TeamMemberSchema.safeParse({ ...member, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects a name over 60 characters", () => {
    expect(
      TeamMemberSchema.safeParse({ ...member, name: "a".repeat(61) }).success,
    ).toBe(false);
  });

  it("rejects a bio over 280 characters", () => {
    expect(
      TeamMemberSchema.safeParse({ ...member, bio: "a".repeat(281) }).success,
    ).toBe(false);
  });

  it("rejects a missing socials object", () => {
    const { socials: _socials, ...withoutSocials } = member;
    expect(TeamMemberSchema.safeParse(withoutSocials).success).toBe(false);
  });
});

describe("TeamSchema", () => {
  const member = {
    id: "ada",
    name: "Ada Lovelace",
    role: "Sonification Engineer",
    bio: "Turns satellite imagery into sound.",
    imageUrl: "/team/ada.jpg",
    socials: {},
  };

  it("accepts four members", () => {
    expect(
      TeamSchema.safeParse([
        member,
        { ...member, id: "b" },
        { ...member, id: "c" },
        { ...member, id: "d" },
      ]).success,
    ).toBe(true);
  });

  it("rejects an empty array", () => {
    expect(TeamSchema.safeParse([]).success).toBe(false);
  });

  it("rejects an array containing an invalid member", () => {
    expect(TeamSchema.safeParse([member, { ...member, name: "" }]).success).toBe(
      false,
    );
  });
});
