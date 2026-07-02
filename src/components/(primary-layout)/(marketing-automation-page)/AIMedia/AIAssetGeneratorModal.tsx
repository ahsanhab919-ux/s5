import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useGeneratePrompt,
  useUserAds,
} from "@/hooks/(marketing-automation-page)/useMediaApi";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import AssetSelectorModal from "./AssetSelectorModal";

interface AIAssetGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: GenerateParams) => Promise<void>;
  existingAssets?: Array<{
    _id: string;
    name: string;
    imagekitUrl: string;
    thumbnailUrl?: string;
    type: string;
  }>;
}

export interface GenerateParams {
  type:
    | "text-to-image"
    | "image-to-video"
    | "text-to-video"
    | "image-to-image"
    | "reference-to-video"
    | "first-last-frame-to-video";
  model: string;
  prompt: string;
  aspectRatio?: string;
  outputCount?: number;
  startFrame?: string; // ImageKit URL for image-to-video or image-to-image
  endFrame?: string; // ImageKit URL for image-to-video
  referenceImages?: string[]; // Multiple ImageKit URLs for reference-to-video
}

// Text to Image Models
const TEXT_TO_IMAGE_MODELS = [
  {
    id: "nano-banana",
    name: "Nano Banana",
    icon: "🍌",
    description: "Fast & efficient image generation",
  },
  {
    id: "flux-1.1-pro-ultra",
    name: "Flux 1.1 Pro Ultra",
    icon: "⚡",
    description: "Ultra high-quality images",
  },
  {
    id: "seedream-4",
    name: "SeeDream 4",
    icon: "🎨",
    description: "Creative & artistic generation",
  },
];

// Image to Image Models (same as text-to-image)
const IMAGE_TO_IMAGE_MODELS = [
  {
    id: "nano-banana",
    name: "Nano Banana",
    icon: "🍌",
    description: "Fast image transformation",
  },
  {
    id: "flux-1.1-pro-ultra",
    name: "Flux 1.1 Pro Ultra",
    icon: "⚡",
    description: "High-quality image editing",
  },
  {
    id: "seedream-4",
    name: "SeeDream 4",
    icon: "🎨",
    description: "Creative image transformation",
  },
];

// Text to Video Models
const TEXT_TO_VIDEO_MODELS = [
  {
    id: "veo-3.1",
    name: "Veo 3.1",
    icon: "🎬",
    description: "High-quality video generation",
    needsFrames: false,
  },
  {
    id: "veo-3.1-fast",
    name: "Veo 3.1 Fast",
    icon: "⚡",
    description: "Rapid video creation",
    needsFrames: false,
  },
  {
    id: "wan-2.5",
    name: "Wan 2.5",
    icon: "🎥",
    description: "Balanced quality & speed",
    needsFrames: false,
  },
  {
    id: "sora-2",
    name: "Sora 2",
    icon: "✨",
    description: "Advanced video synthesis",
    needsFrames: false,
  },
  {
    id: "veo-3",
    name: "Veo 3",
    icon: "📹",
    description: "Professional video quality",
    needsFrames: false,
  },
];

// Image to Video Models
const IMAGE_TO_VIDEO_MODELS = [
  {
    id: "veo-3.1",
    name: "Veo 3.1",
    icon: "🎬",
    description: "Animate with precision",
    needsFrames: true,
  },
  {
    id: "veo-3.1-fast",
    name: "Veo 3.1 Fast",
    icon: "⚡",
    description: "Quick animation",
    needsFrames: true,
  },
  {
    id: "wan-2.5",
    name: "Wan 2.5",
    icon: "🎥",
    description: "Smooth motion generation",
    needsFrames: true,
  },
  {
    id: "sora-2",
    name: "Sora 2",
    icon: "✨",
    description: "Cinematic animations",
    needsFrames: true,
  },
  {
    id: "veo-3",
    name: "Veo 3",
    icon: "📹",
    description: "Professional animations",
    needsFrames: true,
  },
];

// Reference to Video Models
const REFERENCE_TO_VIDEO_MODELS = [
  {
    id: "veo-3.1-reference",
    name: "Veo 3.1 Reference",
    icon: "🖼️",
    description: "Multiple reference images to video",
  },
];

// First-Last Frame to Video Models
const FIRST_LAST_FRAME_MODELS = [
  {
    id: "veo-3.1-fast-first-last",
    name: "Veo 3.1 Fast First-Last",
    icon: "🎞️",
    description: "Precise start & end frame control",
  },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "1:1", label: "1:1 (Square)" },
];

