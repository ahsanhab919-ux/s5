import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import ToolPageShell from "./ToolPageShell";

afterEach(() => {
  cleanup();
});

describe("ToolPageShell", () => {
  it("renders the loading state and not the children", () => {
    render(
      <ToolPageShell loading>
        <div>content</div>
      </ToolPageShell>,
    );
    expect(screen.getByText(/loading…/i)).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  it("renders the error state over children/empty", () => {
    render(
      <ToolPageShell error="Something broke" empty={<div>empty</div>}>
        <div>content</div>
      </ToolPageShell>,
    );
    expect(screen.getByText("Something broke")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
    expect(screen.queryByText("empty")).toBeNull();
  });

  it("renders the empty node when provided and not loading/error", () => {
    render(
      <ToolPageShell empty={<div>nothing here</div>}>
        <div>content</div>
      </ToolPageShell>,
    );
    expect(screen.getByText("nothing here")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  it("renders children in the default state", () => {
    render(
      <ToolPageShell>
        <div>content</div>
      </ToolPageShell>,
    );
    expect(screen.getByText("content")).toBeTruthy();
  });
});
