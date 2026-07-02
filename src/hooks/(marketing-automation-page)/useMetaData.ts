"use client";

import { metaAPI } from "@/services/marketing-automation.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

interface MetaUserData {
  user: {
    id: string;
    name: string;
    email: string;
    access_token: string;
  };
  pages: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
    category_list: Array<{ id: string; name: string }>;
    tasks: string[];
  }>;
  businessAccounts: Array<{
    id: string;
    name: string;
    access_token: string;
    adsAccounts: Array<{
      id: string;
      name: string;
      account_status: number;
      currency: string;
      timezone_name: string;
    }>;
  }>;
  selectedPageIds: string[];
  selectedBusinessAccountId: string;
  selectedAdsAccountId: string;
}

// Fetch Meta user data
export const useMetaData = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);

  return useQuery<MetaUserData | null>({
    queryKey: ["metaData"],
    queryFn: async () => {
      try {
        const response = await metaAPI.getUserData();
        return response.success ? response.data : null;
      } catch (error) {
        console.error("Failed to fetch Meta data:", error);
        return null;
      }
    },
    enabled: !!accessToken,
    retry: false,
  });
};

// Initiate Meta auth (mutation - does not need enabled)
export const useMetaAuth = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await metaAPI.initiateAuth();
      return response;
    },
  });
};

// Disconnect Meta account
export const useMetaDisconnect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => metaAPI.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metaData"] });
    },
  });
};

// Fetch pixels for a business account
export const useMetaPixels = (businessAccountId: string) => {
  const { accessToken } = useSelector((state: RootState) => state.auth);

  return useQuery({
    queryKey: ["metaPixels", businessAccountId],
    queryFn: async () => metaAPI.getPixels(businessAccountId),
    enabled: !!accessToken && !!businessAccountId,
  });
};

// Update Meta account selections
export const useUpdateMetaSelections = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selections: {
      selectedPageIds: string[];
      selectedBusinessAccountId: string;
      selectedAdsAccountId: string;
    }) => metaAPI.updateSelections(selections),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metaData"] });
    },
  });
};

// Get webhook subscription status for a page
export const useWebhookStatus = (pageId: string) => {
  const { accessToken } = useSelector((state: RootState) => state.auth);

  return useQuery({
    queryKey: ["webhookStatus", pageId],
    queryFn: async () => {
      const response = await metaAPI.getWebhookStatus(pageId);
      return response.data;
    },
    enabled: !!accessToken && !!pageId,
  });
};

// Subscribe a page to webhook
export const useSubscribeWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => metaAPI.subscribeWebhook(pageId),
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({ queryKey: ["webhookStatus", pageId] });
    },
  });
};

// Unsubscribe a page from webhook
export const useUnsubscribeWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => metaAPI.unsubscribeWebhook(pageId),
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({ queryKey: ["webhookStatus", pageId] });
    },
  });
};
