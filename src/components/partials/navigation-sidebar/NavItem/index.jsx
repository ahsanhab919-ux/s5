"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function NavItem({ item, isCompact = false, className }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const prevPathnameRef = useRef(pathname);
  const isActive =
    pathname === "/" ? pathname === item.path : pathname.startsWith(item.path);
  const { title, path, icon, iconColor } = item;

  // Close sidebar on mobile when pathname actually changes (not on initial mount)
  useEffect(() => {
    if (isMobile) {
      // Only close if pathname actually changed from previous value
      if (prevPathnameRef.current !== pathname) {
        setOpenMobile(false);
      }
      // Always update the ref to track current pathname
      prevPathnameRef.current = pathname;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isMobile]);

  // Handle link click to close sidebar on mobile
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Link
      // data-umami-event={`Nav: ${title}`}
      data-rybbit-event="Nav Item"
      data-rybbit-prop-nav_item={`Nav: ${title}`}
      href={path}
      id={item?.id}
      onClick={handleLinkClick}
      className={cn(
        "relative flex w-full flex-row items-center justify-start gap-x-4 gap-y-1 rounded-md px-4 py-2 capitalize transition-colors",
        {
          "lg:mx-auto lg:w-[72px] lg:min-w-[72px] lg:flex-col lg:justify-center lg:p-2":
            isCompact,
        },
        isActive
          ? "text-primary bg-primary/10 hover:bg-primary/10 hover:text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    >
      {icon && (
        <div
          className={cn("flex h-8 w-8 shrink-0 items-center justify-center")}
          style={{ color: iconColor }}
        >
          {icon}
        </div>
      )}

      <span
        className={cn(
          "grow text-start text-base whitespace-nowrap",
          isCompact ? "lg:text-center lg:text-xs lg:whitespace-normal" : "",
        )}
      >
        {title}
      </span>
    </Link>
  );
}
