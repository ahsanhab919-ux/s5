import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  type AiMedia,
  useAiMediasByProject,
  useDeleteAiMedia,
} from "@/hooks/(marketing-automation-page)/useAiMediaApi";
import { cn } from "@/lib/utils";
import { FileVideo, Loader2, Play, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

interface MediasSectionProps {
  userId: string;
}

export default function MediasSection({ userId }: MediasSectionProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedMedia, setSelectedMedia] = useState<AiMedia | null>(null);

  // Fetch medias from API
  const {
    data: mediasData,
    isLoading: loading,
    refetch: refetchMedias,
  } = useAiMediasByProject(projectId || "");
  const deleteMediaMutation = useDeleteAiMedia();

  const medias = mediasData?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary/20 text-primary border-primary/30";
      case "pending":
        return "bg-primary/20 text-primary border-primary/30";
      case "failed":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "avatar":
        return "Avatar Video";
      case "short":
        return "Short Video";
      case "long":
        return "Long Video";
      default:
        return type;
    }
  };

  return (
    <div className="bg-background flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-1 flex-col p-6">
        <div className="border-border border-b pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-xl font-bold md:text-2xl">
                AI Generated Medias
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                View all AI-generated videos for this project
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {medias.length} {medias.length === 1 ? "video" : "videos"}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pt-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : !projectId ? (
            <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
              <FileVideo className="mb-4 h-12 w-12 opacity-50" />
              <p>No project selected</p>
            </div>
          ) : medias.length === 0 ? (
            <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
              <FileVideo className="mb-4 h-12 w-12 opacity-50" />
              <p className="mb-2">No videos generated yet</p>
              <p className="text-sm">
                Generate videos from the Creative Tools section
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {medias.map((media) => (
                <Card
                  key={media._id}
                  className="group hover:border-primary relative cursor-pointer overflow-hidden transition-all"
                  onClick={() => setSelectedMedia(media)}
                >
                  {/* Thumbnail */}
                  <div className="bg-muted relative flex aspect-video items-center justify-center overflow-hidden">
                    {media.status === "completed" && media.url ? (
                      <>
                        {media.thumbnail ? (
                          <img
                            src={media.thumbnail}
                            alt="Video thumbnail"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="h-full w-full object-cover"
                            muted
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                          <Play className="text-foreground h-12 w-12" />
                        </div>
                      </>
                    ) : media.status === "pending" ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="text-primary h-8 w-8 animate-spin" />
                        <p className="text-muted-foreground text-xs">
                          Processing...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileVideo className="text-destructive h-8 w-8" />
                        <p className="text-destructive text-xs">Failed</p>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm font-medium">
                          {getTypeLabel(media.type)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(media.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-block rounded border px-2 py-1 text-xs font-medium",
                          getStatusColor(media.status),
                        )}
                      >
                        {media.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      Request ID: {media.requestId}
                    </p>
                  </CardContent>

                  {/* Delete Button */}
                  {media.status === "completed" && (
                    <Button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (
                          confirm("Are you sure you want to delete this video?")
                        ) {
                          await deleteMediaMutation.mutateAsync(media._id);
                          refetchMedias();
                        }
                      }}
                      variant="destructive"
                      size="icon-sm"
                      className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <Dialog
          open={!!selectedMedia}
          onOpenChange={() => setSelectedMedia(null)}
        >
          <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
            <DialogHeader>
              <DialogTitle>{getTypeLabel(selectedMedia.type)}</DialogTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Created on {new Date(selectedMedia.createdAt).toLocaleString()}
              </p>
            </DialogHeader>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedMedia.status === "completed" && selectedMedia.url ? (
                <div className="space-y-6">
                  {/* Video Player */}
                  <div className="bg-muted overflow-hidden rounded-xl">
                    <video
                      src={selectedMedia.url}
                      controls
                      className="w-full"
                      autoPlay
                    />
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground mb-1 block text-sm font-medium">
                        Status
                      </Label>
                      <span
                        className={cn(
                          "inline-block rounded border px-3 py-1.5 text-sm font-medium",
                          getStatusColor(selectedMedia.status),
                        )}
                      >
                        {selectedMedia.status}
                      </span>
                    </div>
                    <div>
                      <Label className="text-muted-foreground mb-1 block text-sm font-medium">
                        Type
                      </Label>
                      <p className="text-foreground">
                        {getTypeLabel(selectedMedia.type)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground mb-1 block text-sm font-medium">
                        Request ID
                      </Label>
                      <p className="text-foreground font-mono text-sm">
                        {selectedMedia.requestId}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground mb-1 block text-sm font-medium">
                        Video URL
                      </Label>
                      <a
                        href={selectedMedia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 block truncate text-sm"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
                  <FileVideo className="mb-4 h-12 w-12 opacity-50" />
                  <p>Video not available</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
