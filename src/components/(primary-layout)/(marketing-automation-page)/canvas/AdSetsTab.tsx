import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ad, AdSet, Campaign } from "@/types/campaign";
import type { BidStrategy, OptimizationGoal } from "@/types/metaCampaign";
import {
  BidStrategyLabels,
  OptimizationGoalLabels,
} from "@/types/metaCampaign";
import { formatBudget } from "@/utils/currencyUtils";
import { Image as ImageIcon, Settings, Target } from "lucide-react";

interface AdSetsTabProps {
  adSets: AdSet[];
  campaigns: Campaign[];
  ads: Ad[];
  onEditAdSet: (adSet: AdSet) => void;
  currency?: string | null;
}

export default function AdSetsTab({
  adSets,
  campaigns,
  ads,
  onEditAdSet,
  currency,
}: AdSetsTabProps) {
  if (adSets.length === 0) {
    return (
      <Card className="text-center md:p-12">
        <Target className="text-primary mx-auto mb-4 h-16 w-16" />
        <h3 className="text-foreground mb-2 text-lg font-semibold">
          No Ad Sets Yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Create a campaign first, then add ad sets
        </p>
      </Card>
    );
  }

  return (
    <>
      {adSets.map((adSet) => (
        <Card key={adSet.id}>
          <CardHeader>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <CardTitle className="mb-1 text-xl font-bold">
                  {adSet.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Campaign:{" "}
                    {campaigns.find((c) => c.id === adSet.campaignId)?.name ||
                      "Unknown"}
                  </span>
                  {adSet.status && (
                    <span
                      className={`rounded border px-2 py-1 text-xs font-medium ${
                        adSet.status === "draft"
                          ? "border-muted bg-muted/50 text-muted-foreground"
                          : adSet.status === "active"
                            ? "border-primary/30 bg-primary/20 text-primary"
                            : adSet.status === "paused"
                              ? "border-muted bg-muted/50 text-muted-foreground"
                              : "border-muted bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {adSet.status.charAt(0).toUpperCase() +
                        adSet.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditAdSet(adSet)}
                title="Edit Ad Set"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ImageIcon className="text-primary h-4 w-4" />
                  <span className="text-muted-foreground mb-2 inline-block text-xs">
                    Ads
                  </span>
                </div>
                <p className="text-foreground text-lg font-bold">
                  {ads.filter((ad) => ad.adSetId === adSet.id).length}
                </p>
              </Card>

              {adSet.budget && (
                <Card className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-muted-foreground mb-2 inline-block text-xs">
                      Daily Budget
                    </span>
                  </div>
                  <p className="text-foreground text-lg font-bold">
                    {formatBudget(adSet.budget, currency)}
                  </p>
                </Card>
              )}
            </div>

            {/* Additional Ad Set Details */}
            {(adSet.bid_strategy ||
              adSet.optimization_goal ||
              adSet.targeting) && (
              <Card className="mb-4 p-4">
                <h4 className="text-foreground mb-3 text-sm font-semibold">
                  Ad Set Details
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {adSet.bid_strategy && (
                    <div>
                      <span className="text-muted-foreground mb-2 inline-block text-xs">
                        Bid Strategy
                      </span>
                      <p className="text-foreground text-sm font-medium">
                        {BidStrategyLabels[adSet.bid_strategy as BidStrategy]}
                      </p>
                    </div>
                  )}
                  {adSet.optimization_goal && (
                    <div>
                      <span className="text-muted-foreground mb-2 inline-block text-xs">
                        Optimization Goal
                      </span>
                      <p className="text-foreground text-sm font-medium">
                        {
                          OptimizationGoalLabels[
                            adSet.optimization_goal as OptimizationGoal
                          ]
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Targeting Details */}
                {adSet.targeting && (
                  <div className="mt-4 border-t pt-4">
                    <h5 className="text-foreground mb-3 text-sm font-semibold">
                      Targeting
                    </h5>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Age Range */}
                      {(adSet.targeting.age_min || adSet.targeting.age_max) && (
                        <div>
                          <span className="text-muted-foreground mb-2 inline-block text-xs">
                            Age Range
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {adSet.targeting.age_min || 18} -{" "}
                            {adSet.targeting.age_max || 65}
                          </p>
                        </div>
                      )}

                      {/* Geographic Location */}
                      {adSet.targeting.geo_locations && (
                        <div>
                          <span className="text-muted-foreground mb-2 inline-block text-xs">
                            Location
                          </span>
                          <div className="text-foreground text-sm font-medium">
                            {adSet.targeting.geo_locations.countries && (
                              <div className="flex flex-wrap gap-1">
                                {adSet.targeting.geo_locations.countries.map(
                                  (country, index) => (
                                    <span
                                      key={index}
                                      className="bg-primary/20 text-primary border-primary/30 rounded border px-2 py-1 text-xs"
                                    >
                                      {country === "BD"
                                        ? "Bangladesh"
                                        : country}
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                            {adSet.targeting.geo_locations.cities &&
                              adSet.targeting.geo_locations.cities.length >
                                0 && (
                                <div className="mt-1">
                                  <span className="text-muted-foreground mb-2 inline-block text-xs">
                                    Cities:{" "}
                                  </span>
                                  <span className="text-muted-foreground mb-2 inline-block text-xs">
                                    {adSet.targeting.geo_locations.cities
                                      .map((city) => city.name || city.key)
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Advantage Audience */}
                      {adSet.targeting.advantage_audience !== undefined && (
                        <div>
                          <span className="text-muted-foreground mb-2 inline-block text-xs">
                            Advantage Audience
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            <span
                              className={`rounded border px-2 py-1 text-xs ${
                                adSet.targeting.advantage_audience
                                  ? "bg-primary/20 text-primary border-primary/30"
                                  : "bg-muted/50 text-muted-foreground border-muted"
                              }`}
                            >
                              {adSet.targeting.advantage_audience
                                ? "Enabled"
                                : "Disabled"}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
