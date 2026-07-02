"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMetaData } from "@/hooks/(marketing-automation-page)/useMetaData";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { WebhookManager } from "./WebhookManager";

export const WebhookSettings = () => {
  const { data: metaData, isLoading } = useMetaData();

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <span className="text-foreground">Loading messenger settings...</span>
        </div>
      </div>
    );
  }

  if (!metaData) {
    return (
      <div className="bg-background relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_110%)] bg-[size:4rem_4rem] opacity-5"></div>

        <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
          <Card className="w-full max-w-md p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-destructive/20 flex h-12 w-12 items-center justify-center rounded-xl">
                <AlertCircle className="text-destructive h-6 w-6" />
              </div>
              <h2 className="text-foreground text-xl font-semibold">
                Meta Account Not Connected
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              You need to connect your Meta (Facebook) account before managing
              Messenger webhooks.
            </p>
            <Link href="/marketing-automation" className="w-full">
              <Button className="w-full">Connect Meta Account</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const pages = metaData.pages || [];

  return (
    <div className="bg-background relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_110%)] bg-[size:4rem_4rem] opacity-5"></div>

      <div className="relative container mx-auto px-4 py-6 md:px-6">
        {/* Back Button */}
        <Link href="/marketing-automation">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="size-5" />
            <span className="text-sm">Back to Analysis</span>
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-6 h-12 md:h-16">
          <div className="flex h-full items-center gap-4">
            <div className="border-border bg-primary/20 flex h-14 w-14 items-center justify-center rounded-2xl border">
              <MessageSquare className="text-primary h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Messenger Management</h1>
              <p className="text-muted-foreground mt-1 hidden text-xs md:block">
                Manage Facebook Messenger webhooks for real-time notifications
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5 mb-6 p-6">
          <h3 className="text-primary mb-2 flex items-center gap-2 font-semibold">
            <MessageSquare className="h-5 w-5" />
            What are Messenger Webhooks?
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Webhooks enable your application to receive real-time notifications
            when events occur on your Facebook Pages—such as new messages,
            comments, posts, or lead form submissions. Subscribe to webhooks for
            each page you want to monitor.
          </p>
        </Card>

        {/* Pages List */}
        {pages.length === 0 ? (
          <Card className="text-center md:p-12">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <AlertCircle className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 text-xl font-semibold">
              No Pages Found
            </h3>
            <p className="text-muted-foreground mx-auto max-w-md">
              You don't have any Facebook Pages connected. Please connect a Meta
              account with page access.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-xl font-semibold">
                Your Pages
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  ({pages.length} {pages.length === 1 ? "page" : "pages"})
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {pages?.map((page) => (
                <WebhookManager
                  key={page.id}
                  pageId={page.id}
                  pageName={page.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <Card className="mt-10 p-8">
          <h3 className="text-foreground mb-6 flex items-center gap-2 text-xl font-semibold">
            <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
              <ExternalLink className="text-primary h-4 w-4" />
            </div>
            Setup Instructions
          </h3>
          <ol className="text-muted-foreground space-y-4 text-sm">
            <li className="flex gap-4">
              <span className="bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span className="pt-0.5">
                Go to your{" "}
                <a
                  href="https://developers.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline"
                >
                  Facebook App Dashboard
                </a>
              </span>
            </li>
            <li className="flex gap-4">
              <span className="bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span className="pt-0.5">
                Navigate to Webhooks section and add a subscription
              </span>
            </li>
            <li className="flex gap-4">
              <span className="bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <div className="pt-0.5">
                <span className="mb-2 block">Enter your callback URL:</span>
                <code className="border-border bg-muted text-primary block rounded-lg border px-3 py-2 font-mono text-xs">
                  https://api-qa.shothik.ai$
                  {process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}
                  connect/facebook/webhook
                </code>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span className="pt-0.5">
                Enter your verify token (set in your backend .env file as{" "}
                <code className="bg-muted text-primary rounded px-2 py-0.5 text-xs">
                  FACEBOOK_WEBHOOK_VERIFY_TOKEN
                </code>
                )
              </span>
            </li>
            <li className="flex gap-4">
              <span className="bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                5
              </span>
              <span className="pt-0.5">
                Subscribe to the fields you want to receive (feed, messages,
                leadgen, etc.)
              </span>
            </li>
            <li className="flex gap-4">
              <span className="bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                6
              </span>
              <span className="pt-0.5">
                Click "Subscribe" button above for each page you want to monitor
              </span>
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
};
