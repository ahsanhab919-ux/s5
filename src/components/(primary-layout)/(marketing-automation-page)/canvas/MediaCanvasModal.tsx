"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Ad } from "@/types/campaign";
import {
  Download,
  Edit3,
  Film,
  Image as ImageIcon,
  Layers,
  RefreshCw,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface MediaCanvasModalProps {
  ad: Ad;
  onClose: () => void;
}

export default function MediaCanvasModal({
  ad,
  onClose,
}: MediaCanvasModalProps) {
  const [generatedMedia, setGeneratedMedia] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "edit">("generate");
  const [mediaHistory, setMediaHistory] = useState<string[]>([]);

  const isVideoFormat =
    ad.format === "VIDEO" ||
    ad.format === "SHORT_VIDEO" ||
    ad.format === "LONG_VIDEO";

  const handleGenerateMedia = async () => {
    setIsGenerating(true);

    // TODO: Replace with actual API call
    setTimeout(() => {
      // Simulate generated media
      // Use a data URL to avoid external dependency and ensure download works in offline/restricted environments
      const placeholderImage = isVideoFormat
        ? "data:video/mp4;base64,AAAA" // Minimal invalid video but string nonetheless
        : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      setGeneratedMedia(placeholderImage);
      setMediaHistory((prev) => [...prev, placeholderImage]);
      setIsGenerating(false);
    }, 2000);
  };

  const handleEditMedia = async () => {
    if (!editPrompt.trim() || !generatedMedia) return;

    setIsGenerating(true);

    // TODO: Replace with actual API call
    setTimeout(() => {
      const editedImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      setGeneratedMedia(editedImage);
      setMediaHistory((prev) => [...prev, editedImage]);
      setEditPrompt("");
      setSelectedRegion(null);
      setIsGenerating(false);
    }, 2000);
  };

  const handleRegionSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !generatedMedia) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setSelectedRegion({
      x: Math.max(0, x - 10),
      y: Math.max(0, y - 10),
      width: 20,
      height: 20,
    });
  };

  const handleDownload = async () => {
    if (!generatedMedia) return;

    try {
      const response = await fetch(generatedMedia);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${ad.headline}-media.${isVideoFormat ? "mp4" : "png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading media:", error);
      const link = document.createElement("a");
      link.href = generatedMedia;
      link.download = `${ad.headline}-media.${isVideoFormat ? "mp4" : "png"}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-7xl flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-lg p-2">
                <Wand2 className="text-primary-foreground h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  AI Media Canvas
                </DialogTitle>
                <DialogDescription>
                  {ad.headline} • {ad.format}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto lg:grid-cols-3">
          {/* Left Panel - Controls */}
          <div className="space-y-6 lg:col-span-1">
            {/* Tabs */}
            <div className="bg-muted/50 flex gap-2 rounded-xl p-1">
              <Button
                variant={activeTab === "generate" ? "default" : "ghost"}
                onClick={() => setActiveTab("generate")}
                className="flex-1"
              >
                <Sparkles className="mr-2 inline h-4 w-4" />
                Generate
              </Button>
              <Button
                variant={
                  activeTab === "edit" && generatedMedia ? "default" : "ghost"
                }
                onClick={() => setActiveTab("edit")}
                disabled={!generatedMedia}
                className="flex-1"
              >
                <Edit3 className="mr-2 inline h-4 w-4" />
                Edit
              </Button>
            </div>

            {/* Creative Direction */}
            <Card className="p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Film className="text-primary h-4 w-4" />
                  Creative Direction
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {ad.creative_direction || "No creative direction provided"}
                </p>
              </CardContent>
            </Card>

            {/* Ad Details */}
            <Card className="p-4">
              <CardContent className="space-y-3 p-0">
                <div>
                  <span className="text-muted-foreground text-xs">Format:</span>
                  <p className="text-foreground font-semibold">{ad.format}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Hook:</span>
                  <p className="text-foreground text-sm">{ad.hook}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Persona:
                  </span>
                  <p className="text-foreground text-sm">
                    {ad.persona || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Awareness Stage:
                  </span>
                  <p className="text-foreground text-sm capitalize">
                    {ad.awareness_stage?.replace("_", " ") || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Generate Tab Content */}
            {activeTab === "generate" && (
              <div className="space-y-4">
                <Button
                  onClick={handleGenerateMedia}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="border-primary-foreground/30 border-t-primary-foreground h-5 w-5 animate-spin rounded-full border-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Generate {isVideoFormat ? "Video" : "Image"}
                    </>
                  )}
                </Button>

                <Card className="border-primary/30 bg-primary/10 p-4">
                  <h4 className="text-primary mb-2 text-sm font-semibold">
                    AI Generation Info
                  </h4>
                  <ul className="text-foreground space-y-1 text-xs">
                    <li>• Uses creative direction as context</li>
                    <li>• Optimized for {ad.format} format</li>
                    <li>• Matches persona: {ad.persona}</li>
                    <li>• Awareness: {ad.awareness_stage}</li>
                  </ul>
                </Card>
              </div>
            )}

            {/* Edit Tab Content */}
            {activeTab === "edit" && generatedMedia && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Edit Prompt
                  </label>
                  <Textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe what you want to change..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={isSelecting ? "default" : "outline"}
                    onClick={() => setIsSelecting(!isSelecting)}
                    className="flex-1"
                  >
                    <Layers className="mr-2 inline h-4 w-4" />
                    {isSelecting ? "Selecting..." : "Select Region"}
                  </Button>
                </div>

                {selectedRegion && (
                  <Card className="border-primary/30 bg-primary/10 p-3">
                    <p className="text-primary text-xs">
                      Region selected: {selectedRegion.width}% ×{" "}
                      {selectedRegion.height}%
                    </p>
                  </Card>
                )}

                <Button
                  onClick={handleEditMedia}
                  disabled={isGenerating || !editPrompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="border-primary-foreground/30 border-t-primary-foreground h-5 w-5 animate-spin rounded-full border-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      Apply Edit
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleGenerateMedia}
                  disabled={isGenerating}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate from Scratch
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel - Canvas */}
          <div className="space-y-4 lg:col-span-2">
            {/* Canvas */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  {isVideoFormat ? (
                    <>
                      <Film className="text-primary h-5 w-5" />
                      Video Canvas
                    </>
                  ) : (
                    <>
                      <ImageIcon className="text-primary h-5 w-5" />
                      Image Canvas
                    </>
                  )}
                </CardTitle>
                {generatedMedia && (
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-muted relative aspect-square">
                  {generatedMedia ? (
                    <div
                      className="relative h-full w-full cursor-crosshair"
                      onClick={handleRegionSelect}
                    >
                      {isVideoFormat ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="bg-muted mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                              <Film className="text-foreground h-10 w-10" />
                            </div>
                            <p className="text-foreground text-lg font-semibold">
                              Video Preview
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {ad.format} • {ad.headline}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={generatedMedia}
                          alt="Generated"
                          className="h-full w-full object-contain"
                        />
                      )}

                      {/* Selection Overlay */}
                      {selectedRegion && (
                        <div
                          className="border-primary bg-primary/20 absolute border-4"
                          style={{
                            left: `${selectedRegion.x}%`,
                            top: `${selectedRegion.y}%`,
                            width: `${selectedRegion.width}%`,
                            height: `${selectedRegion.height}%`,
                          }}
                        >
                          <div className="bg-primary text-primary-foreground absolute top-0 left-0 -mt-6 rounded px-2 py-1 text-xs">
                            Selected Region
                          </div>
                        </div>
                      )}

                      {isSelecting && (
                        <div className="bg-primary text-primary-foreground absolute top-4 left-4 rounded-lg px-4 py-2 text-sm shadow-lg">
                          Click to select a region to edit
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="border-primary/30 bg-primary/20 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border">
                          {isVideoFormat ? (
                            <Film className="text-primary h-12 w-12" />
                          ) : (
                            <ImageIcon className="text-primary h-12 w-12" />
                          )}
                        </div>
                        <p className="text-foreground mb-2 text-lg font-semibold">
                          No Media Generated Yet
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Click "Generate {isVideoFormat ? "Video" : "Image"}"
                          to create AI-powered media
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* History */}
            {mediaHistory.length > 0 && (
              <Card className="p-4">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <RefreshCw className="text-primary h-4 w-4" />
                    Generation History ({mediaHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-4 gap-3">
                    {mediaHistory.map((media, index) => (
                      <Button
                        key={index}
                        variant={
                          generatedMedia === media ? "default" : "outline"
                        }
                        onClick={() => setGeneratedMedia(media)}
                        className="aspect-square overflow-hidden rounded-lg border-2 p-0"
                      >
                        <img
                          src={media}
                          alt={`Version ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card className="border-primary/30 bg-primary/10 p-4">
              <h3 className="text-primary mb-2 text-sm font-semibold">
                💡 Quick Tips
              </h3>
              <ul className="text-foreground space-y-1 text-xs">
                <li>• AI generates media based on your creative direction</li>
                <li>
                  • Use "Select Region" to edit specific parts of the image
                </li>
                <li>• Try different prompts for variations</li>
                <li>• Download your favorite version</li>
                <li>• Generation history lets you restore previous versions</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t p-6">
          <div className="text-muted-foreground text-sm">
            {generatedMedia ? (
              <span className="text-primary">✓ Media ready</span>
            ) : (
              <span>Click generate to create AI media</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {generatedMedia && (
              <Button
                onClick={() => {
                  // TODO: Save media to ad
                  onClose();
                }}
              >
                Save & Apply
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
