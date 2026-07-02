import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface GenerateUGCVideoPayload {
  audio: string;
  image: string;
  name?: string;
  text_prompt?: string;
  model_version?: "aurora_v1" | "aurora_v1_fast";
  metadata?: Record<string, unknown>;
}

interface GenerateUGCVideoResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  message?: string;
}

export const useGenerateUGCVideo = () => {
  return useMutation({
    mutationFn: async (payload: GenerateUGCVideoPayload) => {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post<GenerateUGCVideoResponse>(
        `${API_URL}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}ugc-video/generate`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
  });
};
