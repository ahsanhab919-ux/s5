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
import { Input } from "@/components/ui/input";
import type { AdSet, Campaign } from "@/types/campaign";
import type { BidStrategy, OptimizationGoal } from "@/types/metaCampaign";
import {
  BidStrategyLabels,
  OptimizationGoalLabels,
} from "@/types/metaCampaign";
import {
  getOptimizationGoalDescription,
  getRecommendedOptimizationGoalForObjective,
  getValidOptimizationGoalsForObjective,
} from "@/utils/objectiveMapping";
import { Save } from "lucide-react";
import TargetingConfig from "../TargetingConfig";

interface EditAdSetModalProps {
  showModal: boolean;
  editingAdSet: AdSet | null;
  campaigns: Campaign[];
  adSetEditFormData: {
    name: string;
    budget: number;
    bid_strategy: BidStrategy;
    optimization_goal: OptimizationGoal;
    targeting: {
      age_min: number;
      age_max: number;
      geo_locations: {
        countries: string[];
        cities: Array<{ key: string; name?: string }>;
      };
      advantage_audience: boolean;
    };
  };
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: string, value: string | number | object) => void;
}

export default function EditAdSetModal({
  showModal,
  editingAdSet,
  campaigns,
  adSetEditFormData,
  saving,
  onClose,
  onSave,
  onFieldChange,
}: EditAdSetModalProps) {
  if (!showModal || !editingAdSet) return null;

  return (
    <Dialog open={showModal} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl! overflow-y-auto md:w-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Ad Set</DialogTitle>
          <DialogDescription>{editingAdSet.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="border-b pb-2 text-lg font-semibold">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ad Set Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Ad Set Name
                </label>
                <Input
                  type="text"
                  value={adSetEditFormData.name}
                  onChange={(e) => onFieldChange("name", e.target.value)}
                  placeholder="Enter ad set name..."
                />
              </div>

              {/* Daily Budget */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Daily Budget (USD)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-muted-foreground text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      adSetEditFormData.budget === 0
                        ? ""
                        : adSetEditFormData.budget || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        onFieldChange("budget", 0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          onFieldChange("budget", numValue);
                        }
                      }
                    }}
                    className="pl-8"
                    placeholder="Enter daily budget..."
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Minimum $1 per day. Higher budgets allow for better
                  optimization.
                </p>
              </div>

              {/* Bid Strategy */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Bid Strategy
                </label>
                <select
                  value={adSetEditFormData.bid_strategy}
                  onChange={(e) =>
                    onFieldChange("bid_strategy", e.target.value)
                  }
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
                >
                  <option value="LOWEST_COST_WITHOUT_CAP">
                    {BidStrategyLabels.LOWEST_COST_WITHOUT_CAP}
                  </option>
                  <option value="LOWEST_COST_WITH_BID_CAP">
                    {BidStrategyLabels.LOWEST_COST_WITH_BID_CAP}
                  </option>
                  <option value="COST_CAP">{BidStrategyLabels.COST_CAP}</option>
                  <option value="LOWEST_COST_WITH_MIN_ROAS">
                    {BidStrategyLabels.LOWEST_COST_WITH_MIN_ROAS}
                  </option>
                </select>
              </div>

              {/* Optimization Goal */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Optimization Goal
                  <span className="text-muted-foreground ml-2 text-xs font-normal">
                    (Based on Campaign Objective)
                  </span>
                </label>
                <select
                  value={adSetEditFormData.optimization_goal}
                  onChange={(e) =>
                    onFieldChange("optimization_goal", e.target.value)
                  }
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
                >
                  {(() => {
                    // Get the campaign objective from the first campaign
                    const campaignObjective = campaigns[0]?.objective;
                    if (!campaignObjective) return null;

                    const validGoals =
                      getValidOptimizationGoalsForObjective(campaignObjective);
                    const recommendedGoal =
                      getRecommendedOptimizationGoalForObjective(
                        campaignObjective,
                      );

                    return validGoals.map((goal) => (
                      <option key={goal} value={goal}>
                        {
                          OptimizationGoalLabels[
                            goal as keyof typeof OptimizationGoalLabels
                          ]
                        }
                        {goal === recommendedGoal ? " (Recommended)" : ""}
                      </option>
                    ));
                  })()}
                </select>
                {(() => {
                  const campaignObjective = campaigns[0]?.objective;
                  if (!campaignObjective) return null;

                  return (
                    <Card className="mt-2 p-3">
                      <p className="text-muted-foreground text-xs">
                        💡 {getOptimizationGoalDescription(campaignObjective)}
                      </p>
                    </Card>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Targeting Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="border-b pb-2 text-lg font-semibold">
                Targeting Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TargetingConfig
                targeting={adSetEditFormData.targeting}
                onTargetingChange={(targeting) =>
                  onFieldChange("targeting", targeting)
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex gap-4 border-t pt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
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
