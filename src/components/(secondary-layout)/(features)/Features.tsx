"use client";

import {
  BookOpen,
  Database,
  FileSpreadsheet,
  Globe,
  PenTool,
  RefreshCw,
  Search,
  UserCheck,
} from "lucide-react";
import type { StaticImageData } from "next/image";
import React from "react";
import FeatureCard from "./FeatureCard";
import AnalysisMockup from "./mockups/AnalysisMockup";
import CanvasMockup from "./mockups/CanvasMockup";
import DashboardMockup from "./mockups/DashboardMockup";
import LaunchMockup from "./mockups/LaunchMockup";
import MediaMockup from "./mockups/MediaMockup";

// { writing images }
import Aidectator from "../../../assets/(home-v3-page)/Showcase/Aidectator.gif";
import Grammerfix from "../../../assets/(home-v3-page)/Showcase/grammerfix.gif";
import Humanize from "../../../assets/(home-v3-page)/Showcase/Humanizemain.gif";
import Paraphrase from "../../../assets/(home-v3-page)/Showcase/paraphrase.gif";
import Summarizer from "../../../assets/(home-v3-page)/Showcase/summarizer.gif";
import Translator from "../../../assets/(home-v3-page)/Showcase/translator.gif";
// import Plagarism from "../../../assets/(home-v3-page)/Showcase/Plagarism.gif";

// { agents images }
// import Slidegent from "../../../assets/(home-v3-page)/Showcase/slideagent.gif";
import DeepResearch from "../../../assets/(home-v3-page)/Showcase/DeepResearch.gif";
import Sheetagent from "../../../assets/(home-v3-page)/Showcase/sheetagent.gif";

// { marketing images }
// import MetaMarketing from "../../../assets/(home-v3-page)/Showcase/MetaMarketing.gif";

const accentColor = "#1877F2";
interface Feature {
  icon: React.ReactElement;
  tag: string;
  title: string;
  description: string;
  mockupType: string;
  reverse: boolean;
  // Interactive: React.ReactElement;
  gif: StaticImageData;
  href: string;
}

const features: Feature[] = [
  {
    // paraphrasing
    icon: <RefreshCw size={24} />,
    tag: "Paraphrasing Agent",
    title: "Paraphrasing Agent",
    description:
      "Paraphrase your text with AI-powered paraphrasing, grammar enhancement, humanization, translation, and smart summarization in 180+ languages.",
    mockupType: "canvas",
    reverse: true,
    gif: Paraphrase,
    href: "/paraphrase",
  },
  {
    // ai detector
    icon: <Search size={24} />,
    tag: "AI Detector Agent",
    title: "AI Detector Agent",
    description:
      "Detect AI-generated content with our AI Detector Agent, ensuring authenticity and trust in your digital content.",
    mockupType: "dashboard",
    reverse: false,
    gif: Aidectator,
    href: "/ai-detector",
  },
  {
    // humanize
    icon: <UserCheck size={24} />,
    tag: "Humanize Agent",
    title: "Humanize Agent",
    description:
      "Humanize your content with AI-powered enhancements for a more natural and engaging tone.",
    mockupType: "dashboard",
    reverse: true,
    gif: Humanize,
    href: "/humanize-gpt",
  },
  {
    // summarizer
    icon: <BookOpen size={24} />,
    tag: "Summarizer Agent",
    title: "Summarizer Agent",
    description:
      "Summarize your content quickly and accurately with AI-powered summarization tools for concise and clear information.",
    mockupType: "media",
    reverse: false,
    gif: Summarizer,
    href: "/summarize",
  },
  {
    // grammar fix
    icon: <PenTool size={24} />,
    tag: "Grammar Fix Agent",
    title: "Grammar Fix Agent",
    description:
      "Enhance your writing with AI-powered grammar correction, ensuring clarity and professionalism in your content.",
    mockupType: "dashboard",
    reverse: true,
    gif: Grammerfix,
    href: "/grammar-checker",
  },
  {
    // translator
    icon: <Globe size={24} />,
    tag: "Translator Agent",
    title: "Translator Agent",
    description:
      "Translate your content accurately and efficiently with AI-powered translation tools supporting 180+ languages.",
    mockupType: "dashboard",
    reverse: false,
    gif: Translator,
    href: "/translator",
  },
  {
    // sheet generation
    icon: <FileSpreadsheet size={24} />,
    tag: "Sheet Gen Agent",
    title: "Data Analysis & Sheet Generation Agent",
    description:
      "Generate professional spreadsheets and analyze data with AI-powered tools for smart insights and automated reporting.",
    mockupType: "dashboard",
    reverse: true,
    gif: Sheetagent,
    href: "/agents",
  },
  {
    // deep research
    icon: <Database size={24} />,
    tag: "Research Agent",
    title: "Deep Research Agent",
    description:
      "Conduct comprehensive market and competitor research with AI-powered insights, trend analysis, and actionable intelligence for strategic decision-making.",
    mockupType: "dashboard",
    reverse: false,
    gif: DeepResearch,
    href: "/agents",
  },
];

const mockupComponents: Record<string, React.ReactElement> = {
  analysis: <AnalysisMockup accentColor={accentColor} />,
  canvas: <CanvasMockup accentColor={accentColor} />,
  media: <MediaMockup accentColor={accentColor} />,
  launch: <LaunchMockup accentColor={accentColor} />,
  dashboard: <DashboardMockup accentColor={accentColor} />,
};

export default function Features() {
  return (
    <section
      data-testid="meta-ads-features"
      className="relative py-24 md:py-20"
    >
      <div className="container mx-auto">
        <div className="mx-auto mb-24 max-w-4xl text-center md:mb-32">
          <h2 className="text-h2 text-foreground mb-6 text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
            Our Features{" "}
          </h2>
        </div>

        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            tag={feature.tag}
            title={feature.title}
            description={feature.description}
            accentColor={accentColor}
            mockup={mockupComponents[feature.mockupType]}
            reverse={feature.reverse}
            index={index}
            // Interactive={feature.gif}
            gif={feature.gif}
            href={feature.href}
          />
        ))}
      </div>
    </section>
  );
}
