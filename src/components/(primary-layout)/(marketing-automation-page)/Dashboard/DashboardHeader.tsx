"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

interface DashboardHeaderProps {
  isLoadingInsights: boolean;
  onRefresh: () => void;
}

export default function DashboardHeader({
  isLoadingInsights,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="flex h-full items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/marketing-automation">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Campaign Dashboard</h1>
          <p className="text-muted-foreground mt-1 hidden text-xs md:block">
            Performance insights and AI recommendations
          </p>
        </div>
      </div>
      <Button
        onClick={onRefresh}
        disabled={isLoadingInsights}
        className="flex h-8 items-center gap-2 md:h-9"
      >
        <RefreshCw
          className={`h-4 w-4 ${isLoadingInsights ? "animate-spin" : ""}`}
        />
        Refresh
      </Button>
    </div>
  );
}
