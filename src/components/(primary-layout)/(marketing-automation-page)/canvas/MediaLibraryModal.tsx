"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileVideo, Image, Loader2, Video } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId?: string;
  adFormat?: string;
}

interface SmartAsset {
  _id: string;
  name: string;
  type: string;
  imagekitUrl: string;
  thumbnailUrl?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  createdAt: string;
}

interface AiMedia {
  _id: string;
  type: "avatar" | "short" | "long" | "ugc";
  status: "pending" | "completed" | "failed";
  url?: string;
  thumbnail?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  error?: string;
  createdAt: string;
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  adId,
  adFormat,
}: MediaLibraryModalProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"smart-assets" | "ai-media">(
    "smart-assets",
  );
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Determine if format supports multiple media
  const isCarousel = adFormat === "CAROUSEL";
  const isVideo = adFormat === "SHORT_VIDEO" || adFormat === "LONG_VIDEO";
  const maxSelection = isCarousel ? 10 : 1;

  // Fetch Smart Assets with TanStack Query
  const { data: smartAssetsData, isLoading: loadingSmartAssets } = useQuery({
    queryKey: ["smart-assets", projectId],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}smart-assets/project/${projectId}`,
      );
      return data;
    },
    enabled: !!projectId && isOpen,
  });

  // Fetch AI Media with TanStack Query
  const { data: aiMediaData, isLoading: loadingAiMedia } = useQuery({
    queryKey: ["ai-media", projectId],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}ai-media/project/${projectId}`,
      );
      return data;
    },
    enabled: !!projectId && isOpen,
  });

  const smartAssets = smartAssetsData?.assets || smartAssetsData?.data || [];
  const aiMedia = aiMediaData?.media || aiMediaData?.data || [];
  const loading = loadingSmartAssets || loadingAiMedia;

  // Save selected media mutation
  const saveMediaMutation = useMutation({
    mutationFn: async (mediaUrls: string[]) => {
      const payload: any = {};

      if (isCarousel) {
        payload.imageUrls = mediaUrls;
      } else if (isVideo) {
        payload.videoUrl = mediaUrls[0];
      } else {
        payload.imageUrl = mediaUrls[0];
      }

      const { data } = await api.patch(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/${projectId}/ad/${adId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      // Refetch campaign data
      queryClient.invalidateQueries({ queryKey: ["campaign", projectId] });

      // Show success toast
      toast.success("Media updated successfully!");

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: (error: any) => {
      // Show error toast
      toast.error(error.response?.data?.error || "Failed to update media");
      setSaving(false);
    },
  });

  const handleMediaSelect = (mediaId: string, mediaUrl: string) => {
    if (isCarousel) {
      // Multiple selection for carousel
      setSelectedMedia((prev) => {
        if (prev.includes(mediaUrl)) {
          return prev.filter((id) => id !== mediaUrl);
        } else if (prev.length < maxSelection) {
          return [...prev, mediaUrl];
        }
        return prev;
      });
    } else {
      // Single selection for other formats
      setSelectedMedia([mediaUrl]);
    }
  };

  const handleSave = async () => {
    if (selectedMedia.length === 0) {
      toast.warning("Please select at least one media item");
      return;
    }

    setSaving(true);
    try {
      await saveMediaMutation.mutateAsync(selectedMedia);
    } catch (error) {
      console.error("Failed to save media:", error);
      // Error toast is already handled in mutation's onError
    } finally {
      setSaving(false);
    }
  };

  const getMediaIcon = (type: string) => {
    if (type.includes("image")) return Image;
    if (type.includes("video")) return Video;
    return FileVideo;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="flex max-h-[90vh] max-w-6xl! flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Select Media
            </DialogTitle>
            <DialogDescription>
              {isCarousel
                ? `Select up to ${maxSelection} images for carousel (${selectedMedia.length} selected)`
                : isVideo
                  ? "Select a video"
                  : "Select an image"}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex w-full gap-4 border-b">
            <Button
              variant={"ghost"}
              onClick={() => setActiveTab("smart-assets")}
              className={cn(
                "rounded-b-none px-4 py-3 font-medium transition-colors",
                activeTab === "smart-assets"
                  ? "border-primary text-foreground border-b-2"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Smart Assets ({smartAssets.length})
            </Button>
            <Button
              variant={"ghost"}
              onClick={() => setActiveTab("ai-media")}
              className={cn(
                "rounded-b-none px-4 py-3 font-medium transition-colors",
                activeTab === "ai-media"
                  ? "border-primary text-foreground border-b-2"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Medias ({aiMedia.length})
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {/* Smart Assets Tab */}
                {activeTab === "smart-assets" && (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {smartAssets.length === 0 ? (
                      <div className="col-span-full py-12 text-center">
                        <Image className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                        <p className="text-muted-foreground">
                          No smart assets yet
                        </p>
                      </div>
                    ) : (
                      smartAssets.map((asset: SmartAsset) => {
                        const Icon = getMediaIcon(asset.type);
                        const mediaUrl = asset.imagekitUrl;
                        const isSelected = selectedMedia.includes(mediaUrl);
                        return (
                          <Card
                            key={asset._id}
                            onClick={() =>
                              handleMediaSelect(asset._id, mediaUrl)
                            }
                            className={`group hover:ring-primary relative cursor-pointer overflow-hidden hover:ring-2 ${
                              isSelected ? "ring-primary ring-2" : ""
                            }`}
                          >
                            {/* Thumbnail */}
                            <div className="bg-muted relative aspect-video">
                              {asset.thumbnailUrl || asset.imagekitUrl ? (
                                <img
                                  src={asset.thumbnailUrl || asset.imagekitUrl}
                                  alt={asset.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Icon className="text-muted-foreground h-8 w-8" />
                                </div>
                              )}

                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="bg-primary absolute top-2 right-2 rounded-full p-1">
                                  <Check className="text-primary-foreground h-4 w-4" />
                                </div>
                              )}

                              {/* Selection Number for Carousel */}
                              {isCarousel && isSelected && (
                                <div className="bg-primary text-primary-foreground absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                                  {selectedMedia.indexOf(mediaUrl) + 1}
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <CardContent className="p-3">
                              <p className="text-foreground truncate text-sm font-medium">
                                {asset.name}
                              </p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-muted-foreground text-xs capitalize">
                                  {asset.type}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {formatFileSize(asset.fileSize)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}

                {/* AI Media Tab */}
                {activeTab === "ai-media" && (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {aiMedia.length === 0 ? (
                      <div className="col-span-full py-12 text-center">
                        <Video className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                        <p className="text-muted-foreground">No AI media yet</p>
                      </div>
                    ) : (
                      aiMedia.map((media: AiMedia) => {
                        const mediaUrl = media.url || "";
                        const isSelected = selectedMedia.includes(mediaUrl);
                        return (
                          <Card
                            key={media._id}
                            onClick={() =>
                              handleMediaSelect(media._id, mediaUrl)
                            }
                            className={`group hover:ring-primary relative cursor-pointer overflow-hidden hover:ring-2 ${
                              isSelected ? "ring-primary ring-2" : ""
                            }`}
                          >
                            {/* Thumbnail */}
                            <div className="bg-muted relative aspect-video">
                              {media.status === "completed" &&
                              (media.thumbnail || media.url) ? (
                                <img
                                  src={media.thumbnail || media.url}
                                  alt={media.type}
                                  className="h-full w-full object-cover"
                                />
                              ) : media.status === "pending" ? (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                                </div>
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Video className="text-muted-foreground h-8 w-8" />
                                </div>
                              )}

                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="bg-primary absolute top-2 left-2 rounded-full p-1">
                                  <Check className="text-primary-foreground h-4 w-4" />
                                </div>
                              )}

                              {/* Status Badge */}
                              <div className="absolute top-2 right-2">
                                <span
                                  className={`rounded border px-2 py-1 text-xs font-medium ${
                                    media.status === "completed"
                                      ? "border-primary/30 bg-primary/20 text-primary"
                                      : media.status === "pending"
                                        ? "border-muted bg-muted/50 text-muted-foreground"
                                        : "border-destructive/30 bg-destructive/20 text-destructive"
                                  }`}
                                >
                                  {media.status}
                                </span>
                              </div>
                            </div>

                            {/* Info */}
                            <CardContent className="p-3">
                              <p className="text-foreground text-sm font-medium capitalize">
                                {media.type} Video
                              </p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">
                                  {formatDuration(media.duration)}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {formatFileSize(media.fileSize)}
                                </span>
                              </div>
                              {media.error && (
                                <p className="text-destructive mt-1 truncate text-xs">
                                  {media.error}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-muted-foreground text-sm">
              {selectedMedia.length > 0 ? (
                <span className="text-primary font-medium">
                  {selectedMedia.length} item
                  {selectedMedia.length > 1 ? "s" : ""} selected
                </span>
              ) : (
                <span>
                  {activeTab === "smart-assets"
                    ? `${smartAssets.length} smart assets`
                    : `${aiMedia.length} AI media files`}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={selectedMedia.length === 0 || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Selection
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
