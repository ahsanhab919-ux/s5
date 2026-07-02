import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface SmartAsset {
  _id: string;
  userId: string;
  projectId: string;
  name: string;
  type: "image" | "video" | "logo";
  imagekitUrl: string;
  imagekitFileId: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateSmartAssetPayload {
  userId: string;
  projectId: string;
  name: string;
  type: "image" | "video" | "logo";
  imagekitUrl: string;
  imagekitFileId: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  tags?: string[];
}

interface UploadToImageKitPayload {
  file: string; // base64 or URL
  fileName: string;
  folder?: string;
  useUniqueFileName?: boolean;
}

// Get smart assets by project
export const useSmartAssetsByProject = (
  projectId: string,
  type?: "image" | "video" | "logo",
) => {
  return useQuery<{ success: boolean; data: SmartAsset[] }>({
    queryKey: ["smartAssets", "project", projectId, type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : "";
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}smart-assets/project/${projectId}${params}`,
      );
      return data;
    },
    enabled: !!projectId,
  });
};

// Get smart assets by user
export const useSmartAssetsByUser = (
  userId: string,
  projectId?: string,
  type?: "image" | "video" | "logo",
) => {
  return useQuery<{ success: boolean; data: SmartAsset[] }>({
    queryKey: ["smartAssets", "user", userId, projectId, type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (type) params.append("type", type);
      const queryString = params.toString() ? `?${params.toString()}` : "";
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}smart-assets/user/${userId}${queryString}`,
      );
      return data;
    },
    enabled: !!userId,
  });
};

// Get single smart asset
export const useSmartAsset = (id: string) => {
  return useQuery<{ success: boolean; data: SmartAsset }>({
    queryKey: ["smartAsset", id],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}smart-assets/${id}`,
      );
      return data;
    },
    enabled: !!id,
  });
};

interface ImageKitUploadResponse {
  success: boolean;
  data: {
    fileId: string;
    name: string;
    url: string;
    thumbnailUrl?: string;
    height?: number;
    width?: number;
    size: number;
    filePath: string;
    fileType: string;
  };
}

// Upload to ImageKit
export const useUploadToImageKit = () => {
  return useMutation<ImageKitUploadResponse, Error, UploadToImageKitPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}imagekit/upload`,
        payload,
      );
      return data;
    },
  });
};

// Create smart asset record
export const useCreateSmartAsset = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: SmartAsset },
    Error,
    CreateSmartAssetPayload
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}smart-assets`,
        payload,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["smartAssets", "project", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["smartAssets", "user", variables.userId],
      });
    },
  });
};

// Update smart asset
export const useUpdateSmartAsset = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: SmartAsset },
    Error,
    { id: string; updates: Partial<SmartAsset> }
  >({
    mutationFn: async ({ id, updates }) => {
      const { data } = await api.put(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}smart-assets/${id}`,
        updates,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["smartAssets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["smartAsset", data.data._id],
      });
    },
  });
};

// Delete smart asset
export const useDeleteSmartAsset = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    { id: string; imagekitFileId: string }
  >({
    mutationFn: async ({ id, imagekitFileId }) => {
      // Delete from ImageKit first
      await api.delete(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}imagekit/delete/${imagekitFileId}`,
      );
      // Then delete from MongoDB
      const { data } = await api.delete(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}smart-assets/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["smartAssets"],
      });
    },
  });
};

// Bulk delete smart assets
export const useBulkDeleteSmartAssets = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string; deletedCount: number },
    Error,
    { ids: string[]; imagekitFileIds: string[] }
  >({
    mutationFn: async ({ ids, imagekitFileIds }) => {
      // Delete from ImageKit first
      await Promise.all(
        imagekitFileIds.map((fileId) =>
          api.delete(
            `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}imagekit/delete/${fileId}`,
          ),
        ),
      );
      // Then bulk delete from MongoDB
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}smart-assets/bulk-delete`,
        {
          ids,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["smartAssets"],
      });
    },
  });
};

// AI Generation
export const useAIGeneration = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; data: { asset: SmartAsset; falResult: any } },
    Error,
    {
      type:
        | "text-to-image"
        | "image-to-video"
        | "text-to-video"
        | "image-to-image"
        | "reference-to-video"
        | "first-last-frame-to-video";
      model: string;
      prompt: string;
      aspectRatio?: string;
      outputCount?: number;
      startFrame?: string;
      endFrame?: string;
      referenceImages?: string[];
      userId: string;
      projectId: string;
    }
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}ai-generation/generate`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartAssets"] });
    },
  });
};
