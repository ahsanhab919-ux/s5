import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useDispatch, useSelector } from "react-redux";

import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import type { RootState } from "@/redux/store";
import {
  getCachedReport,
  setCachedReport,
} from "@/services/cache/PlagiarismCacheManager";
import {
  analyzePlagiarism,
  PlagiarismServiceError,
  QuotaExceededError,
  UnauthorizedError,
} from "@/services/plagiarismService";
import type { PlagiarismReport } from "@/types/plagiarism";
import { toast } from "react-toastify";

type PlagiarismState = {
  loading: boolean;
  report: PlagiarismReport | null;
  error: string | null;
  fromCache: boolean;
};

const normalizeKey = (text: string) => text.trim().toLowerCase();

export const usePlagiarismReport = (text: string) => {
  const dispatch = useDispatch();

  const accessToken = useSelector((state: RootState) => state?.auth?.accessToken);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRequestInProgressRef = useRef<boolean>(false);

  const [state, setState] = useState<PlagiarismState>({
    loading: false,
    report: null,
    error: null,
    fromCache: false,
  });
  
  // Debug: Log when state actually changes
  useEffect(() => {
    if (state.report) {
      console.log({
        reportId: state.report?.analysisId,
        sectionsCount: state.report?.sections?.length,
        exactMatchesCount: state.report?.exactMatches?.length,
        hasSummary: !!state.report?.summary,
        loading: state.loading,
      });
    }
  }, [state.report, state.loading]);

  const resetState = useCallback(() => {
    setState({
      loading: false,
      report: null,
      error: null,
      fromCache: false,
    });
  }, []);

  const stopActiveRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isRequestInProgressRef.current = false;
  }, []);

  const handleError = useCallback(
    (error: unknown) => {
      let message = "Unable to complete plagiarism scan. Please try again.";

      if (error instanceof UnauthorizedError) {
        message = error.message || "Please sign in to continue.";
        dispatch(setShowLoginModal(true));
      } else if (error instanceof QuotaExceededError) {
        message =
          error.message || "You have reached your plagiarism scan limit.";
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(message));
      } else if (error instanceof PlagiarismServiceError) {
        message = error.message || message;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        fromCache: false,
      }));

      toast.error(message);
    },
    [dispatch],
  );

  const runScan = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      // Normalize current text for cache key lookup
      const currentText = text || "";
      const trimmedText = normalizeKey(currentText);
      const requestId = Date.now(); // Unique ID for this request

      if (!trimmedText) {
        stopActiveRequest();
        resetState();
        return;
      }

      // Prevent duplicate requests (unless force refresh)
      // Use ref for synchronous check to avoid race conditions
      if (isRequestInProgressRef.current && !options?.forceRefresh) {
        console.log(
          "[Plagiarism] Request already in progress, skipping duplicate",
        );
        return;
      }

      // Check cache ONLY if not forcing refresh
      if (!options?.forceRefresh) {
        const cachedReport = getCachedReport(trimmedText);
        if (cachedReport) {
          console.log({
            reportId: cachedReport?.analysisId,
            sectionsCount: cachedReport?.sections?.length,
            exactMatchesCount: cachedReport?.exactMatches?.length,
            requestId,
          });
          
          // Update state immediately using flushSync for guaranteed update
          flushSync(() => {
            setState({
              loading: false,
              report: cachedReport,
              error: null,
              fromCache: true,
            });
          });
          isRequestInProgressRef.current = false;
          return cachedReport; // Return cached report for immediate use
        }
      }

      // Abort any previous request before starting a new one
      if (
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        stopActiveRequest();
      }

      // Mark that a request is in progress
      isRequestInProgressRef.current = true;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Set loading state - keep previous report visible during loading
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        fromCache: false,
      }));

      try {
        console.log({
          textLength: text.length,
          requestId,
          forceRefresh: options?.forceRefresh,
        });
        
        const report = await analyzePlagiarism({
          text,
          token: accessToken || undefined,
          signal: abortController.signal,
        });

        // Check if request was aborted
        if (abortController.signal.aborted) {
          console.warn("[Plagiarism] Request was aborted after completion", { requestId });
          isRequestInProgressRef.current = false;
          return;
        }

        // Verify this is still the current request (not superseded by a newer one)
        const isCurrentRequest = abortControllerRef.current === abortController;
        if (!isCurrentRequest) {
          isRequestInProgressRef.current = false;
          return;
        }

        console.log({
          requestId,
          report: !!report,
          reportId: report?.analysisId,
          sectionsCount: report?.sections?.length,
          exactMatchesCount: report?.exactMatches?.length,
        });
        
        // Validate report
        if (!report) {
          console.error("[Plagiarism] Scan completed but report is null/undefined", { requestId });
          setState({
            loading: false,
            report: null,
            error: "Scan completed but no report was returned. Please try again.",
            fromCache: false,
          });
          isRequestInProgressRef.current = false;
          return;
        }

        // Cache the report immediately
        setCachedReport(trimmedText, report);

        // CRITICAL FIX: Use flushSync to force React to process state update immediately
        // This ensures the component re-renders with the new report synchronously
        console.log({
          requestId,
          reportId: report?.analysisId,
          isCurrentRequest,
          sectionsCount: report?.sections?.length,
          exactMatchesCount: report?.exactMatches?.length,
          hasSummary: !!report?.summary,
          score: report?.score,
        });
        
        // Use flushSync to force immediate state update and re-render
        // This is the key fix - ensures React processes the update synchronously
        flushSync(() => {
          setState({
            loading: false,
            report,
            error: null,
            fromCache: false,
          });
        });
        
        // Verify state was updated (for debugging)
        console.log({
          requestId,
          reportId: report?.analysisId,
        });
        
        // Clear the abort controller ref and flag AFTER state is set and flushed
        // This prevents race conditions where the ref is cleared before state update
        if (isCurrentRequest) {
          abortControllerRef.current = null;
        }
        isRequestInProgressRef.current = false;
        
        // Return the report for immediate use (avoids closure issues)
        return report;
      } catch (error) {
        // Check if this is the current request (not a stale one)
        if (abortControllerRef.current !== abortController) {
          return;
        }

        if ((error as Error)?.name === "AbortError") {
          console.warn("[Plagiarism] Request was aborted", { requestId });
          isRequestInProgressRef.current = false;
          // Don't update state when aborted - keep previous state
          return;
        }

        console.error("[Plagiarism] Scan error:", {
          requestId,
          error: (error as Error)?.message,
          name: (error as Error)?.name,
        });
        
        isRequestInProgressRef.current = false;
        handleError(error);
      } finally {
        // Final cleanup - only if this was the current request
        if (abortControllerRef.current === abortController && abortController.signal.aborted) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      accessToken,
      handleError,
      resetState,
      stopActiveRequest,
      text, // Use text directly, not normalizedText, to avoid dependency issues
    ],
  );

  // Only cleanup on unmount, not on every render
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  return {
    loading: state.loading,
    report: state.report,
    error: state.error,
    fromCache: state.fromCache,
    triggerCheck: runScan,
    manualRefresh: () => runScan({ forceRefresh: true }),
    reset: resetState,
  };
};

export default usePlagiarismReport;
