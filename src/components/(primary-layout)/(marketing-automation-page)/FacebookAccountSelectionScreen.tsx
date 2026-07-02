"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { campaignAPI, metaAPI } from "@/services/marketing-automation.service";
import type { Ad } from "@/types/campaign";
import { getRouteState } from "@/utils/getRouteState";
import type { RootState } from "@/redux/store";
import {
  Activity,
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  Edit2,
  ExternalLink,
  Globe,
  Loader2,
  MousePointerClick,
  Save,
  Send,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

interface FacebookUser {
  id: string;
  name: string;
  email: string;
}

interface Page {
  id: string;
  name: string;
  category: string;
  tasks: string[];
}

interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
}

interface BusinessAccount {
  id: string;
  name: string;
  adsAccounts: AdAccount[];
}

interface Pixel {
  id: string;
  name: string;
  code?: string;
  creation_time?: string;
  last_fired_time?: string;
  is_created_by_business?: boolean;
  owner_business?: {
    id: string;
    name?: string;
  };
  owner_ad_account?: {
    id: string;
    name?: string;
  };
}

interface FacebookData {
  user: FacebookUser;
  pages: Page[];
  businessAccounts: BusinessAccount[];
  selectedPageIds: string[];
  selectedBusinessAccountId: string;
  selectedAdsAccountId: string;
}

