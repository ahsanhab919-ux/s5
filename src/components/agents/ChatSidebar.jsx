"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { format } from "date-fns";
import { Clock, Loader2, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function ChatSidebar({
  sidebarOpen,
  toggleDrawer,
  isMobile,
  isLoading,
  error,
  router,
  myChats = [],
  SlideDataLoading,
  slidesChats,
  SlideDataLoadingError,
  researchData,
  researchDataLoading,
  researchDataError,
}) {
  const [tabIndex, setTabIndex] = useState("slide");

  const handleTabChange = (value) => {
    setTabIndex(value);
  };


  return (
    <Sheet open={sidebarOpen} onOpenChange={(open) => toggleDrawer(open)()}>
      <SheetContent
        side="left"
        className={cn(
          "absolute w-screen overflow-hidden p-0 sm:w-80 sm:max-w-[calc(100vw-320px)] md:w-[360px]",
        )}
        style={{ zIndex: 1102 }}
      >
        <VisuallyHidden>
          <SheetTitle>Chat History</SheetTitle>
        </VisuallyHidden>
        <div className="flex h-screen w-full flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <Tabs
              value={tabIndex}
              onValueChange={handleTabChange}
              className="w-4/5"
            >
              <TabsList className="w-4/5">
                <TabsTrigger value="slide" className="flex-1">
                  Slide
                </TabsTrigger>
                <TabsTrigger value="sheet" className="flex-1">
                  Sheet
                </TabsTrigger>
                <TabsTrigger value="research" className="flex-1">
                  Research
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {tabIndex === "slide" && (
              <>
                {SlideDataLoading && (
                  <div className="flex h-[100px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="ml-2">Loading chats…</p>
                  </div>
                )}
                {SlideDataLoadingError && (
                  <p className="text-muted-foreground">No chats found</p>
                )}
                {!SlideDataLoading && slidesChats?.length === 0 && (
                  <div className="mt-4 text-center">
                    <MessageCircle className="text-muted-foreground mx-auto h-12 w-12" />
                    <p>No chats yet</p>
                    <p className="text-muted-foreground text-sm">
                      Start a new conversation to see it here
                    </p>
                  </div>
                )}
                {slidesChats?.length > 0 && (
                  <div className="flex flex-col space-y-2">
                    {slidesChats.map((chat) => (
                      <Card
                        key={chat.p_id}
                        onClick={() => {
                          toggleDrawer(false)();
                          router.push(`/agents/presentation?id=${chat.p_id}`);
                        }}
                        className={cn(
                          "cursor-pointer border transition-all duration-100",
                          "hover:bg-accent hover:border-primary",
                          "active:scale-[0.98]",
                        )}
                      >
                        <CardContent className="p-4">
                          <p
                            className="truncate font-semibold"
                            title={chat.title}
                          >
                            {chat.title}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            {format(
                              new Date(chat.creation_date),
                              "dd/MM/yyyy, hh:mm a",
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {tabIndex === "sheet" && (
              <>
                {isLoading && (
                  <div className="flex h-[100px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="ml-2">Loading chats…</p>
                  </div>
                )}
                {error && (
                  <p className="text-muted-foreground">No chats found</p>
                )}
                {!isLoading && myChats.length === 0 && (
                  <div className="mt-4 text-center">
                    <MessageCircle className="text-muted-foreground mx-auto h-12 w-12" />
                    <p>No chats yet</p>
                    <p className="text-muted-foreground text-sm">
                      Start a new conversation to see it here
                    </p>
                  </div>
                )}
                {myChats.length > 0 && (
                  <div className="flex flex-col space-y-2">
                    {myChats.map((chat) => (
                      <Card
                        key={chat._id || chat.id}
                        onClick={() => {
                          toggleDrawer(false)();
                          router.push(`/agents/sheets?id=${chat._id}`);
                        }}
                        className={cn(
                          "cursor-pointer border transition-all duration-100",
                          "hover:bg-accent hover:border-primary",
                          "active:scale-[0.98]",
                        )}
                      >
                        <CardContent className="p-4">
                          <p
                            className="truncate font-semibold"
                            title={chat.name}
                          >
                            {chat.name}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            {format(
                              new Date(chat.createdAt),
                              "dd/MM/yyyy, hh:mm a",
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {tabIndex === "research" && (
              <>
                {researchDataLoading && (
                  <div className="flex h-[100px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="ml-2">Loading chats…</p>
                  </div>
                )}
                {researchDataError && (
                  <p className="text-muted-foreground">No chats found</p>
                )}
                {!researchDataLoading && researchData?.length === 0 && (
                  <div className="mt-4 text-center">
                    <MessageCircle className="text-muted-foreground mx-auto h-12 w-12" />
                    <p>No chats yet</p>
                    <p className="text-muted-foreground text-sm">
                      Start a new conversation to see it here
                    </p>
                  </div>
                )}
                {researchData?.length > 0 && (
                  <div className="flex flex-col space-y-2">
                    {researchData.map((chat) => (
                      <Card
                        key={chat._id}
                        onClick={() => {
                          toggleDrawer(false)();
                          router.push(`/agents/research?id=${chat._id}`);
                        }}
                        className={cn(
                          "cursor-pointer border transition-all duration-100",
                          "hover:bg-accent hover:border-primary",
                          "active:scale-[0.98]",
                        )}
                      >
                        <CardContent className="p-4">
                          <p
                            className="truncate font-semibold"
                            title={chat.name}
                          >
                            {chat.name}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            {format(
                              new Date(chat.createdAt),
                              "dd/MM/yyyy, hh:mm a",
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
