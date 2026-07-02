import api from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";

interface ChatMessage {
  role: string;
  content: string;
  timestamp?: string;
}

interface SendMessagePayload {
  message: string;
  projectId: string;
  conversationHistory: ChatMessage[];
}

// Fetch chat history
export const useChatHistory = (projectId: string, limit = 50) => {
  return useQuery({
    queryKey: ["chatHistory", projectId, limit],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}chat/history/${projectId}?limit=${limit}`,
      );
      return data;
    },
    enabled: !!projectId,
  });
};

// Send chat message
export const useSendMessage = () => {
  return useMutation<any, Error, SendMessagePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        "${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}chat/message",
        payload,
      );
      return data;
    },
  });
};

// Fetch mindmap history
export const useMindMapHistory = (analysisId: string) => {
  return useQuery({
    queryKey: ["mindMapHistory", analysisId],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}projects/${analysisId}/mindmap/history`,
      );
      return data;
    },
    enabled: !!analysisId,
  });
};

// Fetch mindmap
export const useMindMap = (analysisId?: string, mindMapId?: string) => {
  return useQuery({
    queryKey: ["mindMap", analysisId, mindMapId],
    queryFn: async () => {
      const url = mindMapId
        ? `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}projects/mindmap/${mindMapId}`
        : `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}projects/${analysisId}/mindmap`;
      const { data } = await api.get(url);
      return data;
    },
    enabled: !!(analysisId || mindMapId),
  });
};
