"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

/**
 * KeywordResearchLog Component
 *
 * Displays keyword research agent logs with:
 * - Keywords displayed as a bullet list
 * - Clean, readable format similar to reference designs
 * - Dark theme styling
 */
export default function KeywordResearchLog({ log }) {
  const keywords = Array.isArray(log?.keywords) ? log.keywords : [];
  const timestamp = log?.timestamp || log?.lastUpdated;

  // Format timestamp for display
  const timeFormatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const displayTime = timestamp
    ? timeFormatter.format(new Date(timestamp))
    : "";

  return (
    <div className="mb-6 flex justify-start">
      <div className="w-full sm:max-w-[90%] lg:max-w-full">
        {/* Header bar with tool indicator - matching reference design */}
        <div className="mb-3 flex items-center gap-2">
          <Search className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-xs font-medium">
            Using Tool |
          </span>
          <span className="text-foreground text-xs font-semibold">
            Keyword Research
          </span>
          {displayTime && (
            <>
              <span className="text-muted-foreground/50 mx-1">•</span>
              <span className="text-muted-foreground text-[11px]">
                {displayTime}
              </span>
            </>
          )}
        </div>

        {/* Main content container - dark theme card */}
        <div className="border-border bg-card rounded-lg border shadow-sm">
          {/* Card header */}
          <div className="border-border bg-muted/30 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Search className="text-muted-foreground h-4 w-4" />
              <span className="text-foreground text-sm font-semibold">
                Research Keywords
              </span>
            </div>
          </div>

          {/* Card content */}
          <div className="p-4">
            {/* Summary text */}
            <div className="mb-4">
              <p className="text-muted-foreground text-xs">
                {keywords.length > 0
                  ? `Identified ${keywords.length} research keywords for content discovery`
                  : "No keywords identified"}
              </p>
            </div>

            {/* Keywords bullet list */}
            {keywords.length > 0 ? (
              <ul className="space-y-2">
                {keywords.map((keyword, index) => (
                  <li
                    key={index}
                    className={cn(
                      "flex items-start gap-3 text-sm leading-relaxed",
                      "text-foreground/90",
                    )}
                  >
                    {/* Bullet point */}
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        "bg-foreground/40",
                      )}
                    />
                    {/* Keyword text */}
                    <span className="flex-1">{keyword}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground border-border/50 bg-muted/20 rounded-md border border-dashed p-4 text-center text-sm">
                <p className="italic">No keywords identified</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
