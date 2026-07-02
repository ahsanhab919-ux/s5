"use client";

import ButtonCopyText from "@/components/buttons/ButtonCopyText";
import ButtonDownloadText from "@/components/buttons/ButtonDownloadText";
import { cn } from "@/lib/utils";
import { StickyNote } from "lucide-react";

const OutputActions = ({
  input = "",
  showSentenceCount = false,
  showDownload = false,
  showCopy = false,
  className,
}) => {
  const countSentence = (text) => {
    return text.split(/[.।]/).length - 1;
  };

  const buttons = [];

  if (showSentenceCount) {
    buttons.push(
      <div key="sentence-count" className="flex items-center gap-2 text-sm">
        <StickyNote className="size-5" />
        <span>{countSentence(input)} sentences</span>
      </div>,
    );
  }

  if (showDownload) {
    buttons.push(
      <ButtonDownloadText key="download" name="summary" text={input} />,
    );
  }

  if (showCopy) {
    buttons.push(<ButtonCopyText key="copy" text={input} />);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 px-4", className)}>
      {buttons.map((button, index) => (
        <div key={index} className="flex items-center gap-2">
          {button}
        </div>
      ))}
    </div>
  );
};

export default OutputActions;