export default function AIAssetGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  existingAssets = [],
}: AIAssetGeneratorModalProps) {
  const [generateType, setGenerateType] = useState<
    | "text-to-image"
    | "image-to-video"
    | "text-to-video"
    | "image-to-image"
    | "reference-to-video"
    | "first-last-frame-to-video"
  >("text-to-image");
  const [selectedModel, setSelectedModel] = useState(
    TEXT_TO_IMAGE_MODELS[0].id,
  );
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [outputCount, setOutputCount] = useState(1);
  const [startFrame, setStartFrame] = useState<string>("");
  const [endFrame, setEndFrame] = useState<string>("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [assetSelectorMode, setAssetSelectorMode] = useState<
    "start" | "end" | "reference"
  >("start");
  const [selectedAd, setSelectedAd] = useState<string>("");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  // Fetch user ads and project ID
  const { projectId } = useParams<{ projectId: string }>();
  const { data: allUserAds = [], isLoading: loadingAds } = useUserAds();
  const generatePromptMutation = useGeneratePrompt();

  // Filter ads to only show those from current project
  const projectAds = allUserAds.filter((ad: any) => ad.projectId === projectId);

  const handleGeneratePrompt = async () => {
    if (!selectedAd || !projectId) {
      alert("Please select an ad first");
      return;
    }

    setGeneratingPrompt(true);
    try {
      const result = await generatePromptMutation.mutateAsync({
        projectId,
        adId: selectedAd,
        generateType,
      });

      if (result.success && result.prompt) {
        setPrompt(result.prompt);
      }
    } catch (error) {
      console.error("Prompt generation error:", error);
      alert("Failed to generate prompt");
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const getModelsForType = (type: string) => {
    switch (type) {
      case "text-to-image":
        return TEXT_TO_IMAGE_MODELS;
      case "image-to-image":
        return IMAGE_TO_IMAGE_MODELS;
      case "text-to-video":
        return TEXT_TO_VIDEO_MODELS;
      case "image-to-video":
        return IMAGE_TO_VIDEO_MODELS;
      case "reference-to-video":
        return REFERENCE_TO_VIDEO_MODELS;
      case "first-last-frame-to-video":
        return FIRST_LAST_FRAME_MODELS;
      default:
        return TEXT_TO_IMAGE_MODELS;
    }
  };

  const currentModels = getModelsForType(generateType);

  const handleModelChange = (
    type:
      | "text-to-image"
      | "image-to-video"
      | "text-to-video"
      | "image-to-image"
      | "reference-to-video"
      | "first-last-frame-to-video",
  ) => {
    setGenerateType(type);
    const models = getModelsForType(type);
    setSelectedModel(models[0].id);
    setStartFrame("");
    setEndFrame("");
    setReferenceImages([]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    // Validation based on generation type
    if (generateType === "image-to-video" && !startFrame) {
      alert("Please select a start frame");
      return;
    }

    if (generateType === "image-to-image" && !startFrame) {
      alert("Please select a reference image");
      return;
    }

    if (
      generateType === "first-last-frame-to-video" &&
      (!startFrame || !endFrame)
    ) {
      alert("Please select both first and last frames");
      return;
    }

    if (generateType === "reference-to-video" && referenceImages.length === 0) {
      alert("Please select at least one reference image");
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate({
        type: generateType,
        model: selectedModel,
        prompt,
        aspectRatio,
        outputCount,
        startFrame:
          generateType === "image-to-video" ||
          generateType === "image-to-image" ||
          generateType === "first-last-frame-to-video"
            ? startFrame
            : undefined,
        endFrame:
          generateType === "first-last-frame-to-video" ? endFrame : undefined,
        referenceImages:
          generateType === "reference-to-video" ? referenceImages : undefined,
      });

      // Reset form
      setPrompt("");
      setStartFrame("");
      setEndFrame("");
      onClose();
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <Sparkles className="text-primary-foreground h-5 w-5" />
            </div>
            <div>
              <DialogTitle>AI Asset Generator</DialogTitle>
              <DialogDescription>
                Generate images and videos with AI
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate Type Selector */}
          <div>
            <Label className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Wand2 className="text-primary h-4 w-4" />
              Generate type
            </Label>
            <Select
              value={generateType}
              onValueChange={(value) =>
                handleModelChange(
                  value as
                    | "text-to-image"
                    | "image-to-video"
                    | "text-to-video"
                    | "image-to-image"
                    | "reference-to-video"
                    | "first-last-frame-to-video",
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                  Video Generator
                </div>
                <SelectItem value="text-to-video">📹 Text to video</SelectItem>
                <SelectItem value="image-to-video">
                  🎬 Image to video
                </SelectItem>
                <SelectItem value="reference-to-video">
                  🖼️ Reference to video
                </SelectItem>
                <SelectItem value="first-last-frame-to-video">
                  🎞️ First-Last frame to video
                </SelectItem>
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                  Image Generator
                </div>
                <SelectItem value="text-to-image">🎨 Text to image</SelectItem>
                <SelectItem value="image-to-image">
                  🖼️ Image to image
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model Selector */}
          <div>
            <Label className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="text-primary h-4 w-4" />
              Select AI Model
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.icon} {model.name} - {model.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-2 text-xs">
              {currentModels.find((m) => m.id === selectedModel)?.description}
            </p>
          </div>

          {/* Frame Upload - Conditional based on generation type */}

          {/* Image to Video - Single Start Frame */}
          {generateType === "image-to-video" && (
            <div className="space-y-4">
              <Label className="block text-sm font-medium">Frame</Label>
              <div>
                <Label className="mb-2 block text-xs">Start Frame *</Label>
                <div
                  className={cn(
                    "relative overflow-hidden rounded-lg border-2 border-dashed",
                    startFrame ? "border-primary" : "border-border",
                  )}
                >
                  {startFrame ? (
                    <div className="relative aspect-video">
                      <img
                        src={startFrame}
                        alt="Start frame"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        onClick={() => setStartFrame("")}
                        variant="destructive"
                        size="icon-sm"
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setAssetSelectorMode("start");
                        setShowAssetSelector(true);
                      }}
                      variant="outline"
                      className="flex aspect-video h-full w-full cursor-pointer flex-col items-center justify-center"
                    >
                      <ImageIcon className="text-muted-foreground mb-2 h-8 w-8" />
                      <span className="text-muted-foreground text-sm">
                        Select Start Frame
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Image to Image - Single Reference Image */}
          {generateType === "image-to-image" && (
            <div className="space-y-4">
              <Label className="block text-sm font-medium">
                Reference Image
              </Label>
              <div>
                <Label className="mb-2 block text-xs">Reference Image *</Label>
                <div
                  className={cn(
                    "relative overflow-hidden rounded-lg border-2 border-dashed",
                    startFrame ? "border-primary" : "border-border",
                  )}
                >
                  {startFrame ? (
                    <div className="relative aspect-video">
                      <img
                        src={startFrame}
                        alt="Reference image"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        onClick={() => setStartFrame("")}
                        variant="destructive"
                        size="icon-sm"
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setAssetSelectorMode("start");
                        setShowAssetSelector(true);
                      }}
                      variant="outline"
                      className="flex aspect-video h-full w-full cursor-pointer flex-col items-center justify-center"
                    >
                      <ImageIcon className="text-muted-foreground mb-2 h-8 w-8" />
                      <span className="text-muted-foreground text-sm">
                        Select Reference Image
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* First-Last Frame to Video - First & Last Frames */}
          {generateType === "first-last-frame-to-video" && (
            <div className="space-y-4">
              <Label className="block text-sm font-medium">Frames</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block text-xs">First Frame *</Label>
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-lg border-2 border-dashed",
                      startFrame ? "border-primary" : "border-border",
                    )}
                  >
                    {startFrame ? (
                      <div className="relative aspect-video">
                        <img
                          src={startFrame}
                          alt="First frame"
                          className="h-full w-full object-cover"
                        />
                        <Button
                          onClick={() => setStartFrame("")}
                          variant="destructive"
                          size="icon-sm"
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          setAssetSelectorMode("start");
                          setShowAssetSelector(true);
                        }}
                        variant="outline"
                        className="flex aspect-video h-full w-full cursor-pointer flex-col items-center justify-center"
                      >
                        <ImageIcon className="text-muted-foreground mb-2 h-8 w-8" />
                        <span className="text-muted-foreground text-sm">
                          Select First Frame
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-xs">Last Frame *</Label>
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-lg border-2 border-dashed",
                      endFrame ? "border-primary" : "border-border",
                    )}
                  >
                    {endFrame ? (
                      <div className="relative aspect-video">
                        <img
                          src={endFrame}
                          alt="Last frame"
                          className="h-full w-full object-cover"
                        />
                        <Button
                          onClick={() => setEndFrame("")}
                          variant="destructive"
                          size="icon-sm"
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          setAssetSelectorMode("end");
                          setShowAssetSelector(true);
                        }}
                        variant="outline"
                        className="flex aspect-video h-full w-full cursor-pointer flex-col items-center justify-center"
                      >
                        <ImageIcon className="text-muted-foreground mb-2 h-8 w-8" />
                        <span className="text-muted-foreground text-sm">
                          Select Last Frame
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reference to Video - Multiple Reference Images */}
          {generateType === "reference-to-video" && (
            <div className="space-y-4">
              <Label className="block text-sm font-medium">
                Reference Images
              </Label>
              <div>
                <Label className="mb-2 block text-xs">
                  Select Multiple Images *
                </Label>
                {referenceImages.length > 0 && (
                  <div className="mb-2 grid grid-cols-3 gap-2">
                    {referenceImages.map((url, index) => (
                      <div
                        key={index}
                        className="border-primary relative aspect-video overflow-hidden rounded-lg border-2"
                      >
                        <img
                          src={url}
                          alt={`Reference ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <Button
                          onClick={() =>
                            setReferenceImages(
                              referenceImages.filter((_, i) => i !== index),
                            )
                          }
                          variant="destructive"
                          size="icon-sm"
                          className="absolute top-1 right-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => {
                    setAssetSelectorMode("reference");
                    setShowAssetSelector(true);
                  }}
                  variant="outline"
                  className="flex w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed py-8"
                >
                  <ImageIcon className="text-muted-foreground mb-2 h-8 w-8" />
                  <span className="text-muted-foreground text-sm">
                    {referenceImages.length > 0
                      ? "Add More Images"
                      : "Select Reference Images"}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Ad Selection (Optional) */}
          <div>
            <Label className="mb-3 block text-sm font-medium">
              Select Ad{" "}
              <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Select
              value={selectedAd}
              onValueChange={setSelectedAd}
              disabled={loadingAds}
            >
              <SelectTrigger>
                <SelectValue placeholder="No ad selected" />
              </SelectTrigger>
              <SelectContent>
                {projectAds.map((ad: any) => (
                  <SelectItem key={ad.id} value={ad.id}>
                    {ad.headline?.slice(0, 50)}
                    {ad.headline?.length > 50 ? "..." : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAd && (
              <p className="text-muted-foreground mt-2 text-xs">
                Selected ad will be used as context for generation
              </p>
            )}
          </div>

          {/* Prompt */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-medium">Prompt</Label>
              {selectedAd && (
                <Button
                  onClick={handleGeneratePrompt}
                  disabled={generatingPrompt}
                  size="sm"
                  className="flex items-center gap-2"
                  title="Generate AI prompt from selected ad"
                >
                  {generatingPrompt ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Generate
                    </>
                  )}
                </Button>
              )}
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                generateType === "text-to-image"
                  ? "Describe the image you want to generate..."
                  : "Describe how the image should animate..."
              }
              rows={4}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {prompt.length} / 1000 characters
              </span>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="link"
            className="text-sm"
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Settings
          </Button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="border-border bg-muted/50 space-y-4 rounded-lg border p-4">
              {/* Aspect Ratio */}
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Aspect Ratio
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <Button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      variant={
                        aspectRatio === ratio.value ? "default" : "outline"
                      }
                      className="text-sm"
                    >
                      {ratio.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Output Count (Text to Image only) */}
              {generateType === "text-to-image" && (
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Number of Outputs: {outputCount}
                  </Label>
                  <Input
                    type="range"
                    min="1"
                    max="4"
                    value={outputCount}
                    onChange={(e) => setOutputCount(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              disabled={isGenerating}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex flex-1 items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Asset Selector Modal */}
      <AssetSelectorModal
        isOpen={showAssetSelector}
        onClose={() => setShowAssetSelector(false)}
        assets={existingAssets}
        mode={assetSelectorMode === "reference" ? "multiple" : "single"}
        onSelect={(selectedUrls) => {
          if (assetSelectorMode === "start") {
            setStartFrame(selectedUrls[0] || "");
          } else if (assetSelectorMode === "end") {
            setEndFrame(selectedUrls[0] || "");
          } else if (assetSelectorMode === "reference") {
            setReferenceImages(selectedUrls);
          }
        }}
        title={
          assetSelectorMode === "start"
            ? "Select Start Frame"
            : assetSelectorMode === "end"
              ? "Select End Frame"
              : "Select Reference Images"
        }
        selectedAssets={
          assetSelectorMode === "start"
            ? startFrame
              ? [startFrame]
              : []
            : assetSelectorMode === "end"
              ? endFrame
                ? [endFrame]
                : []
              : referenceImages
        }
      />
    </Dialog>
  );
}
