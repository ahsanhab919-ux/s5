"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
// import { useToggleAIChat } from "@/hooks/(marketing-automation-page)/useAIChatApi";
import {
  useConversation,
  usePageMessages,
  useSendMessage,
  useUserProfile,
} from "@/hooks/(marketing-automation-page)/useMessengerApi";
import { useMetaData } from "@/hooks/(marketing-automation-page)/useMetaData";
import {
  AlignRight,
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import Link from "next/link";

interface Attachment {
  type: string;
  payload: Record<string, unknown>;
}

interface Message {
  _id: string;
  pageId: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  messageId?: string;
  text?: string;
  attachments?: Attachment[];
  isRead: boolean;
  isDelivered: boolean;
  eventType: string;
  createdAt: string;
}

interface Conversation {
  senderId: string;
  senderName?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

// Component to display conversation header with user name and AI toggle
const ConversationHeader = ({
  pageId,
  userId,
}: {
  pageId: string;
  userId: string;
}) => {
  const { data: userProfile } = useUserProfile(pageId, userId);
  const { data: metaData } = useMetaData();
  // const toggleAIChatMutation = useToggleAIChat();

  const displayName = userProfile?.name || `User ${userId.slice(-4)}`;

  // Find current page's AI chat status
  const currentPage = metaData?.pages?.find((p: any) => p.id === pageId);
  // const aiChatEnabled = currentPage?.aiChatEnabled || false;

  // const handleToggleAI = async () => {
  //   try {
  //     await toggleAIChatMutation.mutateAsync({
  //       pageId,
  //       enabled: !aiChatEnabled,
  //     });
  //   } catch (error) {
  //     console.error("Failed to toggle AI chat:", error);
  //   }
  // };

  return (
    <div className="flex h-full items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative">
          <div className="bg-primary flex size-8 items-center justify-center rounded-full shadow-lg md:size-8">
            <User className="text-primary-foreground h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="border-card bg-secondary absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 md:h-3.5 md:w-3.5"></div>
        </div>
        <div>
          <h3 className="text-foreground text-xs font-semibold md:text-sm">
            {displayName}
          </h3>
          <p className="text-secondary flex items-center gap-1 text-[10px] md:text-xs">
            <span className="bg-secondary h-1.5 w-1.5 animate-pulse rounded-full"></span>
            Active now
          </p>
        </div>
      </div>

      {/* AI Chat Toggle - Hidden on mobile */}
      <div className="hidden items-center gap-3 md:flex">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">AI Chat</span>
          {/* <button
              onClick={handleToggleAI}
              disabled={toggleAIChatMutation.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                aiChatEnabled ? "bg-secondary" : "bg-muted"
              } ${toggleAIChatMutation.isPending ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform ${
                  aiChatEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button> */}
          {/* {aiChatEnabled && (
              <span className="text-xs font-medium text-emerald-400">
                Active
              </span>
            )} */}
        </div>
      </div>
    </div>
  );
};

// Component to display a single conversation with real user name
const ConversationItem = ({
  conv,
  pageId,
  isSelected,
  onClick,
  formatTime,
}: {
  conv: Conversation;
  pageId: string;
  isSelected: boolean;
  onClick: () => void;
  formatTime: (timestamp: number) => string;
}) => {
  const { data: userProfile } = useUserProfile(pageId, conv.senderId);
  const displayName = userProfile?.name || `User ${conv.senderId.slice(-4)}`;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-md px-2 py-2 text-left transition-all duration-200 ${
        isSelected
          ? "border-primary/40 bg-primary/15 shadow-primary/10 border shadow-lg"
          : "border-border/40 bg-card/40 hover:border-border/60 hover:bg-accent/40 border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="bg-primary flex size-8 items-center justify-center rounded-full shadow-md">
            <User className="text-primary-foreground h-6 w-6" />
          </div>
          {conv.unreadCount > 0 && (
            <div className="border-card bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2">
              <span className="text-xs font-bold">{conv.unreadCount}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="text-foreground truncate pr-2 text-sm font-semibold">
              {displayName}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {formatTime(conv.lastMessageTime)}
            </span>
          </div>
          <p
            className={`truncate text-xs ${
              conv.unreadCount > 0
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            {conv.lastMessage}
          </p>
        </div>
      </div>
    </button>
  );
};

export const MessengerInbox = () => {
  const { data: metaData, isLoading: metaLoading } = useMetaData();
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messageText, setMessageText] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const { data: messagesData, isLoading: messagesLoading } =
    usePageMessages(selectedPage);
  const { data: conversationData, isLoading: conversationLoading } =
    useConversation(selectedPage, selectedConversation);
  const sendMessageMutation = useSendMessage();

  // Auto-select first page
  useEffect(() => {
    if (metaData?.pages && metaData.pages.length > 0 && !selectedPage) {
      setSelectedPage(metaData.pages[0].id);
    }
  }, [metaData, selectedPage]);

  // Close sidebar on mobile when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      setShowSidebar(false);
    }
  }, [selectedConversation]);

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
  }, [conversationData]);

  // Group messages by sender to create conversations
  const conversations: Conversation[] = [];
  if (messagesData?.messages) {
    const senderMap = new Map<string, Message[]>();

    messagesData.messages.forEach((msg: Message) => {
      // Group by sender (the user, not the page)
      const senderId =
        msg.senderId === selectedPage ? msg.recipientId : msg.senderId;
      if (!senderMap.has(senderId)) {
        senderMap.set(senderId, []);
      }
      senderMap.get(senderId)!.push(msg);
    });

    senderMap.forEach((messages, senderId) => {
      const sortedMessages = messages.sort((a, b) => b.timestamp - a.timestamp);
      const lastMessage = sortedMessages[0];
      const unreadCount = messages.filter(
        (m) => !m.isRead && m.senderId !== selectedPage,
      ).length;

      conversations.push({
        senderId,
        senderName: `User ${senderId.slice(-4)}`,
        lastMessage: lastMessage.text || "(attachment)",
        lastMessageTime: lastMessage.timestamp,
        unreadCount,
      });
    });

    conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedPage || !selectedConversation) return;

    try {
      await sendMessageMutation.mutateAsync({
        pageId: selectedPage,
        recipientId: selectedConversation,
        message: messageText,
      });
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getMessageStatus = (msg: Message) => {
    if (msg.senderId !== selectedPage) return null; // Only show status for sent messages
    if (msg.isRead)
      return <CheckCheck className="text-primary h-3 w-3 md:h-4 md:w-4" />;
    if (msg.isDelivered)
      return (
        <CheckCheck className="text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
      );
    return <Check className="text-muted-foreground h-3 w-3 md:h-4 md:w-4" />;
  };

  if (metaLoading) {
    return (
      <div className="bg-background flex min-h-[calc(100vh-4rem)] max-w-full items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!metaData || !metaData.pages || metaData.pages.length === 0) {
    return (
      <div className="bg-background flex min-h-[calc(100vh-4rem)] max-w-full items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="items-center gap-2 md:gap-3">
            <MessageSquare className="text-muted-foreground mx-auto h-12 w-12 md:h-16 md:w-16" />
            <CardTitle className="text-lg font-semibold md:text-xl">
              No Pages Connected
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Connect your Facebook account to start managing messages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/marketing-automation">
              <Button className="rounded-xl px-4 py-2 text-sm md:px-6 md:py-3 md:text-base">
                Connect Meta Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPageData = metaData.pages.find((p) => p.id === selectedPage);

  return (
    <div className="bg-background flex max-w-full flex-col">
      <div className="border-border bg-background/80 h-12 border-b px-3 backdrop-blur-xl md:h-16 md:px-6">
        <div className="flex h-full items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/marketing-automation">
              <Button
                variant="ghost"
                size="icon"
                title="Back to Campaign"
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <ArrowLeft className="size-4 md:size-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="border-primary/30 bg-primary/10 flex h-8 w-8 items-center justify-center rounded-xl border md:h-10 md:w-10">
                <MessageSquare className="text-primary h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold md:text-xl">
                  Messenger Inbox
                </h1>
                <p className="text-muted-foreground text-xs">
                  {selectedPageData?.name}
                </p>
              </div>
              <div className="block md:hidden">
                <h1 className="text-sm font-bold">Inbox</h1>
                <p className="text-muted-foreground max-w-[120px] truncate text-[10px]">
                  {selectedPageData?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            {selectedConversation && (
              <Button
                variant="ghost"
                size="icon"
                title="Back to conversations"
                onClick={() => setSelectedConversation(null)}
                className="h-8 w-8 md:hidden"
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            {!selectedConversation && (
              <Button
                variant="ghost"
                size="icon"
                title="Show conversations"
                onClick={() => setShowSidebar(true)}
                className="h-8 w-8 md:hidden"
              >
                <AlignRight className="size-4" />
              </Button>
            )}

            {metaData.pages.length > 1 && (
              <Select
                value={selectedPage ?? undefined}
                onValueChange={(value) => {
                  setSelectedPage(value);
                  setSelectedConversation(null);
                }}
              >
                <SelectTrigger
                  title="Select a page"
                  className="h-8 w-[120px] md:h-10 md:w-auto"
                >
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {metaData.pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Desktop Conversations List - Sticky Sidebar */}
        <div className="border-border bg-background/60 hidden h-[calc(100vh-8rem)] w-80 overflow-y-auto border-r backdrop-blur-md md:sticky md:top-16 md:block">
          <div className="p-4">
            <h2 className="text-muted-foreground mb-4 px-2 text-xs font-bold tracking-wider uppercase">
              Messages
            </h2>

            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-primary h-6 w-6 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                <p className="text-muted-foreground text-sm">
                  No conversations yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.senderId}
                    conv={conv}
                    pageId={selectedPage!}
                    isSelected={selectedConversation === conv.senderId}
                    onClick={() => setSelectedConversation(conv.senderId)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Conversations List - Sheet */}
        <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
          <SheetContent
            side="left"
            className="w-[85vw] max-w-sm overflow-y-auto p-0"
          >
            <SheetHeader className="border-border border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                  Messages
                </SheetTitle>
              </div>
            </SheetHeader>
            <div className="p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="text-primary h-6 w-6 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground text-sm">
                    No conversations yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <ConversationItem
                      key={conv.senderId}
                      conv={conv}
                      pageId={selectedPage!}
                      isSelected={selectedConversation === conv.senderId}
                      onClick={() => {
                        setSelectedConversation(conv.senderId);
                        setShowSidebar(false);
                      }}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Messages Area */}
        <div className="top-12 bottom-0 flex h-[calc(100vh-8rem)] flex-1 flex-col md:top-16">
          {!selectedConversation ? (
            <div className="flex flex-1 items-center justify-center p-4 py-6">
              <div className="text-center">
                <MessageSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12 md:h-16 md:w-16" />
                <h3 className="text-foreground mb-2 text-lg font-semibold md:text-xl">
                  Select a conversation
                </h3>
                <p className="text-muted-foreground text-sm md:text-base">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="h-12 border-b px-3 md:h-16 md:px-6">
                <ConversationHeader
                  pageId={selectedPage!}
                  userId={selectedConversation}
                />
              </div>

              {/* Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 space-y-3 overflow-y-auto p-3 md:space-y-4 md:p-6"
              >
                {conversationLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="text-primary h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {conversationData?.messages
                      ?.slice()
                      .reverse()
                      .map((msg: Message) => {
                        const isFromPage = msg.senderId === selectedPage;
                        const hasImage = msg.attachments?.some(
                          (att) => att.type === "image",
                        );
                        const imageAttachment = msg.attachments?.find(
                          (att) => att.type === "image",
                        );
                        const imageUrl = imageAttachment?.payload?.url as
                          | string
                          | undefined;

                        return (
                          <div
                            key={msg._id}
                            className={`flex items-end gap-1.5 md:gap-2 ${isFromPage ? "justify-end" : "justify-start"}`}
                          >
                            {!isFromPage && (
                              <div className="bg-primary text-primary-foreground mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full md:h-8 md:w-8">
                                <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </div>
                            )}
                            <div className="flex max-w-[85%] flex-col md:max-w-md">
                              <div
                                className={`${
                                  isFromPage
                                    ? "bg-primary text-primary-foreground rounded-[18px] rounded-br-md shadow-lg md:rounded-[20px]"
                                    : "border-border/50 bg-card/80 text-foreground rounded-[18px] rounded-bl-md border shadow-md backdrop-blur-md md:rounded-[20px]"
                                } px-3 py-2 md:px-4 md:py-2.5`}
                              >
                                {/* Image Attachment */}
                                {hasImage && imageUrl && (
                                  <div className="mb-2">
                                    <img
                                      src={imageUrl}
                                      alt="Attachment"
                                      className="h-auto max-h-48 max-w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90 md:max-h-64 md:rounded-xl"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Text Message */}
                                {msg.text && (
                                  <p
                                    className={`text-sm leading-relaxed md:text-[15px] ${
                                      isFromPage
                                        ? "text-primary-foreground"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {msg.text}
                                  </p>
                                )}

                                {/* No content fallback */}
                                {!msg.text && !hasImage && (
                                  <p className="text-muted-foreground text-xs italic md:text-sm">
                                    (attachment)
                                  </p>
                                )}
                              </div>
                              <div
                                className={`mt-0.5 flex items-center gap-1 px-1 md:mt-1 md:gap-1.5 ${
                                  isFromPage ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span className="text-muted-foreground text-[10px] md:text-xs">
                                  {formatTime(msg.timestamp)}
                                </span>
                                {getMessageStatus(msg)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="border-border/60 bg-background/80 h-14 border-t px-3 backdrop-blur-xl md:h-16 md:px-6">
                <div className="flex h-full items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="h-10 px-3 text-sm md:h-12 md:px-4"
                      disabled={sendMessageMutation.isPending}
                    />
                  </div>
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={
                      !messageText.trim() || sendMessageMutation.isPending
                    }
                    className="h-10 w-10 md:h-12 md:w-12"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin md:h-5 md:w-5" />
                    ) : (
                      <Send className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
