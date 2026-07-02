"use client";

import FileList from "@/components/common/FileList";
import { User } from "lucide-react";
import { useMemo } from "react";

/**
 * UserMessageLog Component
 *
 * Displays user messages in a chat bubble format with attached files
 */
export default function UserMessageLog({ log }) {
  const timeFormatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const displayTime = log?.timestamp || log?.lastUpdated;
  const content = log?.content || log?.text || "";

  // Transform file URLs for FileList component
  const transformedFiles = useMemo(() => {
    const fileUrls = log?.file_urls;
    if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
      return [];
    }

    return fileUrls.map((file) => ({
      filename: file.name || file.filename || "Unknown file",
      signed_url: file.url || file.signed_url || file.public_url || null,
    }));
  }, [log?.file_urls]);

  const hasFiles = transformedFiles.length > 0;

  return (
    <div className="mb-6 flex justify-end">
      <div className="w-full sm:w-fit sm:max-w-[90%]">
        {/* Header with timestamp and user indicator */}

        {/* FileList - Display attached files */}
        {hasFiles ? (
          <div className="mb-2 flex w-full items-end justify-end">
            <FileList
              files={transformedFiles}
              maxVisibleFiles={10}
              title="Attached Files"
              showHeader={true}
              truncateLength={14}
            />
          </div>
        ) : (
          <div className="mb-1.5 flex items-center justify-end gap-2 opacity-70">
            <span className="text-muted-foreground text-[11px]">
              {displayTime ? timeFormatter.format(new Date(displayTime)) : ""}
            </span>
            <span className="text-muted-foreground text-xs">You</span>
            <div className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
              <User className="text-primary-foreground h-3 w-3" />
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className="flex w-full justify-end">
          <div className="bg-primary w-fit rounded-t-[18px] rounded-br-[4px] rounded-bl-[18px] px-4 py-3 wrap-break-word">
            <span className="text-primary-foreground text-sm leading-[1.5] whitespace-pre-line md:text-base">
              {content}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
