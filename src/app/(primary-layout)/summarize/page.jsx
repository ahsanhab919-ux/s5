import { summarizeFaq } from "@/_mock/tools/summarizefaq";
import SummarizeContentSection from "@/components/(primary-layout)/(summarize-page)/SummarizeContentSection";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import HomeAdvertisement from "@/components/common/HomeAdvertisement";
import ToolsCTA from "@/components/tools/common/ToolsCTA";
import ToolsSepecigFaq from "@/components/tools/common/ToolsSepecigFaq";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: "Summarize || Shothik AI",
    description: "This is Summarize page",
  };
}

const Summarize = () => {
  return (
    <div
      className={cn("flex max-w-full flex-col gap-6 px-4 pt-2 md:gap-8 lg:pt-2")}
    >
      <ErrorBoundary>
        <SummarizeContentSection />
      </ErrorBoundary>
      <ToolsSepecigFaq
        tag="All you need to know about Summarize feature"
        data={summarizeFaq}
      />
      <ToolsCTA toolType="summarize" />
      <HomeAdvertisement />
    </div>
  );
};

export default Summarize;
