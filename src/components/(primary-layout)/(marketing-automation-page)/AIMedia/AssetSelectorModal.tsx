import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface Asset {
  _id: string;
  name: string;
  imagekitUrl: string;
  thumbnailUrl?: string;
  type: string;
}

interface AssetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  mode: "single" | "multiple";
  onSelect: (selectedUrls: string[]) => void;
  title: string;
  selectedAssets?: string[];
}

export default function AssetSelectorModal({
  isOpen,
  onClose,
  assets,
  mode,
  onSelect,
  title,
  selectedAssets = [],
}: AssetSelectorModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedAssets);
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const handleToggle = (url: string) => {
    if (mode === "single") {
      setSelected([url]);
    } else {
      setSelected((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
      );
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const handleUploadAssets = () => {
    // Close modal first, then redirect to smart assets section
    onClose();
    // Use window.location for full page navigation to avoid routing conflicts
    window.location.href = `/marketing-automation/media/${projectId}?section=smart-assets`;
  };

  // Show all assets (images, logos, and videos)
  const filteredAssets = assets;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "multiple"
              ? "Select multiple assets (images, logos, videos)"
              : "Select an asset"}
          </DialogDescription>
        </DialogHeader>

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAssets.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center">
              <p className="text-lg">No assets available</p>
              <p className="mt-2 text-sm">Upload some media first</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredAssets.map((asset) => {
                const isSelected = selected.includes(asset.imagekitUrl);
                return (
                  <div
                    key={asset._id}
                    onClick={() => handleToggle(asset.imagekitUrl)}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-primary ring-primary/50 ring-2"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="bg-muted flex aspect-square items-center justify-center">
                      {asset.type === "video" ? (
                        <video
                          src={asset.imagekitUrl}
                          className="h-full w-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={asset.thumbnailUrl || asset.imagekitUrl}
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

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="bg-primary absolute top-2 right-2 rounded-full p-1">
                        <Check className="text-primary-foreground h-4 w-4" />
                      </div>
                    )}

                    {/* Asset Name */}
                    <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-foreground truncate text-xs font-medium">
                        {asset.name}
                      </p>
                    </div>

                    {/* Hover Overlay */}
                    <div
                      className={cn(
                        "bg-primary/20 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
                        isSelected && "opacity-100",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-border flex items-center justify-between border-t p-6">
          <p className="text-muted-foreground text-sm">
            {selected.length} selected
            {mode === "multiple" && ` (${selected.length} assets)`}
          </p>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            {filteredAssets.length === 0 ? (
              <Button onClick={handleUploadAssets}>
                {/* redirects to smart assets */}
                Upload Assets
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={selected.length === 0}>
                Confirm Selection
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
