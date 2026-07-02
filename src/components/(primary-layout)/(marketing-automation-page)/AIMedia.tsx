"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import type { RootState } from "@/redux/store";
import { AlignCenter, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AIShortsSection from "./AIMedia/AIShortsSection";
import AvatarsSection from "./AIMedia/AvatarsSection";
import MediasSection from "./AIMedia/MediasSection";
import Sidebar, {
  mediaSidebarSections,
  type MediaSidebarSectionId,
} from "./AIMedia/Sidebar";
import SmartAssetsSection from "./AIMedia/SmartAssetsSection";
import UGCVideoSection from "./AIMedia/UGCVideoSection";

export default function AIMedia() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);

  // Get section from URL or default to creative-tools
  const DEFAULT_SECTION: MediaSidebarSectionId = "smart-assets";

  const isValidSection = useCallback(
    (section: string | null): section is MediaSidebarSectionId =>
      !!section &&
      mediaSidebarSections.some(
        (sidebarSection) => sidebarSection.id === section,
      ),
    [],
  );

  const sectionFromUrl = searchParams.get("section");
  const [activeSidebar, setActiveSidebar] = useState<MediaSidebarSectionId>(
    isValidSection(sectionFromUrl) ? sectionFromUrl : DEFAULT_SECTION,
  );
  const [isInitialMount, setIsInitialMount] = useState(true);

  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const isMobile = useResponsive("down", "md");

  // Close sheet when screen size changes from mobile to desktop
  useEffect(() => {
    if (!isMobile && isSidebarSheetOpen) {
      setIsSidebarSheetOpen(false);
    }
  }, [isMobile, isSidebarSheetOpen]);

  // Update URL when sidebar changes
  const updateURL = useCallback(
    (section: MediaSidebarSectionId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", section);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Sync state with URL on mount and when URL changes
  useEffect(() => {
    const urlSection = searchParams.get("section");
    if (isValidSection(urlSection) && urlSection !== activeSidebar) {
      setActiveSidebar(urlSection);
    } else if (!isValidSection(urlSection) && isInitialMount) {
      // Set default section in URL on initial mount if not present
      updateURL(DEFAULT_SECTION);
    }
    setIsInitialMount(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when sidebar changes (but not on initial mount)
  useEffect(() => {
    if (!isInitialMount) {
      const currentSection = searchParams.get("section");
      if (!isValidSection(currentSection) || currentSection !== activeSidebar) {
        updateURL(activeSidebar);
      }
    }
  }, [activeSidebar, isInitialMount, isValidSection, searchParams, updateURL]);

  const handleToolClick = (toolId: string) => {
    // Navigate to specific tool page
    router.push(`/marketing-automation/media/${projectId}/${toolId}`);
  };

  const renderContent = () => {
    switch (activeSidebar) {
      case "avatars":
        return <AvatarsSection onToolClick={handleToolClick} />;
      case "smart-assets":
        return <SmartAssetsSection userId={user?.id || ""} />;
      case "medias":
        return <MediasSection userId={user?.id || ""} />;
      case "ai-shorts":
        return <AIShortsSection onToolClick={handleToolClick} />;
      case "ugc-video":
        return <UGCVideoSection />;
      default:
        return <AvatarsSection onToolClick={handleToolClick} />;

      // case "creative-tools":
      // default:
      //   return <CreativeToolsSection onToolClick={handleToolClick} />;
    }
  };

  return (
    <div className="bg-background flex flex-1 flex-col">
      {/* Header */}
      <div className="border-border bg-background/90 sticky top-0 z-10 flex h-12 items-center justify-center border-b backdrop-blur-sm md:h-16">
        <div className="mx-auto flex h-full w-full items-center px-4 md:px-6">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Back to analysis"
              >
                <Link href="/marketing-automation">
                  <ArrowLeft className="size-5" />
                </Link>
              </Button>
              <h1 className="text-foreground text-xl font-semibold">
                AI Media Studio
              </h1>
            </div>
            <div></div>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="border-border bg-background/90 sticky top-12 z-10 border-b px-4 py-3 backdrop-blur-sm md:hidden">
        <nav className="flex items-center gap-1 overflow-x-auto">
          {mediaSidebarSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSidebar === section.id;
            return (
              <Button
                key={section.id}
                onClick={() => setActiveSidebar(section.id)}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-2 whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{section.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="relative grid md:grid-cols-3 xl:grid-cols-4">
        {/* Desktop ChatBox - Hidden on mobile */}
        <div
          className={cn(
            "bg-background sticky top-16 bottom-0 left-0 hidden overflow-hidden overflow-y-auto md:block md:h-[calc(100vh-8rem)] md:border-e",
          )}
        >
          <Sidebar
            activeSidebar={activeSidebar}
            setActiveSidebar={setActiveSidebar}
          />
        </div>

        {/* Canvas Body - Full width on mobile, 2/3 on desktop */}
        <div className="bg-background overflow-hidden md:col-span-2 xl:col-span-3">
          {activeSidebar === "smart-assets" || activeSidebar === "medias" ? (
            activeSidebar === "smart-assets" ? (
              <SmartAssetsSection userId={user?.id || ""} />
            ) : (
              <MediasSection userId={user?.id || ""} />
            )
          ) : (
            <div className="custom-scrollbar h-full overflow-y-auto">
              {renderContent()}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Button - Floating action button */}
      <Button
        onClick={() => setIsSidebarSheetOpen(true)}
        size="icon-lg"
        className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 md:hidden"
        aria-label="Open chat"
      >
        <AlignCenter className="h-6 w-6" />
      </Button>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarSheetOpen} onOpenChange={setIsSidebarSheetOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-sm overflow-hidden p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>AI Assistant</SheetTitle>
          </SheetHeader>
          <div className="h-full">
            <Sidebar
              activeSidebar={activeSidebar}
              setActiveSidebar={setActiveSidebar}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
