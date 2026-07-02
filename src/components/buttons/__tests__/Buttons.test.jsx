import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ButtonCopyText from '../ButtonCopyText';
import ButtonDownloadText from '../ButtonDownloadText';

afterEach(() => {
  cleanup();
});

// Mock imports
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('../tools/common/downloadfile', () => ({
  downloadFile: vi.fn().mockResolvedValue(true),
}));

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(true),
  },
});

// Mock Tooltip UI component to avoid Radix UI complexity in JSDOM
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }) => <div>{children}</div>,
  TooltipContent: ({ children }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }) => <div>{children}</div>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check" />,
  Copy: () => <span data-testid="icon-copy" />,
  Download: () => <span data-testid="icon-download" />,
}));

describe('ButtonCopyText', () => {
  it('renders with correct aria-label', () => {
    render(<ButtonCopyText text="Hello World" />);
    const button = screen.getByRole('button', { name: /copy text/i });
    expect(button).toBeTruthy();
  });

  it('renders tooltip content', () => {
    render(<ButtonCopyText text="Hello World" />);
    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip.textContent).toBe('Copy text');
  });

  it('changes state on click', async () => {
    render(<ButtonCopyText text="Hello World" />);
    const button = screen.getByRole('button', { name: /copy text/i });

    await fireEvent.click(button);

    // Expect clipboard write
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello World');

    // The aria-label should update to "Copied"
    const copiedButton = await screen.findByRole('button', { name: /copied/i });
    expect(copiedButton).toBeTruthy();

    // Tooltip text should update
    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip.textContent).toBe('Copied!');
  });
});

describe('ButtonDownloadText', () => {
  it('renders with correct aria-label', () => {
    render(<ButtonDownloadText text="Hello World" name="test.txt" />);
    const button = screen.getByRole('button', { name: /download text/i });
    expect(button).toBeTruthy();
  });

  it('renders tooltip content', () => {
    render(<ButtonDownloadText text="Hello World" name="test.txt" />);
    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip.textContent).toBe('Download text');
  });
});
