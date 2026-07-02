"use client";

import HomeHeroSection from "@/components/(primary-layout)/(home-v2-page)/(home-components)/HomeHeroSection";
import AgenticHeroSection from "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/AgenticHeroSection";
import AgnetShowCase from "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/AgentShowCase";
import FeaturesSection from "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/FeaturesSection";

import CtaSection from "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/CtaSection";
import KeyBenefits from "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/KeyBenefits";

import ModalProvider from "@/components/(primary-layout)/(home-v2-page)/(home-components)/ModelProvider";
import Journey from "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/Journey";
import ClaritySectionSkeleton from "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/skeleton/ClaritySectionSkeleton";
import FounderVideoSectionSkeleton from "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/skeleton/FounderVideoSectionSkeleton";
import TryAgentSkeleton from "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/skeleton/InteractiveAgentDemoSkeleton";
import LandingPageAnalyticsProvider from "@/components/analytics/LandingPageAnalyticsProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const ClaritySection = dynamic(
  () =>
    import(
      "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/ClaritySection"
    ),
  {
    loading: () => <ClaritySectionSkeleton />,
    ssr: false, // Disable SSR for client-only components
  },
);
const InteractiveAgentDemo = dynamic(
  () =>
    import(
      "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/InteractiveAgentDemo"
    ),
  {
    loading: () => <TryAgentSkeleton />,
    ssr: false, // Disable SSR for client-only components
  },
);
const FounderVideoSection = dynamic(
  () =>
    import(
      "@/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/FounderVideoSection"
    ),
  {
    loading: () => <FounderVideoSectionSkeleton />,
    ssr: false, // Disable SSR for client-only components
  },
);

export default function HomeContentSection() {
  return (
    <LandingPageAnalyticsProvider>
      <ErrorBoundary>
        <HomeHeroSection />
        <Suspense fallback={<ClaritySectionSkeleton />}>
          <ClaritySection />
        </Suspense>
        {/* <ClaritySectionV2 /> */}
        {/* <StudentDeserve/> */}
        <Suspense fallback={<TryAgentSkeleton />}>
          <InteractiveAgentDemo />
        </Suspense>
        <Suspense fallback={<FounderVideoSectionSkeleton />}>
          <FounderVideoSection />
        </Suspense>
        <AgenticHeroSection />
        <AgnetShowCase />
        <Journey />
        <KeyBenefits />
        <FeaturesSection />
        <CtaSection />
        <ModalProvider />
      </ErrorBoundary>
    </LandingPageAnalyticsProvider>
  );
}
