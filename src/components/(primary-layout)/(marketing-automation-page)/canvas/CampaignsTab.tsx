import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ad, AdSet, Campaign } from "@/types/campaign";
import { Image as ImageIcon, Pencil, Target, TrendingUp } from "lucide-react";

interface CampaignsTabProps {
  campaigns: Campaign[];
  adSets: AdSet[];
  ads: Ad[];
  onEditCampaign: (campaign: Campaign) => void;
}

export default function CampaignsTab({
  campaigns,
  adSets,
  ads,
  onEditCampaign,
}: CampaignsTabProps) {
  return (
    <>
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <CardTitle className="mb-1 text-xl font-bold">
                  {campaign.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                      campaign.status === "active"
                        ? "border-primary/30 bg-primary/20 text-primary"
                        : "border-muted bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {campaign.status}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {campaign.objective}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditCampaign(campaign)}
                title="Edit Campaign"
              >
                <Pencil className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign className="text-primary h-4 w-4" />
                  <span className="text-muted-foreground text-xs">Budget</span>
                </div>
                <p className="text-foreground text-lg font-bold">
                  ${campaign.budget}/day
                </p>
              </Card> */}
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Target className="text-primary h-4 w-4" />
                  <span className="text-muted-foreground text-xs">Ad Sets</span>
                </div>
                <p className="text-foreground text-lg font-bold">
                  {adSets.filter((as) => as.campaignId === campaign.id).length}
                </p>
              </Card>
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ImageIcon className="text-primary h-4 w-4" />
                  <span className="text-muted-foreground text-xs">Ads</span>
                </div>
                <p className="text-foreground text-lg font-bold">
                  {
                    ads.filter((ad) =>
                      adSets.some(
                        (as) =>
                          as.campaignId === campaign.id && as.id === ad.adSetId,
                      ),
                    ).length
                  }
                </p>
              </Card>
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="text-primary h-4 w-4" />
                  <span className="text-muted-foreground text-xs">
                    Objective
                  </span>
                </div>
                <p className="text-foreground text-sm font-bold capitalize">
                  {campaign.objective}
                </p>
              </Card>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
