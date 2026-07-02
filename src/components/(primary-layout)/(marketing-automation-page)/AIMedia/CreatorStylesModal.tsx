import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PersonaStyle {
  id: string;
  gender: string;
  age_range: string;
  location: string;
  style: string;
  creator_name: string;
  video_scene: string;
  preview_image_9_16: string;
  portrait_preview_video: string;
  is_active: boolean;
  type: string;
}

interface CreatorStylesModalProps {
  creatorName: string;
  onClose: () => void;
  onSelectStyle: (style: PersonaStyle) => void;
}

interface StyleCardProps {
  style: PersonaStyle;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function StyleCard({
  style,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: StyleCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch((error) => {
        });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered]);

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <Card className="relative mb-3 aspect-[3/4] overflow-hidden shadow-lg transition-transform hover:scale-105">
        <img
          src={style.preview_image_9_16}
          alt={`${style.creator_name} - ${style.video_scene}`}
          className={`h-full w-full object-cover transition-all duration-300 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        />
        <video
          ref={videoRef}
          src={style.portrait_preview_video}
          loop
          muted
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="absolute right-3 bottom-3 left-3">
          <div className="rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm">
            <p className="text-foreground truncate text-xs font-medium capitalize">
              {style.video_scene}
            </p>
            <p className="text-muted-foreground text-[10px] capitalize">
              {style.location} • {style.style}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CreatorStylesModal({
  creatorName,
  onClose,
  onSelectStyle,
}: CreatorStylesModalProps) {
  const [styles, setStyles] = useState<PersonaStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        setLoading(true);

        const { data: result } = await api.get(
          `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/avatars/creator/${encodeURIComponent(creatorName)}`,
        );

        // DEBUG: Log creator styles API response to check for date fields
        if (result.data && result.data.length > 0) {
        }
        if (result.success && result.data) {
          setStyles(result.data);
        }
      } catch (err: unknown) {
        console.error("Error fetching creator styles:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load styles";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, [creatorName]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh]! max-w-4xl! p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl">{creatorName}'s Styles</DialogTitle>
          <DialogDescription>
            {styles.length} style{styles.length !== 1 ? "s" : ""} available
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] px-6 pb-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <div className="py-12 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && styles.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {styles.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  isHovered={hoveredStyle === style.id}
                  onHover={() => setHoveredStyle(style.id)}
                  onLeave={() => setHoveredStyle(null)}
                  onClick={() => onSelectStyle(style)}
                />
              ))}
            </div>
          )}

          {!loading && !error && styles.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No styles found</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
