import { aidetectorFaq } from "@/_mock/tools/aidetectorFaq";
import AiDetectorContentSection from "@/components/(primary-layout)/(ai-detector-page)/AiDetectorContentSection";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import HomeAdvertisement from "@/components/common/HomeAdvertisement";
import ToolsCTA from "@/components/tools/common/ToolsCTA";
import ToolsSepecigFaq from "@/components/tools/common/ToolsSepecigFaq";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: "AI Detector || Shothik AI",
    description: "AI Detector description",
  };
}

const Aidetector = () => {
  return (
    <div className="flex max-w-full flex-col gap-6 md:gap-8">
      <ErrorBoundary>
        <Suspense fallback={null}>
          <AiDetectorContentSection />
        </Suspense>
      </ErrorBoundary>
      <ToolsSepecigFaq
        tag="All you need to know about AI Detector feature"
        data={aidetectorFaq}
      />
      <ToolsCTA toolType="aidetector" />
      <HomeAdvertisement />
    </div>
  );
};

export default Aidetector;
