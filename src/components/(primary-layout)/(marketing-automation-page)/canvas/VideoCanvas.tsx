"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadToImageKit } from "@/lib/imagekit";
import { mediaAPI } from "@/services/marketing-automation.service";
import { Film, Play, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface VideoCanvasProps {
  format: string;
  headline: string;
  generatedMedia: string[];
  isGenerating: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onDownload: () => void;
  projectId: string;
  adId: string;
  onMediaUploaded: (mediaUrls: string[]) => void;
}

export default function VideoCanvas({
  format,
  generatedMedia,
  projectId,
  adId,
  onMediaUploaded,
}: VideoCanvasProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalDuration = 12; // Single 12-second video

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
    // Single video - just stop playing
    setIsPlaying(false);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith("video/")) {
        throw new Error("Please select a video file");
      }

      // Upload to ImageKit
      const mediaUrl = await uploadToImageKit(file, "ads");

      // Save to ad

      const saveResult = await mediaAPI.saveUploadedMedia(
        projectId,
        adId,
        mediaUrl,
        "video",
      );

      // Update the media display
      onMediaUploaded([mediaUrl]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert("Upload failed: " + errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Canvas */}
      <Card className="overflow-hidden shadow-lg">
        <div className="bg-muted relative aspect-video">
          {generatedMedia.length > 0 ? (
            <div className="relative h-full w-full">
              {/* Video Player */}
              <video
                ref={videoRef}
                src={generatedMedia[0]} // Always use first (and only) video
                className="h-full w-full object-contain"
                onEnded={handleVideoEnd}
                onClick={handlePlayPause}
              />

              {/* Play/Pause Overlay */}
              {!isPlaying && (
                <div className="bg-background/30 absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handlePlayPause}
                    className="flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
                  >
                    <Play className="ml-1 h-10 w-10" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="border-primary/30 bg-primary/20 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border">
                  <Film className="text-primary h-12 w-12" />
                </div>
                <p className="text-foreground mb-2 text-lg font-semibold">
                  No Video Generated Yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Click "Generate Video" to create AI-powered video content
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Upload Controls */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex-1"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <p className="text-muted-foreground mt-2 text-center text-xs">
          Upload a video file (MP4, MOV, etc.)
        </p>
      </Card>

      {/* Video Info */}
      {generatedMedia.length > 0 && (
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Video Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="text-foreground font-medium">{format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="text-foreground font-medium">
                  {totalDuration}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-primary font-medium">Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video-specific Tips */}
      <Card className="border-primary/30 bg-primary/10 p-4">
        <h3 className="text-primary mb-2 text-sm font-semibold">
          🎬 Video Tips
        </h3>
        <ul className="text-foreground space-y-1 text-xs">
          <li>
            • 12-second videos perform best with strong hooks in first 3 seconds
          </li>
          <li>• Add captions for accessibility and sound-off viewing</li>
          <li>• Use vertical format for Stories and Reels</li>
          <li>• Focus on clear storytelling from problem to solution</li>
        </ul>
      </Card>
    </div>
  );
}
