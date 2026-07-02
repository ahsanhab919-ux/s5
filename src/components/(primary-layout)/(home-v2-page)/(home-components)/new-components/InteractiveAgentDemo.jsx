"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { cn } from "@/lib/utils";
import { useRegisterUserToBetaListMutation } from "@/redux/api/auth/authApi";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  BrainCog,
  ChevronRight,
  FileText,
  Send,
  Sheet,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import EmailModal from "../EmailCollectModal";
import AgentThinkingLoader from "./AgentThinkingLoader";

export const createSheetSimulationChatId = async (inputValue, router, sId) => {
  try {
    const response = await fetch(
      // "http://163.172.172.38:3005/api/chat/create_chat",
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/chat/create_chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${localStorage.getItem("sheetai-token")}`,
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          name: `${inputValue} - ${new Date().toLocaleString()}`,
        }),
      },
    );
    if (!response.ok) {
      return;
    }

    // We can do some operation here

    const result = await response.json();
    const chatId = result.chat_id || result.id || result._id;

    // Save active chat ID for connection polling
    sessionStorage.setItem("activeChatId", chatId);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    router.push(`/agents/sheets/?id=${chatId}&s_id=${sId}`);
  } catch (error) {
  }
};

const agentDemos = [
  {
    id: "slides",
    name: "AI Slides Agent",
    icon: <FileText size={24} />,
    color: "emerald",
    placeholder: "Select an example...",
    examples: [
      "Create a professional business presentation about Digital Marketing",
      "Create an academic presentation about AI in Education",
      "Create a presentation on Bangladesh Software Industry",
    ],
    chatId: [
      "12344e7c-21ca-414b-bab1-6129a2981bc3",
      "0af635b5-41cb-4d47-9fe0-a0eb91bd0384",
      "a1f51514-5fb4-4d90-8c6e-c26479a63f72",
    ],
    description:
      "Creates complete presentations with research, design, and content",
    processingMessage:
      "Researching topic, designing slides, writing content...",
  },
  {
    id: "sheet",
    name: "AI Sheet Agent",
    icon: <Sheet size={24} />,
    color: "blue",
    placeholder: "Select an example...",
    examples: [
      "Compare pricing of top 10 gyms of the world in a sheet",
      "List top 5 Italian restaurants with ratings",
      "Generate 10 school and contact notes",
    ],
    chatId: [
      "68c92076dc985a1ee342aa72", // for prod
      "68c9237adc985a1ee342aa75", // for prod
      "68c926eedc985a1ee342aa77", // for prod
    ],
    description:
      "Performs real-world research and structures the data in smart sheets",
    processingMessage:
      "Researching deeply, organizing data, formatting your sheet...",
  },
  {
    id: "deep-research",
    name: "Deep Research Agent",
    icon: <BrainCog size={24} />,
    color: "purple",
    placeholder: "Research deeply about...",
    chatId: [
      "68ca4f4ee4baf23966d0d8de",
      "68ca4fe4e4baf23966d0d922",
      "68ca5154e4baf23966d0d975",
    ],
    examples: [
      "Find all recent studies on intermittent fasting and longevity",
      "Compare pricing, pros, and cons of top 5 project management tools",
      "Investigate the latest laws on crypto trading in the US and Europe",
    ],
    description:
      "Performs thorough research, analyzes findings, and delivers structured insights",
    processingMessage:
      "Reading sources, verifying facts, organizing your research brief...",
  },
];

// Mock API function
const mockApiRequest = async (method, endpoint, data) => {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // return to the slide simulation api
  return {
    json: async () => ({
      result: `Mock response for ${
        data.topic || data.text
      }: This is a demonstration of how the ${endpoint
        .split("/")
        .pop()} agent would work. In a real implementation, this would return detailed results based on your request.`,
    }),
  };
};

// Mock analytics functions
const mockAnalytics = {
  trackAgentInteraction: (id, action, length) => {},
  trackFeatureClick: (feature, context) => {},
  trackError: (type, message, context) => {},
};

export default function InteractiveAgentDemo() {
  const { componentRef, trackClick } = useComponentTracking(
    trackingList.LIVE_AGENT,
  );

  const [selectedAgent, setSelectedAgent] = useState(agentDemos[0]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);
  const [aiResponse, setAiResponse] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const [userChatId, setUserChatId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [
    registerUserForBetaList,
    { isLoading: registerUserProcessing, isError: registerUserError },
  ] = useRegisterUserToBetaListMutation();

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success", // 'success', 'error', 'warning', 'info'
  });

  const router = useRouter();

  // Cycle through examples automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % selectedAgent.examples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedAgent]);

  const handleSubmit = async (idx) => {
    if (!userInput.trim()) return;

    mockAnalytics.trackAgentInteraction(
      selectedAgent.id,
      "demo_started",
      userInput.length,
    );

    const simulationId = selectedAgent.chatId[userChatId];
    // 
    // return;

    // Tracking simulation for GA4, GTM, and other
    trackClick(trackingList.LIVE_AGENT_SIMULATION, {
      agent: selectedAgent.id,
      userQuer: userInput,
    });

    setIsProcessing(true);
    setShowResults(false);
    setError("");
    setAiResponse("");

    try {
      let response;

      switch (selectedAgent.id) {
        case "slides":
          response = await mockApiRequest("POST", "/api/agents/outline", {
            topic: userInput,
            type: "presentation",
          });
          break;

        case "call":
          response = await mockApiRequest("POST", "/api/agents/research", {
            topic: `Phone call strategy for: ${userInput}`,
            domain: "business communication",
          });
          break;

        case "hire":
          response = await mockApiRequest("POST", "/api/agents/research", {
            topic: `Hiring plan for: ${userInput}`,
            domain: "human resources",
          });
          break;

        default:
          response = await mockApiRequest("POST", "/api/agents/improve", {
            text: userInput,
            improvements: ["clarity", "structure", "engagement"],
          });
      }

      const data = await response.json();
      setAiResponse(data.result);

      if (selectedAgent?.id === "slides") {
        router.push(
          `/${process.env.NEXT_PUBLIC_SLIDE_REDIRECT_PREFIX}/replay?id=${simulationId}`,
        );
      } else if (selectedAgent?.id === "sheet") {
        // await createSheetSimulationChatId(userInput, router, simulationId); // Previously we needed to create chat ID and then we needed to add token to add and work simulation. With new update now we only need simulation ID. No authentication needed.
        router.push(`/agents/sheets/?s_id=${simulationId}`);
      } else if (selectedAgent?.id === "deep-research") {
        router.push(`/agents/research/?r_id=${simulationId}`);
      }

      return;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(errorMessage);
      mockAnalytics.trackError(
        "agent_demo_error",
        errorMessage,
        selectedAgent.id,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExample = (example, index) => {
    setUserInput(example);
    mockAnalytics.trackFeatureClick("example_used", "agent_demo");
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setUserChatId(index);
  };

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
    setUserInput("");
    setShowResults(false);
    setError("");
    mockAnalytics.trackFeatureClick(
      `agent_${agent.id}_selected`,
      "agent_selector",
    );
  };

  const handleEmailSubmit = async (email) => {
    try {
      const result = await registerUserForBetaList({ email }).unwrap();


      // Success toast
      setToast({
        open: true,
        message: "Successfully registered for beta! We'll be in touch soon.",
        severity: "success",
      });

      // Close the modal
      setShowModal(false);
    } catch (error) {
      // Error toast
      setToast({
        open: true,
        message:
          error?.data?.message || "Registration failed. Please try again.",
        severity: "error",
      });
    }
  };

  const handleCloseToast = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setToast((prev) => ({ ...prev, open: false }));
  };

  const getColorClasses = (color, type) => {
    const colorMap = {
      emerald: {
        selected: "border-primary bg-primary/10 text-primary",
        header: "border-b border-primary bg-primary/10 text-primary",
      },
      blue: {
        selected: "border-secondary bg-secondary/10 text-secondary-foreground",
        header:
          "border-b border-secondary bg-secondary/10 text-secondary-foreground",
      },
      purple: {
        selected: "border-accent bg-accent/10 text-accent-foreground",
        header: "border-b border-accent bg-accent/10 text-accent-foreground",
      },
    };
    return colorMap[color]?.[type] || "";
  };

  return (
    <>
      <section ref={componentRef} className="min-h-screen pt-12 lg:pt-16">
        <div className="mx-auto max-w-[1200px] px-2 lg:max-w-[1400px]">
          {/* Header */}
          <div className="mb-6 text-center lg:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-foreground mb-2 px-2 text-[2rem] leading-tight font-light sm:text-[2.5rem] lg:mb-3 lg:text-[3rem] xl:text-[3.75rem]">
                Try an Agent <span className="text-primary">Live</span>
              </h2>
              <p className="text-muted-foreground mx-auto max-w-[768px] px-2 text-lg leading-relaxed font-normal sm:text-xl">
                Experience the future of AI. Pick an agent, give it a task, and
                watch it work in real-time.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6">
            {/* Agent Selection */}
            <div className="lg:col-span-1">
              <div>
                <h3 className="text-foreground mb-2 text-xl font-semibold sm:text-2xl lg:mb-3">
                  Choose Your Agent
                </h3>

                <div className="flex flex-col gap-2">
                  {agentDemos.map((agent) => (
                    <motion.div
                      key={agent.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer rounded-2xl border-2 transition-all",
                          selectedAgent.id === agent.id
                            ? getColorClasses(agent.color, "selected")
                            : "border-border bg-card hover:border-muted-foreground/30",
                        )}
                        onClick={() => handleAgentSelect(agent)}
                      >
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div
                              className={cn(
                                "flex items-center justify-center rounded-xl p-2 sm:p-3",
                                selectedAgent.id === agent.id
                                  ? "bg-background shadow-sm"
                                  : "bg-muted",
                              )}
                            >
                              {agent.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="mb-0.5 text-base font-semibold sm:text-lg">
                                {agent.name}
                              </h4>
                              <p className="text-xs leading-relaxed opacity-80 sm:text-sm">
                                {agent.description}
                              </p>
                            </div>
                            {selectedAgent.id === agent.id && (
                              <>
                                <ChevronRight
                                  size={20}
                                  className="hidden sm:block"
                                />
                                <ChevronRight
                                  size={16}
                                  className="block sm:hidden"
                                />
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Example Prompts */}
                <div className="mt-4">
                  <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase sm:text-sm">
                    Try These Examples
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${selectedAgent.id}-${currentExample}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex flex-col gap-1.5">
                        {selectedAgent.examples.map((example, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.01 }}
                            style={{
                              opacity: index === currentExample ? 1 : 0.6,
                            }}
                          >
                            <Button
                              variant="outline"
                              className="border-border bg-card hover:border-primary hover:bg-primary/10 w-full justify-start rounded-xl border px-2 py-3 text-left text-xs transition-colors sm:px-2 sm:py-2 sm:text-sm"
                              onClick={() => handleExample(example, index)}
                            >
                              <span>&quot;{example}&quot;</span>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Interactive Demo */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-8 lg:mt-[3.75rem]">
                <Card className="overflow-hidden rounded-2xl border shadow-lg">
                  {/* Agent Header */}
                  <div
                    className={cn(
                      "border-b px-3 py-3 sm:px-4 sm:py-4",
                      getColorClasses(selectedAgent.color, "header"),
                    )}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="bg-background flex items-center justify-center rounded-xl p-2 shadow-sm sm:p-3">
                        {selectedAgent.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="overflow-hidden text-lg font-semibold text-ellipsis whitespace-nowrap sm:text-xl">
                          {selectedAgent.name}
                        </h3>
                        <p className="text-xs opacity-80 sm:text-sm">
                          Ready to help
                        </p>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Bot size={24} className="hidden sm:block" />
                        <Bot size={20} className="block sm:hidden" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-foreground mb-1 block text-xs font-medium sm:text-sm">
                          What would you like {selectedAgent.name} to do?
                        </label>
                        <Textarea
                          ref={inputRef}
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder={selectedAgent.placeholder}
                          disabled={true}
                          className="min-h-[120px] cursor-not-allowed resize-none rounded-xl text-sm"
                          rows={4}
                        />
                      </div>

                      <Button
                        // data-umami-event={`Try New Agent: ${selectedAgent?.name || ""}`}
                        data-rybbit-event={`Try New Agent: ${selectedAgent?.name || ""}`}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl text-sm font-medium transition-colors sm:px-6 sm:py-2 sm:text-base"
                        onClick={() => handleSubmit()}
                        disabled={!userInput.trim() || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="mr-2"
                            >
                              <Sparkles size={20} />
                            </motion.div>
                            Agent Working...
                          </>
                        ) : (
                          <>
                            <Send size={20} className="mr-2" />
                            Try Now
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Processing Status */}
                    <AnimatePresence>
                      {isProcessing && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6"
                        >
                          <AgentThinkingLoader
                            message={`${selectedAgent.name} is working...`}
                            steps={[
                              "Analyzing your request",
                              selectedAgent.processingMessage,
                              "Preparing results",
                            ]}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Results */}
                    <AnimatePresence>
                      {showResults && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="border-primary bg-primary/10 mt-3 rounded-xl border p-3">
                            <div className="flex items-start gap-1.5">
                              <div className="bg-primary text-primary-foreground flex items-center justify-center rounded-lg p-1">
                                {selectedAgent.icon}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-foreground mb-1.5 font-semibold">
                                  {selectedAgent.name} Results
                                </h4>
                                {error ? (
                                  <Alert
                                    variant="destructive"
                                    className="p-1.5"
                                  >
                                    <AlertDescription className="text-sm">
                                      {error}
                                    </AlertDescription>
                                  </Alert>
                                ) : (
                                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                    {aiResponse}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center pt-5 sm:pt-7 md:pt-10 lg:pt-11 xl:pt-12">
            <Button
              // data-umami-event="Get early access"
              data-rybbit-event="Get early access"
              size="lg"
              onClick={() => {
                setShowModal(true);

                // tracking
                trackClick("cta_button", {
                  button_text: "Get early access",
                  position: "live_agent",
                });
              }}
              className="bg-primary text-primary-foreground max-w-fit rounded-lg px-3 py-1.5 font-normal"
            >
              Get early access
            </Button>
          </div>
        </div>
      </section>

      <EmailModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleEmailSubmit}
      />

      {/* Toast notification */}
      {toast.open && (
        <div className="fixed bottom-5 left-1/2 z-[9999] -translate-x-1/2 transform">
          <Alert
            variant={toast.severity === "error" ? "destructive" : "default"}
            className="w-full max-w-md"
          >
            <div className="flex items-center justify-between gap-2">
              <AlertDescription>{toast.message}</AlertDescription>
              <button
                onClick={() => handleCloseToast(null, "close")}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </Alert>
        </div>
      )}
    </>
  );
}
