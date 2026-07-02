"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Globe, Loader2, Search, Sparkles, Database } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalysisProgressProps {
    currentStep: string;
    statusMessage: string;
    searchQueries: string[];
}

const STEPS = [
    {
        id: "starting",
        label: "Initializing Analysis",
        icon: Search,
        description: "Preparing to scan the URL...",
    },
    {
        id: "web_search_performed",
        label: "Market Intelligence",
        icon: Globe,
        description: "Gathering competitor data and trends...",
    },
    {
        id: "analyzing_content", // We can map various analyzing steps here
        label: "Analyzing Content",
        icon: Sparkles,
        description: "Extracting features and selling points...",
    },
    {
        id: "database_saved",
        label: "Finalizing",
        icon: Database,
        description: "Saving project data...",
    },
];

export default function AnalysisProgress({
    currentStep,
    statusMessage,
    searchQueries,
}: AnalysisProgressProps) {
    // Map the raw step from backend to our visual steps
    const getCurrentStepIndex = (step: string) => {
        if (!step || step === "starting") return 0;
        if (step === "web_search_performed") return 1;
        if (step === "analysis_complete" || step === "database_saved") return 3;
        return 2; // Default to analyzing for other steps
    };

    const currentStepIndex = getCurrentStepIndex(currentStep);

    return (
        <Card className="border-primary/20 bg-card/50 backdrop-blur-xl p-6 md:p-8 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20 animate-pulse" />

            <div className="space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            AI Analysis in Progress
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            Building your marketing profile...
                        </p>
                    </div>
                    <div className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                        <span className="text-primary text-sm font-medium animate-pulse">
                            {statusMessage || "Processing..."}
                        </span>
                    </div>
                </div>

                {/* Stepper */}
                <div className="relative">
                    {/* Connecting Line */}
                    <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-border/50" />

                    <div className="space-y-8">
                        {STEPS.map((step, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const Icon = step.icon;

                            return (
                                <div
                                    key={step.id}
                                    className={cn(
                                        "relative flex gap-4 transition-all duration-500",
                                        isCurrent || isCompleted ? "opacity-100" : "opacity-40"
                                    )}
                                >
                                    {/* Icon Bubble */}
                                    <div
                                        className={cn(
                                            "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                                            isCompleted
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : isCurrent
                                                    ? "border-primary bg-background text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                                    : "border-border bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-6 w-6" />
                                        ) : isCurrent ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Icon className="h-5 w-5" />
                                        )}
                                    </div>

                                    {/* Text Content */}
                                    <div className="pt-1">
                                        <h4
                                            className={cn(
                                                "font-semibold text-base transition-colors",
                                                isCurrent ? "text-primary" : "text-foreground"
                                            )}
                                        >
                                            {step.label}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {step.description}
                                        </p>

                                        {/* Dynamic Content for this step */}
                                        {isCurrent && index === 1 && searchQueries.length > 0 && (
                                            <div className="mt-3 bg-background/50 rounded-lg p-3 border border-border/50">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                    Live Search Queries
                                                </p>
                                                <div className="space-y-1.5">
                                                    {searchQueries.slice(-3).map((query, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs text-foreground/80 animate-in slide-in-from-left-2 fade-in duration-300">
                                                            <Search className="h-3 w-3 opacity-50" />
                                                            {query}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
}
