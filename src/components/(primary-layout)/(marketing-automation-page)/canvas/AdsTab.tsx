"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Ad } from "@/types/campaign";
import {
  Clapperboard,
  Crosshair,
  Eye,
  Image,
  Image as ImageIcon,
  ImagePlus,
  Images,
  Lightbulb,
  MapPin,
  Play,
  Settings,
  Smartphone,
  SquarePen,
  Target,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import MediaLibraryModal from "./MediaLibraryModal";

interface AdsTabProps {
  ads: Ad[];
  projectId: string;
  onEditAd: (ad: Ad) => void;
  onPreviewAd: (ad: Ad) => void;
}

export default function AdsTab({
  ads,
  projectId,
  onEditAd,
  onPreviewAd,
}: AdsTabProps) {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState<string | undefined>();
  const [selectedAdFormat, setSelectedAdFormat] = useState<
    string | undefined
  >();

  if (ads.length === 0) {
    return (
      <Card className="text-center md:p-12">
        <ImageIcon className="text-primary mx-auto mb-4 h-16 w-16" />
        <h3 className="text-foreground mb-2 text-lg font-semibold">
          No Ads Created
        </h3>
        <p className="text-muted-foreground text-sm">
          Create an ad set first, then add ads
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {ads.map((ad, index) => (
        <Card
          key={ad.id}
          className="transition-border hover:border-primary/50 relative flex flex-col overflow-hidden pt-0"
        >
          <div>
            {/* Serial Number Badge */}
            <div className="absolute top-4 right-4">
              <span className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-bold shadow-lg">
                #{index + 1}
              </span>
            </div>

            {/* Media Preview */}
            {ad.imageUrl ? (
              <img
                src={ad.imageUrl}
                alt={ad.headline}
                className="h-60 w-full object-cover"
              />
            ) : ad.videoUrl ? (
              <div className="bg-background relative flex h-60 w-full items-center justify-center border-b text-lg font-bold">
                <video
                  src={ad.videoUrl}
                  className="h-full w-full object-cover"
                  muted
                  autoPlay
                  loop
                />
              </div>
            ) : ad.imageUrls && ad.imageUrls.length > 0 ? (
              <div className="bg-background relative flex h-60 w-full items-center justify-center border-b text-lg font-bold">
                <img
                  src={ad.imageUrls[0]}
                  alt={ad.headline}
                  className="h-full w-full object-cover"
                />
                <div className="bg-background/90 text-foreground absolute top-2 right-2 rounded px-2 py-1 text-xs">
                  {ad.imageUrls.length} images
                </div>
                <div className="bg-background/90 text-foreground absolute bottom-2 left-2 flex items-center gap-1 rounded px-2 py-1 text-xs">
                  <Images className="h-3 w-3" /> CAROUSEL
                </div>
              </div>
            ) : (
              <div className="bg-background text-foreground flex h-60 w-full items-center justify-center border-b text-lg font-bold">
                {ad.format?.includes("VIDEO") ? (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Play className="h-8 w-8" />
                    <div>{ad.format?.replace("_", " ")}</div>
                  </div>
                ) : ad.format === "CAROUSEL" ? (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Images className="h-8 w-8" />
                    <div>CAROUSEL</div>
                  </div>
                ) : ad.format === "STORY" ? (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Smartphone className="h-8 w-8" />
                    <div>STORY</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Image className="h-8 w-8" />
                    <div>SINGLE IMAGE</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <CardContent className="flex flex-1 flex-col gap-4 p-6">
            {/* Tags and Metadata */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="border-primary/30 bg-primary/20 text-primary rounded-lg border px-3 py-1 text-xs font-medium">
                {ad.format?.replace("_", " ")}
              </span>

              {ad.awareness_stage && (
                <span className="border-primary/30 bg-primary/20 text-primary rounded-lg border px-3 py-1 text-xs font-medium">
                  {ad.awareness_stage.replace("_", " ")}
                </span>
              )}

              {ad.persona && (
                <span className="border-primary/30 bg-primary/20 text-primary rounded-lg border px-3 py-1 text-xs font-medium">
                  {ad.persona}
                </span>
              )}
            </div>

            {/* Headline */}
            <h4 className="text-foreground text-xl leading-tight font-bold">
              {ad.headline}
            </h4>

            {/* Hook */}
            {ad.hook && (
              <Card className="border-primary/30 gap-3 p-3">
                <p className="text-primary flex items-center gap-1 text-xs font-medium">
                  <Target className="h-3 w-3" /> Hook
                </p>
                <p className="text-foreground text-sm italic">{ad.hook}</p>
              </Card>
            )}

            {/* Primary Text */}
            {ad.primary_text && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {ad.primary_text}
              </p>
            )}

            {/* Description */}
            <p className="text-muted-foreground text-sm">{ad.description}</p>

            {/* Creative Direction */}
            {ad.creative_direction && (
              <Card className="gap-3 p-4">
                <p className="text-foreground flex items-center gap-1 text-xs font-medium">
                  <Clapperboard className="h-3 w-3" /> Creative Direction
                </p>
                <p className="text-muted-foreground text-xs">
                  {ad.creative_direction}
                </p>
              </Card>
            )}

            {/* Angle & Benefit */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ad.angle && (
                <Card className="border-primary/30 gap-3 p-2">
                  <p className="text-primary flex items-center gap-1 text-xs font-medium">
                    <Crosshair className="h-3 w-3" /> Angle
                  </p>
                  <p className="text-foreground text-xs">{ad.angle}</p>
                </Card>
              )}
              {ad.benefit_focus && (
                <Card className="border-primary/30 gap-3 p-2">
                  <p className="text-primary flex items-center gap-1 text-xs font-medium">
                    <Lightbulb className="h-3 w-3" /> Benefit
                  </p>
                  <p className="text-foreground text-xs">{ad.benefit_focus}</p>
                </Card>
              )}
              {ad.cta && (
                <Card className="border-primary/30 gap-3 p-2">
                  <p className="text-primary flex items-center gap-1 text-xs font-medium">
                    <Lightbulb className="h-3 w-3" /> CTA
                  </p>
                  <p className="text-foreground text-xs">{ad.cta}</p>
                </Card>
              )}
            </div>

            {/* Recommended Placements */}
            {ad.recommended_placements &&
              ad.recommended_placements.length > 0 && (
                <Card className="border-primary/30 gap-3 p-3">
                  <p className="text-primary flex items-center gap-1 text-xs font-medium">
                    <MapPin className="h-3 w-3" /> Recommended Placements
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ad.recommended_placements.map((placement, i) => (
                      <span
                        key={i}
                        className="border-primary/30 bg-primary/20 text-primary rounded border px-2 py-1 text-xs"
                      >
                        {placement.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

            <div className="mt-auto">
              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPreviewAd(ad)}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAdId(ad.id);
                    setSelectedAdFormat(ad.format);
                    setShowMediaModal(true);
                  }}
                >
                  <ImagePlus className="h-4 w-4" />
                  Medias
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditAd(ad)}
                >
                  <SquarePen className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => {
          setShowMediaModal(false);
          setSelectedAdId(undefined);
          setSelectedAdFormat(undefined);
        }}
        adId={selectedAdId}
        adFormat={selectedAdFormat}
      />
    </div>
  );
}
