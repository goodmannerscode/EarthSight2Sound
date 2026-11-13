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

  const response = await fetch(`${API_BASE_URL}/api/feed?${query}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }

  return FeedResponseSchema.parse(await response.json());
};
