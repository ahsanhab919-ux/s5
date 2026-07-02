"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Ad } from "@/types/campaign";
import {
  AlignLeft,
  Clapperboard,
  FileText,
  Heading1,
  MousePointerClick,
  Save,
  Target,
} from "lucide-react";

interface EditAdModalProps {
  editingAd: Ad | null;
  editFormData: {
    headline: string;
    primary_text: string;
    description: string;
    cta: string;
    creative_direction: string;
    hook: string;
  };
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: string, value: string) => void;
}

export default function EditAdModal({
  editingAd,
  editFormData,
  saving,
  onClose,
  onSave,
  onFieldChange,
}: EditAdModalProps) {
  if (!editingAd) return null;

  return (
    <Dialog open={!!editingAd} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] !max-w-4xl overflow-y-auto md:w-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Heading1 className="text-primary h-5 w-5" />
            Edit Ad: {editingAd.headline}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Headline */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Heading1 className="text-primary h-4 w-4" /> Headline
            </label>
            <Input
              type="text"
              value={editFormData.headline}
              onChange={(e) => onFieldChange("headline", e.target.value)}
              placeholder="Enter headline..."
            />
          </div>

          {/* Hook */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Target className="text-primary h-4 w-4" /> Hook
            </label>
            <Textarea
              value={editFormData.hook}
              onChange={(e) => onFieldChange("hook", e.target.value)}
              rows={2}
              placeholder="Enter hook..."
            />
          </div>

          {/* Primary Text */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <FileText className="text-primary h-4 w-4" /> Primary Text
            </label>
            <Textarea
              value={editFormData.primary_text}
              onChange={(e) => onFieldChange("primary_text", e.target.value)}
              rows={4}
              placeholder="Enter primary text..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <AlignLeft className="text-primary h-4 w-4" /> Description
            </label>
            <Textarea
              value={editFormData.description}
              onChange={(e) => onFieldChange("description", e.target.value)}
              rows={3}
              placeholder="Enter description..."
            />
          </div>

          {/* Creative Direction */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Clapperboard className="text-primary h-4 w-4" /> Creative
              Direction
            </label>
            <Textarea
              value={editFormData.creative_direction}
              onChange={(e) =>
                onFieldChange("creative_direction", e.target.value)
              }
              rows={5}
              placeholder="Enter creative direction..."
            />
          </div>

          {/* CTA */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <MousePointerClick className="text-primary h-4 w-4" /> Call to
              Action (CTA)
            </label>
            <select
              value={editFormData.cta}
              onChange={(e) => onFieldChange("cta", e.target.value)}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
            >
              <option value="">Select CTA</option>
              <option value="LEARN_MORE">Learn More</option>
              <option value="SHOP_NOW">Shop Now</option>
              <option value="SIGN_UP">Sign Up</option>
              <option value="GET_OFFER">Get Offer</option>
              <option value="DOWNLOAD">Download</option>
              <option value="BOOK_NOW">Book Now</option>
              <option value="APPLY_NOW">Apply Now</option>
              <option value="CONTACT_US">Contact Us</option>
              <option value="SUBSCRIBE">Subscribe</option>
              <option value="WATCH_MORE">Watch More</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <div className="border-primary-foreground/30 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
