"use client";
import NotFound from "@/app/not-found";
import { AgentContextProvider } from "@/components/agents/shared/AgentContextProvider";
import ChatInput from "@/components/research/ui/ChatInput";
import ResearchPageSkeletonLoader from "@/components/research/ui/ResearchPageSkeletonLoader";
import { FooterCta } from "@/components/sheet/SheetAgentPage"; // Needs to move it to common or shared folder.
import { researchCoreState } from "@/redux/slices/researchCoreSlice";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
// import PresentationAgentPage from "@/components/presentation/PresentationAgentPage";
// import ResearchAgentPage from "@/components/research/ResearchAgentPage";
// const PresentationAgentPage = dynamic(
//   () => import("@/components/presentation/PresentationAgentPage"),
//   {
//     loading: () => <ResearchPageSkeletonLoader />,
//     ssr: false,
//   },
// );
const PresentationAgentPageV2 = dynamic(
  () => import("@/components/presentation/PresentationAgentPageV2"),
  {
    loading: () => <ResearchPageSkeletonLoader />,
    ssr: false,
  },
);
const SheetAgentPage = dynamic(
  () => import("@/components/sheet/SheetAgentPage"),
  {
    loading: () => <ResearchPageSkeletonLoader />,
    ssr: false,
  },
);
const ResearchAgentPage = dynamic(
  () => import("@/components/research/ResearchAgentPage"),
  {
    loading: () => <ResearchPageSkeletonLoader />,
    ssr: false,
  },
);

export default function SpecificAgentPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const params = useParams();
  const agentType = params.agentType;

  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const researchId = searchParams.get("r_id"); // this ID is presents when we are on research simulation mode
  const isResarchSimulating = !!researchId;

  // 

  const [loadingResearchHistory, setLoadingResearchHistory] = useState(true);

  const { isSimulating, simulationStatus } = useSelector(researchCoreState);

  // Media query hook for responsive design
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleMediaQueryChange = (e) => setIsMobile(e.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaQueryChange);

    return () =>
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
  }, []);

  // Function to render the appropriate component based on agentType
  const renderComponent = () => {
    switch (agentType) {
      case "presentation":
        return (
          // <PresentationAgentPage
          //   specificAgent={agentType}
          //   presentationId={id}
          // /> // working version previously
          <PresentationAgentPageV2 presentationId={id} />
        );
      case "sheets":
        return <SheetAgentPage specificAgent={agentType} sheetId={id} />;
      case "research":
        return (
          <ResearchAgentPage
            loadingResearchHistory={loadingResearchHistory}
            setLoadingResearchHistory={setLoadingResearchHistory}
          />
        );
      case "browse":
        return <div>Browse Agent Page - Coming Soon</div>;
      case "call":
        return <div>Call Agent Page - Coming Soon</div>;
      default:
        return <NotFound />;
    }
  };

  return (
    <AgentContextProvider>
      <div className="relative min-h-[calc(100dvh-200px)] overflow-y-auto">
        {renderComponent()}

        {/* chat input for research agents */}
        {agentType === "research" && !isResarchSimulating && (
          <>
            {!loadingResearchHistory && (
              <div className="absolute bottom-[0.7rem] left-0 w-full px-2 sm:px-0">
                <ChatInput />
              </div>
            )}
          </>
        )}

        {/* join the beta list footer cta for research only now */}
        {!isSimulating && simulationStatus === "completed" && (
          <div className="absolute bottom-0 flex w-full items-center justify-center">
            <FooterCta
              isMobile={isMobile}
              showModal={showModal}
              setShowModal={setShowModal}
            />
          </div>
        )}
      </div>
    </AgentContextProvider>
  );
}
