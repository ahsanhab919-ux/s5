import { transtorFaq } from "@/_mock/tools/translator";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import HomeAdvertisement from "@/components/common/HomeAdvertisement";
import ToolsCTA from "@/components/tools/common/ToolsCTA";
import ToolsSepecigFaq from "@/components/tools/common/ToolsSepecigFaq";
import Translator from "@/components/tools/tanslator/Translator";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: "Translator | Shothik AI",
    description: "This is Translator page",
  };
}

const TranslatorPage = () => {
  return (
    <div className="mt-6 flex max-w-full flex-col gap-6 px-4 md:mt-8 md:gap-8 md:px-6">
      <ErrorBoundary>
        <Translator />
      </ErrorBoundary>
      <ToolsSepecigFaq
        tag="All you need to know about Translator feature"
        data={transtorFaq}
      />
      <ToolsCTA toolType="translator" />
      <HomeAdvertisement />
    </div>
  );
};

export default TranslatorPage;
