"use client";

import { MESSAGE_TYPES } from "@/utils/presentation/messageTypeClassifier.js";
import BrowserWorkerLog from "./BrowserWorkerLog";
import KeywordResearchLog from "./KeywordResearchLog";
import PlanningLog from "./PlanningLog";
import SlideGenerationLog from "./SlideGenerationLog";
import SpecExtractorLog from "./SpecExtractorLog";
import ToolCallLog from "./ToolCallLog";
import UserMessageLog from "./UserMessageLog";

/**
 * LogRouter Component
 *
 * Routes different log types to their specialized UI components.
 * This provides separation of concerns and allows each log type
 * to have its own tailored UI.
 */
export default function LogRouter({ log, onViewSummary, handlePreviewOpen }) {
  if (!log) return null;

  const messageType = log?.messageType || MESSAGE_TYPES.UNKNOWN;

  // Route to appropriate component based on messageType
  switch (messageType) {
    case MESSAGE_TYPES.USER:
      return <UserMessageLog log={log} />;

    case MESSAGE_TYPES.SPEC_EXTRACTOR:
      return <SpecExtractorLog log={log} />;

    case MESSAGE_TYPES.KEYWORD_RESEARCH:
      return <KeywordResearchLog log={log} />;

    case MESSAGE_TYPES.BROWSER_WORKER:
      return (
        <BrowserWorkerLog
          log={log}
          onViewSummary={onViewSummary}
          handlePreviewOpen={handlePreviewOpen}
        />
      );

    case MESSAGE_TYPES.PLANNING:
      return <PlanningLog log={log} />;

    case MESSAGE_TYPES.SLIDE_GENERATION:
      return <SlideGenerationLog log={log} />;

    case MESSAGE_TYPES.SLIDE_INSERTION_ORCHESTRATOR:
      return <SlideGenerationLog log={log} />;

    case MESSAGE_TYPES.SLIDE_ORCHESTRATION_AGENT:
      return <SlideGenerationLog log={log} />;

    case MESSAGE_TYPES.TOOL_CALL:
      return <ToolCallLog log={log} />;

    default:
      // Fallback for unknown log types
      return (
        <div className="mb-4 flex justify-start">
          <div className="max-w-[90%]">
            <div className="bg-secondary border-border rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">
                {log?.content || log?.text || log?.author || "Unknown log type"}
              </p>
              {log?.timestamp && (
                <p className="text-muted-foreground/50 mt-2 text-xs">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      );
  }
}
