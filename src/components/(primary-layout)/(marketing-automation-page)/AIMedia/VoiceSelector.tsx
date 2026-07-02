import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2, Mic, Pause, Play, Volume2, X } from "lucide-react";
import { useState } from "react";

interface Voice {
  voice_id: string;
  voice_name: string;
  preview_audio_url?: string;
  gender?: string;
  age?: string;
  accent?: string;
}

interface GroupedVoices {
  [gender: string]: Voice[];
}

interface VoiceSelectorProps {
  selectedVoice: string;
  groupedVoices: GroupedVoices | null;
  loadingVoices: boolean;
  genderFilter: "male" | "female" | "non_binary";
  playingAudio: string | null;
  onVoiceSelect: (voiceId: string) => void;
  onGenderFilterChange: (gender: "male" | "female" | "non_binary") => void;
  onPlayAudio: (voiceId: string, audioUrl: string) => void;
  onStopAudio: () => void;
  getSelectedVoiceName: () => string;
}

export default function VoiceSelector({
  selectedVoice,
  groupedVoices,
  loadingVoices,
  genderFilter,
  playingAudio,
  onVoiceSelect,
  onGenderFilterChange,
  onPlayAudio,
  onStopAudio,
  getSelectedVoiceName,
}: VoiceSelectorProps) {
  const [showVoiceSelection, setShowVoiceSelection] = useState(false);
  const [showVoiceEmotion, setShowVoiceEmotion] = useState(false);

  return (
    <Card className="rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Voice</span>
        {loadingVoices && (
          <Loader2 className="text-primary h-4 w-4 animate-spin" />
        )}
      </div>

      <Button
        onClick={() => setShowVoiceSelection(!showVoiceSelection)}
        variant="outline"
        className="mb-3 flex w-full items-center justify-between"
      >
        <span className="truncate">{getSelectedVoiceName()}</span>
        <Mic className="ml-2 h-4 w-4 shrink-0" />
      </Button>

      {/* <Button
        onClick={() => setShowVoiceEmotion(!showVoiceEmotion)}
        variant="outline"
        className="flex w-full items-center justify-between"
      >
        <span>Voice emotion</span>
        <svg
          className={cn(
            "h-4 w-4 transition-transform",
            showVoiceEmotion && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button> */}

      {/* {showVoiceEmotion && ( */}
      <Card className="bg-muted/50 text-foreground mt-3 p-3 text-sm">
        <p>
          When drafting your script, you must incorporate emotional tags using
          square brackets, such as [calmly], [suspiciously], or [GASPING],
          immediately preceding a character's dialogue or action to clearly
          communicate the necessary tone, intensity, and feeling for the
          performance; capitalize the tag (e.g., [EXCITED]) to denote a strong,
          high-intensity emotion.
        </p>
      </Card>
      {/* )} */}

      {/* Voice Selection Modal */}
      <Dialog open={showVoiceSelection} onOpenChange={setShowVoiceSelection}>
        <DialogContent className="flex max-h-[80vh]! w-full! max-w-4xl! flex-col overflow-hidden">
          <DialogHeader>
            <div className="mb-4 flex items-center justify-between">
              <DialogTitle>Select Voice</DialogTitle>
              <Button
                onClick={() => setShowVoiceSelection(false)}
                variant="ghost"
                size="icon"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex gap-2">
              {["male", "female", "non_binary"].map((gender) => (
                <Button
                  key={gender}
                  onClick={() =>
                    onGenderFilterChange(
                      gender as "male" | "female" | "non_binary",
                    )
                  }
                  variant={genderFilter === gender ? "default" : "outline"}
                  className="text-sm"
                >
                  {gender === "non_binary"
                    ? "Non-Binary"
                    : gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Button>
              ))}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {loadingVoices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
              </div>
            ) : !groupedVoices ||
              !groupedVoices[genderFilter] ||
              groupedVoices[genderFilter].length === 0 ? (
              <div className="text-muted-foreground flex items-center justify-center py-12">
                <p>No voices available for {genderFilter} category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {groupedVoices[genderFilter].map((voice) => (
                  <Card
                    key={voice.voice_id}
                    className={cn(
                      "cursor-pointer border-2 p-4 transition-all",
                      selectedVoice === voice.voice_id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50",
                    )}
                    onClick={() => {
                      onVoiceSelect(voice.voice_id);
                      setShowVoiceSelection(false);
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="text-primary h-4 w-4" />
                        <span className="text-foreground font-medium">
                          {voice.voice_name}
                        </span>
                      </div>
                      {voice.preview_audio_url && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playingAudio === voice.voice_id) {
                              onStopAudio();
                            } else {
                              onPlayAudio(
                                voice.voice_id,
                                voice.preview_audio_url!,
                              );
                            }
                          }}
                          variant="ghost"
                          size="icon-sm"
                        >
                          {playingAudio === voice.voice_id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="text-muted-foreground flex gap-2 text-xs">
                      {voice.age && (
                        <span className="bg-muted rounded px-2 py-1">
                          {voice.age}
                        </span>
                      )}
                      {voice.accent && (
                        <span className="bg-muted rounded px-2 py-1">
                          {voice.accent}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
