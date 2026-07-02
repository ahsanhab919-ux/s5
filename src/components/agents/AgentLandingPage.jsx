/* eslint-disable react-hooks/exhaustive-deps */
import FileList from "@/components/common/FileList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useResponsive from "@/hooks/ui/useResponsive";
import useFileUpload from "@/hooks/useFileUpload";
import useNavItemFiles from "@/hooks/useNavItemFiles";
import useSheetAiToken from "@/hooks/useRegisterSheetService";
import { cn } from "@/lib/utils";
import { useUploadPresentationFilesMutation } from "@/redux/api/presentation/presentationApi";
import { useUploadResearchFilesMutation } from "@/redux/api/research/researchChatApi";
import { useUploadSheetFilesMutation } from "@/redux/api/sheet/sheetApi";
import { setSheetToken, setShowLoginModal } from "@/redux/slices/auth";
import {
  BookOpen,
  Bot,
  Briefcase,
  CheckCircle,
  GraduationCap,
  LinkIcon,
  Loader2,
  Palette,
  Presentation,
  Rocket,
  Search,
  Send,
  Table,
  Target,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import SearchDropdown from "./SearchDropDown";
import { useAgentContext } from "./shared/AgentContextProvider";
import {
  handleResearchRequest,
  handleSheetGenerationRequest,
  handleSlideCreation,
} from "./super-agent/agentPageUtils";

const NAVIGATION_ITEMS = [
  {
    id: "slides",
    label: "AI Slides",
    icon: <Presentation className="h-5 w-5" />,
    isNew: true,
    isComingSoon: false,
    isDisabled: false,
  },
  {
    id: "sheets",
    label: "AI Sheets",
    icon: <Table className="h-5 w-5" />,
    isNew: true,
    isComingSoon: false,
    isDisabled: false,
  },
  // {
  //   id: "download",
  //   label: "Download For Me",
  //   icon: <Download />,
  //   isNew: true,
  // },
  // { id: "chat", label: "AI Chat", icon: <MessageCircle /> },
  {
    id: "research",
    label: "Deep research",
    icon: <Search className="h-5 w-5" />,
    isNew: true,
    isComingSoon: false,
    isDisabled: false,
  },
  {
    id: "browse",
    label: "Browse for me",
    icon: <Bot className="h-5 w-5" />,
    isNew: false,
    isComingSoon: true,
    isDisabled: true,
  },
];

const QUICK_START_TEMPLATES = [
  {
    id: "business",
    title: "Business Presentation",
    description: "Professional presentation for business meetings",
    icon: <Briefcase className="h-6 w-6" />,
    prompt: "Create a professional business presentation about",
    colorClass: "text-blue-600",
    examples: ["quarterly results", "product launch", "market analysis"],
  },
  {
    id: "academic",
    title: "Academic Research",
    description: "Educational content with citations and research",
    icon: <GraduationCap className="h-6 w-6" />,
    prompt: "Create an academic presentation about",
    colorClass: "text-purple-600",
    examples: ["climate change", "machine learning", "historical events"],
  },
  {
    id: "product",
    title: "Product Launch",
    description: "Engaging presentation for new product reveals",
    icon: <Rocket className="h-6 w-6" />,
    prompt: "Create a product launch presentation for",
    colorClass: "text-orange-600",
    examples: ["mobile app", "SaaS platform", "hardware device"],
  },
  {
    id: "training",
    title: "Training Material",
    description: "Educational content for team training",
    icon: <BookOpen className="h-6 w-6" />,
    prompt: "Create training materials about",
    colorClass: "text-primary",
    examples: ["onboarding process", "software tools", "best practices"],
  },
];

const ONBOARDING_STEPS = [
  {
    title: "🎯 Smart Planning",
    description:
      "Our Planner Agent analyzes your requirements and creates a custom blueprint for your presentation",
  },
  {
    title: "🎨 Personal Design",
    description:
      "Choose your colors, styles, and branding preferences for a truly customized look",
  },
  {
    title: "🔍 AI Research",
    description:
      "Content Generation Agent researches and creates accurate, up-to-date information",
  },
  {
    title: "✅ Quality Assured",
    description:
      "Every presentation is validated by our QA Agent for accuracy, design, and compliance",
  },
];

const suggestedTopics = {
  slides: [
    "Create a professional business presentation about Digital Marketing",
    "Create an academic presentation about AI in Education",
    "Create a presentation on Bangladesh Software Industry",
  ],
  sheets: [
    "Compare pricing of top 10 gyms in a sheet",
    "List top 5 Italian restaurants with ratings",
    "Generate 10 school and contact notes",
  ],
  research: [
    "Find all recent studies on intermittent fasting and longevity",
    "Compare pricing, pros, and cons of top 5 project management tools",
    "Investigate the latest laws on crypto trading in the US and Europe",
  ],
  browse: [],
};

export default function AgentLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAgentType } = useAgentContext();
  const [inputValue, setInputValue] = useState("");
  const [selectedNavItem, setSelectedNavItem] = useState("slides");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accessToken, sheetToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [uploadFilesForSlides, { isLoading: isUploadingSlides }] =
    useUploadPresentationFilesMutation();
  const [uploadFilesForSheets, { isLoading: isUploadingSheets }] =
    useUploadSheetFilesMutation();
  const [uploadFilesForResearch, { isLoading: isUploadingResearch }] =
    useUploadResearchFilesMutation();
  // const [initiatePresentation, { isLoading: isInitiatingPresentation }] =
  //   useCreatePresentationMutation();
  // 
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [isInitiatingPresentation, setIsInitiatingPresentation] =
    useState(false);
  const [isInitiatingSheet, setIsInitiatingSheet] = useState(false);
  const [isInitiatingResearch, setIsInitiatingResearch] = useState(false);

  // 

  // Add this state to your component
  // const [uploadedFiles, setUploadedFiles] = useState([]);
  // const [fileUrls, setFileUrls] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const {
    currentFiles,
    currentUrls,
    addFiles,
    removeFile,
    clearCurrentNavItem, // if needed
    clearAllNavItems, // if needed
    hasFiles,
  } = useNavItemFiles(selectedNavItem);

  // File upload hook - handles upload logic for different agent types
  const { handleFileSelect, isUploading } = useFileUpload({
    uploadFunction: async (uploadData) => {
      // Route to appropriate upload mutation based on navItem
      switch (selectedNavItem) {
        case "slides":
          return await uploadFilesForSlides(uploadData).unwrap();
        case "sheets":
          return await uploadFilesForSheets(uploadData).unwrap();
        case "research":
          return await uploadFilesForResearch(uploadData).unwrap();
        default:
          throw new Error(`Invalid agent type: ${selectedNavItem}`);
      }
    },
    isUploading:
      isUploadingSlides || isUploadingSheets || isUploadingResearch,
    addFiles,
    prepareUploadData: (files, userId) => ({
      files,
      userId,
    }),
    getUserId: () => user?._id || null,
    onUploadStart: (fileCount) => {
      showToast(
        `Uploading ${fileCount} file${fileCount > 1 ? "s" : ""}...`,
        "info",
      );
    },
    onSuccess: (uploadedFiles, result) => {
      const fileCount = uploadedFiles.length;
      showToast(
        `${fileCount} file${fileCount > 1 ? "s" : ""} uploaded successfully`,
        "success",
      );
    },
    onError: (error) => {
      showToast(
        error.message || "Failed to upload files. Please try again.",
        "error",
      );
    },
    onValidationError: (message) => {
      showToast(message, "error");
    },
  });

  // RESEARCH STATES
  const [researchModel, setResearchModel] = useState("gemini-2.0-flash");
  const [topLevel, setTopLevel] = useState(3); // used for cofig -> 1.number_of_initial_queries, 2.max_research_loops

  // 

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (type) => {
    // You can trigger file picker logic here
    handleClose();
  };

  const isMobile = useResponsive("down", "sm");

  const user = useSelector((state) => state.auth.user);

  /**
   * When we come to the agents page if user is not registered to our services, make them register it.
   */
  const { sheetAIToken, refreshSheetAIToken } = useSheetAiToken();

  // for saving sheet token to redux state
  useEffect(() => {
    // We will save token on redux and based on that we will generate users sheet chat data
    if (!sheetAIToken) return;

    dispatch(setSheetToken(sheetAIToken));
  }, [sheetAIToken, dispatch]);

  useEffect(() => {
    const hasVisited = localStorage.getItem("shothik_has_visited");
    if (!hasVisited) {
      setIsFirstTimeUser(true);
      setShowOnboarding(true);
      localStorage.setItem("shothik_has_visited", "true");
    }
  }, []);

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && NAVIGATION_ITEMS.some((item) => item.id === tab)) {
      setSelectedNavItem(tab);
      // Set appropriate input value based on tab
      if (tab === "sheets") {
        setInputValue("Create a list for ");
      } else if (tab === "slides") {
        setInputValue("Create a presentation about ");
      } else if (tab === "research") {
        setInputValue("");
      }
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isSubmitting) return;

    // Prevent submission while files are uploading
    if (isUploading) {
      showToast(
        "Please wait for file uploads to complete before submitting",
        "error",
      );
      return;
    }

    setIsSubmitting(true);

    // for sheet
    const email = user?.email;

    try {
      switch (selectedNavItem) {
        case "slides":
          return await handleSlideCreation(
            inputValue,
            currentUrls,
            currentFiles,
            setAgentType,
            dispatch,
            setLoginDialogOpen,
            setIsSubmitting,
            setIsInitiatingPresentation,
            router,
            showToast,
          );
        case "sheets":
          return await handleSheetGenerationRequest(
            inputValue,
            setAgentType,
            dispatch,
            setLoginDialogOpen,
            setIsSubmitting,
            setIsInitiatingSheet,
            router,
            email,
            showToast,
            refreshSheetAIToken,
          );
        case "research":
          return await handleResearchRequest(
            inputValue,
            researchModel,
            topLevel,
            setIsInitiatingResearch,
            setLoginDialogOpen,
            setIsSubmitting,
            showToast,
            router,
          );
        case "browse":
          return 
        default:
          return 
      }
    } catch (error) {
      // console.error("[AgentLandingPage] Error initiating presentation:", error);
      // alert("Failed to create presentation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavItemClick = (itemId) => {
    setSelectedNavItem(itemId);
    if (itemId === "slides") {
      setInputValue("Create a presentation about ");
    } else if (itemId === "sheets") {
      setInputValue("Create a list for ");
    } else if (itemId === "download") {
      setInputValue("Download information about ");
    } else {
      setInputValue("");
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedNavItem("slides");
    setInputValue(template.prompt + " ");
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  // to show toast
  const showToast = (message, variant = "destructive") => {
    if (variant === "destructive" || variant === "error") {
      toast.error(message);
    } else if (variant === "success") {
      toast.success(message);
    } else {
      toast.info(message);
    }
  };

  // Updated click handler
  const handleClick = () => {
    // Trigger file input click
    document.getElementById("file-upload-input").click();
  };

  const handleRemoveFile = (index, filename) => {
    removeFile(index);
  };

  // 

  return (
    <div className="bg-background text-foreground relative flex min-h-[calc(100vh-100px)] flex-col">
      {/* Onboarding Banner - Less intrusive welcome message */}
      {showOnboarding && (
        <div className="bg-primary/10 border-primary/20 fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-xl border p-4 shadow-lg backdrop-blur-sm sm:left-auto sm:right-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-primary mb-1 font-semibold">
                Welcome to Shothik AI!
              </h3>
              <p className="text-muted-foreground text-sm">
                Create AI-powered presentations, spreadsheets, and research in seconds. Try typing a prompt above to get started!
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setInputValue("Create a presentation about Digital Marketing Trends 2025");
                    handleCloseOnboarding();
                  }}
                >
                  Try Example
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCloseOnboarding}
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseOnboarding}
              className="h-6 w-6 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 text-center pt-12 sm:pt-0">
          <h1 className="from-primary mb-2 bg-gradient-to-r to-emerald-400 bg-clip-text text-5xl leading-[1.3] font-bold text-transparent">
            Shothik Agents
          </h1>
          {/* <div className="flex items-center justify-center gap-2">
            <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
            <p className="text-muted-foreground text-sm">
              4-Agent AI system ready to create presentations
            </p>
          </div> */}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 max-w-md mx-auto sm:flex sm:flex-wrap sm:justify-center sm:max-w-none sm:gap-3">
          {NAVIGATION_ITEMS.map((item) => (
            <Button
              key={item.id}
              variant={selectedNavItem === item.id ? "default" : "outline"}
              onClick={() => handleNavItemClick(item.id)}
              disabled={item.isDisabled}
              data-rybbit-event="Agent"
              data-rybbit-prop-agent={item.label}
              className={cn(
                "relative rounded-full px-6 py-2 min-w-0",
                selectedNavItem === item.id
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border hover:bg-primary/10 hover:text-primary hover:border-primary",
              )}
            >
              <span className="mr-2">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.isNew && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 px-1.5 text-[0.65rem]"
                >
                  New
                </Badge>
              )}
              {item.isComingSoon && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 px-1.5 text-[0.65rem]"
                >
                  Coming soon
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <Card className="mx-auto max-w-3xl rounded-2xl border shadow-md">
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <Textarea
                placeholder={
                  selectedNavItem === "slides"
                    ? "Create a presentation about..."
                    : "Ask anything, create anything..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="max-h-32 min-h-[60px] resize-none border-none text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {selectedNavItem === "research" && (
                  <SearchDropdown
                    setResearchModel={setResearchModel}
                    setTopLevel={setTopLevel}
                  />
                )}
                {/* Hidden file input for slide file selection */}
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
                {selectedNavItem === "slides" && (
                  <Button
                    variant="ghost"
                    onClick={handleClick}
                    className="text-muted-foreground hover:text-primary"
                    data-rybbit-event="File Attach"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Attach
                  </Button>
                )}

                {isFirstTimeUser && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowOnboarding(true)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Quick Tour
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={handleSubmit}
                          disabled={
                            !inputValue.trim() ||
                            isInitiatingPresentation ||
                            isInitiatingSheet ||
                            isUploading ||
                            isInitiatingResearch
                          }
                          size="icon"
                          className="bg-primary hover:bg-primary/90 h-10 w-10 rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                          data-rybbit-event="Agent Start"
                        >
                          {isInitiatingPresentation ||
                          isInitiatingSheet ||
                          isInitiatingResearch ||
                          isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {isUploading && (
                      <TooltipContent>
                        <p>Please wait for file uploads to complete</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* uploaded files preview STARTS */}
            <FileList
              files={currentFiles || []}
              onRemove={handleRemoveFile}
              maxVisibleFiles={3}
              title="Attached Files"
              showHeader={true}
              isUploading={isUploading}
            />
            {/* uploaded files preview ENDS */}
          </CardContent>
        </Card>

        {selectedNavItem === "slides" && (
          <div className="mt-8">
            {/* <h2 className="mb-4 text-center text-xl font-semibold">
              Quick Start Templates
            </h2> */}
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {QUICK_START_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => handleTemplateSelect(template)}
                  data-rybbit-event="Quick Start Templates"
                  data-rybbit-prop-quick_start_templates={template.title}
                >
                  <CardContent className="flex flex-col items-center p-4 text-center">
                    <div className={cn("mb-2", template.colorClass)}>
                      {template.icon}
                    </div>
                    <h3 className="mb-1 text-base font-semibold">
                      {template.title}
                    </h3>
                    <p className="text-muted-foreground mb-3 text-xs">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1">
                      {template.examples.slice(0, 2).map((example) => (
                        <Badge
                          key={example}
                          variant="outline"
                          className={cn(
                            "h-5 border text-[0.65rem]",
                            template.colorClass,
                          )}
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-3 text-sm">
            {selectedNavItem === "slides"
              ? "Popular presentation topics:"
              : "Try these popular requests:"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedTopics[selectedNavItem].length > 0 &&
              suggestedTopics[selectedNavItem].map((prompt) => (
                <Badge
                  key={prompt}
                  variant="outline"
                  onClick={() => setInputValue(prompt)}
                  className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 block max-w-full cursor-pointer truncate px-3 py-1.5"
                  data-rybbit-event="Popular Topics"
                  data-rybbit-prop-popular_topics={prompt}
                >
                  {prompt}
                </Badge>
              ))}
          </div>
        </div>

        {selectedNavItem === "slides" && (
          <div className="mt-12 text-center">
            <h2 className="mb-6 text-xl font-semibold">
              Powered by 4 AI Agents
            </h2>
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="text-center">
                <Target className="text-primary mx-auto mb-2 h-10 w-10" />
                <h3 className="mb-1 text-sm font-semibold">Smart Planning</h3>
                <p className="text-muted-foreground text-xs">
                  AI analyzes your needs
                </p>
              </div>
              <div className="text-center">
                <Palette className="text-primary mx-auto mb-2 h-10 w-10" />
                <h3 className="mb-1 text-sm font-semibold">Custom Design</h3>
                <p className="text-muted-foreground text-xs">
                  Your style, your brand
                </p>
              </div>
              <div className="text-center">
                <CheckCircle className="text-primary mx-auto mb-2 h-10 w-10" />
                <h3 className="mb-1 text-sm font-semibold">Quality Assured</h3>
                <p className="text-muted-foreground text-xs">
                  AI validates everything
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Social Proof Section */}
        <div className="mt-16 border-t pt-12">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-xl font-semibold">
              Trusted by Thousands Worldwide
            </h2>
            <div className="mb-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-primary text-3xl font-bold">10K+</div>
                <div className="text-muted-foreground text-sm">Presentations Created</div>
              </div>
              <div className="text-center">
                <div className="text-primary text-3xl font-bold">150+</div>
                <div className="text-muted-foreground text-sm">Countries Served</div>
              </div>
              <div className="text-center">
                <div className="text-primary text-3xl font-bold">95%</div>
                <div className="text-muted-foreground text-sm">Satisfaction Rate</div>
              </div>
              <div className="text-center">
                <div className="text-primary text-3xl font-bold">5M+</div>
                <div className="text-muted-foreground text-sm">Words Processed</div>
              </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-3">
              <Card className="border p-4 text-left">
                <p className="text-muted-foreground mb-3 text-sm italic">
                  "Shothik AI transformed how I create presentations. What used to take hours now takes minutes!"
                </p>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                    S
                  </div>
                  <div>
                    <div className="text-sm font-medium">Sarah M.</div>
                    <div className="text-muted-foreground text-xs">Marketing Manager</div>
                  </div>
                </div>
              </Card>
              <Card className="border p-4 text-left">
                <p className="text-muted-foreground mb-3 text-sm italic">
                  "The AI research feature is incredibly powerful. It saves me hours of manual research work."
                </p>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                    J
                  </div>
                  <div>
                    <div className="text-sm font-medium">James L.</div>
                    <div className="text-muted-foreground text-xs">Content Strategist</div>
                  </div>
                </div>
              </Card>
              <Card className="border p-4 text-left">
                <p className="text-muted-foreground mb-3 text-sm italic">
                  "Best investment for my business. The quality of AI-generated content is outstanding."
                </p>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                    A
                  </div>
                  <div>
                    <div className="text-sm font-medium">Anika R.</div>
                    <div className="text-muted-foreground text-xs">Entrepreneur</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <LoginDialog
        loginDialogOpen={loginDialogOpen}
        setLoginDialogOpen={setLoginDialogOpen}
      />
    </div>
  );
}

// Note: This code is for alerting user to login for using agentic services
const LoginDialog = ({ loginDialogOpen, setLoginDialogOpen }) => {
  const dispatch = useDispatch();
  return (
    <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to create a presentation. Please log in to
            continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              dispatch(setShowLoginModal(true));
              setLoginDialogOpen(false);
            }}
          >
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
