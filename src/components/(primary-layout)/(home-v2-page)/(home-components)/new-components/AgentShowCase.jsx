"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { cn } from "@/lib/utils";
import { useRegisterUserToBetaListMutation } from "@/redux/api/auth/authApi";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle,
  Clock,
  Code,
  Globe,
  Phone,
  Play,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import EmailModal from "../EmailCollectModal";

const agents = [
  {
    id: "research-agent",
    name: "Deep Research Agent",
    description:
      "Analyze 50+ research papers and extract key findings in minutes, not weeks",
    icon: <Brain className="size-6" />,
    gradient: "from-emerald-600 to-teal-600",
    capabilities: [
      "Cross-reference 100+ academic sources",
      "Extract contradicting findings",
      "Generate synthesis reports",
      "Citation management",
    ],
    demoPrompt:
      "I need to analyze all recent research on CRISPR gene therapy for my medical thesis. Find contradictions and emerging trends.",
    output:
      "Analyzed 73 papers (2020-2024). Found 3 major contradictions in delivery methods. Identified 5 emerging trends in targeting mechanisms. Generated 12-page synthesis with proper citations.",
    stats: {
      timesSaved: "3-4 weeks",
      accuracy: "98%",
      automationLevel: "Full",
    },
    isRevolutionary: true,
  },
  {
    id: "browse-agent",
    name: "Browse For Me",
    description:
      "Research complex topics across hundreds of websites like having a personal research team",
    icon: <Globe className="size-6" />,
    gradient: "from-teal-600 to-emerald-600",
    capabilities: [
      "Multi-site data extraction",
      "Comparative analysis",
      "Price monitoring",
      "Application tracking",
    ],
    demoPrompt:
      "Find the top 15 PhD programs in neuroscience that accept international students, compare funding, and track application deadlines.",
    output:
      "Researched 127 universities. Found 15 programs with full funding for international students. Created comparison table with deadlines, requirements, and contact info. Set up deadline alerts.",
    stats: {
      timesSaved: "2-3 weeks",
      accuracy: "96%",
      automationLevel: "Full",
    },
    isRevolutionary: true,
  },
  {
    id: "task-agent",
    name: "Task Automation",
    description:
      "Complete multi-step workflows that would take you days of manual work",
    icon: <Bot className="size-6" />,
    gradient: "from-emerald-700 to-teal-600",
    capabilities: [
      "Job application automation",
      "Scholarship applications",
      "Data entry workflows",
      "Follow-up sequences",
    ],
    demoPrompt:
      "Apply to 25 summer research internships in biotech. Customize each application and set up follow-up reminders.",
    output:
      "Applied to 25 positions. Customized cover letters for each. Submitted applications with transcripts. Created follow-up calendar. Secured 7 interview invitations.",
    stats: {
      timesSaved: "40+ hours",
      accuracy: "94%",
      automationLevel: "Full",
    },
    isRevolutionary: true,
  },
  {
    id: "call-agent",
    name: "Call For Me",
    description:
      "Make professional calls to gather information, schedule meetings, and handle negotiations",
    icon: <Phone className="size-6" />,
    gradient: "from-teal-700 to-emerald-600",
    capabilities: [
      "Information gathering calls",
      "Appointment scheduling",
      "Interview coordination",
      "Professional follow-ups",
    ],
    demoPrompt:
      "Contact 10 research professors about potential thesis supervision. Ask about their current projects and availability.",
    output:
      "Called 10 professors. Gathered project details from 8. Scheduled 5 meetings. Received 3 thesis topic suggestions. Created follow-up plan for interested supervisors.",
    stats: {
      timesSaved: "2+ weeks",
      accuracy: "92%",
      automationLevel: "Full",
    },
    isRevolutionary: true,
  },
  {
    id: "hire-agent",
    name: "Hire For Me",
    description:
      "Find, vet, and hire the perfect freelancers for your academic or personal projects",
    icon: <Users className="size-6" />,
    gradient: "from-emerald-600 to-emerald-800",
    capabilities: [
      "Talent sourcing & vetting",
      "Portfolio evaluation",
      "Rate negotiation",
      "Project management",
    ],
    demoPrompt:
      "Hire a statistical analyst to help with my psychology research data analysis. Budget: $800, need SPSS expertise.",
    output:
      "Screened 23 analysts. Evaluated 5 portfolios. Interviewed top 3 candidates. Hired PhD statistician for $750. Project completed in 10 days with publication-ready results.",
    stats: {
      timesSaved: "3+ weeks",
      accuracy: "96%",
      automationLevel: "Full",
    },
    isRevolutionary: true,
  },
];

