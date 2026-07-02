"use client";

import { trySamples } from "@/_mock/trySamples";
import { downloadFile } from "@/components/tools/common/downloadfile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { detectLanguage } from "@/hooks/languageDitector";
import useResponsive from "@/hooks/ui/useResponsive";
import useDebounce from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { setShowLoginModal } from "@/redux/slices/auth";
import {
  setIsCheckLoading,
  setIsSectionbarOpen,
  setIsSidebarOpen,
  setIssues,
  setLanguage,
  setScore,
  setScores,
  setSections,
  setSectionsGroups,
  setSectionsMeta,
  setSelectedIssue,
  setSelectedSection,
  setSelectedTab,
  setText,
} from "@/redux/slices/grammar-checker-slice";
import {
  fetchGrammarSection,
  fetchGrammarSections,
  grammarCheck,
} from "@/services/grammar-checker.service";
import { Mark, mergeAttributes } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ChevronsRight, ChevronUp, MoreVertical } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ActionMenu from "./ActionMenu";
import ActionToolbar from "./ActionToolbar";
import EditorToolbar from "./EditorToolbar";
import GrammarIssueCard from "./GrammarIssueCard";
import GrammarSectionbar from "./GrammarSectionbar";
import GrammarSidebar from "./GrammarSidebar";
import InitialInputActions from "./InitialInputActions";
import LanguageMenu from "./LanguageMenu";

// Utility: Group histories by period
const dataGroupsByPeriod = (histories = []) => {
  if (!Array.isArray(histories) || histories.length === 0) return [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const groups = histories.reduce((acc, entry) => {
    if (!entry?.timestamp) return acc;

    const d = new Date(entry.timestamp);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthName = d.toLocaleString("default", { month: "long" });
    const key =
      m === currentMonth && y === currentYear
        ? "This Month"
        : `${monthName} ${y}`;

    if (!acc[key]) acc[key] = [];
    acc?.[key]?.push({
      ...(entry || {}),
      _id: entry?._id,
      text: entry?.text,
      time: entry?.timestamp,
    });
    return acc;
  }, {});

  const result = [];

  if (groups?.["This Month"]) {
    result.push({ period: "This Month", history: groups["This Month"] });
    delete groups["This Month"];
  }

  Object.keys(groups)
    .sort((a, b) => {
      const [ma, ya] = a.split(" ");
      const [mb, yb] = b.split(" ");
      const da = new Date(`${ma} 1, ${ya}`);
      const db = new Date(`${mb} 1, ${yb}`);
      return db - da;
    })
    .forEach((key) => {
      result.push({ period: key, history: groups[key] });
    });

  return result;
};

// Custom Mark for Error Highlighting
const ErrorMark = Mark.create({
  name: "errorMark",

  addAttributes() {
    return {
      error: { default: null },
      correct: { default: null },
      errorId: { default: null },
      sentence: { default: null },
      type: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-error]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-error": HTMLAttributes.error,
        "data-correct": HTMLAttributes.correct,
        "data-error-id": HTMLAttributes.errorId,
        "data-sentence": HTMLAttributes.sentence,
        "data-context": HTMLAttributes.context,
        "data-type": HTMLAttributes.type,
        style:
          "padding: 2px 0; cursor: pointer; border-bottom: 2px solid #FF5630;",
      }),
      0,
    ];
  },
});

// Utility: Normalize text
const prepareText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .normalize("NFC")
    .trim()
    .replace(/\u200B|\u200C|\u200D/g, "");
};

const isWordBoundary = (char) => {
  return /[\p{P}\p{Z}\p{C}]/u.test(char) || char === "";
};

// Helper function to find error position using sentence + context + error together
// This ensures accurate error detection even when same error appears multiple times
const findErrorPosition = (nodeText, sentence, context, error, nodePos) => {
  // Step 1: Check if this node contains the sentence (required)
  if (!nodeText.includes(sentence) && !sentence.includes(nodeText.trim())) {
    return null; // Skip if sentence not in this node
  }

  // Step 2: Handle context (if exists, MUST use it)
  let searchText = nodeText;
  let searchOffset = 0;
  let contextStart = -1;
  let contextEnd = -1;

  if (context && context.trim()) {
    // Context exists - must find it first
    const contextIndex = nodeText.indexOf(context);
    if (contextIndex === -1) {
      // Context exists but not found in nodeText - skip this error
      return null;
    }
    // Context found - search only within context area
    contextStart = contextIndex;
    contextEnd = contextIndex + context.length;
    searchText = nodeText.substring(contextStart, contextEnd);
    searchOffset = contextStart;
  }

  // Step 3: Find error in search area (context area if context exists, otherwise whole nodeText)
  const errorIndex = searchText.indexOf(error);
  if (errorIndex === -1) return null;

  const actualIndex = searchOffset + errorIndex;
  const start = nodePos + actualIndex;
  const end = start + error.length;

  // Step 4: If context exists, verify error is within context boundaries
  // This is a safety check - since we search within context area, error should be within bounds
  // But we verify to ensure accuracy
  if (context && context.trim() && contextStart !== -1) {
    // actualIndex is already relative to nodeText, and should be within contextStart to contextEnd
    // But verify to ensure error doesn't extend beyond context
    const errorStartInNode = actualIndex;
    const errorEndInNode = actualIndex + error.length;

    // Error must be completely within context boundaries
    if (errorStartInNode < contextStart || errorEndInNode > contextEnd) {
      // Error is outside context boundaries - skip
      return null;
    }
  }

  // Step 5: Verify word boundaries (prevent "com" in "come")
  const beforeChar = actualIndex > 0 ? nodeText?.[actualIndex - 1] : " ";
  const afterChar =
    actualIndex + error.length < nodeText.length
      ? nodeText[actualIndex + error.length]
      : " ";

  if (!isWordBoundary(beforeChar) || !isWordBoundary(afterChar)) {
    return null; // Not at word boundary
  }

  return { start, end, actualIndex };
};

