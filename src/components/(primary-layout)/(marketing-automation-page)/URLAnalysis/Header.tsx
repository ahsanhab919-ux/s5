"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BookOpen,
  Building2,
  ChevronDown,
  CreditCard,
  Facebook,
  Loader2,
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface MetaUserData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  pages: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  businessAccounts: Array<{
    id: string;
    name: string;
    adsAccounts: Array<{
      id: string;
      name: string;
      account_status: number;
      currency: string;
      timezone_name: string;
    }>;
  }>;
  selectedPageIds: string[];
  selectedBusinessAccountId: string;
  selectedAdsAccountId: string;
}

interface HeaderProps {
  metaConnected: boolean;
  metaLoading: boolean;
  metaConnecting: boolean;
  metaUserData?: MetaUserData | null;
  onMetaConnect: () => void;
  onMetaDisconnect: () => void;
}

export default function Header({
  metaConnected,
  metaLoading,
  metaConnecting,
  metaUserData,
  onMetaConnect,
  onMetaDisconnect,
}: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 flex items-center justify-end">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Meta Connection Status */}
        {metaConnected ? (
          <>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-3"
                >
                  <Facebook className="text-primary h-4 w-4" />
                  <span className="text-sm font-medium">
                    <span className="hidden md:inline">Meta</span> Connected
                  </span>
                  <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[95vw] p-0 md:w-[420px]"
                align="end"
                sideOffset={8}
              >
                <Card className="border-0 shadow-none">
                  {/* Header with gradient */}
                  <CardHeader className="border-border border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                          <Facebook className="text-primary h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-foreground text-sm font-semibold">
                            Meta Account Details
                          </CardTitle>
                          <p className="text-muted-foreground text-xs">
                            Connected & Active
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={onMetaDisconnect}
                        disabled={metaLoading}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/20 h-8"
                        title="Disconnect Meta account"
                      >
                        {metaLoading ? (
                          <Loader2 className="text-destructive h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <LogOut className="text-destructive h-4 w-4" />
                            <span className="text-destructive text-xs">
                              Disconnect
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
                    {metaUserData && (
                      <>
                        {/* User Info */}
                        <Card className="border-border bg-muted/30 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="bg-primary/20 flex h-6 w-6 items-center justify-center rounded-lg">
                              <UserIcon className="text-primary h-3.5 w-3.5" />
                            </div>
                            <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                              Account Owner
                            </h3>
                          </div>
                          <p className="text-foreground mb-0.5 text-sm font-semibold">
                            {metaUserData.user.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {metaUserData.user.email}
                          </p>
                        </Card>

                        {/* Pages */}
                        {metaUserData.pages &&
                          metaUserData.pages.length > 0 && (
                            <div>
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="bg-primary/20 flex h-6 w-6 items-center justify-center rounded-lg">
                                    <Facebook className="text-primary h-3.5 w-3.5" />
                                  </div>
                                  <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                                    Facebook Pages
                                  </h3>
                                </div>
                                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                                  {metaUserData.pages.length}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {metaUserData.pages.slice(0, 3).map((page) => (
                                  <Card
                                    key={page.id}
                                    className="group border-border bg-muted/40 hover:border-primary/50 hover:bg-muted/60 p-3 transition-all"
                                  >
                                    <p className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
                                      {page.name}
                                    </p>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                      {page.category}
                                    </p>
                                  </Card>
                                ))}
                                {metaUserData.pages.length > 3 && (
                                  <div className="py-1 text-center">
                                    <span className="bg-muted/50 text-muted-foreground rounded-full px-3 py-1 text-xs">
                                      +{metaUserData.pages.length - 3} more
                                      pages
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Business Accounts */}
                        {metaUserData.businessAccounts &&
                          metaUserData.businessAccounts.length > 0 && (
                            <div>
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="bg-primary/20 flex h-6 w-6 items-center justify-center rounded-lg">
                                    <Building2 className="text-primary h-3.5 w-3.5" />
                                  </div>
                                  <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                                    Business Accounts
                                  </h3>
                                </div>
                                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                                  {metaUserData.businessAccounts.length}
                                </span>
                              </div>
                              <div className="space-y-3">
                                {metaUserData.businessAccounts.map(
                                  (business) => (
                                    <Card
                                      key={business.id}
                                      className="border-border bg-muted/40 p-3"
                                    >
                                      <p className="text-foreground mb-2 text-sm font-semibold">
                                        {business.name}
                                      </p>
                                      {business.adsAccounts &&
                                        business.adsAccounts.length > 0 && (
                                          <div className="space-y-2">
                                            <div className="mb-2 flex items-center gap-1.5">
                                              <CreditCard className="text-primary h-3 w-3" />
                                              <p className="text-muted-foreground text-xs font-medium">
                                                Ads Accounts (
                                                {business.adsAccounts.length})
                                              </p>
                                            </div>
                                            {business.adsAccounts
                                              .slice(0, 2)
                                              .map((ads) => (
                                                <Card
                                                  key={ads.id}
                                                  className="border-border bg-background/50 hover:border-primary/40 hover:bg-background/70 p-2.5 transition-all"
                                                >
                                                  <p className="text-foreground mb-1 text-xs font-medium">
                                                    {ads.name}
                                                  </p>
                                                  <div className="flex items-center gap-2">
                                                    <span className="bg-muted/50 text-muted-foreground rounded px-2 py-0.5 text-xs">
                                                      {ads.currency}
                                                    </span>
                                                    <span
                                                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                                                        ads.account_status === 1
                                                          ? "bg-primary/10 text-primary"
                                                          : "bg-destructive/10 text-destructive"
                                                      }`}
                                                    >
                                                      {ads.account_status === 1
                                                        ? "● Active"
                                                        : "● Inactive"}
                                                    </span>
                                                  </div>
                                                </Card>
                                              ))}
                                            {business.adsAccounts.length >
                                              2 && (
                                              <div className="py-1 text-center">
                                                <span className="bg-muted/50 text-muted-foreground rounded-full px-3 py-1 text-xs">
                                                  +
                                                  {business.adsAccounts.length -
                                                    2}{" "}
                                                  more accounts
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                    </Card>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {/* Selected Items */}
                        {(metaUserData.selectedPageIds?.length > 0 ||
                          metaUserData.selectedBusinessAccountId ||
                          metaUserData.selectedAdsAccountId) && (
                          <Card className="border-primary/20 bg-primary/10 p-3">
                            <h3 className="text-primary mb-2 text-xs font-semibold tracking-wide uppercase">
                              Active Selections
                            </h3>
                            <div className="space-y-1.5">
                              {metaUserData.selectedPageIds?.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                                  <p className="text-foreground text-xs">
                                    {metaUserData.selectedPageIds.length}{" "}
                                    page(s) selected
                                  </p>
                                </div>
                              )}
                              {metaUserData.selectedBusinessAccountId && (
                                <div className="flex items-center gap-2">
                                  <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                                  <p className="text-foreground text-xs">
                                    Business account selected
                                  </p>
                                </div>
                              )}
                              {metaUserData.selectedAdsAccountId && (
                                <div className="flex items-center gap-2">
                                  <div className="bg-primary h-1.5 w-1.5 rounded-full"></div>
                                  <p className="text-foreground text-xs">
                                    Ads account selected
                                  </p>
                                </div>
                              )}
                            </div>
                          </Card>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>

            <Link href="/marketing-automation/webhooks">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                title="Open Messenger Inbox"
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span className="hidden text-sm sm:inline">
                  Messenger Connect
                </span>
              </Button>
            </Link>
            <Link href="/marketing-automation/messenger">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                title="Open Messenger Inbox"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden text-sm sm:inline">Messenger</span>
              </Button>
            </Link>
            <Link href="/marketing-automation/chat-knowledge">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                title="Knowledge Base"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden text-sm sm:inline">Knowledge</span>
              </Button>
            </Link>
          </>
        ) : (
          <Button
            onClick={onMetaConnect}
            disabled={metaConnecting || metaLoading}
            className="flex items-center gap-2"
          >
            {metaConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Facebook className="h-4 w-4" />
            )}
            <span
              className="hidden text-sm sm:inline"
              data-rybbit-event="connect_meta_clicked"
            >
              {metaConnecting ? "Connecting..." : "Connect Meta"}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
