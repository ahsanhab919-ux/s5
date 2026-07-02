"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { uploadToImageKit } from "@/lib/imagekit";
import { mediaAPI } from "@/services/marketing-automation.service";
import { Layers, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface ImageCanvasProps {
  format: string;
  generatedMedia: string[];
  isGenerating: boolean;
  editPrompt: string;
  setEditPrompt: (prompt: string) => void;
  onGenerate: () => void;
  onEdit: (
    regions: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      imageIndex: number;
    }>,
  ) => void;
  onRegenerate: () => void;
  onDownload: () => void;
  projectId: string;
  adId: string;
  onMediaUploaded: (mediaUrls: string[]) => void;
  currentImageIndex: number;
  onIndexChange: (index: number) => void;
}

export default function ImageCanvas({
  format,
  generatedMedia,
  isGenerating,
  editPrompt,
  setEditPrompt,
  onEdit,
  projectId,
  adId,
  onMediaUploaded,
  currentImageIndex,
  onIndexChange,
}: ImageCanvasProps) {
  const [selectedRegions, setSelectedRegions] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      imageIndex: number;
    }>
  >([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{
    x: number;
    y: number;
    imageIndex: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCarousel = format === "CAROUSEL";

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    imageIndex: number,
  ) => {
    if (!isSelecting) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setStartPoint({ x, y, imageIndex });
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    imageIndex: number,
  ) => {
    if (!isDrawing || !startPoint || startPoint.imageIndex !== imageIndex)
      return;

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);
    const x = Math.min(startPoint.x, currentX);
    const y = Math.min(startPoint.y, currentY);

    setSelectedRegions((prev) => {
      const filtered = prev.filter((r) => r.id !== "temp-drawing");
      return [
        ...filtered,
        {
          id: "temp-drawing",
          x: Math.max(0, Math.min(100 - width, x)),
          y: Math.max(0, Math.min(100 - height, y)),
          width: Math.min(width, 100),
          height: Math.min(height, 100),
          imageIndex,
        },
      ];
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint) return;

    setIsDrawing(false);

    setSelectedRegions((prev) => {
      const tempRegion = prev.find((r) => r.id === "temp-drawing");
      if (!tempRegion || tempRegion.width < 2 || tempRegion.height < 2) {
        return prev.filter((r) => r.id !== "temp-drawing");
      }

      const newRegion = {
        ...tempRegion,
        id: `region-${Date.now()}`,
      };

      return [...prev.filter((r) => r.id !== "temp-drawing"), newRegion];
    });

    setStartPoint(null);
  };

  const handleClearRegions = () => {
    setSelectedRegions([]);
    setIsSelecting(false);
  };

  const handleRemoveRegion = (regionId: string) => {
    setSelectedRegions((prev) => prev.filter((r) => r.id !== regionId));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Please select image files only");
        }

        // Upload to ImageKit
        const mediaUrl = await uploadToImageKit(file, "ads");

        // Save to ad
        await mediaAPI.saveUploadedMedia(projectId, adId, mediaUrl, "image");

        return mediaUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Update the media display
      if (isCarousel) {
        onMediaUploaded([...generatedMedia, ...uploadedUrls]);
      } else {
        onMediaUploaded([uploadedUrls[0]]);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + (error as Error).message);
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
              {/* Carousel Navigation */}
              {isCarousel && generatedMedia.length > 1 && (
                <div className="bg-background/90 text-foreground absolute top-4 right-4 z-20 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm">
                  {currentImageIndex + 1} / {generatedMedia.length}
                </div>
              )}

              {/* Image Display */}
              {isCarousel ? (
                <div className="relative h-full w-full">
                  <img
                    src={generatedMedia[currentImageIndex]}
                    alt={`Carousel ${currentImageIndex + 1}`}
                    className="pointer-events-none h-full w-full object-contain"
                  />

                  {/* Carousel Controls */}
                  {generatedMedia.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() =>
                          onIndexChange(
                            currentImageIndex > 0
                              ? currentImageIndex - 1
                              : generatedMedia.length - 1,
                          )
                        }
                        className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full shadow-lg"
                      >
                        ◀
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() =>
                          onIndexChange(
                            currentImageIndex < generatedMedia.length - 1
                              ? currentImageIndex + 1
                              : 0,
                          )
                        }
                        className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full shadow-lg"
                      >
                        ▶
                      </Button>
                    </>
                  )}

                  {/* Selection overlay for current carousel image */}
                  <div
                    className={`absolute inset-0 ${
                      isSelecting ? "cursor-crosshair" : ""
                    }`}
                    onMouseDown={(e) => handleMouseDown(e, currentImageIndex)}
                    onMouseMove={(e) => handleMouseMove(e, currentImageIndex)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {selectedRegions
                      .filter((r) => r.imageIndex === currentImageIndex)
                      .map((region, index) => (
                        <div
                          key={region.id}
                          className="border-primary bg-primary/20 pointer-events-none absolute border-4"
                          style={{
                            left: `${region.x}%`,
                            top: `${region.y}%`,
                            width: `${region.width}%`,
                            height: `${region.height}%`,
                          }}
                        >
                          <div className="bg-primary text-primary-foreground absolute -top-7 left-0 rounded px-2 py-1 text-xs font-semibold shadow-lg">
                            Region {index + 1}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div
                  className={`relative h-full w-full ${
                    isSelecting ? "cursor-crosshair" : ""
                  }`}
                  onMouseDown={(e) => handleMouseDown(e, 0)}
                  onMouseMove={(e) => handleMouseMove(e, 0)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={generatedMedia[0]}
                    alt="Generated"
                    className="pointer-events-none h-full w-full object-contain"
                  />

                  {/* Selection overlays */}
                  {selectedRegions.map((region, index) => (
                    <div
                      key={region.id}
                      className="border-primary bg-primary/20 pointer-events-none absolute border-4"
                      style={{
                        left: `${region.x}%`,
                        top: `${region.y}%`,
                        width: `${region.width}%`,
                        height: `${region.height}%`,
                      }}
                    >
                      <div className="bg-primary text-primary-foreground absolute -top-7 left-0 rounded px-2 py-1 text-xs font-semibold shadow-lg">
                        Region {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Status Indicators */}
              {isSelecting && selectedRegions.length === 0 && (
                <div className="bg-primary text-primary-foreground pointer-events-none absolute top-4 left-4 rounded-lg px-4 py-2 text-sm shadow-lg">
                  Click and drag to select regions
                  {isCarousel && " on this slide"}
                </div>
              )}

              {isSelecting && selectedRegions.length > 0 && (
                <div className="bg-primary text-primary-foreground pointer-events-none absolute top-4 left-4 rounded-lg px-4 py-2 text-sm shadow-lg">
                  {selectedRegions.length} region(s) selected • Draw more or
                  apply edit
                </div>
              )}

              {isDrawing && (
                <div className="bg-muted text-foreground pointer-events-none absolute top-4 right-4 rounded-lg px-4 py-2 text-sm shadow-lg">
                  Drawing region...
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="border-primary/30 bg-primary/20 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border">
                  <span className="text-6xl">🖼️</span>
                </div>
                <p className="text-foreground mb-2 text-lg font-semibold">
                  No Media Generated Yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Click "Generate {isCarousel ? "Carousel" : "Image"}" to create
                  AI-powered media
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Carousel Thumbnail Strip */}
      {isCarousel && generatedMedia.length > 1 && (
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Carousel Slides ({generatedMedia.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {generatedMedia.map((img, index) => (
                <Button
                  key={index}
                  variant={currentImageIndex === index ? "default" : "outline"}
                  onClick={() => onIndexChange(index)}
                  className="relative aspect-square overflow-hidden rounded-lg border-2 p-0"
                >
                  <img
                    src={img}
                    alt={`Slide ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="bg-background/70 text-foreground absolute right-1 bottom-1 rounded px-2 py-1 text-xs">
                    {index + 1}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            {isUploading ? "Uploading..." : "Upload Images"}
          </Button>
        </div>
        <input
          title="Upload Images"
          placeholder="Upload Images"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={isCarousel}
          onChange={handleFileUpload}
          className="hidden"
        />
        <p className="text-muted-foreground mt-2 text-center text-xs">
          {isCarousel
            ? "Upload multiple images for carousel"
            : "Upload a single image"}
        </p>
      </Card>

      {/* Region Selection Controls */}
      {generatedMedia.length > 0 && (
        <Card className="p-4">
          <div className="flex gap-2">
            <Button
              variant={isSelecting ? "default" : "outline"}
              onClick={() => setIsSelecting(!isSelecting)}
              className="flex-1"
            >
              <Layers className="mr-2 inline h-4 w-4" />
              {isSelecting ? "Drawing..." : "Select Regions"}
            </Button>
            {selectedRegions.length > 0 && (
              <Button variant="destructive" onClick={handleClearRegions}>
                Clear All
              </Button>
            )}
          </div>

          {selectedRegions.length > 0 && (
            <Card className="border-primary/30 bg-primary/10 mt-4 max-h-32 space-y-2 overflow-y-auto p-3">
              <p className="text-primary mb-2 text-xs font-semibold">
                Selected Regions ({selectedRegions.length}):
              </p>
              {selectedRegions.map((region) => (
                <div
                  key={region.id}
                  className="bg-primary/20 text-foreground flex items-center justify-between rounded p-2 text-xs"
                >
                  <span>
                    {isCarousel && `Slide ${region.imageIndex + 1}: `}
                    {Math.round(region.width)}% × {Math.round(region.height)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRegion(region.id)}
                    className="text-destructive hover:text-destructive px-2"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </Card>
          )}

          {/* Edit Prompt */}
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold">
              Edit Prompt{" "}
              {selectedRegions.length > 0 &&
                `(${selectedRegions.length} region${
                  selectedRegions.length > 1 ? "s" : ""
                } selected)`}
            </label>
            <Textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder={
                selectedRegions.length > 0
                  ? "Describe changes for selected regions..."
                  : "Describe changes for the entire image..."
              }
              rows={3}
            />
            <Button
              onClick={() => onEdit(selectedRegions)}
              disabled={isGenerating || !editPrompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <div className="border-primary-foreground/30 border-t-primary-foreground h-5 w-5 animate-spin rounded-full border-2"></div>
                  Applying Changes...
                </>
              ) : (
                <>✨ Apply Edit</>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
