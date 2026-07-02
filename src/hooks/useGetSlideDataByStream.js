// File: src/hooks/useGetSlideDataByStream.js
import {
  selectPresentation,
  setPresentationState,
} from "@/redux/slices/presentationSlice";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PresentationOrchestrator from "../services/presentation/PresentationOrchestrator";

export const useGetSlideDataByStream = (config) => {
  const dispatch = useDispatch();
  const { slideCurrentId } = useSelector(selectPresentation);
  const [state, setState] = useState({
    logs: [],
    slides: [],
    status: "idle",
    presentationStatus: null,
    error: null,
    progress: null,
  });
  const orchestratorRef = useRef(null);
  const updateState = useCallback(
    (updates) => {
      setState((prev) => {
        // Check if we should replace arrays (for history loading)
        if (updates._replaceArrays) {
          const { _replaceArrays, ...rest } = updates;
          const newState = {
            ...prev,
            ...rest,
            logs: updates.logs || prev.logs,
            slides: updates.slides || prev.slides,
          };


          return newState;
        }

        // Normal append behavior for streaming
        const newLogs = updates.logs
          ? [...prev.logs, ...updates.logs]
          : prev.logs;

        const newSlides = updates.slides
          ? [...prev.slides, ...updates.slides]
          : prev.slides;

        const newState = {
          ...prev,
          ...updates,
          logs: newLogs,
          slides: newSlides,
        };


        return newState;
      });

      // Dispatch to Redux store
      dispatch(setPresentationState(updates));
    },
    [dispatch],
  );
  const connect = useCallback(() => {
    if (!slideCurrentId) {
      console.warn("No slideCurrentId provided");
      return;
    }

    // Create orchestrator if needed
    if (!orchestratorRef.current) {
      orchestratorRef.current = new PresentationOrchestrator(config);
    }

    // Reset state and start
    setState({
      logs: [],
      slides: [],
      status: "checking",
      presentationStatus: null,
      error: null,
      progress: null,
    });

    orchestratorRef.current.start(slideCurrentId, updateState);
  }, [slideCurrentId, config, updateState]);
  const disconnect = useCallback(() => {
    orchestratorRef.current?.stop();
    setState((prev) => ({ ...prev, status: "idle" }));
  }, []);
  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
    connect();
  }, [connect]);
  useEffect(() => {
    if (slideCurrentId) {
      connect();
    }
    return () => {
      orchestratorRef.current?.stop();
    };
  }, [slideCurrentId]);
  return {
    ...state,
    connect,
    disconnect,
    retry,
    isConnected: state.status === "streaming",
    isCompleted: state.status === "completed",
    isFailed: state.status === "failed",
    isQueued: state.status === "queued",
    isChecking: state.status === "checking",
    hasError: state.status === "error",
  };
};
