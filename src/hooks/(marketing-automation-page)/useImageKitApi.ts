import ap from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface ImageKitAuth {
  signature: string;
  expire: number;
  token: string;
}

// Fetch ImageKit authentication
export const useImageKitAuth = () => {
  return useQuery<ImageKitAuth>({
    queryKey: ["imagekitAuth"],
    queryFn: async () => {
      const { data } = await ap.get(
        `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}imagekit/auth`,
      );
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