const GrammarCheckerContentSection = () => {
  const { accessToken, user } = useSelector((state) => state.auth);
  const isMobile = useResponsive("down", "sm");
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [anchorEl, setAnchorEl] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const skipSectionRef = useRef(false);
  const skipCheckRef = useRef(false);
  const skipMarkRef = useRef(false);
  const abortControllerRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const hasUserInputRef = useRef(false);
  const isFromEditorUpdateRef = useRef(false);
  const hasClearedOnMountRef = useRef(false);
  const previousTextRef = useRef("");
  const isClearingEditorRef = useRef(false); // Track when we're programmatically clearing editor
  const lastDispatchedTextRef = useRef(""); // Track last dispatched text to prevent duplicate dispatches
  const isHistoryOperationRef = useRef(false); // Track when undo/redo operations are happening
  const isProgrammaticUpdateRef = useRef(false); // Track when update is from programmatic operations (accept, ignore, section load)
  const handleSelectSectionRef = useRef(null); // Store latest handleSelectSection to avoid infinite loops
  const sectionsRef = useRef([]); // Store latest sections to avoid dependency in fetchSections
  const lastSelectedSectionIdRef = useRef(null); // Track last selected section ID to prevent infinite loop
  // const lastAppliedIssuesRef = useRef(""); // Track last applied issues to prevent highlighting loop

  const {
    isCheckLoading,
    isRecommendationLoading,
    language,
    text,
    issues,
    selectedIssue,
    recommendations,
    isSidebarOpen,
    sections,
    selectedSection,
    selectedTab,
  } = useSelector((state) => state.grammar_checker) || {};

  // Keep sectionsRef in sync with Redux state
  sectionsRef.current = sections || [];

  const sample = useMemo(
    () =>
      trySamples.grammar[language.startsWith("English") ? "English" : language],
    [language],
  );

  const sectionId = searchParams.get("section");

  // URL parameter management
  const setSectionId = useCallback(
    (newId) => {
      if (!newId) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", newId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const removeSectionId = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("section");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Auto-detect language
  useEffect(() => {
    if (!text?.trim()) return;

    const lang = detectLanguage(text);
    if (lang && lang !== language) {
      dispatch(setLanguage(lang));
    }
  }, [text, language, dispatch]);

  // Initialize Tiptap Editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: {
          depth: 50, // Increase history depth for better undo/redo
        },
      }),
      ErrorMark,
      Placeholder.configure({
        placeholder: "Add text or upload document",
        showOnlyWhenEditable: true,
      }),
    ],
    content: "",
    enableCoreExtensions: true,
    editorProps: {
      attributes: {
        class: "tiptap-content prose focus:outline-none",
        style:
          "outline: none; min-height: 400px; padding: 16px; word-break: break-word; overflow-wrap: anywhere; max-width: 100%; box-sizing: border-box;",
      },
      handleClickOn: (view, pos, node, nodePos, event) => {
        const target = event.target;
        if (target.hasAttribute("data-error")) {
          const error = target.getAttribute("data-error");
          const correct = target.getAttribute("data-correct");
          const sentence = target.getAttribute("data-sentence");
          const context = target.getAttribute("data-context");
          const type = target.getAttribute("data-type");
          const errorId = target.getAttribute("data-error-id");

          dispatch(
            setSelectedIssue({
              error,
              correct,
              sentence,
              context,
              type,
              errorId,
            }),
          );
          setAnchorEl(target);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const newText = editor.getText();

      // If this is a history operation (undo/redo), skip Redux dispatch to preserve history stack
      // Update lastDispatchedTextRef to prevent sync effect from triggering
      if (isHistoryOperationRef.current) {
        // Update lastDispatchedTextRef to match editor state immediately
        // This prevents the sync effect from calling setContent which would clear the history stack
        lastDispatchedTextRef.current = newText;
        // Update Redux state to keep it in sync, but do it after a delay to ensure history operation completes
        // The sync effect is blocked by the flag, so this won't trigger setContent
        // Use setTimeout with 0 delay to ensure it runs after the current execution context
        setTimeout(() => {
          if (newText !== text) {
            dispatch(setText(newText));
          }
          // Reset flag after Redux update - use another setTimeout to ensure it's after Redux update
          setTimeout(() => {
            isHistoryOperationRef.current = false;
          }, 50);
        }, 0);
        // Return early to skip the rest of the dispatch logic
        return;
      }

      // If we're programmatically clearing the editor, don't dispatch to prevent loops
      if (isClearingEditorRef.current) {
        // Don't dispatch at all during programmatic clear
        lastDispatchedTextRef.current = newText;
        return;
      }

      // Only dispatch if text actually changed AND it's different from what we last dispatched
      if (newText === lastDispatchedTextRef.current) {
        return; // Already dispatched this text, skip
      }

      // If this is a programmatic update (section load or initial clear), don't mark as user input
      if (skipCheckRef.current) {
        // Check if this is a programmatic update (accept, ignore, section load, etc.)
        if (isProgrammaticUpdateRef.current) {
          // This is a programmatic update - don't dispatch to Redux to prevent triggering grammar check
          isFromEditorUpdateRef.current = false;
          hasUserInputRef.current = false;
          // Only update lastDispatchedTextRef to prevent sync effect from triggering
          lastDispatchedTextRef.current = newText;
          // Reset the flag after handling
          isProgrammaticUpdateRef.current = false;
          return;
        }

        // Check if this is actually user typing (not programmatic)
        // If text exists and we're past the initial mount, user is typing
        if (newText && newText.trim() && !hasClearedOnMountRef.current) {
          // User is typing after initial mount - reset skipCheckRef to allow checking
          skipCheckRef.current = false;
          isFromEditorUpdateRef.current = true;
          hasUserInputRef.current = true;
          // Dispatch and update ref - but only if different from last dispatched
          if (newText !== lastDispatchedTextRef.current) {
            dispatch(setText(newText));
            lastDispatchedTextRef.current = newText;
          }
        } else {
          // This is a programmatic update (section load, correction, ignore, etc.)
          // Don't dispatch to Redux to prevent triggering grammar check
          isFromEditorUpdateRef.current = false;
          hasUserInputRef.current = false;
          // Only update lastDispatchedTextRef to prevent sync effect from triggering
          lastDispatchedTextRef.current = newText;
        }
        return;
      }

      // This is user input (typing/pasting) - skipCheckRef is already false
      // Mark that this text change is from user input - this will trigger grammar check
      isFromEditorUpdateRef.current = true;
      hasUserInputRef.current = true;

      // Dispatch and update ref - but only if different from last dispatched
      if (newText !== lastDispatchedTextRef.current) {
        dispatch(setText(newText));
        lastDispatchedTextRef.current = newText;
      }
    },
  });

  const debouncedText = useDebounce(text, 1500);

  // Sync Redux text state to editor when text changes (but not from editor updates)
  // This ensures editor stays in sync with Redux state, especially after navigation
  useEffect(() => {
    // Skip on initial mount - let the mount clear effect handle it
    if (
      !editor ||
      isClearingEditorRef.current ||
      hasClearedOnMountRef.current === false
    ) {
      return;
    }

    // Skip sync during history operations (undo/redo) to prevent clearing redo stack
    if (isHistoryOperationRef.current) {
      return;
    }

    const editorText = editor.getText() || "";
    const stateText = text || "";

    // Only sync if Redux text is different from editor text
    // This handles cases where Redux state is restored but editor is empty
    if (stateText !== editorText && stateText.trim()) {
      // Don't sync if we just dispatched this text from editor
      if (stateText === lastDispatchedTextRef.current) {
        return;
      }

      // Double-check flag hasn't been set during this check
      if (isHistoryOperationRef.current) {
        return;
      }

      // Don't sync if editor text matches lastDispatchedTextRef (recent history operation)
      // This prevents clearing the redo stack after history operations
      if (editorText === lastDispatchedTextRef.current) {
        return;
      }

      skipCheckRef.current = true;
      isClearingEditorRef.current = true;
      // Use setContent with emitUpdate: false to prevent triggering onUpdate during sync
      // Note: setContent will clear history, but this is only called when syncing from Redux
      // History operations are protected by isHistoryOperationRef flag
      editor.commands.setContent(stateText, false, {
        preserveWhitespace: "full",
      });
      lastDispatchedTextRef.current = stateText;

      setTimeout(() => {
        isClearingEditorRef.current = false;
      }, 100);
    } else if (!stateText.trim() && editorText.trim()) {
      isClearingEditorRef.current = true;
      editor.commands.clearContent();
      lastDispatchedTextRef.current = "";

      // Clear issues if text is empty
      // Check issues length directly to avoid dependency loop
      const currentIssuesCount = issues?.length || 0;
      if (currentIssuesCount > 0) {
        dispatch(setIssues([]));
        dispatch(setSelectedIssue({}));
      }

      setTimeout(() => {
        isClearingEditorRef.current = false;
      }, 100);
    }
    // Removed issues from deps - we check it directly to prevent infinite loop
    // When we dispatch setIssues, it changes issues, which would trigger this effect again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, editor, dispatch]);

  // Clear everything on initial mount/reload - NEVER auto-load from URL
  // This effect should ONLY run once on mount - use empty deps with ref guard
  useEffect(() => {
    // Use a ref to ensure this only runs once, even if component re-renders
    if (hasClearedOnMountRef.current) return;

    // Wait for editor to be ready
    if (!editor) {
      // If editor not ready, try again after a short delay
      const timeoutId = setTimeout(() => {
        if (!hasClearedOnMountRef.current && editor) {
          // Retry the mount logic
          hasClearedOnMountRef.current = true;
          isInitialMountRef.current = false;


          dispatch(setText(""));
          dispatch(setIssues([]));
          dispatch(setSelectedIssue({}));
          dispatch(setScore(0));
          dispatch(setScores([]));
          dispatch(setSelectedSection({}));

          hasUserInputRef.current = false;
          isFromEditorUpdateRef.current = false;
          skipCheckRef.current = true;
          skipSectionRef.current = true;
          lastDispatchedTextRef.current = "";

          isClearingEditorRef.current = true;
          setTimeout(() => {
            try {
              if (editor && !editor.isDestroyed && editor.view) {
                editor.commands.clearContent();
                setTimeout(() => {
                  isClearingEditorRef.current = false;
                }, 100);
              } else {
                isClearingEditorRef.current = false;
              }
            } catch (err) {
              console.error("[Initial Mount] Error clearing editor:", err);
              isClearingEditorRef.current = false;
            }
          }, 100);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    hasClearedOnMountRef.current = true;
    isInitialMountRef.current = false;

    // ALWAYS clear everything on mount/reload, regardless of sectionId in URL or Redux state
    // User must explicitly click on a section to load it

    // Clear all state from Redux FIRST (this clears any persisted state)
    // Use React.startTransition to batch updates and prevent blocking
    dispatch(setText(""));
    dispatch(setIssues([]));
    dispatch(setSelectedIssue({}));
    dispatch(setScore(0));
    dispatch(setScores([]));
    dispatch(setSelectedSection({}));

    // Reset all flags
    hasUserInputRef.current = false;
    isFromEditorUpdateRef.current = false;
    skipCheckRef.current = true; // Start with skipCheck true to prevent any auto-check
    skipSectionRef.current = true; // Prevent section loading from URL
    lastDispatchedTextRef.current = ""; // Initialize to empty since we're clearing everything

    // Clear editor content when it's ready
    // Set flag to prevent onUpdate from dispatching during clear
    isClearingEditorRef.current = true;
    setTimeout(() => {
      try {
        if (editor && !editor.isDestroyed && editor.view) {
          editor.commands.clearContent();
          // Reset flag after a short delay to allow onUpdate to process
          setTimeout(() => {
            isClearingEditorRef.current = false;
          }, 150);
        } else {
          isClearingEditorRef.current = false;
        }
      } catch (err) {
        console.error("[Initial Mount] Error clearing editor:", err);
        isClearingEditorRef.current = false;
      }
    }, 150);

    // Remove sectionId from URL on reload to prevent auto-loading
    // Use a longer timeout to ensure it happens after all state updates
    const currentSectionId = new URLSearchParams(window.location.search).get(
      "section",
    );
    if (currentSectionId) {
      setTimeout(() => {
        try {
          const params = new URLSearchParams(window.location.search);
          params.delete("section");
          const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
          window.history.replaceState({}, "", newUrl);
        } catch (err) {
          console.error("[Initial Mount] Error removing sectionId:", err);
        }
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - this should ONLY run once on mount

  // Grammar check with position-based errors
  useEffect(() => {
    const preparedText = debouncedText?.trim() || "";


    // CRITICAL: First check - if no text at all, clear everything
    if (!debouncedText || !debouncedText.trim()) {
      // Only clear if we're not in the middle of loading a section
      if (!skipCheckRef.current) {
        dispatch(setIssues([]));
        dispatch(setSelectedIssue({}));
        hasUserInputRef.current = false;
        isFromEditorUpdateRef.current = false;
      }
      return;
    }

    if (!preparedText) {
      return;
    }

    // CRITICAL: Only auto-check if:
    // 1. Not skipping check (programmatic updates/section loading)
    // 2. User has actually typed/pasted (hasUserInputRef is true)
    // 3. Text change came from editor update (isFromEditorUpdateRef is true)
    if (skipCheckRef.current) {
      return;
    }

    if (!hasUserInputRef.current || !isFromEditorUpdateRef.current) {
      return;
    }

    // Reset the editor update flag after checking (will be set again on next user input)
    // isFromEditorUpdateRef.current = false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!hasUserInputRef.current || !isFromEditorUpdateRef.current) {
      return;
    }

    // Check if user is logged in
    if (!user?._id) {
      setLoginDialogOpen(true);
      return;
    }

    // Reset the editor update flag after checking (will be set again on next user input)
    isFromEditorUpdateRef.current = false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchGrammar = async () => {
      try {
        dispatch(setIsCheckLoading(true));

        const data = await grammarCheck(
          {
            content: debouncedText,
            language,
            ...(sectionId ? { section: sectionId } : {}),
          },
          controller.signal,
        );

        const { result, section, history } = data || {};

        const { issues = [] } = result || {};

        skipMarkRef.current = false;
        dispatch(setIssues(issues || []));

        const { _id } = data?.section || {};
        if (_id && (!sectionId || _id !== sectionId)) {
          skipSectionRef.current = true;

          const currentSection = section
            ? { ...section, last_history: history }
            : { last_history: history };

          dispatch(setSections([currentSection, ...sections]));
          dispatch(setSelectedSection(currentSection));
          setSectionId(_id);
        }
      } catch (error) {
        if (error.name === "CanceledError" || error.name === "AbortError")
          return;
        console.error("Grammar check error:", error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to check grammar. Please try again.",
        );
      } finally {
        dispatch(setIsCheckLoading(false));
      }
    };

    fetchGrammar();

    return () => {
      controller.abort();
    };
  }, [debouncedText, language, dispatch]);

  // Clear issues if text becomes empty or editor content doesn't match
  // Use a ref to track previous issues count to prevent unnecessary dispatches
  const previousIssuesCountRef = useRef(0);

  useEffect(() => {
    if (!editor || isClearingEditorRef.current) return; // Skip during programmatic clear

    const editorText = editor.getText() || "";
    const stateText = text || "";

    // Only run if text actually changed (not just on every render)
    if (previousTextRef.current === stateText) {
      // But still check if issues exist without text (safety check)
      if (!stateText.trim() && !editorText.trim() && issues?.length > 0) {
        dispatch(setIssues([]));
        dispatch(setSelectedIssue({}));
        previousIssuesCountRef.current = 0;
      }
      return;
    }
    previousTextRef.current = stateText;

    // If editor is empty or state text is empty, clear issues
    if (!editorText.trim() || !stateText.trim()) {
      // Only dispatch if there are actually issues to clear (check count, not array reference)
      const currentIssuesCount = issues?.length || 0;
      if (currentIssuesCount > 0) {
        dispatch(setIssues([]));
        dispatch(setSelectedIssue({}));
        previousIssuesCountRef.current = 0;
      }
      return;
    }

    // If editor text doesn't match state text and editor is empty, clear issues
    if (editorText.trim() !== stateText.trim() && !editorText.trim()) {
      const currentIssuesCount = issues?.length || 0;
      if (currentIssuesCount > 0 && previousIssuesCountRef.current !== 0) {
        dispatch(setIssues([]));
        dispatch(setSelectedIssue({}));
        previousIssuesCountRef.current = 0;
      }
    } else {
      // Update issues count ref when text exists
      previousIssuesCountRef.current = issues?.length || 0;
    }
  }, [text, editor, dispatch]); // Removed issues from deps to prevent loop - we check it directly

  // Apply error highlighting using sentence + context + error matching
  useEffect(() => {
    if (!editor || !text?.trim()) {
      return;
    }

    if (skipMarkRef.current) {
      return;
    }

    const { state } = editor;
    let tr = state.tr;

    // Remove all existing marks
    tr = tr.removeMark(0, state.doc.content.size, state.schema.marks.errorMark);

    // Apply marks for each issue
    // Use JSON stringify to check if issues actually changed effectively
    // const issuesString = JSON.stringify(issues);
    // if (lastAppliedIssuesRef.current === issuesString && text === editor.getText()) {
    //   return;
    // }
    // lastAppliedIssuesRef.current = issuesString;

    issues?.forEach((errorObj, index) => {
      const { error, correct, sentence, type, context, errorId } = errorObj;
      if (!error) return;

      state.doc.descendants((node, pos) => {
        if (!node.isText) return;

        const nodeText = node.text;

        // Use helper function to find error position (sentence + context + error together)
        const position = findErrorPosition(
          nodeText,
          sentence,
          context,
          error,
          pos,
        );
        if (!position) return;

        const { start, end } = position;

        // Mark the error
        tr = tr.addMark(
          start,
          end,
          state.schema.marks.errorMark.create({
            error,
            correct,
            sentence,
            context,
            type,
            errorId,
          }),
        );
      });
    });

    tr.setMeta("addToHistory", false);
    editor.view.dispatch(tr);
  }, [issues, editor, text]);

  const handleAcceptAllCorrections = useCallback(() => {
    if (!Array.isArray(issues) || !editor) return;

    // Set flags BEFORE making any changes to prevent grammar check
    skipCheckRef.current = true;
    skipMarkRef.current = true;
    isFromEditorUpdateRef.current = false;
    hasUserInputRef.current = false;
    isProgrammaticUpdateRef.current = true; // Mark as programmatic update

    const { state } = editor;
    let tr = state.tr;
    const appliedIds = new Set();

    // Collect all corrections with their exact positions
    const corrections = [];

    state.doc.descendants((node, pos) => {
      if (!node.isText) return;

      const marks = node.marks?.filter(
        (mark) => mark.type?.name === "errorMark",
      );

      marks.forEach((mark) => {
        const { errorId, error, correct, sentence, context } = mark.attrs;
        if (!errorId || appliedIds.has(errorId) || !error || !correct) return;

        const issue = issues.find((i) => i.errorId === errorId);
        if (!issue || !issue.correct) return;

        const nodeText = node.text;

        // Use helper function to find error position (sentence + context + error together)
        const position = findErrorPosition(
          nodeText,
          sentence,
          context,
          error,
          pos,
        );
        if (!position) return;

        const { start, end } = position;

        corrections.push({
          errorId,
          start,
          end,
          correct: issue.correct,
          markType: mark.type,
        });
        appliedIds.add(errorId);
      });
    });

    // Sort corrections by position in DESCENDING order (end to start)
    // This ensures that when we apply corrections, positions don't shift
    corrections.sort((a, b) => b.end - a.end);

    // Apply corrections in reverse order (from end to start)
    corrections.forEach(({ errorId, start, end, correct, markType }) => {
      // Replace the error with the correction
      tr = tr.delete(start, end);
      tr = tr.insertText(correct, start);
      tr = tr.removeMark(start, start + correct.length, markType);
    });

    // Cleanup all remaining marks after applying all corrections
    tr = tr.removeMark(0, state.doc.content.size, state.schema.marks.errorMark);

    tr.setMeta("addToHistory", true);
    editor.view.dispatch(tr);

    // Update lastDispatchedTextRef IMMEDIATELY after dispatch (synchronously)
    // This must happen before onUpdate handler runs to prevent setText dispatch
    const newText = editor.getText();
    lastDispatchedTextRef.current = newText;

    // Clear issues from Redux state
    dispatch(setIssues([]));

    // Keep skipCheckRef true for a bit longer to ensure debounced effect doesn't run
    setTimeout(() => {
      // Only reset if user hasn't typed (which would have reset it in onUpdate)
      if (skipCheckRef.current) {
        skipCheckRef.current = false;
      }
    }, 2000); // Longer than debounce time (1500ms)

    toast.success("All corrections accepted!");
  }, [issues, editor, dispatch]);

  const handleAcceptCorrection = useCallback(
    (issue) => {
      if (!editor || !issue?.errorId) {
        setAnchorEl(null);
        dispatch(setSelectedIssue({}));
        return;
      }

      // Set flags BEFORE making any changes to prevent grammar check
      skipCheckRef.current = true;
      skipMarkRef.current = true;
      isFromEditorUpdateRef.current = false;
      hasUserInputRef.current = false;
      isProgrammaticUpdateRef.current = true; // Mark as programmatic update

      const { state } = editor;
      let tr = state.tr;
      let corrected = false;
      const { error, correct, sentence, context } = issue;

      if (!error || !correct) {
        setAnchorEl(null);
        dispatch(setSelectedIssue({}));
        // Reset flags if correction failed
        skipCheckRef.current = false;
        return;
      }

      // Find the exact error position and replace it with the correction
      state.doc.descendants((node, pos) => {
        if (!node.isText || corrected || !error) return;

        const nodeText = node.text;

        // Use helper function to find error position (sentence + context + error together)
        const position = findErrorPosition(
          nodeText,
          sentence,
          context,
          error,
          pos,
        );
        if (!position) return;

        const { start, end } = position;

        // Replace the error with the correction
        tr = tr.delete(start, end);
        tr = tr.insertText(correct, start);
        tr = tr.removeMark(
          start,
          start + correct.length,
          state.schema.marks.errorMark,
        );
        corrected = true;
      });

      if (corrected) {
        tr.setMeta("addToHistory", true);
        editor.view.dispatch(tr);

        // Update lastDispatchedTextRef IMMEDIATELY after dispatch (synchronously)
        // This must happen before onUpdate handler runs
        const newText = editor.getText();
        lastDispatchedTextRef.current = newText;

        dispatch(setIssues(issues.filter((e) => e.errorId !== issue.errorId)));
        // Close the modal and clear selected issue
        setAnchorEl(null);
        dispatch(setSelectedIssue({}));

        // Keep skipCheckRef true for a bit longer to ensure debounced effect doesn't run
        setTimeout(() => {
          // Only reset if user hasn't typed (which would have reset it in onUpdate)
          if (skipCheckRef.current) {
            skipCheckRef.current = false;
          }
        }, 2000); // Longer than debounce time (1500ms)
      } else {
        // If correction failed, still close the modal and reset flags
        setAnchorEl(null);
        dispatch(setSelectedIssue({}));
        skipCheckRef.current = false;
      }
    },
    [editor, issues, dispatch],
  );

  const handleIgnoreError = useCallback(
    (issue) => {
      if (!editor || !issue?.errorId) {
        setAnchorEl(null);
        return;
      }

      // Set flags BEFORE making any changes to prevent grammar check
      skipCheckRef.current = true;
      skipMarkRef.current = true;
      isFromEditorUpdateRef.current = false;
      hasUserInputRef.current = false;
      isProgrammaticUpdateRef.current = true; // Mark as programmatic update

      const { state } = editor;
      let tr = state.tr;
      let markRemoved = false;
      const { error, sentence, context } = issue;

      // Get current text - it won't change when removing mark, so update ref now
      const currentText = editor.getText();
      lastDispatchedTextRef.current = currentText;

      // Find and remove the error mark from the editor (but keep the text unchanged)
      state.doc.descendants((node, pos) => {
        if (!node.isText || markRemoved || !error) return;

        const nodeText = node.text;

        // Use helper function to find error position (sentence + context + error together)
        const position = findErrorPosition(
          nodeText,
          sentence,
          context,
          error,
          pos,
        );
        if (!position) return;

        const { start, end } = position;

        // Remove the mark from this specific range
        tr = tr.removeMark(start, end, state.schema.marks.errorMark);
        markRemoved = true;
      });

      if (markRemoved) {
        tr.setMeta("addToHistory", false);
        editor.view.dispatch(tr);
      }

      // Remove the issue from Redux state
      dispatch(setIssues(issues.filter((e) => e.errorId !== issue.errorId)));

      // Clear selected issue and close dialog
      dispatch(setSelectedIssue({}));
      setAnchorEl(null);

      // Keep skipCheckRef true for a bit longer to ensure debounced effect doesn't run
      setTimeout(() => {
        // Only reset if user hasn't typed (which would have reset it in onUpdate)
        if (skipCheckRef.current) {
          skipCheckRef.current = false;
        }
      }, 2000); // Longer than debounce time (1500ms)
    },
    [editor, issues, dispatch],
  );

  // Clear function
  const handleClear = useCallback(() => {
    if (editor) {
      isClearingEditorRef.current = true;
      editor?.commands?.clearContent();
      setTimeout(() => {
        isClearingEditorRef.current = false;
      }, 50);
    }

    dispatch(setScore(0));
    dispatch(setScores([]));
    dispatch(setText(""));
    dispatch(setIssues([]));
    dispatch(setSelectedIssue({}));
    hasUserInputRef.current = false;
    isFromEditorUpdateRef.current = false;
  }, [editor, dispatch]);

  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }, [text]);

  // Section management
  const handleNewSection = useCallback(() => {
    handleClear();
    dispatch(setSelectedSection({}));
    removeSectionId();
    toast.info("New chat opened!");
  }, [handleClear, dispatch, removeSectionId]);

  const handleSelectSection = useCallback(
    (section) => {
      // Set flags BEFORE making any changes to prevent grammar check
      skipCheckRef.current = true;
      skipMarkRef.current = true; // Prevent error marking until editor content is set
      // Don't mark as user input when loading a section
      isFromEditorUpdateRef.current = false;
      hasUserInputRef.current = false;
      isProgrammaticUpdateRef.current = true; // Mark as programmatic update

      handleClear();

      const sectionText = section?.text || section?.last_history?.text || "";
      const sectionIssues =
        section?.last_history?.result?.issues || section?.result?.issues || [];

      dispatch(setSelectedSection(section || {}));

      // Only set issues if section has text
      if (sectionText && sectionText.trim()) {
        dispatch(setIssues(sectionIssues));
      } else {
        dispatch(setIssues([]));
      }

      // Update Redux text state to prevent InitialInputActions from showing
      // This is safe because skipCheckRef is true, so grammar check won't trigger
      if (sectionText && sectionText.trim()) {
        dispatch(setText(sectionText));
        lastDispatchedTextRef.current = sectionText;
      } else {
        lastDispatchedTextRef.current = "";
      }

      if (editor) {
        // Set content without triggering auto-check
        editor.commands.setContent(sectionText || "");
        // Update lastDispatchedTextRef to prevent onUpdate from dispatching
        lastDispatchedTextRef.current = sectionText || "";
      }

      // Reset skipMarkRef after a delay to allow error highlighting
      // Ensure editor content and issues are set before allowing marks
      setTimeout(() => {
        skipMarkRef.current = false;
        // Manually trigger error marking by applying marks directly
        // This ensures marks are applied even if the effect doesn't re-run
        if (
          editor &&
          sectionText &&
          sectionText.trim() &&
          sectionIssues?.length > 0
        ) {
          const { state } = editor;
          let tr = state.tr;

          // Remove all existing marks first
          tr = tr.removeMark(
            0,
            state.doc.content.size,
            state.schema.marks.errorMark,
          );

          // Apply marks for each issue
          sectionIssues.forEach((errorObj) => {
            const { error, correct, sentence, type, context, errorId } =
              errorObj;
            if (!error) return;

            state.doc.descendants((node, pos) => {
              if (!node.isText) return;

              const nodeText = node.text;

              // Use helper function to find error position (sentence + context + error together)
              const position = findErrorPosition(
                nodeText,
                sentence,
                context,
                error,
                pos,
              );
              if (!position) return;

              const { start, end } = position;

              // Mark the error
              tr = tr.addMark(
                start,
                end,
                state.schema.marks.errorMark.create({
                  error,
                  correct,
                  sentence,
                  context,
                  type,
                  errorId,
                }),
              );
            });
          });

          tr.setMeta("addToHistory", false);
          editor.view.dispatch(tr);
        }
        // Keep skipCheckRef true to prevent auto-check until user types
        // It will be reset when user actually types (handled in onUpdate)
      }, 300); // Increased delay to ensure editor content is set

      if (section?._id && section._id !== sectionId) {
        // Update ref to prevent infinite loop
        lastSelectedSectionIdRef.current = section._id;
        setSectionId(section._id);
      } else if (section?._id) {
        // Update ref even if sectionId matches to prevent re-loading
        lastSelectedSectionIdRef.current = section._id;
      }
    },
    [dispatch, setSectionId, editor, sectionId, handleClear],
  );

  // Store latest handleSelectSection in ref to avoid infinite loops
  handleSelectSectionRef.current = handleSelectSection;

  const fetchSections = useCallback(
    async ({ page = 1, limit = 10, search = "", reset = false } = {}) => {
      try {
        const { data, meta } = await fetchGrammarSections({
          page,
          limit,
          search,
        });

        if (reset) {
          const groups = dataGroupsByPeriod(data || []);
          dispatch(setSections(data || []));
          dispatch(setSectionsGroups(groups));
          dispatch(setSectionsMeta(meta || {}));
        } else {
          // Use ref to get latest sections without needing it in dependency array
          const currentSections = sectionsRef.current || [];
          const allData = [...currentSections, ...(data || [])];
          const groups = dataGroupsByPeriod(allData);
          dispatch(setSections(allData));
          dispatch(setSectionsGroups(groups));
          dispatch(setSectionsMeta(meta || {}));
        }
      } catch (err) {
        console.error("Error fetching sections:", err);
      }
    },
    [dispatch], // Removed sections from deps to prevent infinite loop
  );

  // Load section by ID from URL - ONLY when user explicitly selects it (not from URL on reload)
  useEffect(() => {
    if (!sectionId) {
      // Only clear if we haven't already cleared for this empty sectionId
      if (lastSelectedSectionIdRef.current !== null) {
        dispatch(setSelectedSection({}));
        lastSelectedSectionIdRef.current = null;
      }
      return;
    }

    // Skip if this section is already being loaded/loaded
    if (lastSelectedSectionIdRef.current === sectionId) {
      return;
    }

    if (skipSectionRef.current) {
      // Reset skipSectionRef after a delay to allow manual section selection
      setTimeout(() => {
        skipSectionRef.current = false;
      }, 500);
      return;
    }

    // Fetch section and use handleSelectSection to set it (reuses existing logic)
    const loadSectionFromUrl = async () => {
      try {
        // Mark as loading to prevent duplicate loads
        lastSelectedSectionIdRef.current = sectionId;

        const { success, data: section } = await fetchGrammarSection(sectionId);
        if (success && section) {
          // Use ref to avoid infinite loop - handleSelectSection changes when sectionId changes
          // but we don't want to re-run this effect when handleSelectSection changes
          if (handleSelectSectionRef.current) {
            handleSelectSectionRef.current(section);
          }
        } else {
          // Reset if fetch failed
          lastSelectedSectionIdRef.current = null;
        }
      } catch (err) {
        console.error("Error fetching section:", err);
        // Reset on error
        lastSelectedSectionIdRef.current = null;
      }
    };

    loadSectionFromUrl();
    // Removed handleSelectSection and selectedSection from dependencies to prevent infinite loop
    // Using refs instead ensures we always have the latest version without triggering re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, dispatch]);

  const handlePreferences = useCallback(() => {
    alert("Open Preferences modal");
  }, []);

  const handleStatistics = useCallback(() => {
    alert("Statistics feature coming soon");
  }, []);

  const handleDownload = useCallback(async () => {
    if (!text) return;
    await downloadFile(text, "grammar");
  }, [text]);

  return (
    <>
      <div className="p-4">
        <div className="relative flex min-w-0 flex-col items-start gap-3 overflow-x-hidden lg:flex-row">
          <div className="bg-card hidden rounded-lg border p-3 lg:block">
            <div className="flex flex-col gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => dispatch(setIsSectionbarOpen(true))}
                      className="cursor-pointer"
                    >
                      <Image
                        src="/icons/history.svg"
                        alt="History"
                        width={20}
                        height={20}
                        className="size-5"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm">View History</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewSection}
                      className="cursor-pointer"
                    >
                      <Image
                        src="/icons/new-chat.svg"
                        alt="New Chat"
                        width={24}
                        height={24}
                        className="size-6"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm">New Chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="mx-auto flex h-[calc(100vh-180px)] max-h-[650px] w-full min-w-0 flex-1 flex-col lg:h-[calc(100vh-200px)] lg:max-h-[650px]">
            <div className="bg-card flex w-full min-w-0 shrink-0 items-center justify-between border border-b-0 lg:w-fit lg:rounded-t-lg">
              <LanguageMenu
                isLoading={isCheckLoading}
                setLanguage={(lang) => dispatch(setLanguage(lang))}
                language={language}
              />
              <div className="lg:hidden">
                <ActionMenu
                  onDownload={handleDownload}
                  onPreferences={handlePreferences}
                  onStatistics={handleStatistics}
                  onNewSection={handleNewSection}
                  onOpenSectionbar={() => dispatch(setIsSectionbarOpen(true))}
                />
              </div>
            </div>
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <div className="border-border bg-card flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-br-lg rounded-bl-lg border lg:rounded-tr-lg">
                <style jsx global>{`
                  .tiptap-content {
                    background-color: transparent !important;
                    max-width: 100%;
                    color: currentColor !important;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                  }

                  .ProseMirror {
                    box-sizing: border-box;
                    padding: 16px;
                    width: 100%;
                    min-width: 0;
                    max-width: 100%;
                    min-height: 300px;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                  }
                  .ProseMirror:focus {
                    outline: none;
                  }
                  .ProseMirror.ProseMirror-focused {
                    outline: none;
                  }
                  .ProseMirror p.is-editor-empty:first-child::before {
                    float: left;
                    height: 0;
                    pointer-events: none;
                    content: "Input your text here...";
                    color: hsl(var(--muted-foreground));
                  }
                  .ProseMirror p,
                  .ProseMirror div,
                  .ProseMirror span {
                    max-width: 100%;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                  }

                  .error-highlight:hover {
                    background-color: #fee2e2 !important;
                  }
                `}</style>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <EditorContent
                    className="h-full w-full max-w-full min-w-0 overflow-x-hidden"
                    editor={editor}
                  />
                </div>
                <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
                  <div className="flex items-center gap-2 lg:gap-4">
                    <div className="flex items-center justify-center">
                      <div className="hidden items-center gap-1 md:flex">
                        <EditorToolbar
                          editor={editor}
                          onHistoryOperation={() => {
                            isHistoryOperationRef.current = true;
                          }}
                        />
                      </div>
                      <div className="md:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="top" align="center">
                            <div className="flex items-center gap-1 px-2 py-1">
                              <EditorToolbar
                                editor={editor}
                                onHistoryOperation={() => {
                                  isHistoryOperationRef.current = true;
                                }}
                              />
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <ActionToolbar
                        editor={editor}
                        text={text}
                        setText={(value) => dispatch(setText(value))}
                        handleClear={handleClear}
                        handleCopy={handleCopy}
                      />
                      <div className="hidden lg:block">
                        <ActionMenu
                          onDownload={handleDownload}
                          onPreferences={handlePreferences}
                          onStatistics={handleStatistics}
                          onNewSection={handleNewSection}
                          onOpenSectionbar={() =>
                            dispatch(setIsSectionbarOpen(true))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 lg:hidden">
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-w-0 gap-1 px-2"
                          >
                            <span>
                              {(selectedTab === "grammar" ||
                                selectedTab === "all") &&
                                (issues?.length || 0)}
                              {selectedTab === "recommendation" &&
                                (recommendations?.length || 0)}
                            </span>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="center">
                          <DropdownMenuItem
                            onClick={() => dispatch(setSelectedTab("grammar"))}
                            className={cn({
                              "bg-primary/10 text-primary":
                                selectedTab === "grammar" ||
                                selectedTab === "all",
                            })}
                          >
                            <span className="shrink-0">
                              {issues?.length ? (
                                <span className="rounded-full bg-red-500/15 p-1 text-xs text-red-500">
                                  {issues?.length}
                                </span>
                              ) : (
                                <Image
                                  className="shrink-0"
                                  alt="check"
                                  src="/favicon.png"
                                  height={16}
                                  width={16}
                                />
                              )}
                            </span>
                            <span className="ml-2 text-xs capitalize">
                              Grammar
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              dispatch(setSelectedTab("recommendation"))
                            }
                            className={cn({
                              "bg-primary/10 text-primary":
                                selectedTab === "recommendation",
                            })}
                          >
                            <span className="shrink-0">
                              {recommendations?.length ? (
                                <span className="bg-primary/10 text-primary rounded-full p-1 text-xs">
                                  {recommendations.length}
                                </span>
                              ) : (
                                <Image
                                  className="shrink-0"
                                  alt="check"
                                  src="/favicon.png"
                                  height={16}
                                  width={16}
                                />
                              )}
                            </span>
                            <span className="ml-2 text-xs capitalize">
                              Recommendation
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-1">
                      {(selectedTab === "grammar" || selectedTab === "all") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-2 rounded"
                                disabled={!issues?.length || isCheckLoading}
                                onClick={handleAcceptAllCorrections}
                              >
                                {isCheckLoading ? (
                                  <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    <span className="shrink-0">
                                      Checking...
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="shrink-0">
                                      Fix Grammar
                                    </span>
                                    <span className="shrink-0">
                                      ({issues?.length || 0})
                                    </span>
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Accept All Grammar</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {selectedTab === "recommendation" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-2 rounded"
                                disabled={true}
                              >
                                <span className="shrink-0">Accept</span>
                                <span className="shrink-0">
                                  ({recommendations?.length || 0})
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Accept All Recommendations</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {!text && (
                <div className="absolute top-20 left-4">
                  <InitialInputActions
                    setInput={(text) => {
                      if (editor) {
                        // Mark as user input when pasting/inserting via buttons
                        hasUserInputRef.current = true;
                        isFromEditorUpdateRef.current = true;
                        editor?.commands?.setContent(text);
                      }
                    }}
                    sample={sample}
                    showSample={!!sample}
                    showPaste={true}
                    showInsertDocument={true}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <div
              className={cn(
                "absolute top-0 right-0 bottom-0 z-50 flex flex-col transition-all duration-300",
                {
                  "right-0": isSidebarOpen,
                  "-right-full": !isSidebarOpen,
                },
              )}
            >
              <GrammarSidebar
                handleAccept={handleAcceptCorrection}
                handleIgnore={handleIgnoreError}
                handleAcceptAll={handleAcceptAllCorrections}
              />
            </div>
            <div className="w-80 lg:mt-10">
              <div>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <button
                    onClick={() => dispatch(setIsSidebarOpen(true))}
                    className="flex h-8 cursor-pointer items-center justify-center rounded-md border px-2"
                  >
                    <ChevronsRight />
                    <span>Open assistant</span>
                  </button>
                  {/* <div
                    className={cn(
                      "flex aspect-square h-8 items-center justify-center rounded-md border bg-red-500/15 px-2 text-sm",
                    )}
                  >
                    {score || 0}/100
                  </div> */}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span>
                        {isCheckLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="border-t-muted-foreground h-5 w-5 animate-spin rounded-full border-2"></div>
                          </div>
                        ) : issues?.length ? (
                          <span className="rounded-md bg-red-500 px-1.5 py-1 text-white">
                            {issues?.length}
                          </span>
                        ) : (
                          <Image
                            className="shrink-0"
                            alt="check"
                            src="/favicon.png"
                            height={20}
                            width={20}
                          />
                        )}
                      </span>
                      <span>Grammar</span>
                    </div>
                    <div>
                      {!!issues?.length && (
                        <button
                          onClick={handleAcceptAllCorrections}
                          className="border-primary text-primary h-8 cursor-pointer rounded-full border px-4 text-sm"
                        >
                          Accept All
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span>
                        {recommendations?.length ? (
                          <span className="rounded-md bg-red-500 px-1.5 py-1 text-white">
                            {recommendations.length || 0}
                          </span>
                        ) : isRecommendationLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="border-t-muted-foreground h-5 w-5 animate-spin rounded-full border-2"></div>
                          </div>
                        ) : (
                          <Image
                            className="shrink-0"
                            alt="check"
                            src="/favicon.png"
                            height={20}
                            width={20}
                          />
                        )}
                      </span>
                      <span>Recommendation</span>
                    </div>
                    <div>
                      {!!recommendations?.length && (
                        <button className="border-primary text-primary h-8 cursor-pointer rounded-full border px-4 text-sm">
                          Accept All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GrammarSectionbar
        fetchSections={fetchSections}
        handleNewSection={handleNewSection}
        handleSelectSection={handleSelectSection}
        sectionId={sectionId}
        setSectionId={setSectionId}
        removeSectionId={removeSectionId}
      />

      {selectedIssue && Object.keys(selectedIssue).length > 0 && (
        <Dialog
          open={
            (Boolean(anchorEl) && !isSidebarOpen && !isMobile) ||
            (Boolean(anchorEl) && isMobile)
          }
          onOpenChange={(open) => {
            if (!open) setAnchorEl(null);
          }}
        >
          <DialogContent className="max-w-md p-0">
            <GrammarIssueCard
              issue={selectedIssue}
              handleAccept={handleAcceptCorrection}
              handleIgnore={handleIgnoreError}
              isCollapsed={true}
            />
          </DialogContent>
        </Dialog>
      )}
      <LoginDialog
        loginDialogOpen={loginDialogOpen}
        setLoginDialogOpen={setLoginDialogOpen}
      />
    </>
  );
};

const LoginDialog = ({ loginDialogOpen, setLoginDialogOpen }) => {
  const dispatch = useDispatch();
  return (
    <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to check grammar. Please log in to
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

export default GrammarCheckerContentSection;
