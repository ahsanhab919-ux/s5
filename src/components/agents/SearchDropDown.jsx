"use client";

import SvgColor from "@/components/common/SvgColor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";

const SearchDropdown = ({ setResearchModel, setTopLevel }) => {
  const [open, setOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("Level 1-3");

  const isMobile = useResponsive("down", "sm");
  const isMd = useResponsive("down", "md");
  const pathname = usePathname();
  const router = useRouter();

  const { user } = useSelector((state) => state.auth);

  // Check if user has premium access
  const userPackage = user?.package || "free";
  const isPremiumUser = ["value_plan", "pro_plan", "unlimited"].includes(
    userPackage,
    userPackage,
  );

  const handleMenuItemClick = (level, model, topLevel, isPremium = false) => {
    // If it's a premium feature and user doesn't have premium access
    if (isPremium && !isPremiumUser) {
      // Close the menu first
      setOpen(false);

      // Redirect to pricing page
      const redirectUrl = `/pricing?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
      return;
    }

    // For free features or premium users with premium features
    setSelectedLevel(level);
    setOpen(false);
    setResearchModel(model);
    setTopLevel(topLevel);
  };

  const handleUpgradeClick = (event) => {
    // Prevent event bubbling to avoid triggering the menu item click
    event.stopPropagation();

    // Close the menu
    setOpen(false);

    // Navigate to pricing page
    const redirectUrl = `/pricing?redirect=${encodeURIComponent(pathname)}`;
    router.push(redirectUrl);
  };

  const searchLevels = [
    {
      level: "Level 1-3",
      title: "Quick Research",
      description:
        "Fast, essential points only - from brief summary to Level 1 to a brief paragraph with key facts at Level 3",
      icon: "/agents/quick-research.svg",
      isPremium: false,
      model: "gemini-2.0-flash",
      topLevel: 2,
    },
    {
      level: "Level 4-7",
      title: "Standard Research",
      description:
        "Balanced detail - from concise 7 insights at Level 4 to a comprehensive written-up with examples and context at Level 7",
      icon: "/agents/standard-research.svg",
      isPremium: true,
      model: "gemini-2.0-flash",
      topLevel: 6,
    },
    {
      level: "Level 8-10",
      title: "Deep Dive",
      description:
        "Maximum depth - from detailed analysis at Level 8 to a full executive-style report with exhaustive references at Level 10",
      icon: "/agents/deep-dive.svg",
      isPremium: true,
      model: "gemini-2.5-pro",
      topLevel: 9,
    },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "bg-primary/10 text-muted-foreground focus-within:border-primary rounded-md font-semibold",
            isMobile ? "text-xs" : "text-sm",
          )}
        >
          {isMobile ? selectedLevel.replace("Level ", "Lv ") : selectedLevel}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          "mt-1 rounded-lg border shadow-lg",
          isMobile
            ? "max-w-[300px] min-w-[200px]"
            : "max-w-[400px] min-w-[320px]",
        )}
      >
        {searchLevels.map((item, index) => {
          const isPremiumFeature = item.isPremium && !isPremiumUser;

          return (
            <DropdownMenuItem
              key={index}
              onClick={() =>
                handleMenuItemClick(
                  item.level,
                  item.model,
                  item.topLevel,
                  item.isPremium,
                  item.isPremium,
                )
              }
              className={cn(
                "flex cursor-pointer flex-col items-start px-6 py-4 break-words whitespace-normal",
                index < searchLevels.length - 1 && "border-b",
                selectedLevel === item.level
                  ? "bg-primary/10 hover:bg-primary/20"
                  : "hover:bg-accent",
              )}
            >
              <div className="mb-1 flex w-full items-center justify-between">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <SvgColor
                      src={item.icon}
                      className={cn(
                        "h-4 w-4 md:h-5 md:w-5",
                        selectedLevel === item.level
                          ? "text-primary"
                          : "text-foreground",
                      )}
                    />
                    <p
                      className={cn(
                        "mr-2 font-semibold",
                        selectedLevel === item.level
                          ? "text-primary"
                          : "text-foreground",
                      )}
                    >
                      {item.level}
                    </p>
                    {item.isPremium && (
                      <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-[0.65rem] font-semibold">
                        {isPremiumUser ? "PRO" : "PRO"}
                      </span>
                    )}
                  </div>
                  <p className="text-primary font-medium">{item.title}</p>
                </div>

                {/* Show upgrade button only for premium features when user is not premium */}
                {isPremiumFeature && (
                  <Button
                    onClick={handleUpgradeClick}
                    size={isMd ? "default" : "sm"}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <SvgColor
                      src="/navbar/diamond.svg"
                      className="mr-2 h-4 w-4 md:h-5 md:w-5"
                    />
                    upgrade
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {item.description}
              </p>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SearchDropdown;
