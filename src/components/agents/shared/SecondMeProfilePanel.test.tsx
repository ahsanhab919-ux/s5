import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import SecondMeProfilePanel from "./SecondMeProfilePanel";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** A profile snapshot from GET /api/second-me/profile. */
function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    identity: { keyId: "abc123def456", publicKey: "PUB", revoked: false, lettaAgentId: "agent-1" },
    skillProfile: { personas: ["writer"], defaultPersona: "writer", focusAreas: ["sci-fi"] },
    reputation: { userId: "u1", karma: 120, reviewCount: 3, helpfulnessScore: 0, level: 1 },
    keys: [{ userId: "u1", purpose: "byok:openai", provider: "openai", present: true }],
    personas: ["student", "writer", "executive"],
    ...overrides,
  };
}

/**
 * Route the panel's several fetch calls by URL + method. GET returns the
 * snapshot; PUT/POST/DELETE return their success bodies. Lets a test assert on
 * exactly the request it cares about.
 */
function mockRoutes(handlers: {
  get?: () => { status: number; body: unknown };
  put?: () => { status: number; body: unknown };
  post?: () => { status: number; body: unknown };
  del?: () => { status: number; body: unknown };
}) {
  const fn = vi.fn(async (url: string, opts?: RequestInit) => {
    const method = (opts?.method || "GET").toUpperCase();
    let h;
    if (method === "GET") h = handlers.get?.();
    else if (method === "PUT") h = handlers.put?.();
    else if (method === "POST") h = handlers.post?.();
    else if (method === "DELETE") h = handlers.del?.();
    const { status, body } = h || { status: 200, body: {} };
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("SecondMeProfilePanel", () => {
  it("loads the snapshot and renders identity, personas, reputation, and stored keys", async () => {
    mockRoutes({ get: () => ({ status: 200, body: snapshot() }) });
    render(<SecondMeProfilePanel />);

    await screen.findByText(/second me profile/i);
    expect(screen.getByText(/abc123def456/)).toBeTruthy();
    expect(screen.getByText(/active/i)).toBeTruthy();
    expect(screen.getByText(/level 1/i)).toBeTruthy();
    expect(screen.getByText(/120 karma/i)).toBeTruthy();
    // stored key shows presence only, never a key value
    expect(screen.getByText(/openai · stored/i)).toBeTruthy();
    // persona buttons render
    expect(screen.getByRole("button", { name: "Writer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Student" })).toBeTruthy();
  });

  it("shows a not-set-up message when identity is null", async () => {
    mockRoutes({ get: () => ({ status: 200, body: snapshot({ identity: null }) }) });
    render(<SecondMeProfilePanel />);
    await screen.findByText(/not set up yet/i);
  });

  it("surfaces a 401 on load with a sign-in prompt", async () => {
    mockRoutes({ get: () => ({ status: 401, body: { error: "Unauthorized" } }) });
    render(<SecondMeProfilePanel />);
    await screen.findByText(/please sign in to view/i);
  });

  it("saves the skill profile with the edited personas + default + focus areas", async () => {
    const fn = mockRoutes({
      get: () => ({ status: 200, body: snapshot() }),
      put: () => ({
        status: 200,
        body: {
          skillProfile: {
            personas: ["writer", "executive"],
            defaultPersona: "writer",
            focusAreas: ["sci-fi"],
          },
        },
      }),
    });
    render(<SecondMeProfilePanel />);
    await screen.findByText(/second me profile/i);

    // enable a second persona, then save
    fireEvent.click(screen.getByRole("button", { name: "Executive" }));
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await screen.findByText(/profile saved/i);
    const putCall = fn.mock.calls.find((c) => (c[1]?.method || "").toUpperCase() === "PUT");
    expect(putCall).toBeTruthy();
    const sent = JSON.parse((putCall![1] as RequestInit).body as string);
    expect(sent.personas).toContain("writer");
    expect(sent.personas).toContain("executive");
    expect(sent.defaultPersona).toBe("writer");
  });

  it("blocks a save with no personas selected and does not PUT", async () => {
    const fn = mockRoutes({ get: () => ({ status: 200, body: snapshot() }) });
    render(<SecondMeProfilePanel />);
    await screen.findByText(/second me profile/i);

    // turn off the only enabled persona (writer), then attempt save
    fireEvent.click(screen.getByRole("button", { name: "Writer" }));
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await screen.findByText(/pick at least one persona/i);
    expect(fn.mock.calls.some((c) => (c[1]?.method || "").toUpperCase() === "PUT")).toBe(false);
  });

  it("surfaces the server 400 message when the profile is invalid", async () => {
    mockRoutes({
      get: () => ({ status: 200, body: snapshot() }),
      put: () => ({ status: 400, body: { error: "Unknown persona \"wizard\"" } }),
    });
    render(<SecondMeProfilePanel />);
    await screen.findByText(/second me profile/i);
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));
    await screen.findByText(/unknown persona/i);
  });

  it("stores a key via the x-second-me-key header and never keeps it in the body", async () => {
    const fn = mockRoutes({
      get: () => ({ status: 200, body: snapshot({ keys: [] }) }),
      post: () => ({ status: 200, body: { key: { provider: "openai", present: true } } }),
    });
    render(<SecondMeProfilePanel />);
    await screen.findByText(/second me profile/i);

    fireEvent.change(screen.getByLabelText(/api key/i), { target: { value: "sk-secret-999" } });
    fireEvent.click(screen.getByRole("button", { name: /store key/i }));

    await screen.findByText(/key stored securely/i);
    const postCall = fn.mock.calls.find((c) => (c[1]?.method || "").toUpperCase() === "POST");
    expect(postCall).toBeTruthy();
    const opts = postCall![1] as RequestInit;
    // key rides in the header, NOT the body
    expect((opts.headers as Record<string, string>)["x-second-me-key"]).toBe("sk-secret-999");
    const sentBody = JSON.parse(opts.body as string);
    expect(sentBody.provider).toBe("openai");
    expect(JSON.stringify(sentBody)).not.toContain("sk-secret-999");
  });

  it("removes a stored key via DELETE", async () => {
    const fn = mockRoutes({
      get: () => ({ status: 200, body: snapshot() }),
      del: () => ({ status: 200, body: { removed: true } }),
    });
    render(<SecondMeProfilePanel />);
    await screen.findByText(/openai · stored/i);

    fireEvent.click(screen.getByRole("button", { name: /remove openai key/i }));
    await waitFor(() =>
      expect(fn.mock.calls.some((c) => (c[1]?.method || "").toUpperCase() === "DELETE")).toBe(true),
    );
    const delCall = fn.mock.calls.find((c) => (c[1]?.method || "").toUpperCase() === "DELETE");
    expect(JSON.parse((delCall![1] as RequestInit).body as string).provider).toBe("openai");
  });
});
