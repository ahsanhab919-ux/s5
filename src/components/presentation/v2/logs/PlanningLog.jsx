"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Layout,
  Palette,
} from "lucide-react";
import { useState } from "react";

/**
 * PlanningLog Component
 *
 * Displays lightweight planning agent logs with comprehensive presentation structure:
 * - Presentation metadata (topic, key message, narrative flow)
 * - Global theme (colors, tone, visual style)
 * - Content strategy (slide categorization)
 * - Detailed slide outline (numbered sections with full details)
 *
 * Uses collapsible sections for better organization and readability.
 */
export default function PlanningLog({ log }) {
  const data = log?.data || {};
  const timestamp = log?.timestamp || log?.lastUpdated;

  // Extract nested data
  const metadata = data?.presentation_metadata || {};
  const theme = data?.global_theme || {};
  const contentStrategy = data?.content_strategy || {};
  const slideOutline = Array.isArray(data?.slide_outline)
    ? data.slide_outline
    : [];

  // Format timestamp
  const timeFormatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const displayTime = timestamp
    ? timeFormatter.format(new Date(timestamp))
    : "";

  return (
    <div className="mb-6 flex justify-start">
      <div className="w-full sm:max-w-[90%] lg:max-w-full">
        {/* Header bar */}
        <div className="mb-3 flex items-center gap-2">
          <FileText className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-xs font-medium">
            Using Tool |
          </span>
          <span className="text-foreground text-xs font-semibold">
            Planning Agent
          </span>
          {displayTime && (
            <>
              <span className="text-muted-foreground/50 mx-1">•</span>
              <span className="text-muted-foreground text-[11px]">
                {displayTime}
              </span>
            </>
          )}
        </div>

        {/* Main container */}
        <div className="border-border bg-card rounded-lg border shadow-sm">
          {/* Card header */}
          <div className="border-border bg-muted/30 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Layout className="text-muted-foreground h-4 w-4" />
              <span className="text-foreground text-sm font-semibold">
                Presentation Structure
              </span>
            </div>
            {metadata?.total_slides && (
              <span className="text-muted-foreground text-xs">
                {metadata.total_slides} slides
              </span>
            )}
          </div>

          {/* Card content */}
          <div className="space-y-4 p-4">
            {/* Presentation Metadata Section */}
            {metadata && Object.keys(metadata).length > 0 && (
              <MetadataSection metadata={metadata} />
            )}

            {/* Theme Section */}
            {theme && Object.keys(theme).length > 0 && (
              <ThemeSection theme={theme} />
            )}

            {/* Content Strategy Section */}
            {contentStrategy && Object.keys(contentStrategy).length > 0 && (
              <ContentStrategySection contentStrategy={contentStrategy} />
            )}

            {/* Slide Outline Section */}
            {slideOutline.length > 0 && (
              <SlideOutlineSection slideOutline={slideOutline} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Metadata Section Component
 */
function MetadataSection({ metadata }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className="border-border bg-muted/20 rounded-md border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <FileText className="text-muted-foreground h-4 w-4" />
          <span className="text-foreground text-sm font-semibold">
            Presentation Overview
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="border-border space-y-3 border-t px-4 pt-3 pb-4">
          {metadata?.topic && (
            <div>
              <span className="text-muted-foreground text-xs font-medium">
                Topic:
              </span>
              <p className="text-foreground mt-1 text-sm">{metadata.topic}</p>
            </div>
          )}

          {metadata?.key_message && (
            <div>
              <span className="text-muted-foreground text-xs font-medium">
                Key Message:
              </span>
              <p className="text-foreground mt-1 text-sm leading-relaxed">
                {metadata.key_message}
              </p>
            </div>
          )}

          {metadata?.narrative_flow && (
            <div>
              <span className="text-muted-foreground text-xs font-medium">
                Narrative Flow:
              </span>
              <p className="text-foreground mt-1 text-sm leading-relaxed">
                {metadata.narrative_flow}
              </p>
            </div>
          )}

          {metadata?.presentation_type && (
            <div>
              <span className="text-muted-foreground text-xs font-medium">
                Type:
              </span>
              <Badge variant="outline" className="ml-2 text-xs">
                {metadata.presentation_type.replace("_", " ")}
              </Badge>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Theme Section Component
 */
function ThemeSection({ theme }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const colorKeys = [
    { key: "primary_color", label: "Primary" },
    { key: "secondary_color", label: "Secondary" },
    { key: "accent_color", label: "Accent" },
    { key: "background_color", label: "Background" },
    { key: "text_color", label: "Text" },
    { key: "heading_color", label: "Heading" },
  ];

  return (
    <section className="border-border bg-muted/20 rounded-md border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Palette className="text-muted-foreground h-4 w-4" />
          <span className="text-foreground text-sm font-semibold">
            Theme & Style
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="border-border space-y-3 border-t px-4 pt-3 pb-4">
          {/* Color Palette */}
          <div>
            <span className="text-muted-foreground text-xs font-medium">
              Color Palette:
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {colorKeys.map(({ key, label }) => {
                const color = theme[key];
                if (!color) return null;

                return (
                  <div
                    key={key}
                    className="border-border bg-background flex items-center gap-2 rounded-md border px-2 py-1"
                  >
                    <div
                      className="border-border/50 h-4 w-4 rounded border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-foreground text-xs">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tone and Visual Style */}
          <div className="flex flex-wrap gap-3">
            {theme?.tone && (
              <div>
                <span className="text-muted-foreground text-xs font-medium">
                  Tone:
                </span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {theme.tone}
                </Badge>
              </div>
            )}

            {theme?.visual_style && (
              <div>
                <span className="text-muted-foreground text-xs font-medium">
                  Style:
                </span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {theme.visual_style.replace("_", " ")}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Content Strategy Section Component
 */
function ContentStrategySection({ contentStrategy }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const strategyTypes = [
    {
      key: "opening_slides",
      label: "Opening",
      //  color: "bg-blue-500/20"
    },
    {
      key: "core_content_slides",
      label: "Core Content",
      //   color: "bg-green-500/20",
    },
    {
      key: "data_heavy_slides",
      label: "Data Heavy",
      //   color: "bg-purple-500/20",
    },
    {
      key: "story_slides",
      label: "Story",
      // color: "bg-orange-500/20"
    },
    {
      key: "closing_slides",
      label: "Closing",
      //  color: "bg-red-500/20"
    },
  ];

  return (
    <section className="border-border bg-muted/20 rounded-md border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Layout className="text-muted-foreground h-4 w-4" />
          <span className="text-foreground text-sm font-semibold">
            Content Strategy
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="border-border space-y-2 border-t px-4 pt-3 pb-4">
          {strategyTypes.map(({ key, label, color }) => {
            const slides = contentStrategy[key];
            if (!Array.isArray(slides) || slides.length === 0) return null;

            return (
              <div
                key={key}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2",
                  color,
                )}
              >
                <span className="text-foreground text-xs font-medium">
                  {label}
                </span>
                <div className="flex gap-1">
                  {slides.map((slideNum, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="h-5 w-5 p-0 text-[10px]"
                    >
                      {slideNum}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * Slide Outline Section Component
 */
function SlideOutlineSection({ slideOutline }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="border-border bg-muted/20 rounded-md border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Layout className="text-muted-foreground h-4 w-4" />
          <span className="text-foreground text-sm font-semibold">
            Slide Outline
          </span>
          <span className="text-muted-foreground text-xs">
            ({slideOutline.length} slides)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="border-border space-y-3 border-t px-4 pt-3 pb-4">
          {slideOutline.map((slide, index) => (
            <SlideOutlineCard key={index} slide={slide} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Slide Outline Card Component
 */
function SlideOutlineCard({ slide }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const slideNumber = slide?.slide_number || 0;
  const slideTitle = slide?.slide_title || "Untitled Slide";
  const slidePurpose = slide?.slide_purpose || "";
  const suggestedType = slide?.suggested_type || "";
  const contentGuidance = slide?.content_guidance || "";
  const searchQuery = slide?.search_query || "";
  const requiredElements = Array.isArray(slide?.required_elements)
    ? slide.required_elements
    : [];
  const fallbackKeywords = Array.isArray(slide?.fallback_keywords)
    ? slide.fallback_keywords
    : [];

  return (
    <div className="border-border bg-background rounded-md border p-3">
      {/* Card header - always visible */}
      <div className="flex items-start gap-3">
        {/* Slide number badge */}
        <div className="bg-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
          <span className="text-primary-foreground text-xs font-semibold">
            {slideNumber}
          </span>
        </div>

        {/* Slide info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-foreground text-sm font-semibold">
                {slideTitle}
              </h4>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {slidePurpose && (
                  <Badge variant="outline" className="text-[10px]">
                    {slidePurpose.replace("_", " ")}
                  </Badge>
                )}
                {suggestedType && (
                  <Badge variant="outline" className="text-[10px]">
                    {suggestedType.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 shrink-0 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-border mt-3 space-y-2 border-t pt-3">
          {contentGuidance && (
            <div>
              <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                Content Guidance:
              </span>
              <p className="text-foreground mt-1 text-xs leading-relaxed">
                {contentGuidance}
              </p>
            </div>
          )}

          {searchQuery && (
            <div>
              <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                Search Query:
              </span>
              <p className="text-foreground mt-1 text-xs italic">
                {searchQuery}
              </p>
            </div>
          )}

          {requiredElements.length > 0 && (
            <div>
              <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                Required Elements:
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {requiredElements.map((element, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px]">
                    {element.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {fallbackKeywords.length > 0 && (
            <div>
              <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                Fallback Keywords:
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {fallbackKeywords.slice(0, 3).map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px]">
                    {keyword}
                  </Badge>
                ))}
                {fallbackKeywords.length > 3 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{fallbackKeywords.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
