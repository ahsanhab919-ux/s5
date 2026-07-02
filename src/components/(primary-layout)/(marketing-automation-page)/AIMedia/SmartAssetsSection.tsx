import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProject } from "@/hooks/(marketing-automation-page)/useProjectsApi";
import {
  type SmartAsset,
  useAIGeneration,
  useCreateSmartAsset,
  useDeleteSmartAsset,
  useSmartAssetsByProject,
  useUploadToImageKit,
} from "@/hooks/(marketing-automation-page)/useSmartAssetsApi";
import { cn } from "@/lib/utils";
import {
  FileVideo,
  Image as ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import AIAssetGeneratorModal, {
  type GenerateParams,
} from "./AIAssetGeneratorModal";

interface SmartAssetsSectionProps {
  userId: string;
}

export default function SmartAssetsSection({
  userId,
}: SmartAssetsSectionProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedType, setSelectedType] = useState<
    "all" | "image" | "video" | "logo"
  >("all");
  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; progress: number }[]
  >([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SmartAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: projectData } = useProject(projectId || "");
  const {
    data: assetsData,
    isLoading: loadingAssets,
    refetch: refetchAssets,
  } = useSmartAssetsByProject(
    projectId || "",
    selectedType === "all" ? undefined : selectedType,
  );

  // Debug: Log assets to check types

  // Mutations
  const uploadToImageKit = useUploadToImageKit();
  const createSmartAsset = useCreateSmartAsset();
  const deleteSmartAsset = useDeleteSmartAsset();
  const aiGeneration = useAIGeneration();

  const assets = assetsData?.data || [];
  const projectTitle =
    projectData?.product?.title || projectData?.url || "Project";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    handleUpload(Array.from(files));
  };

  const handleUpload = async (files: File[]) => {
    if (!projectId) {
      alert("No project selected");
      return;
    }

    setUploadingFiles(files.map((f) => ({ name: f.name, progress: 0 })));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Update progress
        setUploadingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 30 } : f)),
        );

        // Convert file to base64
        const base64 = await fileToBase64(file);

        // Determine type
        const fileName = file.name.toLowerCase();
        const type = file.type.startsWith("video/")
          ? "video"
          : fileName.includes("logo") ||
              fileName.includes("brand") ||
              fileName.endsWith(".svg") ||
              file.type === "image/svg+xml"
            ? "logo"
            : "image";

        // Upload to ImageKit
        const uploadResult = await uploadToImageKit.mutateAsync({
          file: base64,
          fileName: file.name,
          folder: `/smart-assets/${projectId}`,
          useUniqueFileName: true,
        });

        setUploadingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 70 } : f)),
        );

        // Create smart asset record
        await createSmartAsset.mutateAsync({
          userId,
          projectId,
          name: file.name,
          type,
          imagekitUrl: uploadResult.data.url,
          imagekitFileId: uploadResult.data.fileId,
          thumbnailUrl: uploadResult.data.thumbnailUrl,
          fileSize: file.size,
          mimeType: file.type,
          width: uploadResult.data.width,
          height: uploadResult.data.height,
        });

        setUploadingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 100 } : f)),
        );
      } catch (error) {
        console.error("Upload error:", error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    // Clear uploading files after a delay
    setTimeout(() => {
      setUploadingFiles([]);
      setShowUploadModal(false);
      refetchAssets();
    }, 1000);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/png;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDelete = async (asset: SmartAsset) => {
    if (!confirm(`Are you sure you want to delete "${asset.name}"?`)) return;

    try {
      await deleteSmartAsset.mutateAsync({
        id: asset._id,
        imagekitFileId: asset.imagekitFileId,
      });
      refetchAssets();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete asset");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "video":
        return <FileVideo className="h-5 w-5" />;
      case "logo":
        return <Sparkles className="h-5 w-5" />;
      default:
        return <ImageIcon className="h-5 w-5" />;
    }
  };

  const handleAIGenerate = async (params: GenerateParams) => {
    if (!projectId) {
      alert("No project selected");
      return;
    }

    if (!userId) {
      alert("User not authenticated");
      return;
    }

    try {

      // Call AI generation API
      const result = await aiGeneration.mutateAsync({
        type: params.type,
        model: params.model,
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        outputCount: params.outputCount,
        startFrame: params.startFrame,
        endFrame: params.endFrame,
        referenceImages: params.referenceImages,
        userId,
        projectId,
      });


      // Refresh assets list
      refetchAssets();

      alert("AI asset generated successfully!");
    } catch (error) {
      console.error("AI Generation error:", error);
      alert("Failed to generate AI asset. Please try again.");
    }
  };

  return (
    <div className="bg-background flex h-full flex-col">
      <div className="flex flex-1 flex-col p-6">
        {/* Header */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-xl font-bold md:text-2xl">
                Smart Assets
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                {projectTitle} - Manage images, videos, and logos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowAIGeneratorModal(true)}
                disabled={!projectId}
                className="flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                AI Generate
              </Button>
              <Button
                onClick={() => setShowUploadModal(true)}
                disabled={!projectId}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>

          {/* Type Filter */}
          <div className="border-border flex items-center gap-4 border-b">
            {["all", "image", "video", "logo"].map((type) => (
              <Button
                key={type}
                onClick={() =>
                  setSelectedType(type as "all" | "image" | "video" | "logo")
                }
                variant="ghost"
                className={cn(
                  "rounded-b-none px-4 py-3 font-medium transition-colors",
                  selectedType === type
                    ? "border-primary text-foreground border-b-2"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto py-6">
          {loadingAssets ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : !projectId ? (
            <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
              <Sparkles className="mb-4 h-12 w-12 opacity-50" />
              <p>No project selected</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
              <Upload className="mb-4 h-12 w-12 opacity-50" />
              <p className="mb-2">No assets uploaded yet</p>
              <Button
                onClick={() => setShowUploadModal(true)}
                variant="link"
                className="text-sm"
              >
                Upload your first asset
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {assets.map((asset) => (
                <Card
                  key={asset._id}
                  className="group hover:border-primary relative cursor-pointer overflow-hidden transition-all"
                  onClick={() => setSelectedAsset(asset)}
                >
                  {/* Thumbnail */}
                  <div className="bg-muted flex aspect-square items-center justify-center overflow-hidden">
                    {asset.type === "video" ? (
                      <div className="relative h-full w-full">
                        <video
                          src={asset.imagekitUrl}
                          className="h-full w-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <FileVideo className="text-foreground h-8 w-8" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={asset.imagekitUrl}
                        alt={asset.name}
                        className={cn(
                          "h-full w-full",
                          asset.type === "logo"
                            ? "object-contain p-4"
                            : "object-cover",
                        )}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-start gap-2">
                      <div className="text-primary mt-0.5">
                        {getAssetIcon(asset.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm font-medium">
                          {asset.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatFileSize(asset.fileSize)}
                        </p>
                      </div>
                    </div>
                    <span className="bg-muted text-foreground inline-block rounded px-2 py-1 text-xs font-medium">
                      {asset.type}
                    </span>
                  </CardContent>

                  {/* Delete Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset);
                    }}
                    variant="destructive"
                    size="icon-sm"
                    className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Upload{" "}
              {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}{" "}
              Assets
            </DialogTitle>
          </DialogHeader>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-border hover:border-primary cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all sm:p-12"
          >
            <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-foreground mb-2 font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-muted-foreground text-sm">
              Images, videos, and logos (Max 50MB)
            </p>
            <input
              title="Upload assets"
              placeholder="Upload assets"
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              {uploadingFiles.map((file, idx) => (
                <Card key={idx} className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-foreground truncate text-sm">
                      {file.name}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {file.progress}%
                    </span>
                  </div>
                  <div className="bg-muted h-2 w-full rounded-full">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <Dialog
          open={!!selectedAsset}
          onOpenChange={() => setSelectedAsset(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedAsset.name}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Preview */}
              <div className="bg-muted flex items-center justify-center overflow-hidden rounded-xl">
                {selectedAsset.type === "video" ? (
                  <video
                    src={selectedAsset.imagekitUrl}
                    controls
                    className="h-auto w-full"
                  />
                ) : (
                  <img
                    src={selectedAsset.imagekitUrl}
                    alt={selectedAsset.name}
                    className="h-auto w-full"
                  />
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs font-medium">
                    Type
                  </Label>
                  <p className="text-foreground mt-1 capitalize">
                    {selectedAsset.type}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-medium">
                    File Size
                  </Label>
                  <p className="text-foreground mt-1">
                    {formatFileSize(selectedAsset.fileSize)}
                  </p>
                </div>
                {selectedAsset.width && selectedAsset.height && (
                  <div>
                    <Label className="text-muted-foreground text-xs font-medium">
                      Dimensions
                    </Label>
                    <p className="text-foreground mt-1">
                      {selectedAsset.width} × {selectedAsset.height}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground text-xs font-medium">
                    URL
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="text"
                      value={selectedAsset.imagekitUrl}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          selectedAsset.imagekitUrl,
                        );
                        alert("URL copied to clipboard!");
                      }}
                      size="sm"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-medium">
                    Uploaded
                  </Label>
                  <p className="text-foreground mt-1">
                    {new Date(selectedAsset.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    handleDelete(selectedAsset);
                    setSelectedAsset(null);
                  }}
                  variant="destructive"
                  className="mt-6 flex w-full items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Asset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Asset Generator Modal */}
      <AIAssetGeneratorModal
        isOpen={showAIGeneratorModal}
        onClose={() => setShowAIGeneratorModal(false)}
        onGenerate={handleAIGenerate}
        existingAssets={assets}
      />
    </div>
  );
}
