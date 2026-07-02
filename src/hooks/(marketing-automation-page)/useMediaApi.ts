import api from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  GroupedVoices,
  RawGroupedVoices,
  RawVoiceData,
  VideoGenerationPayload,
} from "@/types/media";

interface Ad {
  id: string;
  projectId: string;
  headline: string;
  primaryText: string;
  description: string;
  format: string;
}

interface ScriptGenerationResponse {
  success: boolean;
  script?: string;
  emotions_used?: string[];
  duration_estimate?: string;
  visual_style_prompt?: string;
  error?: string;
}

// Fetch voices
export const useVoices = () => {
  return useQuery<GroupedVoices>({
    queryKey: ["voices"],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/voices`,
      );

      // Get the actual data
      const voicesData: RawGroupedVoices = data.success && data.data ? data.data : data;

      // Transform the data structure
      // API returns: { male: [{ name, gender, accents: [{id, accent_name, preview_url}] }] }
      // We need: { male: [{ voice_id, voice_name, preview_audio_url }] }
      const transformedData: GroupedVoices = {};

      for (const gender in voicesData) {
        transformedData[gender] = [];

        voicesData[gender].forEach((voice: RawVoiceData) => {
          // Flatten each accent into a separate voice entry
          voice.accents.forEach((accent) => {
            transformedData[gender].push({
              voice_id: accent.id,
              voice_name: `${voice.name} - ${accent.accent_name}`,
              preview_audio_url: accent.preview_url,
              gender: voice.gender,
            });
          });
        });
      }

      return transformedData;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
};

// Fetch user ads
export const useUserAds = () => {
  return useQuery<Ad[]>({
    queryKey: ["userAds"],
    queryFn: async () => {
      const { data } = await api.get(
        "${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/ads",
      );
      return data.data;
    },
  });
};

// Generate script
export const useGenerateScript = () => {
  return useMutation<
    ScriptGenerationResponse,
    Error,
    { projectId: string; adId: string }
  >({
    mutationFn: async ({ projectId, adId }) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/generate-script/${projectId}/${adId}`,
      );
      return data;
    },
  });
};

// Generate UGC script (30 seconds max)
export const useGenerateUGCScript = () => {
  return useMutation<
    ScriptGenerationResponse,
    Error,
    { projectId: string; adId: string }
  >({
    mutationFn: async ({ projectId, adId }) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/generate-ugc-script/${projectId}/${adId}`,
      );
      return data;
    },
  });
};

// Generate AI prompt based on ad data
export const useGeneratePrompt = () => {
  return useMutation<
    { success: boolean; prompt?: string; error?: string },
    Error,
    { projectId: string; adId: string; generateType: string }
  >({
    mutationFn: async ({ projectId, adId, generateType }) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/generate-prompt/${projectId}/${adId}`,
        { generateType },
      );
      return data;
    },
  });
};

// Generate video
export const useGenerateVideo = () => {
  return useMutation<any, Error, VideoGenerationPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/generate-video`,
        payload,
      );
      return data;
    },
  });
};

// Fetch avatars with filters
export const useAvatars = (filters: {
  gender?: string;
  age?: string;
  ethnicity?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["avatars", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.age) params.append("age", filters.age);
      if (filters.ethnicity) params.append("ethnicity", filters.ethnicity);
      if (filters.search) params.append("search", filters.search);

      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/avatars?${params.toString()}`,
      );
      return data.data;
    },
    enabled: false, // Only fetch when explicitly called
  });
};

// Fetch creator styles
export const useCreatorStyles = (creatorName: string) => {
  return useQuery({
    queryKey: ["creatorStyles", creatorName],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/avatars/creator/${encodeURIComponent(creatorName)}`,
      );
      return data.data;
    },
    enabled: !!creatorName,
  });
};
