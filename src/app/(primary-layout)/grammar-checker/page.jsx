import GrammarCheckerContentSection from "@/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Grammar || Shothik AI",
    description: "Grammar description",
  };
}

const Grammar = () => {
  return (
    <div className="flex max-w-full flex-col gap-6 md:gap-8">
      <ErrorBoundary>
        <GrammarCheckerContentSection />
      </ErrorBoundary>
      {/* <ToolsSepecigFaq
        tag="All you need to know about Grammar Fix feature"
        data={grammarfaq}
      />
      <ToolsCTA toolType="grammar" />
      <HomeAdvertisement /> */}
    </div>
  );
};

export default Grammar;
