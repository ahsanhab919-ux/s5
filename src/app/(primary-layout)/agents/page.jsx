"use client";
import AgentLandingPage from "@/components/agents/AgentLandingPage";
import { AgentContextProvider } from "@/components/agents/shared/AgentContextProvider";

export default function AgentsPage() {
  // const [tutorialOpen, setTutorialOpen] = useState(false);

  // Optionally, open tutorial on first visit
  // React.useEffect(() => {
  //   const completed = localStorage.getItem('agents_tutorial_completed');
  //   if (!completed) setTutorialOpen(true);
  // }, []);

  return (
    <AgentContextProvider>
      <AgentLandingPage />
      {/* Tutorial Overlay. For now not needed */}
      {/* <AgentTutorialOverlay open={tutorialOpen} onClose={() => setTutorialOpen(false)} /> */}
    </AgentContextProvider>
  );
}
