"use client";

import DotFlashing from "@/components/common/DotFlashing";
import Logo from "@/components/partials/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import NavigationIcons from "./NavigationIcons";
import NavItem from "./NavItem";
import UserInfo from "./UserInfo";
import WalletCredits from "./WalletCredits";

export default function NavigationSidebar() {
  const { accessToken, user } = useSelector((state) => state.auth);
  const { sidebar } = useSelector((state) => state.settings);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  // Use default value that matches server-side render to prevent hydration mismatch
  const isCompact = mounted ? sidebar === "compact" : false;

  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (sidebar === "compact") {
        setOpen(false);
      } else {
        setOpen(true);
      }
    }
  }, [sidebar, setOpen, mounted]);

  // Close mobile sidebar when route actually changes (not on initial mount)
  useEffect(() => {
    if (mounted && isMobile) {
      // Only close if pathname actually changed from previous value
      if (prevPathnameRef.current !== pathname) {
        setOpenMobile(false);
      }
      // Always update the ref to track current pathname
      prevPathnameRef.current = pathname;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mounted, isMobile]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border h-12 border-b p-0 lg:h-16">
        <div className="flex h-full items-center justify-center px-2 py-1">
          <Logo
            className={cn("", {
              "lg:hidden": isCompact,
              "lg:inline-block": !isCompact,
            })}
          />
          <Image
            src="/moscot.png"
            priority
            alt="shothik_logo"
            width={100}
            height={40}
            className={cn("mx-auto hidden! h-full w-auto object-contain", {
              "lg:hidden!": !isCompact,
              "lg:inline-block!": isCompact,
            })}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden! overflow-y-auto!">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className={`flex flex-col ${isCompact ? "py-0" : "py-4"}`}>
                {NAV_ITEMS?.map((group) => {
                  if (group?.roles && !group?.roles?.includes(user?.role)) {
                    return null;
                  }
                  const key = group.subheader || group.items?.[0]?.title;
                  return (
                    <div key={key} className="flex flex-col gap-4">
                      <div className="px-2">
                        {group?.subheader && !isCompact && (
                          <div className="text-muted-foreground flex h-6 items-center text-sm font-medium uppercase">
                            {group?.subheader}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {group?.items?.map((item) => (
                          <NavItem
                            key={item?.title + item?.path}
                            item={item}
                            isCompact={isCompact}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border flex min-h-12 flex-col items-center border-t lg:min-h-16">
        <div className="flex h-full w-full flex-1 flex-col">
          {!mounted ? (
            // Show loading state on server to match initial client render
            <div className="flex h-full justify-center px-2 py-5 text-center">
              <DotFlashing />
            </div>
          ) : !accessToken ? (
            <UserInfo />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              {/* Credits Section */}
              <WalletCredits isCompact={isCompact} />
              <NavigationIcons />
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
