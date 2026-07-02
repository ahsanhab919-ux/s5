import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Ad } from "@/types/campaign";
import {
  ChevronLeft,
  ChevronRight,
  Facebook,
  Globe,
  Heart,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  Play,
  Send,
  Smartphone,
} from "lucide-react";

interface AdPreviewModalProps {
  previewAd: Ad | null;
  onClose: () => void;
}

export default function AdPreviewModal({
  previewAd,
  onClose,
}: AdPreviewModalProps) {
  if (!previewAd) return null;

  return (
    <Dialog open={!!previewAd} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto md:max-w-6xl md:w-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Ad Preview: {previewAd.headline}
          </DialogTitle>
        </DialogHeader>

        {/* Format and Placement Info */}
        <Card className="mb-2 p-4">
          <CardContent className="flex flex-wrap gap-4 p-0 text-sm">
            <div>
              <span className="text-muted-foreground">Format: </span>
              <span className="text-foreground font-semibold">
                {previewAd.format}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Placements: </span>
              <span className="text-foreground font-semibold">
                {previewAd.recommended_placements?.join(", ") || "Automatic"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Preview Grid */}
        <div className="grid max-h-[59vh] grid-cols-1 gap-6 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
          {/* Facebook Feed Preview */}
          {(previewAd.recommended_placements?.includes("FACEBOOK_FEED") ||
            previewAd.recommended_placements?.includes("AUTOMATIC") ||
            !previewAd.recommended_placements) && (
            <div className="flex flex-col space-y-2 self-stretch py-2">
              <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <span className="text-primary">
                  <Facebook size={20} />
                </span>
                Facebook Feed
              </h3>
              <Card className="flex flex-2 flex-col gap-0 overflow-hidden py-0 shadow-xl">
                {/* Facebook Header */}
                <CardContent className="border-b px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-full">
                      <span className="text-primary-foreground text-sm font-bold">
                        A
                      </span>
                    </div>
                    <div>
                      <div className="text-foreground text-sm font-semibold">
                        Sponsored
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        Sponsored · <Globe size={12} />
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Primary Text */}
                <CardContent className="text-foreground px-2 py-2 text-sm">
                  {previewAd.primary_text}
                </CardContent>

                {/* Image/Video Placeholder */}
                <div
                  className={`bg-primary text-primary-foreground flex flex-1 items-center justify-center font-bold ${
                    previewAd.format === "SHORT_VIDEO" ||
                    previewAd.format === "VIDEO"
                      ? "h-96"
                      : previewAd.format === "STORY"
                        ? "h-[500px]"
                        : "h-80"
                  }`}
                >
                  {previewAd.format === "CAROUSEL" ? (
                    <div className="flex items-center gap-4">
                      <ChevronLeft size={32} />
                      <span>CAROUSEL</span>
                      <ChevronRight size={32} />
                    </div>
                  ) : previewAd.format === "VIDEO" ||
                    previewAd.format === "LONG_VIDEO" ? (
                    <div className="text-center">
                      <Play size={48} className="mx-auto mb-2" />
                      <div>VIDEO</div>
                    </div>
                  ) : previewAd.format === "SHORT_VIDEO" ? (
                    <div className="text-center">
                      <Play size={48} className="mx-auto mb-2" />
                      <div>SHORT VIDEO</div>
                    </div>
                  ) : (
                    <div>IMAGE</div>
                  )}
                </div>

                {/* Headline and CTA */}
                <CardContent className="border-t p-3">
                  <div className="mb-1 text-sm font-semibold">
                    {previewAd.headline}
                  </div>
                  <div className="text-muted-foreground mb-2 text-xs">
                    {previewAd.description}
                  </div>
                  <Button className="w-full">
                    {previewAd.cta?.replace(/_/g, " ") || "Learn More"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Instagram Feed Preview */}
          {(previewAd.recommended_placements?.includes("INSTAGRAM_FEED") ||
            previewAd.recommended_placements?.includes("AUTOMATIC") ||
            !previewAd.recommended_placements) && (
            <div className="flex flex-col space-y-2 self-stretch py-2">
              <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <span className="text-primary">
                  <Instagram size={20} />
                </span>
                Instagram Feed
              </h3>
              <Card className="flex flex-2 flex-col gap-0 overflow-hidden py-0 shadow-xl">
                {/* Instagram Header */}
                <CardContent className="flex items-center justify-between border-b px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-full">
                      <span className="text-primary-foreground text-xs">A</span>
                    </div>
                    <div>
                      <div className="text-foreground text-sm font-semibold">
                        Sponsored
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        Sponsored · <Globe size={12} />
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    <MoreHorizontal size={20} />
                  </div>
                </CardContent>

                {/* Image/Video Placeholder */}
                <div
                  className={`bg-primary text-primary-foreground flex flex-1 items-center justify-center font-bold ${
                    previewAd.format === "SHORT_VIDEO" ||
                    previewAd.format === "VIDEO"
                      ? "h-96"
                      : "aspect-square"
                  }`}
                >
                  {previewAd.format === "CAROUSEL" ? (
                    <div>CAROUSEL 1/3</div>
                  ) : previewAd.format === "VIDEO" ||
                    previewAd.format === "LONG_VIDEO" ||
                    previewAd.format === "SHORT_VIDEO" ? (
                    <div className="text-center">
                      <Play size={48} className="mx-auto mb-2" />
                      <div>VIDEO</div>
                    </div>
                  ) : (
                    <div>IMAGE</div>
                  )}
                </div>

                {/* Instagram Actions */}
                <CardContent className="p-3">
                  <div className="mb-2 flex gap-4">
                    <Heart size={24} />
                    <MessageCircle size={24} />
                    <Send size={24} />
                  </div>
                  <div className="mb-1 text-sm font-semibold">
                    {previewAd.headline}
                  </div>
                  <div className="mb-2 text-sm">
                    {previewAd.primary_text?.substring(0, 100)}
                    {(previewAd.primary_text?.length || 0) > 100 && "... more"}
                  </div>
                  <Button className="w-full">
                    {previewAd.cta?.replace(/_/g, " ") || "Learn More"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stories Preview */}
          {(previewAd.recommended_placements?.includes("FACEBOOK_STORIES") ||
            previewAd.recommended_placements?.includes("INSTAGRAM_STORIES") ||
            previewAd.format === "STORY" ||
            previewAd.recommended_placements?.includes("AUTOMATIC") ||
            !previewAd.recommended_placements) && (
            <div className="flex flex-col space-y-2 self-stretch py-2">
              <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <span className="text-primary">
                  <Smartphone size={20} />
                </span>
                Stories
              </h3>
              <div className="bg-primary relative h-[600px] overflow-hidden rounded-2xl shadow-xl">
                {/* Story Content */}
                <div className="text-primary-foreground absolute inset-0 flex flex-col justify-between p-4">
                  {/* Top Bar */}
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/80 flex h-10 w-10 items-center justify-center rounded-full border">
                      <span className="text-primary-foreground text-xs">A</span>
                    </div>
                    <div className="text-primary-foreground">
                      <div className="text-sm font-semibold text-current">
                        Sponsored
                      </div>
                      <div className="flex items-center gap-1 text-xs text-current">
                        Sponsored · <Globe size={12} />
                      </div>
                    </div>
                    <div className="text-primary-foreground/70 ml-auto">
                      <MoreHorizontal size={20} />
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                      {previewAd.format === "VIDEO" ||
                      previewAd.format === "SHORT_VIDEO" ? (
                        <>
                          <Play size={64} className="mx-auto mb-4" />
                          <div className="text-base font-bold md:text-xl">
                            {previewAd.headline}
                          </div>
                        </>
                      ) : (
                        <div className="px-4 text-lg font-bold md:text-xl">
                          {previewAd.headline}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom CTA */}
                  <div className="space-y-2">
                    <div className="px-2 text-center text-sm">
                      {previewAd.primary_text?.substring(0, 80)}...
                    </div>
                    <Button className="flex w-full items-center justify-center gap-2 border">
                      {previewAd.cta?.replace(/_/g, " ") || "Learn More"}
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-2 flex justify-end">
          <Button onClick={onClose}>Close Preview</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
