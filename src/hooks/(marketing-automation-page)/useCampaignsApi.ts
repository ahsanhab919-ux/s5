import api from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";

// Fetch campaign data
export const useCampaignData = (projectId: string) => {
  return useQuery({
    queryKey: ["campaignData", projectId],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/data/${projectId}`,
      );
      return data;
    },
    enabled: !!projectId,
  });
};

// Fetch meta insights
export const useMetaInsights = (projectId: string) => {
  return useQuery({
    queryKey: ["metaInsights", projectId],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}meta/insights/${projectId}`,
      );
      return data;
    },
    enabled: !!projectId,
  });
};

// Generate campaign suggestions
export const useCampaignSuggestions = () => {
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaigns/suggestions/${projectId}`,
      );
      return data;
    },
  });
};

// Generate campaign suggestions (mutation)
export const useGenerateCampaignSuggestions = () => {
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaigns/suggestions/${projectId}`,
      );
      return data;
    },
  });
};

// Fetch initial campaign suggestions
export const useInitialSuggestions = (
  projectId: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["initialSuggestions", projectId],
    queryFn: async () => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/initial-suggestions/${projectId}`,
      );
      return data;
    },
    enabled: !!projectId && enabled,
    staleTime: Infinity, // Keep data fresh indefinitely
    gcTime: Infinity, // Never garbage collect cached data
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false, // Don't refetch on network reconnection
  });
};

// Publish ads mutation
export const usePublishAds = () => {
  return useMutation({
    mutationFn: async (payload: {
      projectId: string;
      adIds: string[];
      pageId: string;
      adAccountId: string;
      pixelId?: string;
      businessAccountId: string;
      ctasWithUrls: Array<{ cta: string; url: string }>;
    }) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/publish/${payload.projectId}`,
        {
          adIds: payload.adIds,
          pageId: payload.pageId,
          adAccountId: payload.adAccountId,
          pixelId: payload.pixelId,
          businessAccountId: payload.businessAccountId,
          ctasWithUrls: payload.ctasWithUrls,
        },
      );
      return data;
    },
  });
};
