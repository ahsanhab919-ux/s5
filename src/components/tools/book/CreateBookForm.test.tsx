import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import CreateBookForm from "./CreateBookForm";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CreateBookForm", () => {
  it("validates required title/document before calling the API", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const onCreated = vi.fn();
    render(<CreateBookForm onCreated={onCreated} />);

    fireEvent.click(screen.getByRole("button", { name: /create book/i }));
    await screen.findByText(/title is required/i);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("POSTs a valid book and hands the created book to the parent", async () => {
    const created = { _id: "b1", title: "My Book", kind: "fiction", status: "draft", plan: [] };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ book: created }),
    } as Response));
    global.fetch = fetchMock as unknown as typeof fetch;
    const onCreated = vi.fn();
    render(<CreateBookForm onCreated={onCreated} />);

    fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: "My Book" } });
    fireEvent.change(screen.getByLabelText(/source document/i), { target: { value: "# Chapter 1\ntext" } });
    fireEvent.click(screen.getByRole("button", { name: /create book/i }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[1].method).toBe("POST");
    await screen.findByText(/book created/i);
  });

  it("surfaces a 400 error from the API", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: "Body must include a non-empty \"document\"." }),
    } as Response));
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<CreateBookForm onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: "T" } });
    fireEvent.change(screen.getByLabelText(/source document/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /create book/i }));

    await screen.findByText(/non-empty/i);
  });
});
