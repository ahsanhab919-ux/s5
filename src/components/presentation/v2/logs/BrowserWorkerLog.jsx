"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { cn } from "@/lib/utils";
import { FileText, Globe } from "lucide-react";
import Link from "next/link";

/**
 * BrowserWorkerLog Component
 *
 * Displays browser worker agent logs with:
 * - List of hyperlinked domains that open in new tabs
 * - "View" button to show markdown summary in PreviewPanel (desktop) or modal (mobile)
 * - Clean, readable format matching reference designs
 */
export default function BrowserWorkerLog({
  log,
  onViewSummary,
  handlePreviewOpen,
}) {
  const isMobile = useIsMobile();
  const links = Array.isArray(log?.links) ? log.links : [];
  const summary = log?.summary || "";
  const timestamp = log?.timestamp || log?.lastUpdated;
  const workerNumber = log?.workerNumber || null;

  // Format timestamp for display
  const timeFormatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const displayTime = timestamp
    ? timeFormatter.format(new Date(timestamp))
    : "";

  const hasSummary = !!summary;
  const hasLinks = links.length > 0;

  // Truncate URL for display while keeping it clickable
  const truncateUrl = (url, maxLength = 60) => {
    if (!url || url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  // Handle View button click - open modal on mobile, show summary on desktop
  const handleViewClick = () => {
    if (isMobile && handlePreviewOpen) {
      // On mobile: open the preview modal
      handlePreviewOpen();
    }
    // Always call onViewSummary to set the summary in the state
    // (needed for desktop to show in right panel, and for modal content)
    if (onViewSummary) {
      onViewSummary(log);
    }
  };

  return (
    <div className="mb-6 flex justify-start">
      <div className="w-full sm:max-w-[90%] lg:max-w-full">
        {/* Header bar with tool indicator and View button */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {hasSummary && onViewSummary ? (
              <FileText className="text-muted-foreground h-4 w-4" />
            ) : (
              <Spinner />
            )}
            <span className="text-muted-foreground text-xs font-medium">
              Using Tool |
            </span>
            <span className="text-foreground text-xs font-semibold">Read</span>
            {displayTime && (
              <>
                <span className="text-muted-foreground/50 mx-1">•</span>
                <span className="text-muted-foreground text-[11px]">
                  {displayTime}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Main content container - dark theme card */}
        <div className="border-border bg-card rounded-lg border shadow-sm">
          {/* Card header */}
          <div className="border-border bg-muted/30 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Globe className="text-muted-foreground h-4 w-4" />
              <span className="text-foreground text-sm font-semibold">
                Research Sources
              </span>
            </div>

            {/* View button - only show if summary exists */}
            {hasSummary && onViewSummary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewClick}
                className={cn(
                  "h-7 px-3 text-xs font-normal",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/50",
                )}
              >
                View
              </Button>
            )}
          </div>

          {/* Card content */}
          <div className="p-4">
            {/* Summary text */}
            <div className="mb-4">
              <p className="text-muted-foreground text-xs">
                {hasLinks
                  ? `Researched ${links.length} source${links.length !== 1 ? "s" : ""}`
                  : "No sources found"}
              </p>
            </div>

            {/* Links list */}
            {hasLinks ? (
              <ul className="space-y-2">
                {links.map((linkItem, index) => {
                  const url = linkItem?.url || "";
                  const domain = linkItem?.domain || "";
                  const displayUrl = domain || url || "";

                  if (!displayUrl) return null;

                  return (
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
                      {/* Link */}
                      <Link
                        href={url || `https://${domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "text-primary flex-1 truncate",
                          "transition-colors hover:underline",
                          "break-all",
                        )}
                        title={displayUrl}
                      >
                        {truncateUrl(displayUrl)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-muted-foreground border-border/50 bg-muted/20 rounded-md border border-dashed p-4 text-center text-sm">
                <p className="italic">No sources found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
