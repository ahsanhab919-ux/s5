import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface GenerateAIShortPayload {
  script: string;
  aspect_ratio: "9x16" | "16x9" | "1x1";
  style: string;
  accent?: string;
  caption_setting?: {
    style: string;
  };
  background_music_url?: string | null;
  background_music_volume?: number;
  voiceover_volume?: number;
  metadata?: {
    userId?: string;
    projectId?: string;
    campaignDataId?: string;
    adId?: string;
  };
}

export const useGenerateAIShort = () => {
  return useMutation({
    mutationFn: async (payload: GenerateAIShortPayload) => {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${API_URL}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}ai-shorts/generate`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
  });
};
