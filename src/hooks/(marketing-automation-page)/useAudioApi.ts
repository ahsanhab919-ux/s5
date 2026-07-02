import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface GenerateDialogueAudioPayload {
  script: string;
  voiceId?: string;
}

interface GenerateDialogueAudioResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
  message?: string;
}

export const useGenerateDialogueAudio = () => {
  return useMutation({
    mutationFn: async (payload: GenerateDialogueAudioPayload) => {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post<GenerateDialogueAudioResponse>(
        `${API_URL}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}audio/generate-dialogue`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
  });
};
