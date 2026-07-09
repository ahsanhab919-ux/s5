import ErrorBoundary from "@/components/common/ErrorBoundary";
import ToolPageShell from "@/components/shared/ToolPageShell";
import ResearchContend from "@/components/tools/research/ResearchContend";

export async function generateMetadata() {
  return {
    title: "Research || Shothik AI",
    description: "Research description",
  };
}

const Research = () => {
  return (
    <ToolPageShell maxWidth="full">
      <ErrorBoundary>
        <ResearchContend />
      </ErrorBoundary>
    </ToolPageShell>
  );
};

export default Research;
