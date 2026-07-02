"use client";

import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { Star } from "lucide-react";

const AgenticHeroSection = () => {
  const { componentRef } = useComponentTracking(
    trackingList.STOP_WORKING_SECTION,
  );
  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div
        ref={componentRef}
        className="flex min-h-[50vh] flex-col items-start justify-start pt-6 pb-6 text-left sm:items-center sm:justify-center sm:pt-8 sm:text-center md:pt-10 md:pb-8 lg:pt-12"
      >
        {/* Welcome Badge */}
        <div className="bg-primary text-primary-foreground mb-2 inline-flex h-9 items-center rounded-full px-3 text-sm font-medium lg:mb-2.5 xl:mb-3.5">
          <Star className="mr-1.5 h-4 w-4" />
          Welcome to the Agentic Era
        </div>

        {/* Main Heading */}
        <div className="mb-2 max-w-[900px] sm:mb-2 lg:mb-2.5 xl:mb-3.5">
          <h1 className="text-foreground mb-0 text-[2.25rem] leading-[1.1] font-bold tracking-tight sm:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem]">
            Stop <span className="text-primary">Working</span>
          </h1>

          <h1 className="text-primary text-[2.25rem] leading-[1.1] font-bold tracking-tight whitespace-nowrap sm:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem]">
            Start Commanding
          </h1>
        </div>

        {/* Description Text */}
        <div className="max-w-[800px]">
          <p className="text-muted-foreground text-base leading-7 sm:text-[1.1rem] sm:leading-7 lg:text-[1.25rem] lg:leading-8 xl:text-[1.375rem]">
            Tell our agents what you need. They&apos;ll research 100+ papers,
            apply to dozens of programs, make professional calls, and hire
            experts for you. Stop spending weeks on tasks that should take
            minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgenticHeroSection;
