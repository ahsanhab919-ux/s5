"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Eye,
  ImageIcon,
  MousePointerClick,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

interface MetaInsights {
  impressions?: number;
  clicks?: number;
  spend?: number;
  reach?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  conversions?: number;
}

interface Ad {
  id: string;
  headline: string;
  metaAdId?: string;
  format: string;
  status?: string;
  primaryText?: string;
}

interface AdSet {
  id: string;
  name: string;
  metaAdSetId?: string;
  budget: number;
  targeting: {
    ageMin?: number;
    ageMax?: number;
  };
  ads: Ad[];
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  budget: number;
  status: string;
  insights?: MetaInsights;
  adSets: AdSet[];
}

interface CampaignsListProps {
  campaigns: Campaign[];
}

export default function CampaignsList({ campaigns }: CampaignsListProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatCurrency = (num?: number) => {
    if (!num) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatPercentage = (num?: number) => {
    if (!num) return "0%";
    return `${num.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Your Campaigns</h2>
        <p className="text-muted-foreground">
          {campaigns.length} active{" "}
          {campaigns.length === 1 ? "campaign" : "campaigns"}
        </p>
      </div>

      {campaigns.map((campaign) => (
        <Card
          key={campaign.id}
          className="overflow-hidden transition-all hover:border-primary"
        >
          {/* Campaign Header */}
          <div className="border-b border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="truncate text-xl font-bold text-foreground">
                    {campaign.name}
                  </h3>
                  <Badge variant="secondary" className="uppercase">
                    {campaign.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    {campaign.objective}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />${campaign.budget}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {campaign.adSets.length} Ad Sets
                  </span>
                </div>
              </div>
              <Button
                onClick={() =>
                  setSelectedCampaign(
                    selectedCampaign === campaign.id ? null : campaign.id,
                  )
                }
                variant="ghost"
                size="icon"
              >
                {selectedCampaign === campaign.id ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Insights Grid */}
          {campaign.insights && (
            <div className="grid grid-cols-2 gap-3 bg-muted/50 p-6 md:grid-cols-4">
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Impressions
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(campaign.insights.impressions)}
                </p>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Clicks
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(campaign.insights.clicks)}
                </p>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Spend
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(campaign.insights.spend)}
                </p>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    CTR
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatPercentage(campaign.insights.ctr)}
                </p>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Reach
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(campaign.insights.reach)}
                </p>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    CPC
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(campaign.insights.cpc)}
                </p>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    CPM
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(campaign.insights.cpm)}
                </p>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Conversions
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(campaign.insights.conversions)}
                </p>
              </Card>
            </div>
          )}

          {/* Ad Sets Details */}
          {selectedCampaign === campaign.id && (
            <div className="border-t border-border bg-muted/50 p-6">
              <h4 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <Target className="h-5 w-5 text-primary" />
                Ad Sets ({campaign.adSets.length})
              </h4>
              <div className="space-y-3">
                {campaign.adSets.map((adSet) => (
                  <Card key={adSet.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {adSet.name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          ${adSet.budget} • Ages {adSet.targeting?.ageMin}-
                          {adSet.targeting?.ageMax}
                        </p>
                      </div>
                      {adSet.metaAdSetId && (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {adSet.metaAdSetId.slice(0, 8)}...
                        </span>
                      )}
                    </div>

                    {/* Published Ads */}
                    {adSet.ads && adSet.ads.length > 0 && (
                      <div className="mt-3 border-t border-border pt-3">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          <ImageIcon className="h-3.5 w-3.5" />
                          Ads ({adSet.ads.length})
                        </p>
                        <div className="space-y-2">
                          {adSet.ads.map((ad) => (
                            <Card key={ad.id} className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {ad.headline}
                                  </p>
                                  {ad.primaryText && (
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                      {ad.primaryText}
                                    </p>
                                  )}
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {ad.format}
                                    </Badge>
                                    {ad.status && (
                                      <Badge variant="outline" className="text-xs">
                                        {ad.status}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {ad.metaAdId && (
                                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                                    {ad.metaAdId.slice(0, 12)}...
                                  </span>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
