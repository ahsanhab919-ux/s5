import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import ReEducatorPanel from "./ReEducatorPanel";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * A minimal successful envelope from POST /api/re-educator (review mode), with
 * one applied edit and one author-required issue, and a changed text so the
 * confirm-diff surfaces.
 */
function reviewEnvelope() {
  return {
    mode: "review",
    runId: "run_1",
    chain: { valid: true, entryCount: 1, headHash: "h" },
    result: {
      text: "The improved manuscript.",
      summary: {
        total: 2,
        applied: 1,
        proposed: 0,
        authorRequired: 1,
        revertedRequeued: 0,
      },
      gates: { hasAppliedToConfirm: true, hasReviewQueue: true },
      panel: {
        applied: [
          {
            issue: {
              category: "readability",
              severity: "low",
              rationale: "Sentence was hard to read.",
              text: "orig",
            },
            verdict: "auto-fixable",
            disposition: "applied",
            edit: { before: "the manuscript", after: "improved manuscript", reason: "clarity" },
          },
        ],
        proposed: [],
        authorRequired: [
          {
            issue: {
              category: "claim",
              severity: "high",
              rationale: "This is a factual claim — verify it yourself.",
              text: "50% growth",
            },
            verdict: "author-required",
            disposition: "author-required",
          },
        ],
        revertedRequeued: [],
      },
    },
  };
}

function mockFetchOnce(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("ReEducatorPanel", () => {
  beforeEach(() => {
    // default: harmless fetch so accidental calls don't reject
    mockFetchOnce(200, reviewEnvelope());
  });

  it("renders the modes and the run button", () => {
    render(<ReEducatorPanel />);
    expect(screen.getByRole("button", { name: /run re-educator/i })).toBeTruthy();
    expect(screen.getByText("Review")).toBeTruthy();
    expect(screen.getByText("Paraphrase")).toBeTruthy();
    expect(screen.getByText("Auto")).toBeTruthy();
    expect(screen.getByText("Nudge")).toBeTruthy();
  });

  it("seeds the textarea from initialText", () => {
    render(<ReEducatorPanel initialText="seeded text" />);
    const ta = screen.getByPlaceholderText(/paste the text/i) as HTMLTextAreaElement;
    expect(ta.value).toBe("seeded text");
  });

  it("blocks an empty run with a validation message and does not fetch", async () => {
    const fetchFn = mockFetchOnce(200, reviewEnvelope());
    render(<ReEducatorPanel initialText="" />);
    fireEvent.click(screen.getByRole("button", { name: /run re-educator/i }));
    await screen.findByText(/enter some text/i);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("steers nudge mode to Review instead of sending an invalid request", async () => {
    const fetchFn = mockFetchOnce(200, reviewEnvelope());
    render(<ReEducatorPanel initialText="hello world" />);
    fireEvent.click(screen.getByText("Nudge"));
    fireEvent.click(screen.getByRole("button", { name: /run re-educator/i }));
    await screen.findByText(/nudge needs a selected span/i);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("runs review, renders grouped issues + summary, and posts the right body", async () => {
    const fetchFn = mockFetchOnce(200, reviewEnvelope());
    render(<ReEducatorPanel initialText="the manuscript" />);
    fireEvent.click(screen.getByRole("button", { name: /run re-educator/i }));

    await screen.findByText(/applied \(1\)/i);
    expect(screen.getByText(/author required \(1\)/i)).toBeTruthy();
    expect(screen.getByText("readability")).toBeTruthy();
    expect(screen.getByText("claim")).toBeTruthy();
    // rationale text renders
    expect(screen.getByText(/this is a factual claim/i)).toBeTruthy();

    // Verify request contract
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchFn.mock.calls[0];
    expect(url).toBe("/api/re-educator");
    expect(opts.method).toBe("POST");
    const sent = JSON.parse(opts.body);
    expect(sent.text).toBe("the manuscript");
    expect(sent.mode).toBe("review");
  });

  it("shows a confirmable diff and applies the revised text on accept", async () => {
    mockFetchOnce(200, reviewEnvelope());
    const onAccept = vi.fn();
    render(<ReEducatorPanel initialText="the manuscript" onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: /run re-educator/i }));

    // DiffPreview renders "Review Changes" with an Accept button.
    await screen.findByText(/review changes/i);
    const ta = screen.getByPlaceholderText(/paste the text/i) as HTMLTextAreaElement;
    expect(ta.value).toBe("the manuscript");

    fireEvent.click(screen.getByRole("button", { name: /accept/i }));
    await waitFor(() => expect(onAccept).toHaveBeenCalledWith("The improved manuscript."));
    expect(ta.value).toBe("The improved manuscript.");
  });

  it("surfaces a 401 with a sign-in prompt", async () => {
    mockFetchOnce(401, { error: "Unauthorized" });
    render(<ReEducatorPanel initialText="hello" />);
    fireEvent.click(screen.getByRole("button", { name: /run re-educator/i }));
    await screen.findByText(/please sign in/i);
  });

  it("surfaces a 400 with the server error message", async () => {
    mockFetchOnce(400, { error: "Body must include a string \"text\" field." });
    render(<ReEducatorPanel initialText="hello" />);
    fireEvent.click(screen.getByRole("button", { name: /run re-educator/i }));
    await screen.findByText(/body must include a string/i);
  });

  it("sends a non-opt-in auto object and renders the refusal reason", async () => {
    const refusal = {
      mode: "auto",
      runId: "run_2",
      chain: { valid: true, entryCount: 0, headHash: "g" },
      result: {
        status: "refused",
        stopReason: "refused-no-optin",
        text: "hello",
        rounds: 0,
        queued: [],
        reason: "Auto refused: no explicit opt-in.",
      },
    };
    const fetchFn = mockFetchOnce(200, refusal);
    render(<ReEducatorPanel initialText="hello" />);
    fireEvent.click(screen.getByText("Auto"));
    fireEvent.click(screen.getByRole("button", { name: /run re-educator/i }));

    await screen.findByText(/auto refused: no explicit opt-in/i);
    const sent = JSON.parse(fetchFn.mock.calls[0][1].body);
    expect(sent.mode).toBe("auto");
    expect(sent.auto).toEqual({ optIn: false, authorization: null });
  });
});
