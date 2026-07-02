import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

interface Project {
  _id: string;
  url: string;
  analysis_id: string;
  product: {
    title: string;
    brand: string;
    category: string;
    description: string;
  };
  createdAt: string;
}

interface ProjectsResponse {
  success: boolean;
  data: Project[];
}

interface AnalysisPayload {
  url: string;
  selectedPlatforms: string[];
}

// Fetch all projects
export const useProjects = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);

  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await api.get<ProjectsResponse>(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}projects`,
      );
      return data.data || [];
    },
    enabled: !!accessToken,
  });
};

// Fetch single project
export const useProject = (projectId: string) => {
  const { accessToken } = useSelector((state: RootState) => state.auth);

  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}projects/${projectId}`,
      );
      return data;
    },
    enabled: !!accessToken && !!projectId,
  });
};

// Delete project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await api.delete(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}projects/${projectId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// Analyze URL
export const useAnalyzeUrl = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, AnalysisPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}analysis/analyze`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
