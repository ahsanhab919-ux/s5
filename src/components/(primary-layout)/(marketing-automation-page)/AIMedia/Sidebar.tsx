import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RootState } from "@/redux/store";
import {
  FileVideo,
  Film,
  ShoppingBag,
  Users as UsersIcon,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export const mediaSidebarSections = [
  // {
  //   id: "creative-tools",
  //   label: "Creative Tools",
  //   icon: Palette,
  // },
  {
    id: "smart-assets",
    label: "Smart Assets",
    icon: ShoppingBag,
  },
  {
    id: "avatars",
    label: "Avatars",
    icon: UsersIcon,
  },
  {
    id: "ai-shorts",
    label: "AI Shorts",
    icon: Film,
  },
  {
    id: "ugc-video",
    label: "UGC Video",
    icon: Video,
  },
  {
    id: "medias",
    label: "Medias",
    icon: FileVideo,
  },
] as const;

export type MediaSidebarSectionId = (typeof mediaSidebarSections)[number]["id"];
type MediaSidebarSection = (typeof mediaSidebarSections)[number];

interface SidebarProps {
  activeSidebar: MediaSidebarSectionId;
  setActiveSidebar: (id: MediaSidebarSectionId) => void;
}

export default function Sidebar({
  activeSidebar,
  setActiveSidebar,
}: SidebarProps) {
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="border-border bg-card/50 flex h-full w-full flex-col border-r">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {mediaSidebarSections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                onClick={() => setActiveSidebar(section.id)}
                variant={activeSidebar === section.id ? "default" : "ghost"}
                className={cn(
                  "flex w-full items-center justify-start gap-3",
                  activeSidebar === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{section.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}