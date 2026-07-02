"use client";

import {
  useMetaAuth,
  useMetaData,
  useMetaDisconnect,
} from "@/hooks/(marketing-automation-page)/useMetaData";
import {
  useDeleteProject,
  useProjects,
} from "@/hooks/(marketing-automation-page)/useProjectsApi";
import type { ProductAnalysis, StreamUpdate } from "@/types/analysis";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import AnalysisResultCard from "./URLAnalysis/AnalysisResultCard";
import Header from "./URLAnalysis/Header";
import HeroSection from "./URLAnalysis/HeroSection";
import ProjectsGrid from "./URLAnalysis/ProjectsGrid";
import URLInputForm from "./URLAnalysis/URLInputForm";

export default function URLAnalysis() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // React Query hooks
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const {
    data: metaUserData,
    isLoading: metaLoading,
    refetch: refetchMetaData,
  } = useMetaData();
  const deleteProjectMutation = useDeleteProject();
  const metaAuthMutation = useMetaAuth();
  const metaDisconnectMutation = useMetaDisconnect();

  // Local state
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [error, setError] = useState("");
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [metaConnecting, setMetaConnecting] = useState(false);
  const [metaError, setMetaError] = useState("");

  // Memoize refetchMetaData to avoid useEffect dependency warning
  const handleRefetchMetaData = useCallback(() => {
    refetchMetaData();
  }, [refetchMetaData]);

  // Handle Meta auth callback and popup messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const metaAuth = urlParams.get("meta_auth");
    const message = urlParams.get("message");

    if (metaAuth === "success") {
      // Close popup and refresh Meta data
      if (window.opener) {
        // Notify parent window of success
        window.opener.postMessage({ type: "META_AUTH_SUCCESS" }, "*");
        window.close();
      } else {
        // If not in popup, just refresh Meta data
        handleRefetchMetaData();
      }
    } else if (metaAuth === "error") {
      setMetaError(decodeURIComponent(message || "Authentication failed"));
      if (window.opener) {
        // Notify parent window of error
        window.opener.postMessage(
          { type: "META_AUTH_ERROR", error: message },
          "*",
        );
        window.close();
      }
    }

    // Listen for messages from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "META_AUTH_SUCCESS") {
        setMetaConnecting(false);
        handleRefetchMetaData();
      } else if (event.data.type === "META_AUTH_ERROR") {
        setMetaConnecting(false);
        setMetaError(
          decodeURIComponent(event.data.error || "Authentication failed"),
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleRefetchMetaData]);

  // React Query automatically fetches projects and Meta data on mount

  const handleDeleteProject = async (
    projectId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;

    deleteProjectMutation.mutate(projectId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);
    setSearchQueries([]);
    setCurrentStep("starting");
    setStatusMessage("Initializing analysis...");

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        toast.error("You are not logged in. Please log in to continue.");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}analysis/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to start analysis");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const update: StreamUpdate = JSON.parse(line);
              setCurrentStep(update.step);
              setStatusMessage(update.data?.message || "Processing...");

              if (update.step === "analysis_complete" && update.data?.data) {
                setAnalysis(update.data.data);
                setUrl("");
                setSearchQueries([]);
                setCurrentStep("");
                setStatusMessage("");
              }

              // Refresh projects list when saved to database
              if (update.step === "database_saved") {
                // Invalidate projects query to refetch
                queryClient.invalidateQueries({ queryKey: ["projects"] });
              }

              if (
                update.step === "web_search_performed" &&
                update.data?.data?.searches
              ) {
                setSearchQueries(update.data.data.searches);
              }

              if (update.step.includes("error")) {
                setError(update.data?.message || "An error occurred");
              }
            } catch (parseError) {
              console.error("Failed to parse stream data:", parseError);
            }
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Meta connection handlers
  const handleMetaConnect = async () => {
    try {
      setMetaConnecting(true);
      setMetaError("");
      const response = await metaAuthMutation.mutateAsync();
      if (response.success) {
        // Open Facebook auth in popup
        const popup = window.open(
          response.authUrl,
          "facebook-auth",
          "width=600,height=600,scrollbars=yes,resizable=yes",
        );

        // Listen for popup close
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setMetaConnecting(false);
            // Refresh Meta data after popup closes
            setTimeout(() => {
              handleRefetchMetaData();
            }, 1000); // Small delay to ensure backend processing is complete
          }
        }, 1000);
      }
    } catch {
      setMetaError("Failed to initiate Meta connection");
      setMetaConnecting(false);
    }
  };

  const handleMetaDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Meta account?"))
      return;

    try {
      await metaDisconnectMutation.mutateAsync();
    } catch {
      setMetaError("Failed to disconnect Meta account");
    }
  };

  return (
    <div className="bg-background relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background pattern */}
      <div className="border-border/50 absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_110%)] bg-size-[4rem_4rem] opacity-5"></div>

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-6">
        {/* Header */}
        <Header
          metaConnected={!!metaUserData}
          metaLoading={metaLoading}
          metaConnecting={metaConnecting}
          metaUserData={metaUserData}
          onMetaConnect={handleMetaConnect}
          onMetaDisconnect={handleMetaDisconnect}
        />

        {/* Hero Section */}
        <HeroSection />

        {/* URL Input Form */}
        <URLInputForm
          url={url}
          isAnalyzing={isAnalyzing}
          error={error}
          metaError={metaError}
          statusMessage={statusMessage}
          currentStep={currentStep}
          searchQueries={searchQueries}
          onUrlChange={setUrl}
          onSubmit={handleSubmit}
        />

        {/* Analysis Results */}
        {analysis && (
          <AnalysisResultCard
            analysis={analysis}
            onOpenCanvas={() => {
              const projectId = analysis.analysis_id;
              // encode analysis data
              const state = { analysis: analysis };
              const encodedState = encodeURIComponent(JSON.stringify(state));
              router.push(
                `/marketing-automation/canvas/${projectId}?state=${encodedState}`,
              );
            }}
          />
        )}

        {/* Projects Section */}
        <ProjectsGrid
          projects={projects}
          loadingProjects={loadingProjects}
          deletingProject={
            deleteProjectMutation.isPending
              ? deleteProjectMutation.variables
              : null
          }
          onDeleteProject={handleDeleteProject}
        />
      </div>
    </div>
  );
}
