"use client";

import { Button } from "@/components/ui/button";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { ArrowRight, Play } from "lucide-react";
import BgContainer from "./components/hero/BgContainer";
import Details from "./components/hero/Details";
import HeroVideo from "./HeroVideo";

export default function HomeHeroSection() {
  const { componentRef, trackClick } = useComponentTracking(
    trackingList.LANDING_HERO,
  );

  return (
    <BgContainer
      ref={componentRef}
      className="mx-auto max-w-screen-xl xl:pt-[50px]"
    >
      <div className="relative mx-auto flex w-full max-w-screen-xl flex-col items-center justify-center gap-8 px-4 pt-6 sm:px-6 md:gap-13 md:px-8 md:pt-8 lg:gap-18 lg:pb-10 xl:gap-20 xl:pb-10">
        <div className="pointer-events-none absolute top-0 left-0 z-[1] h-[100vh] w-[100vw] overflow-hidden">
          {/* <Image
            src="/pattern.svg"
            alt="pattern"
            width={100}
            height={100}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: "40%",
            }}
            priority={true}
          /> */}
        </div>

        {/* Details Section - Shows first on mobile, left on desktop */}
        <Details trackClick={trackClick} />

        {/* Video Section - Shows second on mobile, right on desktop */}
        <div className="z-[12] order-2 w-full">
          <div className="bg-muted relative flex h-[250px] w-full items-center justify-center overflow-hidden rounded-lg sm:h-[300px] md:h-[380px] lg:h-[420px] xl:h-[550px]">
            <HeroVideo />

            {/* Play overlay */}
            <div
              className="border-primary bg-background/90 absolute top-1/2 left-1/2 flex h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-110"
              onClick={(e) => {
                const video =
                  e.currentTarget.parentElement.querySelector("video");
                if (video && video.paused) {
                  video.play();
                  e.currentTarget.style.display = "none";
                }
              }}
            >
              <Play className="text-primary h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </BgContainer>
  );
}

// Signin Button Renderer
export function SigninButtonRenderer({ title }) {
  return (
    <Button className="h-11 max-w-[202px] text-base">
      {title}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  );
}
