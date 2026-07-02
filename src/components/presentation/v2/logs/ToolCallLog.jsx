"use client";

import { getToolCallAgentDisplayName } from "@/utils/presentation/messageTypeClassifier.js.js";
import { Wrench } from "lucide-react";

/**
 * ToolCallLog Component
 *
 * Displays tool call agent logs with:
 * - Tool indicator header (matching reference design)
 * - Agent name and action text
 * - Clean, minimal card design
 * - Consistent with other tool logs
 */
export default function ToolCallLog({ log }) {
  try {
    const agentName = log?.author || "";
    const toolCallText = log?.text || log?.content || "";
    const timestamp = log?.timestamp || log?.lastUpdated;
    const displayName = getToolCallAgentDisplayName(agentName);

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
          {/* Main content container - minimal card design */}
          <div className="sm:bg-card flex flex-col justify-between gap-2 rounded-lg sm:flex-row sm:items-center sm:gap-5 sm:px-4 sm:py-3 lg:flex-wrap">
            {/* Header bar with tool indicator - matching reference design */}
            <div className="xs:mb-3 flex items-center gap-2 sm:mb-0">
              <Wrench className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-xs font-medium">
                Using Tool |
              </span>
              <span className="text-foreground text-xs font-semibold">
                {displayName}
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
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm leading-relaxed capitalize">
                {toolCallText}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("[ToolCallLog] Error rendering:", error);
    // Fallback UI
    return (
      <div className="mb-6 flex justify-start">
        <div className="w-full max-w-[90%]">
          <div className="border-border bg-card rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              Error displaying tool call log
            </p>
          </div>
        </div>
      </div>
    );
  }
}
