"use client";

import MascotIcon from "@/components/icons/MascotIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { campaignAPI } from "@/services/marketing-automation.service";
import type { ProductAnalysis } from "@/types/analysis";
import { Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (message: Message) => void;
  analysis: ProductAnalysis;
  projectId: string;
  onDataModified?: () => void; // Callback when campaign data changes
}

export default function ChatBox({
  messages,
  onSendMessage,
  projectId,
  onDataModified,
}: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

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

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (historyLoaded || messages.length > 0) return; // Prevent duplicate loading

      try {
        const response = await campaignAPI.getChatHistory(projectId);
        if (response.success && response.data.messages?.length > 0) {
          // Load all messages from history
          response.data.messages.forEach((msg: Message) => {
            onSendMessage({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            });
          });
        } else {
          // If no history, show welcome message
          onSendMessage({
            role: "assistant",
            content:
              "👋 Hi! I'm your AI campaign assistant. I've analyzed your product and I'm ready to help you create Meta campaigns and ads. What would you like to work on?",
            timestamp: new Date(),
          });
        }
        setHistoryLoaded(true);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        // Show welcome message on error
        onSendMessage({
          role: "assistant",
          content:
            "👋 Hi! I'm your AI campaign assistant. Let's create amazing Meta ads together!",
          timestamp: new Date(),
        });
        setHistoryLoaded(true);
      }
    };

    if (projectId && !historyLoaded && messages.length === 0) {
      loadChatHistory();
    }
  }, [projectId, historyLoaded, messages.length, onSendMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    onSendMessage(userMessage);
    setInput("");
    setIsTyping(true);

    try {
      // Call real AI backend with memory
      const response = await campaignAPI.chat(projectId, input);

      const aiMessage: Message = {
        role: "assistant",
        content: response.data.message,
        timestamp: new Date(response.data.timestamp),
      };
      onSendMessage(aiMessage);

      // If data was modified, trigger reload in parent component
      if (response.data.dataModified && onDataModified) {
        onDataModified();
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      onSendMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    "Show me the personas",
    "Explain the ad concepts",
    "Create ads for problem-aware stage",
    "Generate carousel ad copy",
  ];

  return (
    <div className="bg-background/30 flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex h-12 items-center border-b px-4 lg:h-16">
        <div className="flex w-full items-center gap-2">
          <MascotIcon className="size-8" />
          <div>
            <h2 className="text-foreground text-base font-semibold">
              AI Assistant
            </h2>
            <p className="text-muted-foreground text-xs">
              Campaign & Ad Creation Helper
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && <MascotIcon className="size-8" />}
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card text-card-foreground border"
              }`}
            >
              <div className="markdown-content text-sm leading-relaxed break-words">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed text-current last:mb-0">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 list-none space-y-2 pl-0">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 list-decimal space-y-2 pl-5">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="before:text-primary flex items-start gap-2 text-sm before:text-base before:font-bold before:content-['•']">
                        <span className="text-current">{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="bg-muted rounded px-1 font-bold text-current">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="text-muted-foreground italic">
                        {children}
                      </em>
                    ),
                    code: ({ children }) => (
                      <code className="bg-muted text-primary rounded border px-2 py-0.5 font-mono text-xs">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-muted mb-3 overflow-x-auto rounded-lg border p-3">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-primary bg-primary/10 my-3 rounded-r border-l-4 py-2 pl-4">
                        {children}
                      </blockquote>
                    ),
                    h1: ({ children }) => (
                      <h1 className="mb-3 border-b pb-2 text-lg font-bold text-current">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mt-4 mb-2 text-base font-bold text-current first:mt-0">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-3 mb-2 text-sm font-semibold text-current first:mt-0">
                        {children}
                      </h3>
                    ),
                    hr: () => <hr className="border-border my-4" />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.timestamp && (
                <p
                  className={`mt-1 text-xs ${
                    message.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
            {message.role === "user" && (
              <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <User className="text-muted-foreground h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
              <MascotIcon className="size-8" />
            </div>
            <div className="bg-card rounded-2xl border px-4 py-3">
              <div className="flex gap-1">
                <div className="bg-primary h-2 w-2 animate-bounce rounded-full"></div>
                <div
                  className="bg-primary h-2 w-2 animate-bounce rounded-full"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="bg-primary h-2 w-2 animate-bounce rounded-full"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && !isTyping && (
        <div className="px-6 pb-4">
          <p className="text-muted-foreground mb-3 text-xs font-medium">
            Quick actions:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex h-12 items-center border-t px-4 lg:h-16">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your campaign..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
          >
            {isTyping ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>

      <style>{`
        .markdown-content {
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        .markdown-content p {
          white-space: pre-wrap;
          word-break: break-word;
        }
        .markdown-content strong {
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
