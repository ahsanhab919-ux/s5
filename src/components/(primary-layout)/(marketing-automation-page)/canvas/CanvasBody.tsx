"use client";

import { campaignAPI, metaAPI } from "@/services/marketing-automation.service";
import type { ProductAnalysis } from "@/types/analysis";
import type {
  Ad,
  AdSet,
  Campaign,
  CampaignSuggestion,
  Persona,
} from "@/types/campaign";
import type {
  BidStrategy,
  CampaignObjective,
  OptimizationGoal,
} from "@/types/metaCampaign";
import { getRecommendedOptimizationGoalForObjective } from "@/utils/objectiveMapping";
import {
  Flag,
  Layers,
  Megaphone,
  Save,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

// Import extracted components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdPreviewModal from "./AdPreviewModal";
import AdSetsTab from "./AdSetsTab";
import AdsTab from "./AdsTab";
import AISuggestionsTab from "./AISuggestionsTab";
import CampaignsTab from "./CampaignsTab";
import EditAdModal from "./EditAdModal";
import EditAdSetModal from "./EditAdSetModal";
import EditCampaignModal from "./EditCampaignModal";
import {
  CampaignDataLoadingSkeleton,
  SuggestionsLoadingSkeleton,
} from "./LoadingSkeletons";
import PersonasTab from "./PersonasTab";

interface CanvasBodyProps {
  analysis: ProductAnalysis;
  initialSuggestions: CampaignSuggestion | null;
  loadingSuggestions?: boolean;
}

export default function CanvasBody({
  analysis,
  initialSuggestions,
  loadingSuggestions = false,
}: CanvasBodyProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activeTab, setActiveTab] = useState<
    "campaigns" | "adsets" | "ads" | "personas" | "suggestions"
  >("suggestions");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
  const [showEditAdSetModal, setShowEditAdSetModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingAdSet, setEditingAdSet] = useState<AdSet | null>(null);
  const [saving, setSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);
  const [adAccountCurrency, setAdAccountCurrency] = useState<string | null>(
    null,
  );
  const [isMetaConnected, setIsMetaConnected] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    headline: "",
    primary_text: "",
    description: "",
    cta: "",
    creative_direction: "",
    hook: "",
  });
  const [campaignEditFormData, setCampaignEditFormData] = useState({
    name: "",
    objective: "OUTCOME_SALES" as CampaignObjective,
    budget: 0,
    status: "draft" as "draft" | "active" | "paused",
  });

  const [adSetEditFormData, setAdSetEditFormData] = useState({
    name: "",
    budget: 0,
    bid_strategy: "LOWEST_COST_WITHOUT_CAP" as BidStrategy,
    optimization_goal: "LINK_CLICKS" as OptimizationGoal, // Will be updated based on campaign objective
    targeting: {
      age_min: 18,
      age_max: 45,
      geo_locations: {
        countries: ["BD"],
        cities: [] as Array<{ key: string; name?: string }>,
      },
      advantage_audience: true,
    },
  });

  // Load campaign data from database
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!projectId) return;

      setIsLoading(true);
      try {
        const response = await campaignAPI.getCampaignData(projectId);
        if (response.success && response.data) {
          setCampaigns(response.data.campaigns || []);
          setAdSets(response.data.adSets || []);
          setAds(response.data.ads || []);
          setPersonas(response.data.personas || []);
        }
        setDataLoaded(true);
      } catch (error) {
        console.error("Failed to load campaign data:", error);
        setDataLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignData();
  }, [projectId, initialSuggestions]); // Added initialSuggestions as dependency

  // Load Meta account data to get currency
  useEffect(() => {
    const loadMetaAccountData = async () => {
      try {
        const response = await metaAPI.getUserData();
        if (response.success && response.data) {
          const { businessAccounts, selectedAdsAccountId } = response.data;
          // Find the selected ad account's currency
          for (const business of businessAccounts || []) {
            const adAccount = business.adsAccounts?.find(
              (acc: { id: string; currency: string }) =>
                acc.id === selectedAdsAccountId,
            );
            if (adAccount?.currency) {
              setAdAccountCurrency(adAccount.currency);
              break;
            }
          }
          // Mark as connected if we have business accounts with ad accounts
          setIsMetaConnected(true);
        }
      } catch (error) {
        console.error("Failed to load Meta account data:", error);
        setIsMetaConnected(false);
        // Currency will default to USD if not available
      }
    };

    loadMetaAccountData();
  }, []);

  // Listen for campaign data updates from AI modifications
  useEffect(() => {
    const handleCampaignDataUpdate = async () => {
      if (!projectId) return;

      try {
        const response = await campaignAPI.getCampaignData(projectId);
        if (response.success && response.data) {
          setCampaigns(response.data.campaigns || []);
          setAdSets(response.data.adSets || []);
          setAds(response.data.ads || []);
          setPersonas(response.data.personas || []);
        }
      } catch (error) {
        console.error("Failed to reload campaign data:", error);
      }
    };

    window.addEventListener("campaignDataUpdated", handleCampaignDataUpdate);
    return () => {
      window.removeEventListener(
        "campaignDataUpdated",
        handleCampaignDataUpdate,
      );
    };
  }, [projectId]);

  // Auto-save campaign data when it changes
  useEffect(() => {
    const saveCampaignData = async () => {
      if (!projectId || !dataLoaded) return;

      setSaving(true);
      try {
        await campaignAPI.saveCampaignData(projectId, {
          campaigns,
          adSets,
          ads,
          personas,
        });
      } catch (error) {
        console.error("Failed to save campaign data:", error);
      } finally {
        setSaving(false);
      }
    };

    // Debounce the save
    const timeoutId = setTimeout(() => {
      if (dataLoaded) {
        saveCampaignData();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [campaigns, adSets, ads, personas, projectId, dataLoaded]);

  // Initialize campaign from suggestions
  useEffect(() => {
    if (initialSuggestions && campaigns.length === 0 && dataLoaded) {
      const suggestedCampaign: Campaign = {
        id: Date.now().toString(),
        name: initialSuggestions.campaign.name,
        objective: initialSuggestions.campaign.objective,
        budget: initialSuggestions.campaign.budget_recommendation.daily_min,
        status: "draft",
      };
      setCampaigns([suggestedCampaign]);

      // Also save personas from suggestions
      if (initialSuggestions.personas.length > 0) {
        setPersonas(initialSuggestions.personas);
      }
    }
  }, [initialSuggestions, campaigns.length, dataLoaded]);

  // Handle edit ad
  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setEditFormData({
      headline: ad.headline || "",
      primary_text: ad.primary_text || "",
      description: ad.description || "",
      cta: ad.cta || "",
      creative_direction: ad.creative_direction || "",
      hook: ad.hook || "",
    });
  };

  // Handle form field changes
  const handleEditFieldChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle edit campaign
  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignEditFormData({
      name: campaign.name || "",
      objective: campaign.objective || "OUTCOME_SALES",
      budget: campaign.budget || 0,
      status: campaign.status || "draft",
    });
    setShowEditCampaignModal(true);
  };

  // Handle campaign form field changes
  const handleCampaignEditFieldChange = (
    field: string,
    value: string | number | object,
  ) => {
    setCampaignEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save edited campaign
  const handleSaveCampaignEdit = async () => {
    if (!editingCampaign || !projectId) return;

    try {
      setSaving(true);
      const updatedCampaigns = campaigns.map((campaign) =>
        campaign.id === editingCampaign.id
          ? { ...campaign, ...campaignEditFormData }
          : campaign,
      );
      setCampaigns(updatedCampaigns as Campaign[]);
      setShowEditCampaignModal(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error("Failed to save campaign edit:", error);
    } finally {
      setSaving(false);
    }
  };

  // Handle edit ad set
  const handleEditAdSet = (adSet: AdSet) => {
    setEditingAdSet(adSet);

    // Get the campaign objective to determine the default optimization goal
    const campaignObjective = campaigns[0]?.objective;
    const defaultOptimizationGoal = campaignObjective
      ? getRecommendedOptimizationGoalForObjective(campaignObjective)
      : "LINK_CLICKS";

    setAdSetEditFormData({
      name: adSet.name || "",
      budget: adSet.budget || 0,
      bid_strategy: adSet.bid_strategy || "LOWEST_COST_WITHOUT_CAP",
      optimization_goal: adSet.optimization_goal || defaultOptimizationGoal,
      targeting: adSet.targeting
        ? {
            age_min: adSet.targeting.age_min ?? 18,
            age_max: adSet.targeting.age_max ?? 45,
            geo_locations: {
              countries: adSet.targeting.geo_locations?.countries ?? ["BD"],
              cities: adSet.targeting.geo_locations?.cities ?? [],
            },
            advantage_audience: adSet.targeting.advantage_audience ?? true,
          }
        : {
            age_min: 18,
            age_max: 45,
            geo_locations: {
              countries: ["BD"],
              cities: [] as Array<{ key: string; name?: string }>,
            },
            advantage_audience: true,
          },
    });
    setShowEditAdSetModal(true);
  };

  // Handle ad set form field changes
  const handleAdSetEditFieldChange = (
    field: string,
    value: string | number | object,
  ) => {
    setAdSetEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save edited ad set
  const handleSaveAdSetEdit = async () => {
    if (!editingAdSet || !projectId) return;

    try {
      setSaving(true);
      const updatedAdSets = adSets.map((adSet) =>
        adSet.id === editingAdSet.id
          ? { ...adSet, ...adSetEditFormData }
          : adSet,
      );
      setAdSets(updatedAdSets as AdSet[]);
      setShowEditAdSetModal(false);
      setEditingAdSet(null);
    } catch (error) {
      console.error("Failed to save ad set edit:", error);
    } finally {
      setSaving(false);
    }
  };

  // Save edited ad
  const handleSaveEdit = async () => {
    if (!editingAd || !projectId) return;

    try {
      setSaving(true);

      // Update the ad in state
      const updatedAds: Ad[] = ads.map((ad) =>
        ad.id === editingAd.id
          ? ({
              ...ad,
              ...editFormData,
            } as Ad)
          : ad,
      );
      setAds(updatedAds);

      // Save to database
      await campaignAPI.saveCampaignData(projectId, {
        campaigns,
        adSets,
        ads: updatedAds,
        personas,
      });

      // Close modal
      setEditingAd(null);
    } catch (error) {
      console.error("Error saving ad:", error);
      alert("Failed to save ad changes");
    } finally {
      setSaving(false);
    }
  };

  const createCampaign = () => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: `${analysis.product.title} Campaign`,
      objective: "OUTCOME_SALES" as CampaignObjective,
      budget: 100,
      status: "draft",
    };
    setCampaigns([...campaigns, newCampaign]);
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2 text-xl font-bold md:text-3xl">
              Meta Campaign Builder
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Create and manage your Facebook & Instagram campaigns
            </p>
          </div>
          {saving && (
            <div className="border-border bg-muted text-muted-foreground flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
              <Save className="text-muted-foreground h-4 w-4 animate-pulse" />
              <p className="text-foreground text-sm font-medium">Saving...</p>
            </div>
          )}
          {!saving && dataLoaded && (
            <div className="border-border bg-muted text-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
              <Save className="text-muted-foreground h-4 w-4" />
              <p className="text-foreground text-sm font-medium">Saved</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex overflow-x-auto border-b">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("suggestions")}
            className={cn(
              "flex items-center rounded-b-none px-4 py-3 font-medium whitespace-nowrap transition-colors",
              activeTab === "suggestions"
                ? "border-primary text-foreground border-b-2"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles className="h-4 w-4" />
            AI Suggestions
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("personas")}
            className={cn(
              "flex items-center rounded-b-none px-4 py-3 font-medium whitespace-nowrap transition-colors",
              activeTab === "personas"
                ? "border-primary text-foreground border-b-2"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="h-4 w-4" />
            Personas ({personas.length})
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("campaigns")}
            className={cn(
              "flex items-center rounded-b-none px-4 py-3 font-medium whitespace-nowrap transition-colors",
              activeTab === "campaigns"
                ? "border-primary text-foreground border-b-2"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Flag className="h-4 w-4" />
            Campaigns ({campaigns.length})
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("adsets")}
            className={cn(
              "flex items-center rounded-b-none px-4 py-3 font-medium whitespace-nowrap transition-colors",
              activeTab === "adsets"
                ? "border-primary text-foreground border-b-2"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="h-4 w-4" />
            Ad Sets ({adSets.length})
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("ads")}
            className={cn(
              "flex items-center rounded-b-none px-4 py-3 font-medium whitespace-nowrap transition-colors",
              activeTab === "ads"
                ? "border-primary text-foreground border-b-2"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Megaphone className="h-4 w-4" />
            Ads ({ads.length})
          </Button>
        </div>

        {/* Publish Ads Button - Only show when ads tab is active and there are ads */}
        {activeTab === "ads" && ads.length > 0 && (
          <div className="mb-6 flex justify-end">
            {isMetaConnected ? (
              <Link href={`/marketing-automation/canvas/${projectId}/publish`}>
                <Button className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Publish Ads
                </Button>
              </Link>
            ) : (
              <Button
                className="flex items-center gap-2"
                onClick={() => {
                  toast.error("Please connect your Facebook Account");
                }}
              >
                <Send className="h-4 w-4" />
                Publish Ads
              </Button>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="space-y-6">
          {/* Loading Skeleton for Initial Suggestions */}
          {loadingSuggestions && <SuggestionsLoadingSkeleton />}

          {/* Loading Skeleton for Campaign Data */}
          {!loadingSuggestions && isLoading && <CampaignDataLoadingSkeleton />}

          {/* AI Suggestions Tab */}
          {!loadingSuggestions &&
            !isLoading &&
            activeTab === "suggestions" &&
            initialSuggestions && (
              <AISuggestionsTab initialSuggestions={initialSuggestions} />
            )}

          {/* Personas Tab */}
          {!isLoading && activeTab === "personas" && (
            <PersonasTab personas={personas} ads={ads} />
          )}

          {/* Campaigns Tab */}
          {!isLoading && activeTab === "campaigns" && (
            <CampaignsTab
              campaigns={campaigns}
              adSets={adSets}
              ads={ads}
              onEditCampaign={handleEditCampaign}
            />
          )}

          {/* Ad Sets Tab */}
          {!isLoading && activeTab === "adsets" && (
            <AdSetsTab
              adSets={adSets}
              campaigns={campaigns}
              ads={ads}
              onEditAdSet={handleEditAdSet}
              currency={adAccountCurrency}
            />
          )}

          {/* Ads Tab */}
          {!isLoading && activeTab === "ads" && (
            <AdsTab
              ads={ads}
              projectId={projectId || ""}
              onEditAd={handleEditAd}
              onPreviewAd={setPreviewAd}
            />
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Create New Campaign
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Campaign Name
              </label>
              <Input
                type="text"
                defaultValue={`${analysis.product.title} Campaign`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Objective
              </label>
              <select
                title="Objective"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
              >
                <option value="outcome_sales">Sales (Conversions)</option>
                <option value="outcome_leads">Leads</option>
                <option value="outcome_traffic">Traffic</option>
                <option value="outcome_engagement">Engagement</option>
                <option value="outcome_app_promotion">App Promotion</option>
                <option value="outcome_awareness">Awareness</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Daily Budget (USD)
              </label>
              <Input type="number" defaultValue={100} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={createCampaign} className="flex-1">
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Ad Modal */}
      <EditAdModal
        editingAd={editingAd}
        editFormData={editFormData}
        saving={saving}
        onClose={() => setEditingAd(null)}
        onSave={handleSaveEdit}
        onFieldChange={handleEditFieldChange}
      />

      {/* Preview Modal */}
      <AdPreviewModal
        previewAd={previewAd}
        onClose={() => setPreviewAd(null)}
      />

      {/* Edit Campaign Modal */}
      <EditCampaignModal
        showModal={showEditCampaignModal}
        editingCampaign={editingCampaign}
        campaignEditFormData={campaignEditFormData}
        saving={saving}
        onClose={() => setShowEditCampaignModal(false)}
        onSave={handleSaveCampaignEdit}
        onFieldChange={handleCampaignEditFieldChange}
      />

      {/* Edit Ad Set Modal */}
      <EditAdSetModal
        showModal={showEditAdSetModal}
        editingAdSet={editingAdSet}
        campaigns={campaigns}
        adSetEditFormData={adSetEditFormData}
        saving={saving}
        onClose={() => setShowEditAdSetModal(false)}
        onSave={handleSaveAdSetEdit}
        onFieldChange={handleAdSetEditFieldChange}
      />
    </div>
  );
}
