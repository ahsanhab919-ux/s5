"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  Bot,
  Eye,
  FileText,
  Languages,
  Megaphone,
  SpellCheck2,
  Wand2,
} from "lucide-react";
import React from "react";

export default function ClaritSectionV2({ onCTAClick = () => {} }) {
  const stages = [
    {
      id: "learn",
      label: "Learn",
      subtitle: "Student: study faster & write better",
      services: [
        {
          key: "paraphrase",
          title: "Paraphrase",
          desc: "Reword sentences while preserving meaning — perfect for study notes and drafts.",
          icon: <ArrowLeftRight className="size-4" />,
        },
        {
          key: "grammar",
          title: "Grammar Fix",
          desc: "Auto-correct spelling, punctuation and tone for academic clarity.",
          icon: <SpellCheck2 className="size-4" />,
        },
        {
          key: "summarize",
          title: "Summarize",
          desc: "Get concise summaries so you can absorb and review faster.",
          icon: <FileText className="size-4" />,
        },
        {
          key: "translate",
          title: "Translator",
          desc: "Translate content while preserving voice and context.",
          icon: <Languages className="size-4" />,
        },
      ],
    },
    {
      id: "build",
      label: "Build",
      subtitle: "Founder: prepare pitch & product-ready content",
      services: [
        {
          key: "humanize",
          title: "Humanize",
          desc: "Make technical or academic text sound natural and persuasive.",
          icon: <Wand2 className="size-4" />,
        },
        {
          key: "ai-detector",
          title: "AI Detector",
          desc: "Check for generated content and tune for a human voice.",
          icon: <Eye className="size-4" />,
        },
        {
          key: "agents",
          title: "Agents",
          desc: "Automate repetitive content tasks and assemble workflows.",
          icon: <Bot className="size-4" />,
        },
      ],
    },
    {
      id: "grow",
      label: "Grow",
      subtitle: "Entrepreneur: scale outreach & convert users",
      services: [
        {
          key: "marketing",
          title: "Marketing Automation",
          desc: "Create email flows, landing copy, and campaign-ready assets quickly.",
          icon: <Megaphone className="size-4" />,
        },
        {
          key: "agents-2",
          title: "Agents",
          desc: "Deploy agents that perform outreach tasks and content orchestration.",
          icon: <Bot className="size-4" />,
        },
      ],
    },
  ];

  const [tab, setTab] = React.useState("0");

  return (
    <section className="bg-background py-12 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        {/* Hero / Motto */}
        <div className="mb-6 text-center md:mb-12">
          <h2 className="mb-4 text-2xl font-bold">
            From Student to Entrepreneur —{" "}
            <span className="text-primary">
              Your writing journey, simplified
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[760px]">
            One platform to write, verify and launch: paraphrase, humanize,
            detect, fix grammar, summarize, translate, build agents and automate
            marketing — all in a cohesive workflow.
          </p>

          <div className="mt-6 flex flex-row justify-center gap-2">
            <Button
              // data-umami-event="Get early access"
              data-rybbit-event="Get early access"
              variant="default"
              onClick={() => onCTAClick("get-started")}
              aria-label="Get early access"
            >
              Get early access
            </Button>
            <Button
              // data-umami-event="View features"
              data-rybbit-event="View features"
              variant="outline"
              onClick={() => onCTAClick("features")}
            >
              View features
            </Button>
          </div>
        </div>

        {/* Tabs (stages) */}
        <Card className="mb-6 border">
          <div className="px-4 pt-4 md:px-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-4 w-full justify-start overflow-x-auto">
                {stages.map((s, i) => (
                  <TabsTrigger
                    key={s.id}
                    value={i.toString()}
                    className="min-w-[160px] py-3 text-left"
                  >
                    <div className="text-left">
                      <div className="font-bold">{s.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {s.subtitle}
                      </div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              <Separator />

              {/* Cards Grid */}
              <CardContent className="pt-6">
                {stages.map((stage, stageIndex) => (
                  <TabsContent
                    key={stage.id}
                    value={stageIndex.toString()}
                    className="mt-0"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {stage.services.map((svc) => (
                        <Card
                          key={svc.key}
                          className="flex h-full flex-col justify-between border"
                        >
                          <CardContent className="pt-6">
                            <div className="flex flex-row items-start gap-4">
                              <div
                                className={cn(
                                  "h-11 w-11 rounded-lg",
                                  "bg-primary/10 flex shrink-0 items-center justify-center",
                                )}
                              >
                                <div className="text-primary">{svc.icon}</div>
                              </div>

                              <div>
                                <h3 className="text-base font-bold">
                                  {svc.title}
                                </h3>
                                <p className="text-muted-foreground mt-1 text-sm">
                                  {svc.desc}
                                </p>
                              </div>
                            </div>
                          </CardContent>

                          <div className="px-4 pb-4">
                            <div className="flex flex-row items-center justify-between">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onCTAClick(svc.key)}
                                aria-label={`Learn more about ${svc.title}`}
                              >
                                Learn more
                              </Button>
                              <span className="text-muted-foreground/60 text-xs">
                                Fast • Secure
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </CardContent>
            </Tabs>
          </div>
        </Card>

        {/* Secondary row: Why choose us + illustration */}
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h3 className="mb-2 text-lg font-bold">
              Designed for the whole journey
            </h3>
            <p className="text-muted-foreground max-w-[680px]">
              Preserve your voice and get results. Each tool plugs into
              workflows so you can go from first draft to market-ready copy
              without leaving the platform.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
              <div>
                <p className="text-sm">
                  • Intuitive, card-based UI for quick scanning
                </p>
              </div>
              <div>
                <p className="text-sm">
                  • Stage-guided path from student to entrepreneur
                </p>
              </div>
              <div>
                <p className="text-sm">
                  • Built-in verification (AI detector & originality checks)
                </p>
              </div>
              <div>
                <p className="text-sm">
                  • Automations & agents to scale outreach
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-row gap-2">
              <Button variant="default" onClick={() => onCTAClick("signup")}>
                Start free trial
              </Button>
              <Button variant="outline" onClick={() => onCTAClick("demo")}>
                Request demo
              </Button>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div
              className={cn(
                "hidden lg:block",
                "bg-muted h-full rounded-lg p-4",
                "border-primary/20 border border-dashed",
              )}
            >
              {/* Replace this area with a branded illustration, Lottie or GIF in production. */}
              <div className="bg-background flex h-[220px] w-full items-center justify-center rounded">
                <p className="text-muted-foreground text-sm">
                  Illustration / GIF — replace with brand asset
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
