"use client";

import MascotIcon from "@/components/icons/MascotIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import { getRouteState } from "@/utils/getRouteState";
import {
  AlignCenter,
  ArrowLeft,
  Brain,
  FileText,
  Lightbulb,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StudioCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface MindMapHistory {
  _id: string;
  title: string;
  createdAt: string;
  insights: {
    totalCampaigns: number;
    totalAdSets: number;
    totalAds: number;
  };
}

export default function AIInsights() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = getRouteState(searchParams);

  const projectId = state?.projectId;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome to AI Insights! I can help you analyze your marketing campaigns, understand audience behavior, optimize ad performance, and provide strategic recommendations. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mindMapHistory, setMindMapHistory] = useState<MindMapHistory[]>([]);
  const [dataSource, setDataSource] = useState<string>("project");

  const [isChatSheetOpen, setIsChatSheetOpen] = useState(false);
  const isMobile = useResponsive("down", "md");

  // Close sheet when screen size changes from mobile to desktop
  useEffect(() => {
    if (!isMobile && isChatSheetOpen) {
      setIsChatSheetOpen(false);
    }
  }, [isMobile, isChatSheetOpen]);

  // Fetch mind map history and chat history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        // Fetch mind map history
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        const mindMapResponse = await fetch(
          `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}projects/${analysisId}/mindmap/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (mindMapResponse.ok) {
          const result = await mindMapResponse.json();
          setMindMapHistory(result.data);
        }

        // Fetch chat history if projectId is available
        if (projectId) {
          const chatResponse = await fetch(
            `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}chat/history/${projectId}?limit=50`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (chatResponse.ok) {
            const chatResult = await chatResponse.json();
            if (chatResult.data && chatResult.data.length > 0) {
              const formattedMessages = chatResult.data.map(
                (msg: {
                  _id: string;
                  role: "user" | "assistant";
                  content: string;
                  timestamp: string;
                }) => ({
                  id: msg._id,
                  role: msg.role,
                  content: msg.content,
                  timestamp: new Date(msg.timestamp),
                }),
              );
              setMessages(formattedMessages);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (analysisId) {
      fetchData();
    }
  }, [analysisId, projectId]);

  const studioCards: StudioCard[] = [
    {
      id: "mindmap",
      title: "Mind Map",
      icon: <Brain className="h-5 w-5" />,
      color: "",
      bgColor: "",
    },
    {
      id: "reports",
      title: "Reports",
      icon: <FileText className="h-5 w-5" />,
      color: "",
      bgColor: "",
    },
  ];

  const handleStudioCardClick = (cardId: string) => {
    if (cardId === "mindmap") {
      router.push(`/marketing-automation/insights/${analysisId}/mindmap`);
    } else if (cardId === "reports") {
      router.push(`/marketing-automation/insights/${analysisId}/reports`);
    }
  };

  const handleMindMapClick = (mindMapId: string) => {
    router.push(
      `/marketing-automation/insights/${analysisId}/mindmap/${mindMapId}`,
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !projectId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}chat/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            message: inputMessage,
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setDataSource(result.data.dataSource || "project");
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I couldn't connect to the server. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // scroll effect
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="bg-background flex flex-1 flex-col">
      {/* Main Content */}
      <div className="relative grid md:grid-cols-3 xl:grid-cols-4">
        {/* Chat Body - Full width on mobile, 2/3 on desktop */}
        <div className="bg-background h-[calc(100vh-4rem)] overflow-hidden md:col-span-2 xl:col-span-3">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-border bg-background/90 sticky top-0 z-10 flex h-12 items-center justify-center border-b backdrop-blur-sm md:h-16">
              <div className="flex h-full w-full items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-2">
                  <Link href="/marketing-automation">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Go back to analysis"
                      title="Go back to analysis"
                    >
                      <ArrowLeft className="size-5" />
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2">
                    <MascotIcon className="size-8" />
                    <div>
                      <h1 className="text-foreground text-xl font-bold">
                        AI Insights Assistant
                      </h1>
                      <p className="text-muted-foreground hidden text-xs md:block">
                        Powered by advanced AI
                      </p>
                    </div>
                  </div>
                </div>
                {/* Top button removed - using floating action button at bottom instead */}
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <MascotIcon className="size-8 shrink-0" />
                  )}
                  <div
                    className={`max-w-2xl rounded-xl px-4 py-3 shadow-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border-border bg-card text-card-foreground border"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    ) : (
                      <div className="prose prose-sm prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-headings:text-foreground prose-p:my-1.5 prose-p:text-muted-foreground prose-strong:text-foreground prose-strong:font-semibold prose-ul:my-1.5 prose-ul:text-muted-foreground prose-ol:my-1.5 prose-ol:text-muted-foreground prose-li:my-0.5 prose-li:text-muted-foreground prose-code:text-primary prose-code:bg-primary/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-2.5 prose-pre:my-2 prose-table:border-collapse prose-table:my-2 prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-2.5 prose-th:py-1.5 prose-th:text-muted-foreground prose-td:border prose-td:border-border prose-td:px-2.5 prose-td:py-1.5 prose-td:text-muted-foreground max-w-none text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    <span
                      className={`mt-1.5 block text-xs ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {message.role === "user" && (
                    <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Lightbulb className="size-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <MascotIcon className="size-8" />
                  </div>
                  <div className="border-border bg-card rounded-xl border px-4 py-3 shadow-lg">
                    <div className="flex gap-2">
                      <div className="bg-primary h-2 w-2 animate-bounce rounded-full"></div>
                      <div
                        className="bg-primary h-2 w-2 animate-bounce rounded-full"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="bg-primary h-2 w-2 animate-bounce rounded-full"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-border bg-background/90 min-h-12 shrink-0 border-t px-4 py-1 md:h-16 md:px-6">
              <div className="flex h-full items-center gap-2">
                <div className="relative flex-1">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="w-full resize-none pr-28"
                    rows={1}
                    style={{
                      minHeight: "38px",
                      maxHeight: "96px",
                    }}
                  />
                  <span className="border-border bg-background text-muted-foreground absolute right-2 bottom-2 rounded border px-1.5 py-0.75 text-xs uppercase">
                    {dataSource === "meta_api"
                      ? "Meta API"
                      : dataSource === "campaign"
                        ? "Campaign Data"
                        : dataSource === "mixed"
                          ? "Mixed"
                          : "Project"}
                  </span>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  aria-label="Send message"
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop studio - Hidden on mobile */}
        <div
          className={cn(
            "bg-background sticky top-16 right-0 bottom-0 hidden overflow-hidden overflow-y-auto md:block md:h-[calc(100vh-4rem)] md:border-s",
          )}
        >
          <div className="flex h-full flex-col">
            {/* Studio Header */}
            <div className="border-border h-12 shrink-0 border-b px-4 md:h-16">
              <div className="flex h-full items-center justify-between">
                <h2 className="text-foreground text-base font-bold">Studio</h2>
                {/* <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="View analytics"
                  title="View analytics"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button> */}
              </div>
            </div>

            {/* Studio Cards */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
              <div className="grid gap-3">
                {studioCards.map((card) => (
                  <Button
                    key={card.id}
                    onClick={() => handleStudioCardClick(card.id)}
                    variant="outline"
                    className="flex h-auto flex-col items-center justify-center gap-2 rounded-xl p-4"
                  >
                    {card.icon}
                    <span className="text-center text-xs font-medium">
                      {card.title}
                    </span>
                  </Button>
                ))}
              </div>

              {/* Recent Activity - Mind Map History */}
              <div className="mt-4">
                <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Mind Map History
                </h3>
                <div className="space-y-2">
                  {mindMapHistory.length === 0 ? (
                    <p className="text-muted-foreground py-3 text-center text-xs">
                      No mind maps generated yet
                    </p>
                  ) : (
                    mindMapHistory.map((mindMap) => (
                      <Card
                        key={mindMap._id}
                        onClick={() => handleMindMapClick(mindMap._id)}
                        className="hover:border-primary cursor-pointer p-2.5 transition-all"
                      >
                        <div className="flex items-start gap-2">
                          <Brain className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground truncate text-xs font-medium">
                              {mindMap.title}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {mindMap.insights.totalCampaigns} campaigns •{" "}
                              {mindMap.insights.totalAds} ads
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Add Note Button */}
            {/* <div className="border-border flex h-12 shrink-0 items-center justify-center border-t px-4 md:h-16">
              <Button className="w-full">
                <MascotIcon className="size-8" />
                Add note
              </Button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Mobile Chat Button - Floating action button */}
      <Button
        onClick={() => setIsChatSheetOpen(true)}
        size="icon-lg"
        className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 md:hidden"
        aria-label="Open chat"
      >
        <AlignCenter className="h-6 w-6" />
      </Button>

      {/* Mobile Chat Sheet */}
      <Sheet open={isChatSheetOpen} onOpenChange={setIsChatSheetOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-sm overflow-hidden p-0"
        >
          <div className="h-full">
            <div className="flex h-full flex-col">
              {/* Studio Header */}
              <div className="border-border h-12 shrink-0 border-b px-4 md:h-16">
                <div className="flex h-full items-center justify-between">
                  <h2 className="text-foreground text-base font-bold">
                    Studio
                  </h2>
                  {/* <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="View analytics"
                    title="View analytics"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button> */}
                </div>
              </div>

              {/* Studio Cards */}
              <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {studioCards.map((card) => (
                    <Button
                      key={card.id}
                      onClick={() => handleStudioCardClick(card.id)}
                      variant="outline"
                      className="flex h-auto flex-col items-center justify-center gap-2 rounded-xl p-4"
                    >
                      {card.icon}
                      <span className="text-center text-xs font-medium">
                        {card.title}
                      </span>
                    </Button>
                  ))}
                </div>

                {/* Recent Activity - Mind Map History */}
                <div className="mt-4">
                  <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Mind Map History
                  </h3>
                  <div className="space-y-2">
                    {mindMapHistory.length === 0 ? (
                      <p className="text-muted-foreground py-3 text-center text-xs">
                        No mind maps generated yet
                      </p>
                    ) : (
                      mindMapHistory.map((mindMap) => (
                        <Card
                          key={mindMap._id}
                          onClick={() => handleMindMapClick(mindMap._id)}
                          className="hover:border-primary cursor-pointer p-2.5 transition-all"
                        >
                          <div className="flex items-start gap-2">
                            <Brain className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground truncate text-xs font-medium">
                                {mindMap.title}
                              </p>
                              <p className="text-muted-foreground mt-0.5 text-xs">
                                {mindMap.insights.totalCampaigns} campaigns •{" "}
                                {mindMap.insights.totalAds} ads
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Add Note Button - Hidden until feature is implemented */}
              {/* <div className="border-border flex h-12 shrink-0 items-center justify-center border-t px-4 md:h-16">
                <Button className="w-full">
                  <Sparkles className="h-4 w-4" />
                  Add note
                </Button>
              </div> */}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