export default function AgentShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [slideDirection, setSlideDirection] = useState("left");
  const [showModal, setShowModal] = useState(false);

  const currentAgent = agents[currentIndex];

  const { componentRef, trackClick } = useComponentTracking(
    trackingList.CAROUSEL_SECTION,
  );

  const [
    registerUserForBetaList,
    { isLoading: registerUserProcessing, isError: registerUserError },
  ] = useRegisterUserToBetaListMutation();

  const nextAgent = () => {
    setSlideDirection("left");
    setCurrentIndex((prev) => (prev + 1) % agents.length);
  };

  const prevAgent = () => {
    setSlideDirection("right");
    setCurrentIndex((prev) => (prev - 1 + agents.length) % agents.length);
  };

  const handlePlayDemo = (agentId) => {
    setIsPlaying(agentId);
    setTimeout(() => setIsPlaying(null), 4000);
  };

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextAgent();
    } else if (isRightSwipe) {
      prevAgent();
    }
  };

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(nextAgent, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleEmailSubmit = async (email) => {
    try {
      const result = await registerUserForBetaList({ email }).unwrap();


      // Success toast
      toast.success("Successfully registered for beta!", {
        description: "We'll be in touch soon.",
      });

      // Close the modal
      setShowModal(false);
    } catch (error) {
      // Error toast
      toast.error("Registration failed", {
        description:
          error?.data?.message || "Registration failed. Please try again.",
      });
    }
  };

  return (
    <>
      <div
        ref={componentRef}
        className={cn("bg-background overflow-hidden pb-8 md:pb-12")}
      >
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          {/* Demo Section with Swipe Support */}
          <div
            className="touch-pan-y select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              key={currentIndex}
              className="transition-all duration-[600ms] ease-in-out"
            >
              <Card className="overflow-hidden rounded-2xl border shadow-sm">
                {/* Demo Header */}
                <div
                  className={cn(
                    "bg-gradient-to-br p-6 text-white md:p-8",
                    currentAgent.gradient,
                  )}
                >
                  <div
                    className={cn(
                      "mb-6 flex items-center justify-between",
                      "flex-col gap-6 md:flex-row md:gap-0",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-4",
                        "text-center md:text-left",
                      )}
                    >
                      <div className="flex size-16 items-center justify-center rounded-lg bg-white/20">
                        {currentAgent.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold md:text-3xl">
                          {currentAgent.name}
                        </h2>
                        <p className="mt-1 text-sm text-white/90 md:text-base">
                          {currentAgent.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      // data-umami-event={`Watch Agent Work: ${currentAgent.name}`}
                      data-rybbit-event={`Watch Agent Work: ${currentAgent.name}`}
                      onClick={() => handlePlayDemo(currentAgent.id)}
                      className="border border-white/30 bg-white/20 px-6 py-3 text-white hover:bg-white/30"
                      variant="ghost"
                    >
                      <Play className="mr-2 size-4" />
                      Watch Agent Work
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                    <div className="text-center">
                      <div className="mb-2 flex items-center justify-center gap-2">
                        <Clock className="size-5" />
                        <h3 className="text-2xl font-bold">
                          {currentAgent.stats.timesSaved}
                        </h3>
                      </div>
                      <p className="text-white/80">Time Saved</p>
                    </div>
                    <div className="text-center">
                      <div className="mb-2 flex items-center justify-center gap-2">
                        <Zap className="size-5" />
                        <h3 className="text-2xl font-bold">
                          {currentAgent.stats.accuracy}
                        </h3>
                      </div>
                      <p className="text-white/80">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="mb-2 flex items-center justify-center gap-2">
                        <Brain className="size-5" />
                        <h3 className="text-2xl font-bold">
                          {currentAgent.stats.automationLevel}
                        </h3>
                      </div>
                      <p className="text-white/80">Automation</p>
                    </div>
                  </div>
                </div>

                {/* Demo Content */}
                <CardContent className="p-6 md:p-8">
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Input */}
                    <div>
                      <h3
                        className={cn(
                          "text-foreground mb-4 flex items-center gap-2 text-lg font-semibold",
                        )}
                      >
                        <Code className="size-5 text-emerald-600" />
                        Your Command
                      </h3>
                      <div className="bg-muted rounded-lg border p-6">
                        <p className="text-muted-foreground leading-relaxed italic">
                          {currentAgent.demoPrompt}
                        </p>
                      </div>
                    </div>

                    {/* Output */}
                    <div>
                      <h3
                        className={cn(
                          "text-foreground mb-4 flex items-center gap-2 text-lg font-semibold",
                        )}
                      >
                        <Sparkles className="size-5 text-purple-600" />
                        Agent Execution
                      </h3>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
                        {isPlaying === currentAgent.id ? (
                          <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                            <Brain className="size-5 animate-spin" />
                            <p className="text-base font-medium">
                              Agent is working...
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">
                            {currentAgent.output}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="mt-8">
                    <h3 className="mb-4 text-lg font-semibold">
                      Agent Capabilities
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {currentAgent.capabilities.map((capability, index) => (
                        <div
                          key={index}
                          className="text-muted-foreground flex items-center gap-2"
                        >
                          <CheckCircle className="size-4 shrink-0 text-emerald-600" />
                          <p className="text-muted-foreground text-sm">
                            {capability}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-8 border-t pt-6">
                    <Button
                      // data-umami-event={`Try Now Agent: ${currentAgent.name}`}
                      data-rybbit-event={`Try Now Agent: ${currentAgent.name}`}
                      className={cn(
                        "w-full py-6 text-base text-white hover:opacity-90",
                        `bg-gradient-to-r ${currentAgent.gradient}`,
                      )}
                      onClick={() => {
                        setShowModal(true);

                        // tracking
                        trackClick(trackingList.CTA_BUTTON, {
                          button_text: "Try now",
                          position: "agent_show_case_section",
                        });
                      }}
                    >
                      Try Now
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">
              Ready to Command the Future?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Leave it to us. Stop working for your tools. Make them work for
              you.
            </p>
            <Button
              // data-umami-event="Command Your AI Writing Team"
              data-rybbit-event="Command Your AI Writing Team"
              className={cn(
                "px-8 py-6 text-base text-white hover:opacity-90",
                "bg-gradient-to-r from-emerald-600 to-teal-600",
              )}
              onClick={() => {
                setShowModal(true);

                // tracking
                trackClick(trackingList.CTA_BUTTON, {
                  button_text: "Command Your AI Writing Team",
                  position: "agent_show_case_section",
                });
              }}
            >
              Command Your AI Writing Team
              <Globe className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* email collect modal */}
      <EmailModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleEmailSubmit}
      />
    </>
  );
}
