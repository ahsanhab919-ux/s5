"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";

// Helper function to format numbers in compact format (k, m, b)
const formatCompactNumber = (num) => {
  if (num === 0) return "0";
  if (num < 1000) return num.toString();

  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (absNum >= 1000000000) {
    // Billions
    const value = absNum / 1000000000;
    return `${sign}${value % 1 === 0 ? value : value.toFixed(1)}b`;
  } else if (absNum >= 1000000) {
    // Millions
    const value = absNum / 1000000;
    return `${sign}${value % 1 === 0 ? value : value.toFixed(1)}m`;
  } else if (absNum >= 1000) {
    // Thousands
    const value = absNum / 1000;
    return `${sign}${value % 1 === 0 ? value : value.toFixed(1)}k`;
  }

  return num.toString();
};

export default function WalletCredits({ isCompact }) {
  const { wallet, isLoading } = useSelector(
    (state) => state.user_wallet || { wallet: null, isLoading: false },
  );

  const credits = wallet?.token || 0;

  if (isLoading) {
    return (
      <div className="border-sidebar-border flex w-full items-center justify-center border-b px-2 py-2">
        <Skeleton className={cn("h-8", isCompact ? "w-8" : "w-full")} />
      </div>
    );
  }

  if (isCompact) {
    const formattedCredits = formatCompactNumber(credits);
    return (
      <div className="border-sidebar-border flex w-full items-center justify-center border-b px-2 py-2">
        <Link
          href="/account/settings?section=wallet"
          className="text-primary hover:text-primary/80 flex w-full items-center justify-between transition-colors"
          title={`${credits.toLocaleString()} Credits`}
        >
          <div className="relative flex w-full items-center justify-between">
            <Coins className="h-5 w-5" />
            {credits > 0 && (
              <span className="bg-primary text-primary-foreground flex min-w-4 items-center justify-center rounded px-2 text-sm font-semibold">
                {formattedCredits}
              </span>
            )}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/account/settings?section=wallet"
      className="border-sidebar-border hover:bg-sidebar-accent flex w-full items-center justify-between border-b px-3 py-2.5 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Coins className="text-primary h-4 w-4" />
        <span className="text-muted-foreground text-sm">Credits</span>
      </div>
      <span className="text-primary font-semibold">
        {credits.toLocaleString()}
      </span>
    </Link>
  );
}
