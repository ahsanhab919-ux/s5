import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PenTool } from "lucide-react";

interface Ad {
  id: string;
  projectId: string;
  headline: string;
  primaryText: string;
  description: string;
  format: string;
}

interface ScriptEditorProps {
  script: string;
  setScript: (script: string) => void;
  userAds: Ad[];
  selectedAd: string;
  loadingAds: boolean;
  generating: boolean;
  onAdSelect: (adId: string) => void;
  onTrySample: () => void;
  onUseScriptWriter: () => void;
  maxChars?: number;
}

export default function ScriptEditor({
  script,
  setScript,
  userAds,
  selectedAd,
  loadingAds,
  generating,
  onAdSelect,
  onTrySample,
  onUseScriptWriter,
  maxChars = 7000,
}: ScriptEditorProps) {
  return (
    <div className="xs:mb-5 mb-4 sm:mb-6">
      <div className="xs:mb-3 xs:gap-3 mb-2 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="xs:gap-2 flex items-center gap-1.5">
          <h2 className="text-foreground xs:text-lg text-base font-semibold sm:text-xl">
            Script
          </h2>
        </div>
        <div className="xs:gap-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <Select
            value={selectedAd}
            onValueChange={onAdSelect}
            disabled={loadingAds}
          >
            <SelectTrigger className="xs:h-9 xs:text-sm h-8 w-full text-xs sm:w-[200px]">
              <SelectValue placeholder="Select from ads" />
            </SelectTrigger>
            <SelectContent>
              {userAds.map((ad) => (
                <SelectItem
                  key={ad.id}
                  value={ad.id}
                  className="xs:text-sm text-xs"
                >
                  {ad.headline.slice(0, 30)}
                  {ad.headline.length > 30 ? "..." : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={onUseScriptWriter}
            disabled={generating || !selectedAd}
            size="sm"
            className="xs:h-9 xs:gap-2 xs:text-sm flex h-8 w-full items-center justify-center gap-1.5 text-xs sm:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="xs:h-4 xs:w-4 h-3.5 w-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <PenTool className="xs:h-4 xs:w-4 h-3.5 w-3.5" />
                <span>Script writer</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <Textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Enter your script here..."
        className="xs:h-56 xs:text-sm h-48 w-full resize-none text-xs sm:h-64"
        maxLength={maxChars}
      />

      <div className="xs:mt-2 mt-1.5 flex justify-end">
        <span className="text-muted-foreground xs:text-xs text-[10px] sm:text-sm">
          {script.length}/{maxChars}
        </span>
      </div>
    </div>
  );
}
