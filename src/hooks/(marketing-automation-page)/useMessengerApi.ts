import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get all messages for a page
export const usePageMessages = (pageId: string | null) => {
  return useQuery({
    queryKey: ["messenger-messages", pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/messenger/messages/${pageId}`,
      );
      return data.data;
    },
    enabled: !!pageId,
    // refetchInterval: 5000,
  });
};

// Get conversation with specific user
export const useConversation = (
  pageId: string | null,
  senderId: string | null,
) => {
  return useQuery({
    queryKey: ["messenger-conversation", pageId, senderId],
    queryFn: async () => {
      if (!pageId || !senderId) return null;
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/messenger/conversation/${pageId}/${senderId}`,
      );
      return data.data;
    },
    enabled: !!pageId && !!senderId,
    // refetchInterval: 3000, // Poll every 3 seconds for new messages
  });
};

// Get user profile from Facebook
export const useUserProfile = (
  pageId: string | null,
  userId: string | null,
) => {
  return useQuery({
    queryKey: ["messenger-user-profile", pageId, userId],
    queryFn: async () => {
      if (!pageId || !userId) return null;
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/messenger/user/${pageId}/${userId}`,
      );
      return data.data;
    },
    enabled: !!pageId && !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Send message to user
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      recipientId,
      message,
    }: {
      pageId: string;
      recipientId: string;
      message: string;
    }) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/messenger/send`,
        {
          pageId,
          recipientId,
          message,
        },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate conversation to show new message
      queryClient.invalidateQueries({
        queryKey: [
          "messenger-conversation",
          variables.pageId,
          variables.recipientId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["messenger-messages", variables.pageId],
      });
    },
  });
};
