"use client";

import { Presentation } from "lucide-react";
import BrowserWorkerMarkdown from "../BrowserWorkerMarkdown";

/**
 * SlideGenerationLog Component
 *
 * Displays lightweight slide generation logs in a chat bubble format.
 * Similar to UserMessageLog but aligned to the left side (agent messages).
 * Supports markdown rendering for slide_orchestration_agent and slide_insertion_orchestrator.
 */
export default function SlideGenerationLog({ log }) {
  const timeFormatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const displayTime = log?.timestamp || log?.lastUpdated;
  const content = log?.text || log?.content || "";
  const hasMarkdown = log?.hasMarkdown || false;

  return (
    <div className="mb-6 flex justify-start">
      <div className="max-w-[80%]">
        {/* Header with timestamp and agent indicator */}
        <div className="mb-1.5 flex items-center gap-2 opacity-70">
          <div className="bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
            <Presentation className="text-muted-foreground h-3 w-3" />
          </div>
          <span className="text-muted-foreground text-xs">Assistant</span>
          {displayTime && (
            <>
              <span className="text-muted-foreground text-[11px]">
                {timeFormatter.format(new Date(displayTime))}
              </span>
            </>
          )}
        </div>

        {/* Message bubble - left aligned with different border radius */}
        <div className="rounded-t-[18px] rounded-br-[18px] rounded-bl-[4px] px-4 py-0 wrap-break-word sm:py-3">
          {hasMarkdown ? (
            <div className="text-foreground [&_*]:text-foreground text-sm leading-[1.5] md:text-base">
              <BrowserWorkerMarkdown content={content} />
            </div>
          ) : (
            <span className="text-foreground text-sm leading-[1.5] md:text-base">
              {content}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
