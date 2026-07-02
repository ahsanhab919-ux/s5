"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AISuggestions from "./AISuggestions";
import CampaignsList from "./CampaignsList";
import DashboardHeader from "./DashboardHeader";
import EmptyState from "./EmptyState";

interface Campaign {
  id: string;
  name: string;
  metaCampaignId?: string;
  objective: string;
  budget: number;
  status: string;
}

interface AdSet {
  id: string;
  name: string;
  metaAdSetId?: string;
  campaignId: string;
  budget: number;
  targeting: any;
}

interface Ad {
  id: string;
  headline: string;
  metaAdId?: string;
  metaCreativeId?: string;
  adSetId: string;
  format: string;
  status?: string;
  primaryText?: string;
  description?: string;
}

interface MetaInsights {
  impressions?: number;
  clicks?: number;
  spend?: number;
  reach?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  conversions?: number;
  costPerConversion?: number;
  [key: string]: number | undefined;
}

interface AdSetWithAds extends AdSet {
  ads: Ad[];
  insights?: MetaInsights;
}

interface CampaignWithInsights extends Campaign {
  insights?: MetaInsights;
  adSets: AdSetWithAds[];
}

interface AISuggestion {
  type: "budget" | "creative";
  level: "campaign" | "adset" | "creative" | "ad";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  action: string;
  targetId?: string;
  targetName?: string;
  newBudget?: number;
  updates?: {
    headline?: string;
    primaryText?: string;
    description?: string;
  };
}

export default function Dashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const [campaigns, setCampaigns] = useState<CampaignWithInsights[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchCampaigns();
      generateSuggestions(projectId);
    }
  }, [projectId]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/data/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        const campaignData = result.data || result;

        // Filter only published campaigns with Meta IDs
        const publishedCampaigns =
          campaignData.campaigns
            ?.filter((c: Campaign) => {
              return c.metaCampaignId && c.status === "published";
            })
            .map((campaign: Campaign) => {
              // Get ad sets for this campaign
              const campaignAdSets = (campaignData.adSets || [])
                .filter((as: AdSet) => as.campaignId === campaign.id)
                .map((adSet: AdSet) => ({
                  ...adSet,
                  ads: (campaignData.ads || []).filter(
                    (ad: Ad) =>
                      ad.adSetId === adSet.id && ad.status === "published",
                  ),
                }));

              return {
                ...campaign,
                adSets: campaignAdSets,
              };
            }) || [];

        setCampaigns(publishedCampaigns);

        // Fetch insights for published campaigns
        if (publishedCampaigns.length > 0) {
          await fetchInsights();
        }
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}meta/insights/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const insightsData = await response.json();

        // Map insights to campaigns
        const campaignsWithInsights = campaigns.map((campaign) => {
          const campaignInsights = insightsData.campaigns?.find(
            (c: any) => c.id === campaign.metaCampaignId,
          );

          return {
            ...campaign,
            insights: campaignInsights?.insights,
          };
        });

        setCampaigns(campaignsWithInsights);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const generateSuggestions = async (projectId: string) => {
    setIsLoadingSuggestions(true);
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaigns/suggestions/${projectId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        setSuggestions(result.suggestions || result.data || []);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-16 w-16 animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background relative flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="border-border bg-background/90 sticky top-0 z-10 h-12 border-b px-4 backdrop-blur-sm md:h-16 md:px-6">
        <DashboardHeader
          isLoadingInsights={isLoadingInsights}
          onRefresh={fetchInsights}
        />
      </div>

      <div className="mx-auto flex w-full flex-1 flex-col px-4 py-6 md:px-6">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "2rem 2rem",
            opacity: 0.05,
          }}
        />
        <div className="z-5 flex w-full flex-1 flex-col">
          {campaigns.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-8">
              {isLoadingSuggestions ? (
                <Card className="flex items-center gap-4 p-6">
                  <div className="bg-muted animate-pulse rounded-full p-3">
                    <Lightbulb className="text-muted-foreground h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <p className="text-muted-foreground text-sm">
                      Analyzing your campaigns for optimization opportunities...
                    </p>
                  </div>
                  <Loader2 className="text-primary h-5 w-5 animate-spin" />
                </Card>
              ) : (
                <AISuggestions suggestions={suggestions} />
              )}
              <CampaignsList campaigns={campaigns} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
