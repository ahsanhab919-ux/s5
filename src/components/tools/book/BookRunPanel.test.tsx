import React from "react";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import BookRunPanel from "./BookRunPanel";
import type { BookStatus } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** A controlled harness so status changes drive the polling effect like the parent. */
function Harness({ initial }: { initial: BookStatus }) {
  const [status, setStatus] = React.useState<BookStatus>(initial);
  const [provider, setProvider] = React.useState<"openai" | "anthropic">("openai");
  const [reloads, setReloads] = React.useState(0);
  return (
    <div>
      <span data-testid="reloads">{reloads}</span>
      <BookRunPanel
        bookId="b1"
        status={status}
        provider={provider}
        onProviderChange={setProvider}
        onStatusChange={setStatus}
        onChaptersMaybeChanged={() => setReloads((n) => n + 1)}
      />
    </div>
  );
}

describe("BookRunPanel", () => {
  it("runs from draft: POSTs /run, transitions to authoring, and begins polling", async () => {
    const fetchMock = vi.fn(async (url: string, opts?: RequestInit) => {
      const method = (opts?.method || "GET").toUpperCase();
      if (url.endsWith("/run") && method === "POST") {
        return { ok: true, status: 202, json: async () => ({ bookId: "b1", status: "authoring" }) } as Response;
      }
      // status poll
      return {
        ok: true,
        status: 200,
        json: async () => ({
          bookId: "b1",
          status: "authoring",
          progress: { total: 2, accepted: 1, failed: 0, lastIndex: 0, perIndex: [{ index: 0, status: "accepted", attempt: 1 }] },
        }),
      } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<Harness initial="draft" />);
    fireEvent.click(screen.getByRole("button", { name: /run/i }));

    // After 202 it shows the authoring state and polls (progress rollup appears).
    await screen.findByText(/authoring… polling/i);
    await waitFor(() => expect(screen.getByText(/1\/2 accepted/i)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith("/api/book/b1/run", expect.objectContaining({ method: "POST" }));
  });

  it("stops polling and reloads chapters when the run reaches a terminal status", async () => {
    vi.useFakeTimers();
    let polls = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/status")) {
        polls += 1;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            bookId: "b1",
            status: "complete", // terminal on the first poll
            progress: { total: 1, accepted: 1, failed: 0, lastIndex: 0, perIndex: [{ index: 0, status: "accepted", attempt: 1 }] },
          }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<Harness initial="authoring" />);

    // Flush the immediate poll.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    const pollsAfterFirst = polls;
    expect(pollsAfterFirst).toBeGreaterThanOrEqual(1);

    // Terminal status lifts up → the interval is torn down. Advancing time does
    // NOT produce more polls (no leaked timer).
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });
    expect(polls).toBe(pollsAfterFirst);
    // Chapters were reloaded on the terminal transition.
    expect(screen.getByTestId("reloads").textContent).toBe("1");
  });

  it("disables Run when not draft and Reset when draft", () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) } as Response)) as unknown as typeof fetch;
    const { rerender } = render(<Harness initial="draft" />);
    expect((screen.getByRole("button", { name: /^run$/i }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: /reset/i }) as HTMLButtonElement).disabled).toBe(true);

    cleanup();
    render(<Harness initial="complete" />);
    expect((screen.getByRole("button", { name: /^run$/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /reset/i }) as HTMLButtonElement).disabled).toBe(false);
  });
});
