import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  analyzePlagiarism,
  PlagiarismServiceError,
  QuotaExceededError,
  ServerUnavailableError,
  UnauthorizedError,
} from "../plagiarismService";

const buildFetchResponse = ({
  ok,
  status,
  json,
}: {
  ok: boolean;
  status: number;
  json: unknown;
}) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(json),
});

describe("plagiarismService", () => {
  const token = "test-token";
  const text = "Sample text to analyze.";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends request and normalizes successful response", async () => {
    const rawResponse = {
      overallSimilarity: 0.81,
      paraphrasedSections: [
        {
          text: "Excerpt",
          similarity: 0.5,
          startChar: 0,
          endChar: 20,
          sources: [
            {
              title: "Source Title",
              url: "https://example.com",
              snippet: "Snippet",
              matchType: "paraphrased",
              confidence: "HIGH",
              similarity: 0.75,
              isPlagiarism: true,
              reason: "Matched content",
            },
          ],
        },
      ],
      summary: {
        paraphrasedCount: 1,
        exactMatchCount: 0,
        riskLevel: "MEDIUM",
      },
      timestamp: "2025-11-09T00:00:00.000Z",
      hasPlagiarism: true,
      needsReview: true,
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch" as any)
      .mockResolvedValue(
        buildFetchResponse({ ok: true, status: 200, json: rawResponse }),
      );

    const result = await analyzePlagiarism({ text, token });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api-qa.shothik.ai/check/plagiarism/analyze",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }),
    );

    expect(result).toEqual({
      score: 81,
      riskLevel: "MEDIUM",
      analyzedAt: rawResponse.timestamp,
      sections: [
        {
          similarity: 50,
          excerpt: "Excerpt",
          span: { start: 0, end: 20 },
          sources: [
            {
              title: "Source Title",
              url: "https://example.com",
              snippet: "Snippet",
              matchType: "paraphrased",
              confidence: "high",
              similarity: 75,
              isPlagiarism: true,
              reason: "Matched content",
            },
          ],
        },
      ],
      summary: {
        paraphrasedCount: 1,
        paraphrasedPercentage: 81,
        exactMatchCount: 0,
      },
      flags: {
        hasPlagiarism: true,
        needsReview: true,
      },
    });
  });

  it("throws UnauthorizedError for 401 responses", async () => {
    vi.spyOn(globalThis, "fetch" as any).mockResolvedValue(
      buildFetchResponse({
        ok: false,
        status: 401,
        json: { message: "Unauthorized" },
      }),
    );

    await expect(analyzePlagiarism({ text, token })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("throws QuotaExceededError for 429 responses", async () => {
    vi.spyOn(globalThis, "fetch" as any).mockResolvedValue(
      buildFetchResponse({
        ok: false,
        status: 429,
        json: { message: "Too Many Requests" },
      }),
    );

    await expect(analyzePlagiarism({ text, token })).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
  });

  it("throws ServerUnavailableError for 500 responses", async () => {
    vi.spyOn(globalThis, "fetch" as any).mockResolvedValue(
      buildFetchResponse({
        ok: false,
        status: 503,
        json: { message: "Service Unavailable" },
      }),
    );

    await expect(analyzePlagiarism({ text, token })).rejects.toBeInstanceOf(
      ServerUnavailableError,
    );
  });

  it("throws validation error when text is empty", async () => {
    await expect(
      analyzePlagiarism({ text: "  ", token }),
    ).rejects.toBeInstanceOf(PlagiarismServiceError);
  });
});