export default function FacebookAccountSelectionScreen() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = getRouteState(searchParams);

  const [facebookData, setFacebookData] = useState<FacebookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [isLoadingPixels, setIsLoadingPixels] = useState(false);
  const [pixelsWarning, setPixelsWarning] = useState<string>("");

  const { accessToken } = useSelector((state: RootState) => state.auth);

  // Get selected ad IDs from navigation state (memoized by JSON string to prevent re-renders)
  const selectedAdIdsString = JSON.stringify(state?.selectedAdIds || []);
  const selectedAdIds = useMemo(
    () => JSON.parse(selectedAdIdsString) as string[],
    [selectedAdIdsString],
  );

  // States for project data
  const [projectUrl, setProjectUrl] = useState<string>("");
  const [uniqueCTAs, setUniqueCTAs] = useState<
    Array<{ cta: string; count: number }>
  >([]);

  // State for editable CTA URLs
  const [ctaUrls, setCtaUrls] = useState<Map<string, string>>(new Map());
  const [editingCTA, setEditingCTA] = useState<string | null>(null);
  const [tempUrl, setTempUrl] = useState<string>("");

  // Selection states
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [selectedBusinessAccountId, setSelectedBusinessAccountId] =
    useState<string>("");
  const [selectedAdsAccountId, setSelectedAdsAccountId] = useState<string>("");
  const [selectedPixelId, setSelectedPixelId] = useState<string>("");

  // Helper function to get base URL
  const getBaseUrl = useCallback((url: string): string => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url;
    }
  }, []);

  // Helper function to get URL for CTA
  const getUrlForCTA = useCallback(
    (cta: string, fullUrl: string): string => {
      if (cta === "SHOP_NOW") {
        return fullUrl;
      }
      return getBaseUrl(fullUrl);
    },
    [getBaseUrl],
  );

  // Load selected ads and project data
  useEffect(() => {
    const loadAdsAndProject = async () => {
      if (!projectId || selectedAdIds.length === 0) return;

      try {
        // Fetch campaign data to get ads
        const campaignResponse = await campaignAPI.getCampaignData(projectId);

        let ctaArray: Array<{ cta: string; count: number }> = [];

        if (campaignResponse.success && campaignResponse.data.ads) {
          const allAds = campaignResponse.data.ads;
          const filteredAds = allAds.filter((ad: Ad) =>
            selectedAdIds.includes(ad.id),
          );

          // Calculate unique CTAs
          const ctaMap = new Map<string, number>();
          filteredAds.forEach((ad: Ad) => {
            const cta = ad.cta || "LEARN_MORE";
            ctaMap.set(cta, (ctaMap.get(cta) || 0) + 1);
          });

          ctaArray = Array.from(ctaMap.entries()).map(([cta, count]) => ({
            cta,
            count,
          }));
          setUniqueCTAs(ctaArray);
        }

        // Fetch project to get URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem("accessToken");
        const projectResponse = await fetch(
          `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          const fullUrl = projectData.data.url || "";
          setProjectUrl(fullUrl);

          // Initialize CTA URLs based on CTA type (inline logic to avoid dependency issues)
          const initialCtaUrls = new Map<string, string>();
          ctaArray.forEach(({ cta }) => {
            if (cta === "SHOP_NOW") {
              initialCtaUrls.set(cta, fullUrl);
            } else {
              // Get base URL
              try {
                const urlObj = new URL(fullUrl);
                initialCtaUrls.set(cta, `${urlObj.protocol}//${urlObj.host}`);
              } catch {
                initialCtaUrls.set(cta, fullUrl);
              }
            }
          });
          setCtaUrls(initialCtaUrls);
        }
      } catch (error) {
        console.error("Failed to load ads and project data:", error);
      }
    };

    loadAdsAndProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedAdIds]);

  // Load Facebook data
  useEffect(() => {
    const loadFacebookData = async () => {
      if (!accessToken) return;

      try {
        setIsLoading(true);
        const response = await metaAPI.getUserData();

        if (response.success) {
          setFacebookData(response.data);
          setSelectedPageIds(response.data.selectedPageIds || []);
          setSelectedBusinessAccountId(
            response.data.selectedBusinessAccountId || "",
          );
          setSelectedAdsAccountId(response.data.selectedAdsAccountId || "");
        } else {
          alert(
            "Failed to load Facebook data. Please connect your Facebook account first.",
          );
          router.push(`/marketing-automation/canvas/${projectId}`);
        }
      } catch (error) {
        console.error("Failed to load Facebook data:", error);
        alert(
          "Failed to load Facebook data. Please connect your Facebook account first.",
        );
        router.push(`/marketing-automation/canvas/${projectId}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadFacebookData();
  }, [projectId]);

  const handlePageToggle = (pageId: string) => {
    setSelectedPageIds((prev) => {
      if (prev.includes(pageId)) {
        return prev.filter((id) => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleBusinessAccountSelect = (businessAccountId: string) => {
    setSelectedBusinessAccountId(businessAccountId);
    setSelectedAdsAccountId(""); // Reset ad account selection
  };

  // Fetch pixels when business account is selected
  useEffect(() => {
    const fetchPixels = async () => {
      if (!selectedBusinessAccountId) {
        setPixels([]);
        setPixelsWarning("");
        return;
      }

      try {
        setIsLoadingPixels(true);
        setPixelsWarning("");
        const response = await metaAPI.getPixels(selectedBusinessAccountId);

        if (response.success) {
          setPixels(response.data || []);

          // Check for warning message
          if (response.warning) {
            setPixelsWarning(response.warning);
          }
        } else {
          console.error("Failed to fetch pixels:", response.error);
          setPixels([]);
          setPixelsWarning("");
        }
      } catch (error) {
        console.error("Error fetching pixels:", error);
        setPixels([]);
        setPixelsWarning("");
      } finally {
        setIsLoadingPixels(false);
      }
    };

    fetchPixels();
  }, [selectedBusinessAccountId]);

  const handleAdAccountSelect = (adAccountId: string) => {
    setSelectedAdsAccountId(adAccountId);
  };

  const handleEditCTA = (cta: string) => {
    setEditingCTA(cta);
    setTempUrl(ctaUrls.get(cta) || "");
  };

  const handleSaveCTAUrl = (cta: string) => {
    const newCtaUrls = new Map(ctaUrls);
    newCtaUrls.set(cta, tempUrl);
    setCtaUrls(newCtaUrls);
    setEditingCTA(null);
    setTempUrl("");
  };

  const handleCancelEdit = () => {
    setEditingCTA(null);
    setTempUrl("");
  };

  const handleSaveAndContinue = async () => {
    if (selectedPageIds.length === 0) {
      alert("Please select at least one Facebook page.");
      return;
    }

    if (!selectedBusinessAccountId) {
      alert("Please select a business account.");
      return;
    }

    if (!selectedAdsAccountId) {
      alert("Please select an ad account.");
      return;
    }

    if (selectedAdIds.length === 0) {
      alert("No ads selected for publishing.");
      return;
    }

    setIsSaving(true);
    try {
      // First, update the Facebook account selections
      const updateResponse = await metaAPI.updateSelections({
        selectedPageIds,
        selectedBusinessAccountId,
        selectedAdsAccountId,
      });

      if (!updateResponse.success) {
        alert("Failed to save account selections. Please try again.");
        return;
      }

      // Prepare CTAs with their URLs
      const ctasWithUrls = Array.from(ctaUrls.entries()).map(([cta, url]) => ({
        cta,
        url,
      }));

      // Then publish the ads
      const publishResponse = await campaignAPI.publishAds(
        projectId!,
        selectedAdIds,
        selectedPageIds[0], // Pass the first selected page ID
        selectedAdsAccountId, // Pass the selected ads account ID
        selectedPixelId || undefined, // Pass the selected pixel ID (optional)
        selectedBusinessAccountId,
        ctasWithUrls, // Pass CTAs with their URLs
      );

      if (publishResponse.success) {
        alert(
          `Successfully published ${publishResponse.data.publishedCount} ads!`,
        );
        router.push(`/marketing-automation/canvas/${projectId}`);
      } else {
        alert("Failed to publish ads. Please try again.");
      }
    } catch (error) {
      console.error("Failed to publish ads:", error);
      alert("Failed to publish ads. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedBusinessAccount = () => {
    return facebookData?.businessAccounts.find(
      (ba) => ba.id === selectedBusinessAccountId,
    );
  };

  const getAccountStatusText = (status: number) => {
    switch (status) {
      case 1:
        return "Active";
      case 2:
        return "Disabled";
      case 3:
        return "Unsettled";
      case 7:
        return "Pending Review";
      case 8:
        return "Pending Closure";
      case 9:
        return "Closed";
      default:
        return "Unknown";
    }
  };

  const getAccountStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "bg-secondary/10 text-secondary";
      case 2:
        return "bg-destructive/10 text-destructive";
      case 3:
        return "bg-accent/10 text-accent-foreground";
      case 7:
        return "bg-primary/10 text-primary";
      case 8:
        return "bg-primary/10 text-primary";
      case 9:
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground text-lg">
            Loading Facebook accounts...
          </p>
        </div>
      </div>
    );
  }

  if (!facebookData) {
    return (
      <div className="bg-background flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Globe className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-lg font-semibold">
            No Facebook Account Connected
          </h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Please connect your Facebook account first
          </p>
          <Link href={`/marketing-automation/canvas/${projectId}`}>
            <Button>
              <ArrowLeft className="h-4 w-4" />
              Back to Campaign
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <div className="border-border bg-background/90 sticky top-0 z-10 h-12 border-b backdrop-blur-sm md:h-16">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/marketing-automation/canvas/${projectId}/publish`}>
              <Button variant="ghost" size="icon" title="Back to Campaign">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
                <Globe className="text-primary size-5" />
                Select Facebook Accounts
              </h1>
              <p className="text-muted-foreground hidden text-xs md:block">
                Choose which pages, business account, and ad account to use for
                publishing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="rounded-lg px-4 py-2 text-sm font-medium"
            >
              {selectedAdIds.length} ads selected
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-lg px-4 py-2 text-sm font-medium"
            >
              {facebookData.user.name}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Facebook Pages Selection */}
          <Card className="rounded-2xl p-6">
            <CardHeader className="mb-6 flex flex-row items-center gap-3 px-0">
              <div className="border-primary/30 bg-primary/10 rounded-lg border p-2">
                <Globe className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Facebook Pages
                </CardTitle>
                <CardDescription>Select pages to publish to</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 px-0">
              {facebookData.pages.map((page) => {
                const isSelected = selectedPageIds.includes(page.id);
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => handlePageToggle(page.id)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border/60 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/70"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <h4 className="text-foreground font-medium">
                          {page.name}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {page.category}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>

            {selectedPageIds.length > 0 && (
              <CardContent className="px-0">
                <Badge
                  variant="secondary"
                  className="text-primary rounded-lg px-3 py-2 text-sm"
                >
                  {selectedPageIds.length} page
                  {selectedPageIds.length > 1 ? "s" : ""} selected
                </Badge>
              </CardContent>
            )}
          </Card>

          {/* Business Accounts Selection */}
          <Card className="rounded-2xl p-6">
            <CardHeader className="mb-6 flex flex-row items-center gap-3 px-0">
              <div className="border-secondary/30 bg-secondary/10 rounded-lg border p-2">
                <Building2 className="text-secondary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Business Account
                </CardTitle>
                <CardDescription>Select business account</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 px-0">
              {facebookData.businessAccounts.map((businessAccount) => {
                const isSelected =
                  selectedBusinessAccountId === businessAccount.id;
                return (
                  <button
                    key={businessAccount.id}
                    type="button"
                    onClick={() =>
                      handleBusinessAccountSelect(businessAccount.id)
                    }
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-secondary bg-secondary/10"
                        : "border-border/60 hover:border-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? "border-secondary bg-secondary text-secondary-foreground"
                            : "border-border/70"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <h4 className="text-foreground font-medium">
                          {businessAccount.name}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {businessAccount.adsAccounts.length} ad account
                          {businessAccount.adsAccounts.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Ad Accounts Selection */}
          <Card className="rounded-2xl p-6">
            <CardHeader className="mb-6 flex flex-row items-center gap-3 px-0">
              <div className="border-accent/30 bg-accent/10 rounded-lg border p-2">
                <CreditCard className="text-accent h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Ad Account</CardTitle>
                <CardDescription>Select ad account</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-0">
              {selectedBusinessAccountId ? (
                <div className="space-y-3">
                  {getSelectedBusinessAccount()?.adsAccounts.map(
                    (adAccount) => {
                      const isSelected = selectedAdsAccountId === adAccount.id;
                      return (
                        <button
                          key={adAccount.id}
                          type="button"
                          onClick={() => handleAdAccountSelect(adAccount.id)}
                          className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                            isSelected
                              ? "border-accent bg-accent/10"
                              : "border-border/60 hover:border-accent/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                isSelected
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border/70"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <div>
                              <h4 className="text-foreground font-medium">
                                {adAccount.name}
                              </h4>
                              <div className="mt-1 flex items-center gap-2">
                                <span
                                  className={`rounded px-2 py-1 text-xs font-medium ${getAccountStatusColor(
                                    adAccount.account_status,
                                  )}`}
                                >
                                  {getAccountStatusText(
                                    adAccount.account_status,
                                  )}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {adAccount.currency}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Users className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground text-sm">
                    Select a business account first to view ad accounts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pixels Section */}
          <Card className="rounded-2xl p-6">
            <CardHeader className="mb-6 flex flex-row items-center gap-3 px-0">
              <div className="border-primary/30 bg-primary/10 rounded-lg border p-2">
                <Activity className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Meta Pixels</CardTitle>
                <CardDescription>
                  Available tracking pixels (optional)
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-0">
              {selectedBusinessAccountId ? (
                <div className="space-y-3">
                  {isLoadingPixels ? (
                    <div className="py-8 text-center">
                      <Loader2 className="text-primary mx-auto mb-3 h-8 w-8 animate-spin" />
                      <p className="text-muted-foreground text-sm">
                        Loading pixels...
                      </p>
                    </div>
                  ) : (
                    <>
                      {pixelsWarning && (
                        <div className="border-accent/30 bg-accent/10 text-accent-foreground rounded-lg border p-4 text-sm">
                          <div className="flex items-start gap-3">
                            <div className="bg-accent mt-1 h-2 w-2 rounded-full"></div>
                            <div>
                              <p className="font-medium">
                                Permissions Required
                              </p>
                              <p className="mt-1 text-xs">{pixelsWarning}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {pixels.length > 0 ? (
                        pixels.map((pixel) => {
                          const isSelected = selectedPixelId === pixel.id;
                          return (
                            <button
                              key={pixel.id}
                              type="button"
                              onClick={() => setSelectedPixelId(pixel.id)}
                              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/10"
                                  : "border-border/60 hover:border-primary/50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border/70"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-foreground font-medium">
                                    {pixel.name}
                                  </h4>
                                  <p className="text-muted-foreground mt-1 text-xs">
                                    ID: {pixel.id}
                                  </p>
                                  {pixel.last_fired_time && (
                                    <p className="text-secondary mt-1 text-xs">
                                      Last fired:{" "}
                                      {new Date(
                                        parseInt(pixel.last_fired_time) * 1000,
                                      ).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : !pixelsWarning ? (
                        <div className="py-8 text-center">
                          <Activity className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                          <p className="text-muted-foreground text-sm">
                            No pixels found for this business account
                          </p>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Activity className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground text-sm">
                    Select a business account first to view pixels
                  </p>
                </div>
              )}

              {selectedPixelId && (
                <div className="mt-4">
                  <Badge
                    variant="secondary"
                    className="text-primary rounded-lg px-3 py-2 text-sm"
                  >
                    ✓ Pixel selected for tracking
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CTA and Action URL Section */}
        {uniqueCTAs.length > 0 && (
          <Card className="mt-6 rounded-2xl p-6">
            <CardHeader className="mb-6 flex flex-row items-center gap-3 px-0">
              <div className="border-accent/30 bg-accent/10 rounded-lg border p-2">
                <MousePointerClick className="text-accent h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Call-to-Actions (CTAs)
                </CardTitle>
                <CardDescription>
                  CTAs from selected ads with action URL
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 px-0">
              {uniqueCTAs.map(({ cta, count }) => {
                const isEditing = editingCTA === cta;
                const isShopNow = cta === "SHOP_NOW";
                return (
                  <div
                    key={cta}
                    className="border-border/60 bg-card/80 rounded-lg border-2 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Badge
                        variant="secondary"
                        className="mt-1 rounded-lg px-3 py-1 text-sm font-bold"
                      >
                        {count}
                      </Badge>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-foreground text-lg font-bold">
                            {cta.replace(/_/g, " ")}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="px-2 py-0.5 text-xs font-medium"
                          >
                            {isShopNow ? "Full URL" : "Base URL"}
                          </Badge>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              type="text"
                              value={tempUrl}
                              onChange={(e) => setTempUrl(e.target.value)}
                              placeholder="Enter URL"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveCTAUrl(cta)}
                                className="gap-1"
                              >
                                <Save className="h-3 w-3" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ExternalLink className="text-primary h-4 w-4 shrink-0" />
                            <a
                              href={ctaUrls.get(cta) || projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 flex-1 truncate text-sm font-medium hover:underline"
                            >
                              {ctaUrls.get(cta) || projectUrl || "No URL set"}
                            </a>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEditCTA(cta)}
                              title="Edit URL"
                            >
                              <Edit2 className="text-muted-foreground h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>

            {!projectUrl && (
              <CardContent className="px-0">
                <div className="border-accent/30 bg-accent/10 text-accent-foreground rounded-lg border p-3 text-sm">
                  ⚠️ No action URL found in project. CTAs will not have a
                  destination URL.
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Selection Summary */}
        {(selectedPageIds.length > 0 ||
          selectedBusinessAccountId ||
          selectedAdsAccountId ||
          selectedPixelId) && (
          <Card className="mt-6 rounded-2xl p-6">
            <CardHeader className="flex flex-row items-center gap-2 px-0">
              <Check className="text-secondary h-5 w-5" />
              <CardTitle className="text-lg font-bold">
                Selection Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {selectedPageIds.length > 0 && (
                  <div className="border-primary/30 bg-card/80 rounded-lg border p-3">
                    <p className="text-muted-foreground mb-1 text-xs">
                      Facebook Page(s)
                    </p>
                    <p className="text-foreground text-sm font-semibold">
                      {selectedPageIds.length} selected
                    </p>
                  </div>
                )}
                {selectedBusinessAccountId && (
                  <div className="border-secondary/30 bg-card/80 rounded-lg border p-3">
                    <p className="text-muted-foreground mb-1 text-xs">
                      Business Account
                    </p>
                    <p className="text-foreground text-sm font-semibold">
                      {getSelectedBusinessAccount()?.name}
                    </p>
                  </div>
                )}
                {selectedAdsAccountId && (
                  <div className="border-accent/30 bg-card/80 rounded-lg border p-3">
                    <p className="text-muted-foreground mb-1 text-xs">
                      Ad Account
                    </p>
                    <p className="text-foreground text-sm font-semibold">
                      {
                        getSelectedBusinessAccount()?.adsAccounts.find(
                          (acc) => acc.id === selectedAdsAccountId,
                        )?.name
                      }
                    </p>
                  </div>
                )}
                {selectedPixelId && (
                  <div className="border-primary/30 bg-card/80 rounded-lg border p-3">
                    <p className="text-muted-foreground mb-1 text-xs">
                      Meta Pixel
                    </p>
                    <p className="text-foreground text-sm font-semibold">
                      {pixels.find((p) => p.id === selectedPixelId)?.name}
                    </p>
                  </div>
                )}
              </div>
              {uniqueCTAs.length > 0 && (
                <div className="border-accent/30 bg-card/80 rounded-lg border p-3">
                  <p className="text-muted-foreground mb-2 text-xs">
                    Call-to-Actions with URLs
                  </p>
                  <div className="space-y-1 text-xs">
                    {uniqueCTAs.map(({ cta }) => (
                      <div key={cta} className="flex items-center gap-2">
                        <span className="text-accent font-semibold">
                          {cta.replace(/_/g, " ")}:
                        </span>
                        <span className="text-muted-foreground truncate">
                          {ctaUrls.get(cta) || projectUrl || "No URL"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSaveAndContinue}
            disabled={
              selectedPageIds.length === 0 ||
              !selectedBusinessAccountId ||
              !selectedAdsAccountId ||
              isSaving
            }
            className="gap-2 px-8"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSaving ? "Publishing..." : `Publish ${selectedAdIds.length} Ads`}
          </Button>
        </div>
      </div>
    </div>
  );
}
