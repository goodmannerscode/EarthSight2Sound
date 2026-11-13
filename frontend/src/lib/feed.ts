import {
  DEFAULT_PAGE_SIZE,
  FeedResponseSchema,
  type FeedResponse,
} from "@es2s/shared";
import { API_BASE_URL, ApiError } from "@/lib/api";

const readError = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // fall through to the generic message
  }
  return `Request failed with status ${response.status}`;
};

export const fetchFeed = async (
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<FeedResponse> => {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/feed?${query}`, {
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, "The feed service is unreachable");
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }

  const parsed = FeedResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ApiError(502, "The feed service returned an unexpected payload");
  }

  return parsed.data;
};
