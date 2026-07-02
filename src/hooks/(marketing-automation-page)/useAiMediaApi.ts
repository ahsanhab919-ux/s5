import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AiMedia {
  _id: string;
  userId: string;
  projectId: string;
  campaignId: string;
  adId: string;
  requestId: string;
  type: "avatar" | "short" | "long";
  status: "pending" | "completed" | "failed";
  url?: string;
  thumbnail?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

// Get AI medias by project
export const useAiMediasByProject = (projectId: string) => {
  return useQuery({
    queryKey: ["aiMedias", projectId],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_URL}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}ai-media/project/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    enabled: !!projectId,
  });
};

// Get AI medias by user
export const useAiMediasByUser = (userId: string) => {
  return useQuery({
    queryKey: ["aiMedias", "user", userId],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_URL}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}ai-media/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    enabled: !!userId,
  });
};

// Get single AI media by ID
export const useAiMedia = (id: string) => {
  return useQuery({
    queryKey: ["aiMedia", id],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_URL}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}ai-media/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// Delete AI media
export const useDeleteAiMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(
        `${API_URL}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}ai-media/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiMedias"] });
    },
  });
};
