"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Palette } from "lucide-react";

/**
 * SpecExtractorLog Component
 *
 * Displays presentation spec extractor agent logs with:
 * - Color theme indicator
 * - Tags/topics organized in a clean grid
 * - Dark theme styling matching reference designs
 */
export default function SpecExtractorLog({ log }) {
  const colorTheme = log?.colorTheme || "#1E3A8A";
  const allTags = Array.isArray(log?.tags) ? log.tags : [];
  const timestamp = log?.timestamp || log?.lastUpdated;

  // Show only first 5 tags, calculate remaining count
  const MAX_VISIBLE_TAGS = 5;
  const visibleTags = allTags.slice(0, MAX_VISIBLE_TAGS);
  const remainingCount = allTags.length - MAX_VISIBLE_TAGS;

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
          <FileText className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-xs font-medium">
            Using Tool |
          </span>
          <span className="text-foreground text-xs font-semibold">
            Specification Extractor
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
              <Palette className="text-muted-foreground h-4 w-4" />
              <span className="text-foreground text-sm font-semibold">
                Content Topics Identified
              </span>
            </div>

            {/* Color theme indicator with label */}
            {colorTheme && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                  Theme Color
                </span>
                <div
                  className="border-border/50 h-5 w-5 rounded-full border-2 shadow-sm"
                  style={{ backgroundColor: colorTheme }}
                  title={`Color Theme: ${colorTheme}`}
                />
              </div>
            )}
          </div>

          {/* Card content */}
          <div className="p-4">
            {/* Summary text */}
            <div className="mb-4">
              <p className="text-muted-foreground text-xs">
                {allTags.length > 0
                  ? `Identified ${allTags.length} content topics and focus areas for your presentation`
                  : "No content topics identified"}
              </p>
            </div>

            {/* Tags grid - show first 5 tags + "more" indicator */}
            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {visibleTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={cn(
                      "text-foreground/80 border-border/60 bg-background/90 text-xs font-normal",
                      "hover:bg-muted/50 hover:border-border transition-all duration-200",
                      "cursor-default px-3 py-1.5",
                    )}
                  >
                    {tag}
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-muted-foreground border-border/60 bg-muted/30 text-xs font-medium",
                      "cursor-default px-3 py-1.5",
                    )}
                  >
                    + {remainingCount}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground border-border/50 bg-muted/20 rounded-md border border-dashed p-4 text-center text-sm">
                <p className="italic">No content topics specified</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
