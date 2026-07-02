"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  BarChart3,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface AISuggestion {
  type: "budget" | "creative";
  level: "campaign" | "adset" | "creative" | "ad";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  action: string;
  targetId?: string;
  targetName?: string;
  newBudget?: number;
  updates?: {
    headline?: string;
    primaryText?: string;
    description?: string;
  };
}

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onSuggestionApplied?: () => void;
}

export default function AISuggestions({
  suggestions,
  onSuggestionApplied,
}: AISuggestionsProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const applySuggestion = async (suggestion: AISuggestion, index: number) => {
    const suggestionKey = `${suggestion.type}-${suggestion.targetId || index}`;

    if (!suggestion.targetId) {
      toast.error("This suggestion doesn't have a specific target.");
      return;
    }

    setApplyingId(suggestionKey);

    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (suggestion.type === "budget" && suggestion.newBudget) {
        const response = await fetch(
          `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}suggestions/apply-budget`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              projectId,
              adSetId: suggestion.targetId,
              newBudget: suggestion.newBudget,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to apply budget suggestion");
        }

        toast.success(
          `Budget updated! ${suggestion.targetName || "Ad Set"} budget set to $${suggestion.newBudget}`,
        );
      } else if (
        suggestion.type === "creative" &&
        suggestion.level === "ad" &&
        suggestion.updates
      ) {
        const response = await fetch(
          `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}suggestions/apply-creative`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              projectId,
              adId: suggestion.targetId,
              updates: suggestion.updates,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.message || "Failed to apply creative suggestion",
          );
        }

        toast.success(
          `Creative updated! Ad "${suggestion.targetName}" has been updated`,
        );
      } else {
        toast.info(`Manual action required: ${suggestion.action}`);
        return;
      }

      setAppliedIds((prev) => new Set(prev).add(suggestionKey));
      onSuggestionApplied?.();
    } catch (error: any) {
      toast.error(
        `Failed to apply suggestion: ${error.message || "Something went wrong"}`,
      );
    } finally {
      setApplyingId(null);
    }
  };

  const getPriorityVariant = (
    priority: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  // Filter to only applicable suggestions
  const canApplyFn = (s: AISuggestion) =>
    (s.type === "budget" && s.newBudget && s.targetId) ||
    (s.type === "creative" && s.level === "ad" && s.updates && s.targetId);

  const applicableSuggestions = suggestions.filter(canApplyFn);

  if (applicableSuggestions.length === 0) {
    return null;
  }

  const tabs = [
    {
      key: "all",
      label: "All",
      icon: Sparkles,
      count: applicableSuggestions.length,
    },
    {
      key: "campaign",
      label: "Campaign",
      icon: Target,
      count: applicableSuggestions.filter((s) => s.level === "campaign").length,
    },
    {
      key: "adset",
      label: "Ad Set (Budget)",
      icon: BarChart3,
      count: applicableSuggestions.filter((s) => s.level === "adset").length,
    },
    {
      key: "creative",
      label: "Creative",
      icon: ImageIcon,
      count: applicableSuggestions.filter((s) => s.level === "creative").length,
    },
    {
      key: "ad",
      label: "Ad Copy",
      icon: Zap,
      count: applicableSuggestions.filter((s) => s.level === "ad").length,
    },
  ];

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="border-border bg-muted rounded-full border p-3">
            <Lightbulb className="text-primary h-8 w-8" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              AI Optimization Suggestions
            </h1>
            <p className="text-muted-foreground">
              {applicableSuggestions.length} actionable recommendations to
              improve your campaign performance
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs value={selectedLevel} onValueChange={setSelectedLevel}>
          <TabsList>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Suggestions Grid */}
      <main className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {applicableSuggestions
          .filter((s) => selectedLevel === "all" || s.level === selectedLevel)
          .map((suggestion, index) => (
            <Card
              key={index}
              className="hover:border-primary flex flex-col space-y-6 p-6 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs uppercase">
                  {suggestion.type}
                </Badge>
                <Badge
                  variant={getPriorityVariant(suggestion.priority)}
                  className="text-xs"
                >
                  <AlertCircle className="mr-1 h-4 w-4" />
                  <span>
                    {suggestion.priority.toUpperCase()} -{" "}
                    {suggestion.level === "adset"
                      ? "Ad Set"
                      : suggestion.level.charAt(0).toUpperCase() +
                        suggestion.level.slice(1)}
                  </span>
                </Badge>
              </div>

              {/* Title */}
              <h2 className="text-foreground text-xl font-bold">
                {suggestion.title}
              </h2>

              {/* Target */}
              {suggestion.targetName && (
                <Card className="flex items-center space-x-3 p-4">
                  <Target className="text-primary h-5 w-5" />
                  <span className="text-muted-foreground text-sm font-medium">
                    {suggestion.targetName}
                  </span>
                </Card>
              )}

              {/* Description */}
              <p className="text-muted-foreground text-sm">
                {suggestion.description}
              </p>

              {/* Impact */}
              <Card className="border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="text-primary mt-0.5 h-5 w-5" />
                  <div>
                    <h3 className="text-primary text-sm font-semibold tracking-wider uppercase">
                      Expected Impact
                    </h3>
                    <p className="text-primary/80 text-sm">
                      {suggestion.impact}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Action (if exists) */}
              {suggestion.action && (
                <Card className="p-4">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="text-primary mt-0.5 h-5 w-5" />
                    <p className="text-muted-foreground text-sm font-medium">
                      Apply: {suggestion.action}
                    </p>
                  </div>
                </Card>
              )}

              {/* Buttons */}
              <div className="mt-auto flex items-center space-x-4 pt-4">
                {(() => {
                  const suggestionKey = `${suggestion.type}-${suggestion.targetId || index}`;
                  const isApplying = applyingId === suggestionKey;
                  const isApplied = appliedIds.has(suggestionKey);
                  const canApply =
                    (suggestion.type === "budget" &&
                      suggestion.newBudget &&
                      suggestion.targetId) ||
                    (suggestion.type === "creative" &&
                      suggestion.level === "ad" &&
                      suggestion.updates &&
                      suggestion.targetId);

                  return (
                    <Button
                      className="flex-1"
                      onClick={() => applySuggestion(suggestion, index)}
                      disabled={isApplying || isApplied}
                      variant={isApplied ? "outline" : "default"}
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Applying...
                        </>
                      ) : isApplied ? (
                        "Applied ✓"
                      ) : canApply ? (
                        "Apply Suggestion"
                      ) : (
                        "How to Apply"
                      )}
                    </Button>
                  );
                })()}
              </div>
            </Card>
          ))}
      </main>

      {/* Empty State */}
      {applicableSuggestions.filter(
        (s) => selectedLevel === "all" || s.level === selectedLevel,
      ).length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No actionable suggestions for this level yet.
          </p>
        </div>
      )}
    </div>
  );
}
