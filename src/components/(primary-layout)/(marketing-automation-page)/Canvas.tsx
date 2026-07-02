"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCampaignData,
  useInitialSuggestions,
} from "@/hooks/(marketing-automation-page)/useCampaignsApi";
import { useProject } from "@/hooks/(marketing-automation-page)/useProjectsApi";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import type { ProductAnalysis } from "@/types/analysis";
import type { CampaignSuggestion } from "@/types/campaign";
import { getRouteState } from "@/utils/getRouteState";
import { ArrowLeft, Loader2, MessageCircle, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import CanvasBody from "./canvas/CanvasBody";
import ChatBox from "./canvas/ChatBox";

export default function Canvas() {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const state = getRouteState(searchParams);

  const [hasShownWelcomeMessage, setHasShownWelcomeMessage] = useState(false);

  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp?: Date }>
  >([]);
  const [isChatSheetOpen, setIsChatSheetOpen] = useState(false);
  const isMobile = useResponsive("down", "md");

  // Get analysis from location state or fetch from API
  const hasAnalysisInState = !!state?.analysis;
  const { data: projectData, isLoading: isLoadingProject } = useProject(
    projectId || "",
  );

  // Check if campaign data already exists in the database
  const { data: existingCampaignData, isLoading: isLoadingCampaignData } =
    useCampaignData(projectId || "");

  // Fetch initial suggestions only when we have analysis
  const hasAnalysis = hasAnalysisInState || !!projectData?.data;

  // Check if campaign data exists (has campaigns, adSets, ads, or personas)
  const hasCampaignData =
    existingCampaignData?.data &&
    ((existingCampaignData.data.campaigns?.length ?? 0) > 0 ||
      (existingCampaignData.data.adSets?.length ?? 0) > 0 ||
      (existingCampaignData.data.ads?.length ?? 0) > 0 ||
      (existingCampaignData.data.personas?.length ?? 0) > 0);


  // Only generate initial suggestions if we have analysis but NO existing campaign data
  const shouldGenerateSuggestions =
    hasAnalysis && !hasCampaignData && !isLoadingCampaignData;


  const {
    data: suggestionsResponse,
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
  } = useInitialSuggestions(projectId || "", shouldGenerateSuggestions);


  const analysis = useMemo((): ProductAnalysis | null => {
    if (state?.analysis) {
      return state.analysis;
    }

    if (projectData?.data) {
      const data = projectData.data;
      return {
        analysis_id: data.analysis_id,
        url: data.url,
        timestamp: data.timestamp,
        scrape_status: data.scrape_status,
        product: data.product,
        social_proof: data.social_proof,
        website: data.website,
        competitors: data.competitors,
        funnel: data.funnel,
        market: data.market,
        brand: data.brand,
      };
    }

    return null;
  }, [state?.analysis, projectData]);

  const initialSuggestions = useMemo((): CampaignSuggestion | null => {

    // If we have suggestions from the API, use them
    if (suggestionsResponse?.data) {
      return suggestionsResponse.data;
    }

    // If we have existing campaign data but no suggestions, reconstruct from campaign data
    if (hasCampaignData && existingCampaignData?.data) {
      const data = existingCampaignData.data;

      const firstCampaign = data.campaigns?.[0];
      if (!firstCampaign) return null;

      // Reconstruct the suggestions object from saved campaign data
      return {
        campaign: {
          name: firstCampaign.name,
          objective: firstCampaign.objective,
          budget_recommendation: {
            daily_min: firstCampaign.budget || 10,
            daily_max: (firstCampaign.budget || 10) * 2,
            reasoning: "Budget based on saved campaign data",
          },
        },
        ad_sets: data.adSets || [],
        personas: data.personas || [],
        ad_concepts: data.ads || [],
        strategy_notes: (firstCampaign as any).strategy_notes || [],
      } as CampaignSuggestion;
    }

    return null;
  }, [suggestionsResponse, hasCampaignData, existingCampaignData]);

  const loading = isLoadingProject && !hasAnalysisInState;

  // Close sheet when screen size changes from mobile to desktop
  useEffect(() => {
    if (!isMobile && isChatSheetOpen) {
      setIsChatSheetOpen(false);
    }
  }, [isMobile, isChatSheetOpen]);

  // Memoized callback to add messages
  const handleSendMessage = useCallback(
    (message: {
      role: "user" | "assistant";
      content: string;
      timestamp?: Date;
    }) => {
      setChatMessages((prev) => [...prev, message]);
    },
    [],
  );

  // Callback when campaign data is modified by AI
  const handleDataModified = useCallback(() => {

    // Force canvas body to reload by triggering a custom event
    // DON'T reset initialSuggestions - that would trigger the welcome message again
    const event = new CustomEvent("campaignDataUpdated", {
      detail: { timestamp: Date.now() },
    });
    window.dispatchEvent(event);
  }, []);

  // Show welcome message when suggestions are loaded
  useEffect(() => {
    if (
      analysis &&
      initialSuggestions &&
      !hasShownWelcomeMessage &&
      !isLoadingSuggestions
    ) {
      const summaryMessage = `✨ **Campaign Strategy Ready!**

I've created a comprehensive campaign structure for **${
        analysis.product.title
      }** based on Meta's 2025 Andromeda strategy:

📊 **Campaign**: ${initialSuggestions.campaign.name}
💰 **Recommended Budget**: $${
        initialSuggestions.campaign.budget_recommendation.daily_min
      }-${initialSuggestions.campaign.budget_recommendation.daily_max}/day
🎯 **Objective**: ${initialSuggestions.campaign.objective}

👥 **${initialSuggestions.personas.length} Buyer Personas** identified
🎨 **${
        initialSuggestions.ad_concepts.length
      } Ad Concepts** created across all awareness stages

**Key Strategy Notes:**
${initialSuggestions.strategy_notes
  .map((note: string) => `• ${note}`)
  .join("\n")}

Would you like me to explain the personas, show you the ad concepts, or help you refine any part of this strategy?`;

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: summaryMessage },
      ]);
      setHasShownWelcomeMessage(true);
    }
  }, [
    analysis,
    initialSuggestions,
    hasShownWelcomeMessage,
    isLoadingSuggestions,
  ]);

  // Show error message if suggestions failed to load
  useEffect(() => {
    if (
      analysis &&
      !initialSuggestions &&
      !isLoadingSuggestions &&
      !hasShownWelcomeMessage &&
      suggestionsResponse === undefined
    ) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered an issue generating initial suggestions. But don't worry! I can still help you create campaigns. What would you like to work on?",
        },
      ]);
      setHasShownWelcomeMessage(true);
    }
  }, [
    analysis,
    initialSuggestions,
    isLoadingSuggestions,
    hasShownWelcomeMessage,
    suggestionsResponse,
  ]);

  if (loading) {
    return (
      <div className="bg-background flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-background flex flex-1 items-center justify-center p-6">
        <Card className="p-8 text-center">
          <h2 className="text-foreground mb-4 text-2xl font-bold">
            No Analysis Data
          </h2>
          <p className="text-muted-foreground mb-6">
            Please complete a URL analysis first.
          </p>
          <Link href="/marketing-automation">
            <Button className="inline-flex items-center gap-2">
              <ArrowLeft className="size-5" />
              Back to Analysis
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background flex flex-1 flex-col">
      {/* Header */}
      <div className="border-border bg-background/90 sticky top-0 z-10 flex min-h-12 items-center justify-center border-b py-1 backdrop-blur-sm md:h-16">
        <div className="w-full px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/marketing-automation">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Back to analysis"
                >
                  <ArrowLeft className="size-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Campaign Canvas</h1>
                <p className="text-muted-foreground hidden text-xs lg:block">
                  {analysis.product.title}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <Badge className="px-4 py-2">
                <p className="text-sm font-medium">✓ Analysis Ready</p>
              </Badge>
              {/* <div className="border-border bg-muted flex items-center gap-2 rounded-lg border px-4 py-2">
                <Save className="text-muted-foreground h-4 w-4" />
                <p className="text-foreground text-sm font-medium">Saved</p>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative grid md:grid-cols-3">
        {/* Desktop ChatBox - Hidden on mobile */}
        <div
          className={cn(
            "bg-background sticky top-16 bottom-0 left-0 hidden overflow-hidden overflow-y-auto md:block md:h-[calc(100vh-8rem)] md:border-e",
          )}
        >
          <ChatBox
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            analysis={analysis}
            projectId={projectId || ""}
            onDataModified={handleDataModified}
          />
        </div>

        {/* Canvas Body - Full width on mobile, 2/3 on desktop */}
        <div className="bg-background overflow-hidden md:col-span-2">
          <CanvasBody
            analysis={analysis}
            initialSuggestions={initialSuggestions}
            loadingSuggestions={isLoadingSuggestions}
          />
        </div>
      </div>

      {/* Mobile Chat Button - Floating action button */}
      <Button
        onClick={() => setIsChatSheetOpen(true)}
        size="icon-lg"
        className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 md:hidden"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        {chatMessages.length > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold">
            {chatMessages.length}
          </span>
        )}
      </Button>

      {/* Mobile Chat Sheet */}
      <Sheet open={isChatSheetOpen} onOpenChange={setIsChatSheetOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-sm overflow-hidden p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>AI Assistant</SheetTitle>
          </SheetHeader>
          <div className="h-full">
            <ChatBox
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              analysis={analysis}
              projectId={projectId || ""}
              onDataModified={handleDataModified}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
