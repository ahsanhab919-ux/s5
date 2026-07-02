"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Campaign } from "@/types/campaign";
import type { CampaignObjective } from "@/types/metaCampaign";

interface EditCampaignModalProps {
  showModal: boolean;
  editingCampaign: Campaign | null;
  campaignEditFormData: {
    name: string;
    objective: CampaignObjective;
    budget: number;
    status: "draft" | "active" | "paused";
  };
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: string, value: string | number) => void;
}

export default function EditCampaignModal({
  showModal,
  editingCampaign,
  campaignEditFormData,
  saving,
  onClose,
  onSave,
  onFieldChange,
}: EditCampaignModalProps) {
  if (!showModal || !editingCampaign) return null;

  return (
    <Dialog open={showModal} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl! overflow-y-auto md:w-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Edit Campaign: {editingCampaign.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campaign Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Campaign Name
            </label>
            <Input
              type="text"
              value={campaignEditFormData.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              placeholder="Enter campaign name..."
            />
          </div>

          {/* Objective */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Objective
            </label>
            <select
              value={campaignEditFormData.objective}
              onChange={(e) => onFieldChange("objective", e.target.value)}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
            >
              <option value="outcome_sales">Sales</option>
              <option value="outcome_leads">Lead Generation</option>
              <option value="outcome_engagement">Engagement</option>
              <option value="outcome_awareness">Awareness</option>
              <option value="outcome_traffic">Traffic</option>
              <option value="outcome_app_promotion">App Promotion</option>
            </select>
          </div>

          {/* Budget */}
          {/* <div>
            <label className="mb-2 block text-sm font-semibold">
              Daily Budget ($)
            </label>
            <Input
              type="number"
              min="1"
              value={
                campaignEditFormData.budget === 0
                  ? ""
                  : campaignEditFormData.budget || ""
              }
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  onFieldChange("budget", 0);
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    onFieldChange("budget", numValue);
                  }
                }
              }}
              placeholder="Enter daily budget..."
            />
          </div> */}

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Status</label>
            <select
              value={campaignEditFormData.status}
              onChange={(e) => onFieldChange("status", e.target.value)}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
