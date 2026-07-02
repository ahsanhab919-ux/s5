"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setShowLoginModal } from "@/redux/slices/auth";
import { Download, Plus, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { trackEvent } from "@/analysers/eventTracker";
import InitialInputActions from "@/components/(primary-layout)/(summarize-page)/SummarizeContentSection/InitialInputActions";
import ButtonInsertDocumentText from "@/components/buttons/ButtonInsertDocumentText";
import EmptyReportState from "@/components/plagiarism/EmptyReportState";
import ErrorStateCard from "@/components/plagiarism/ErrorStateCard";
import PlagiarismInputEditor from "@/components/plagiarism/PlagiarismInputEditor";
import ReportSectionList from "@/components/plagiarism/ReportSectionList";
import ReportSummary from "@/components/plagiarism/ReportSummary";
import ScanProgress from "@/components/plagiarism/ScanProgress";
import WordCounter from "@/components/tools/common/WordCounter";
import { Button } from "@/components/ui/button";
import useResponsive from "@/hooks/ui/useResponsive";
import useGlobalPlagiarismCheck from "@/hooks/useGlobalPlagiarismCheck";
import { cn } from "@/lib/utils";
import { pdfDownload } from "./helpers/pdfDownload";

const PlagiarismCheckerContentSection = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [enableScan, setEnableScan] = useState(true);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const scanStartTimeRef = useRef(null);
  const isScanningRef = useRef(false); // Track if we're currently scanning
  const isMobile = useResponsive("down", "lg"); // Mobile below 1024px
  const params = useSearchParams();
  const share_id = params.get("share_id");

  const {
    loading,
    report,
    error,
    fromCache,
    triggerCheck,
    manualRefresh,
    reset,
  } = useGlobalPlagiarismCheck(inputText);

  const hasInput = Boolean(inputText.trim());
  // Simplified: A report exists if we have a report object (any report is valid)
  // The report structure is guaranteed by the mapper, so we just need to check if it exists
  const hasReport = Boolean(report);
  
  // Debug logging - track report changes
  useEffect(() => {
    // debug logging removed
  }, [report, loading, hasReport, fromCache, error]);
  
  // Force re-render when report changes from null to object (catches state updates)
  useEffect(() => {
    if (report && !loading) {
    }
  }, [report, loading]);
  const highlightRanges = useMemo(() => {
    if (!report || !inputText) {
      return [];
    }
    
    
    const ranges = [];
    const usedPositions = new Set(); // Track used positions to avoid duplicates
    
    // Helper function to find snippet in input text (case-insensitive, handles variations)
    const findSnippetInInput = (sourceSnippet) => {
      if (!sourceSnippet || !inputText) return null;
      
      const trimmedSnippet = sourceSnippet.trim();
      if (!trimmedSnippet || trimmedSnippet.length === 0) return null;
      
      // Strategy 1: Try exact match (case-insensitive on original strings)
      const snippetLower = trimmedSnippet.toLowerCase();
      const inputLower = inputText.toLowerCase();
      let index = inputLower.indexOf(snippetLower);
      
      if (index !== -1) {
        const end = Math.min(inputText.length, index + trimmedSnippet.length);
        return { start: index, end };
      }
      
      // Strategy 2: Try with normalized whitespace (multiple spaces -> single space)
      const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ').trim();
      const normalizedSnippet = normalizeWhitespace(snippetLower);
      const normalizedInput = normalizeWhitespace(inputLower);
      index = normalizedInput.indexOf(normalizedSnippet);
      
      if (index !== -1) {
        // Find the corresponding position in original text
        // Count non-whitespace characters to find position
        let charCount = 0;
        let originalStart = -1;
        
        for (let i = 0; i < inputText.length; i++) {
          if (!inputText[i].match(/\s/)) {
            if (charCount === index) {
              originalStart = i;
              break;
            }
            charCount++;
          } else if (charCount < index) {
            // Still counting, but this is whitespace
            originalStart = i + 1;
          }
        }
        
        if (originalStart !== -1) {
          const end = Math.min(inputText.length, originalStart + trimmedSnippet.length);
          return { start: originalStart, end };
        }
      }
      
      // Strategy 3: Try partial match (first significant portion of snippet)
      if (normalizedSnippet.length > 20) {
        const partialSnippet = normalizedSnippet.substring(0, 20);
        index = normalizedInput.indexOf(partialSnippet);
        
        if (index !== -1) {
          // Find the corresponding position in original text
          let charCount = 0;
          let originalStart = -1;
          
          for (let i = 0; i < inputText.length; i++) {
            if (!inputText[i].match(/\s/)) {
              if (charCount === index) {
                originalStart = i;
                break;
              }
              charCount++;
            } else if (charCount < index) {
              originalStart = i + 1;
            }
          }
          
          if (originalStart !== -1) {
            // Use the full snippet length for end position
            const end = Math.min(inputText.length, originalStart + trimmedSnippet.length);
            return { start: originalStart, end };
          }
        }
      }
      
      return null;
    };
    
    // Process exact matches first (they have highest priority)
    if (report.exactMatches?.length) {
      
      report.exactMatches.forEach((match, matchIndex) => {
        
        // For exact matches, use source snippets to find matches in input
        if (match.sources && match.sources.length > 0) {
          match.sources.forEach((source, sourceIndex) => {
            const sourceSnippet = source.snippet;
            
            if (!sourceSnippet) {
              console.warn(`[Plagiarism] Exact match ${matchIndex + 1}, source ${sourceIndex + 1} has no snippet`);
              return;
            }
            
            
            const found = findSnippetInInput(sourceSnippet);
            
            if (found) {
              const positionKey = `${found.start}-${found.end}`;
              
              // Avoid duplicate highlights
              if (!usedPositions.has(positionKey)) {
                usedPositions.add(positionKey);
                
                // Verify the match makes sense
                const matchedText = inputText.substring(found.start, found.end);
                
                ranges.push({
                  start: found.start,
                  end: found.end,
                  similarity: 100, // Exact matches are 100% similar
                });
              } else {
              }
            } else {
              console.warn(`[Plagiarism] ✗ Could not find source snippet in input:`, {
                snippet: sourceSnippet.substring(0, 50),
                sourceTitle: source.title,
              });
            }
          });
        } else {
          console.warn(`[Plagiarism] Exact match ${matchIndex + 1} has no sources`);
        }
      });
    }
    
    // Process sections (paraphrased content)
    if (report.sections?.length) {
      
      report.sections.forEach((section, sectionIndex) => {
        
        // Use source snippets to find matches in input
        if (section.sources && section.sources.length > 0) {
          section.sources.forEach((source, sourceIndex) => {
            const sourceSnippet = source.snippet;
            
            if (!sourceSnippet) {
              console.warn(`[Plagiarism] Section ${sectionIndex + 1}, source ${sourceIndex + 1} has no snippet`);
              return;
            }
            
            
            const found = findSnippetInInput(sourceSnippet);
            
            if (found) {
              const positionKey = `${found.start}-${found.end}`;
              
              // Avoid duplicate highlights (exact matches take priority)
              if (!usedPositions.has(positionKey)) {
                usedPositions.add(positionKey);
                
                const matchedText = inputText.substring(found.start, found.end);
                
                ranges.push({
                  start: found.start,
                  end: found.end,
                  similarity: section.similarity ?? 0,
                });
              } else {
              }
            } else {
              console.warn(`[Plagiarism] ✗ Could not find section source snippet in input:`, {
                snippet: sourceSnippet.substring(0, 50),
                sourceTitle: source.title,
              });
            }
          });
        } else {
          console.warn(`[Plagiarism] Section ${sectionIndex + 1} has no sources`);
        }
      });
    }
    
    // Sort ranges by start position
    ranges.sort((a, b) => a.start - b.start);
    
    
    return ranges;
  }, [report, inputText]);

  // Don't auto-reset - only reset on explicit user actions (clear button or significant text change)
  // This prevents the report from disappearing after scan completes

  // Track scan start time (no setInterval - calculate on-demand for better performance)
  useEffect(() => {
    if (loading && !scanStartTimeRef.current) {
      // Scan just started
      scanStartTimeRef.current = Date.now();
    } else if (!loading && scanStartTimeRef.current) {
      // Scan completed
      scanStartTimeRef.current = null;
    }
  }, [loading]);

  // Calculate elapsed time on-demand for display (updates only when needed)
  // This approach is more efficient than setInterval and doesn't interfere with scan performance
  const [displayElapsedTime, setDisplayElapsedTime] = useState(0);

  useEffect(() => {
    if (!loading || !scanStartTimeRef.current) {
      setDisplayElapsedTime(0);
      return;
    }

    // Update every second for display (minimal performance impact)
    // Using a longer interval to reduce re-renders and ensure no interference with scan
    const interval = setInterval(() => {
      if (scanStartTimeRef.current) {
        const elapsed = (Date.now() - scanStartTimeRef.current) / 1000;
        setDisplayElapsedTime(elapsed);
      }
    }, 1000); // Update every second - minimal overhead

    return () => clearInterval(interval);
  }, [loading]);

  // Track loading state with ref to avoid closure issues
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  // Reset enableScan when loading completes
  // This handles both fresh results (loading: true → false) and cached results (loading stays false)
  useEffect(() => {
    if (!loading && !enableScan) {
      setEnableScan(true);
    }
    // Clear scanning flag when loading completes (with a small delay to prevent race conditions)
    if (!loading && isScanningRef.current) {
      // Small delay to ensure state updates are processed
      const timeoutId = setTimeout(() => {
        isScanningRef.current = false;
      }, 500); // 500ms grace period after loading completes
      return () => clearTimeout(timeoutId);
    }
  }, [loading, enableScan]);

  const handleInputChange = (nextValue) => {
    const previousText = inputText;
    setInputText(nextValue);
    setEnableScan(true);
    
    // Don't reset if we're currently scanning - this prevents race conditions
    // where the editor updates during/after scan completion
    if (isScanningRef.current) {
      return;
    }
    
    // Only reset if text actually changed (not just whitespace) and we had a report
    // Check report directly (not hasReport from closure) to avoid stale values
    const currentHasReport = Boolean(report);
    if (currentHasReport && previousText.trim() !== nextValue.trim()) {
      reset();
    }
  };

  const handleClear = () => {
    setInputText("");
    setEnableScan(true);
    reset();
  };

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!user?._id) {
      setLoginDialogOpen(true);
      return;
    }

    // Prevent multiple clicks - check both enableScan and loading
    if (!enableScan || loading) {
      return;
    }

    trackEvent("click", "ai-detector", "ai-detector_click", 1);

    // Disable scan button immediately to prevent double clicks
    setEnableScan(false);
    // Mark that we're scanning to prevent reset during scan
    isScanningRef.current = true;

    try {
      // Always force a fresh scan on button click to ensure latest results
      // This eliminates cache-related issues
      const scanResult = await triggerCheck(true);
      
      
      
      // Note: isScanningRef will be cleared when loading becomes false (handled in useEffect)
      
    } catch (error) {
      console.error("[Plagiarism] Scan error:", error);
      // Reset enableScan on error so user can retry
      setEnableScan(true);
      isScanningRef.current = false;
    }
  };

  const handleRefresh = async () => {
    await manualRefresh();
  };

  const handleNewScan = () => {
    reset();
    setInputText("");
    setEnableScan(true);
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownloadReport = async () => {
    if (!report) {
      console.error("[Plagiarism] No report available for download");
      return;
    }

    try {
      setIsDownloading(true);
      await pdfDownload({
        report,
        inputText,
      });
    } catch (error) {
      console.error("[Plagiarism] Failed to download PDF:", error);
      // You might want to show a toast notification here
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      isMobile ? "h-auto overflow-y-auto p-2 sm:p-4" : "h-[calc(100vh-120px)] overflow-hidden p-4"
    )}>
      <div className={cn(
        "flex w-full flex-col gap-3",
        isMobile ? "h-auto" : "lg:flex-row lg:h-full"
      )}>
        {/* Input Section */}
        <div className={cn(
          "flex min-h-0 flex-col",
          isMobile ? "h-auto min-h-[250px] max-h-[350px]" : "h-full lg:flex-1"
        )}>
          <div className="bg-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm lg:max-w-[550px] xl:max-w-full">
            <div className={cn(
              "relative min-h-0 flex-1 overflow-y-auto",
              isMobile ? "p-2 sm:p-4" : "p-4"
            )}>
              <PlagiarismInputEditor
                value={inputText}
                onChange={handleInputChange}
                highlights={highlightRanges}
                disabled={loading}
              />
              {!inputText && !share_id && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="pointer-events-auto flex flex-col items-center">
                    <InitialInputActions
                      className={"flex-nowrap"}
                      setInput={(text) => {
                        setInputText(text);
                      }}
                      sample={null}
                      showSample={false}
                      showPaste={true}
                      showInsertDocument={false}
                    />
                    <div className="mt-1">
                      <ButtonInsertDocumentText
                        key="insert-document"
                        onApply={(value) => setInputText(value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0">
              {inputText && (
                <div className={cn(
                  "border-t py-3",
                  isMobile ? "px-2 sm:px-4" : "px-4"
                )}>
                  <WordCounter
                    btnDisabled={!enableScan || loading}
                    btnText="Scan"
                    toolName="ai-detector"
                    userInput={inputText}
                    isLoading={loading}
                    handleClearInput={handleClear}
                    handleSubmit={handleSubmit}
                    userPackage={user?.package}
                    sticky={0}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className={cn(
          "flex min-h-0 flex-col",
          isMobile ? "h-auto min-h-[350px] flex-1" : "h-full xl:flex-1"
        )}>
          <div className="bg-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
            <div className={cn(
              "relative min-h-0 flex-1 overflow-y-auto",
              isMobile ? "p-2 sm:p-4" : "p-4"
            )}>
              <div className={cn(
                "mb-4 flex shrink-0 items-start justify-between",
                isMobile ? "gap-2" : "gap-3"
              )}>
                <div>
                  <h2 className="text-lg font-semibold">Plagiarism Checker</h2>
                  <p className="text-muted-foreground text-sm">
                    Get similarity insights, matched sources, and actionable next
                    steps.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={loading || !hasReport}
                  title="Refresh check"
                >
                  <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </Button>
              </div>

              {/* Action Buttons */}
              {hasReport && !loading && (
                <div className={cn(
                  "mb-4 flex shrink-0 items-center",
                  isMobile ? "flex-wrap gap-2" : "gap-3"
                )}>
                  <Button
                    variant="outline"
                    onClick={handleNewScan}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <Plus className="size-4" />
                    New Scan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2"
                    disabled={isDownloading || !report}
                  >
                    <Download className="size-4" />
                    {isDownloading ? "Downloading..." : "Download report"}
                  </Button>
                </div>
              )}

              <div className={cn(
                "results-scroll space-y-4",
                isMobile ? "overflow-y-visible" : "min-h-0 flex-1 overflow-y-auto"
              )}>
            {error ? (
              <ErrorStateCard
                message="We couldn't complete the scan."
                description={error}
                onRetry={handleRefresh}
              />
            ) : null}

            {/* Show progress during loading */}
            {loading && !fromCache && (
              <ScanProgress
                loading={loading}
                elapsedTime={displayElapsedTime}
                estimatedTotalTime={Math.max(120, Math.min(300, Math.ceil((inputText.length || 0) / 50)))} // Estimate: 50 chars per second, min 2min, max 5min
              />
            )}

            <ReportSummary
              report={report}
              loading={loading}
              fromCache={fromCache}
            />

            {hasReport && (report.sections?.length > 0 || report.exactMatches?.length > 0) ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b pb-2">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Plagiarism Analysis
                    </h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Review matched content and sources below
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-foreground text-sm font-semibold">
                      {(report.sections?.length ?? 0) +
                        (report.exactMatches?.length ?? 0)}
                    </span>
                    <span className="text-muted-foreground ml-1 text-xs">
                      {(report.sections?.length ?? 0) +
                        (report.exactMatches?.length ?? 0) ===
                      1
                        ? "match"
                        : "matches"}
                    </span>
                    {report.exactMatches && report.exactMatches.length > 0 && (
                      <span className="text-destructive ml-2 text-xs">
                        ({report.exactMatches.length} exact)
                      </span>
                    )}
                  </div>
                </div>
                <ReportSectionList
                  sections={report.sections ?? []}
                  exactMatches={report.exactMatches}
                  loading={loading}
                />
              </div>
            ) : null}

            {/* Only show empty state if we're not loading AND there's no report */}
            {/* Check report directly, not just hasReport, to catch edge cases */}
            {!loading && !report ? (
              <EmptyReportState
                title={
                  hasInput ? "Ready when you are" : "Start a plagiarism scan"
                }
                description={
                  hasInput
                    ? "Run the scan to see similarity score, risk levels, and matched sources."
                    : "Paste or write content in the editor to begin checking for plagiarism."
                }
                actionLabel={hasInput && enableScan ? "Scan now" : undefined}
                onAction={hasInput && enableScan ? handleSubmit : undefined}
              />
            ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      <LoginDialog
        loginDialogOpen={loginDialogOpen}
        setLoginDialogOpen={setLoginDialogOpen}
      />
    </div>
  );
};

// Note: This code is for alerting user to login
const LoginDialog = ({ loginDialogOpen, setLoginDialogOpen }) => {
  const dispatch = useDispatch();
  return (
    <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to create a presentation. Please log in to
            continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              dispatch(setShowLoginModal(true));
              setLoginDialogOpen(false);
            }}
          >
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// function UsesLimit({ userLimit }) {
//   const progressPercentage = () => {
//     if (!userLimit) return 0;
//     const totalWords = userLimit.totalWordLimit;
//     const remainingWords = userLimit.remainingWord;
//     return (remainingWords / totalWords) * 100;
//   };

//   return (
//     <div className="flex justify-end p-2">
//       <div className="w-[220px] sm:w-[250px]">
//         <LinearProgress
//           sx={{ height: 6 }}
//           variant="determinate"
//           value={progressPercentage()}
//         />
//         <p className="mt-1 text-xs sm:text-sm">
//           {formatNumber(userLimit?.totalWordLimit)} words /{" "}
//           {formatNumber(userLimit?.remainingWord)} words left
//         </p>
//       </div>
//     </div>
//   );
// }

export default PlagiarismCheckerContentSection;
