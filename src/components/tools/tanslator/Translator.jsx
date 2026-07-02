"use client";
import { trySamples } from "@/_mock/trySamples";
import { trackEvent } from "@/analysers/eventTracker";
import InitialInputActions from "@/components/(primary-layout)/(summarize-page)/SummarizeContentSection/InitialInputActions";
import ButtonInsertDocumentText from "@/components/buttons/ButtonInsertDocumentText";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import useResponsive from "@/hooks/ui/useResponsive";
import useLoadingText from "@/hooks/useLoadingText";
import { cn } from "@/lib/utils";
import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import BottomBar from "./BottomBar";
import LanguageMenu from "./LanguageMenu";
// new code adde by rahmat
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Download } from "lucide-react";
import { downloadFile } from "../common/downloadfile";
// end
const Translator = () => {
  const [outputContend, setOutputContend] = useState("");
  const { user, accessToken } = useSelector((state) => state.auth);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const isMobile = useResponsive("down", "sm");
  const dispatch = useDispatch();
  const loadingText = useLoadingText(isLoading);
  const [translateLang, setTranslateLang] = useState({
    fromLang: "Auto Detect",
    toLang: "English",
  });

  async function handleCopy() {
    await navigator.clipboard.writeText(outputContend);
    toast.success("Copied to clipboard");
  }
  const handleDownload = async () => {
    await downloadFile(outputContend, "translation");
    toast.success("Text Downloaded");
  };
  const prevToLangRef = useRef(translateLang.toLang);

  // Only show Try Sample if source language is English (similar to Paraphrase)
  const sampleText = useMemo(() => {
    // Check if fromLang is English or starts with "English"
    const isEnglish =
      translateLang.fromLang === "English" ||
      translateLang.fromLang === "English (US)" ||
      translateLang.fromLang?.startsWith("English");

    return isEnglish ? trySamples.translator.English : null;
  }, [translateLang.fromLang]);

  const hasSampleText = Boolean(sampleText); // To conditionally show the Try Sample button

  const handleLanguageChange = (
    newLangStateOrUpdater,
    skipClearOutput = false,
  ) => {
    // Handle both direct object and function updater from React setState
    let newLangState;
    if (typeof newLangStateOrUpdater === "function") {
      // If it's a function, call it with current state to get new state
      newLangState = newLangStateOrUpdater(translateLang);
    } else {
      newLangState = newLangStateOrUpdater;
    }

    // Check if target language changed BEFORE updating the ref
    const targetLangChanged = prevToLangRef.current !== newLangState.toLang;
    const hasInput = userInput.trim().length > 0;
    const hadOutput = outputContend.trim().length > 0; // Check if there was output BEFORE clearing
    const inputText = userInput.trim(); // Store input text before clearing

    // Update previous target language reference BEFORE setting state
    prevToLangRef.current = newLangState.toLang;

    // Clear output when language changes (unless it's a swap operation)
    if (!skipClearOutput) {
      setOutputContend("");
    }

    // Update state - use the updater if it was a function, otherwise use the object directly
    if (typeof newLangStateOrUpdater === "function") {
      setTranslateLang(newLangStateOrUpdater);
    } else {
      setTranslateLang(newLangState);
    }

    // Only auto-translate if target language changed AND there was already a translation (output existed)
    // This ensures we don't auto-translate on initial paste or refresh
    if (targetLangChanged && !skipClearOutput && hadOutput) {
      if (hasInput) {
        // Automatically translate if there's input text and there was previous output
        const direction = newLangState.fromLang + " to " + newLangState.toLang;
        const payload = { data: inputText, direction };

        // Call translation directly without going through handleSubmit to avoid state timing issues
        setTimeout(async () => {
          try {
            //track event
            trackEvent("click", "translator", "translator_click", 1);

            setOutputContend("");
            setIsLoading(true);

            await fetchWithStreaming(payload, "/translator");
          } catch (error) {
            if (/LIMIT_REQUEST|PACAKGE_EXPIRED/.test(error?.error)) {
              dispatch(setShowAlert(true));
              dispatch(setAlertMessage(error?.message));
            } else if (error?.error === "UNAUTHORIZED") {
              dispatch(setShowLoginModal(true));
            } else {
              toast.error(error?.message);
            }
            setOutputContend("");
          } finally {
            setIsLoading(false);
          }
        }, 100);
      } else {
        // If target language changed, had output but no input, show notification
        toast.info(
          "Target language changed — Click Translate to see the updated result",
          {
            position: "top-right",
            autoClose: 4000,
          },
        );
      }
    } else if (targetLangChanged && !skipClearOutput && !hadOutput) {
      // If target language changed but no previous translation existed, show notification
      toast.info(
        "Target language changed — Click Translate to see the result",
        {
          position: "top-right",
          autoClose: 4000,
        },
      );
    }
  };

  function handleInput(e) {
    const value = e.target.value;
    setUserInput(value);
  }

  function handleClear() {
    setUserInput("");
    setOutputContend("");
  }

  async function fetchWithStreaming(payload, api = "/translator") {
    try {
      const url = process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX + api;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { message: error.message, error: error.error };
      }

      const stream = response.body;
      const decoder = new TextDecoderStream();
      const reader = stream.pipeThrough(decoder).getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        setOutputContend((prev) => prev + value);
      }
    } catch (error) {
      throw error;
    }
  }

  async function handleSubmit(payloads, url) {
    try {
      //track event
      trackEvent("click", "translator", "translator_click", 1);

      setOutputContend("");
      setIsLoading(true);
      const direction = translateLang.fromLang + " to " + translateLang.toLang;
      const payload = payloads ? payloads : { data: userInput, direction };

      await fetchWithStreaming(payload, url);
    } catch (error) {
      if (/LIMIT_REQUEST|PACAKGE_EXPIRED/.test(error?.error)) {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(error?.message));
      } else if (error?.error === "UNAUTHORIZED") {
        dispatch(setShowLoginModal(true));
      } else {
        toast.error(error?.message);
      }
      setOutputContend("");
    } finally {
      setIsLoading(false);
    }
  }

  const handleHumanize = async () => {
    try {
      setIsHumanizing(true);
      const payload = {
        data: outputContend,
        language: translateLang.toLang,
        mode: "Fixed",
        synonym: "Basic",
      };
      await handleSubmit(payload, "/fix-grammar");

      toast.success("Translation humanized successfully.");
    } catch (err) {
      const error = err?.response?.data;
      if (/LIMIT_REQUEST|PACAKGE_EXPIRED/.test(error?.error)) {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage("Humanize limit exceeded, Please upgrade"));
      } else if (error?.error === "UNAUTHORIZED") {
        dispatch(setShowLoginModal(true));
      } else {
        toast.error(error?.message);
      }
    } finally {
      setIsHumanizing(false);
    }
  };

  function reverseText() {
    // Swap text content if both input and output exist
    if (userInput && outputContend) {
      const tempInput = userInput;
      setUserInput(outputContend);
      setOutputContend(tempInput);
    } else if (outputContend && !userInput) {
      // If only output exists, move it to input
      setUserInput(outputContend);
      setOutputContend("");
    }
  }

  const handleReverseTranslation = () => {
    // Store current state before swapping
    const hadOutput = outputContend.trim().length > 0;
    const hadInput = userInput.trim().length > 0;
    const textToTranslate = outputContend.trim(); // This will become the new input after swap

    // Swap languages
    const newLangState = {
      fromLang: translateLang.toLang,
      toLang: translateLang.fromLang,
    };

    // Swap text content first
    reverseText();

    // Update languages without clearing output (skipClearOutput = true)
    handleLanguageChange(newLangState, true);

    // If we have text to translate after swap, automatically regenerate translation
    if (hadOutput && textToTranslate.length > 0) {
      // Clear output to show new translation
      setOutputContend("");

      // Small delay to ensure state updates are complete
      setTimeout(() => {
        const direction = newLangState.fromLang + " to " + newLangState.toLang;
        const payload = { data: textToTranslate, direction };
        handleSubmit(payload, "/translator");
      }, 150);
    } else if (hadOutput && !hadInput) {
      // If we swapped and only had output, show notification
      toast.info(
        "Languages swapped — Click Translate to see the updated result",
        {
          position: "top-right",
          autoClose: 4000,
        },
      );
    }
  };

  return (
    <Card className="rounded-xl border p-4 shadow-sm">
      <LanguageMenu
        isLoading={isLoading || isHumanizing}
        userInput={userInput}
        outputContend={outputContend}
        reverseText={reverseText}
        translateLang={translateLang}
        setTranslateLang={handleLanguageChange}
        handleReverseTranslation={handleReverseTranslation}
      />

      <div className="mt-2 grid grid-cols-1 items-stretch md:grid-cols-2 md:gap-4">
        <div
          className={cn(
            "relative h-[calc(100vh-380px)] max-h-[500px] min-h-[350px]",
            isMobile
              ? "flex flex-col overflow-hidden"
              : "overflow-x-hidden overflow-y-auto",
          )}
        >
          <div
            className={cn(
              "relative overflow-x-hidden overflow-y-auto",
              isMobile ? "min-h-0 flex-1" : "h-full",
            )}
          >
            <Textarea
              name="input"
              rows={isMobile ? 12 : 14}
              placeholder="Input your text here..."
              value={userInput}
              onChange={handleInput}
              className="border-border h-full w-full max-w-full resize-none rounded-lg p-4 wrap-break-word focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
            />
            {!userInput && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="pointer-events-auto flex flex-col items-center">
                  <InitialInputActions
                    className={"flex-nowrap"}
                    setInput={(text) => {
                      setUserInput(text);
                    }}
                    sample={sampleText}
                    showSample={hasSampleText}
                    showPaste={true}
                    showInsertDocument={false}
                  />
                  <div className="mt-1">
                    <ButtonInsertDocumentText
                      key="insert-document"
                      onApply={(value) => setUserInput(value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          {isMobile && (
            <div className="bg-background border-t-border sticky bottom-0 z-10 border-t">
              <BottomBar
                handleClear={handleClear}
                handleHumanize={handleHumanize}
                handleSubmit={handleSubmit}
                isHumanizing={isHumanizing}
                isLoading={isLoading}
                outputContend={outputContend}
                userInput={userInput}
                userPackage={user?.package}
              />
            </div>
          )}
        </div>
        {isMobile && !userInput ? null : (
          <div className="h-[calc(100vh-380px)] max-h-[500px] min-h-[350px] overflow-x-hidden overflow-y-auto">
            <Textarea
              name="output"
              rows={isMobile ? 12 : 14}
              placeholder="Translated text"
              value={loadingText ? loadingText : outputContend}
              disabled
              className="border-border text-foreground h-full w-full max-w-full resize-none rounded-lg p-4 break-words disabled:cursor-default disabled:opacity-100"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
            />
          </div>
        )}
        <div className="flex flex-row items-center">
          {outputContend && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleDownload}
                    aria-label="download"
                    variant="ghost"
                    size={isMobile ? "icon-sm" : "icon"}
                    className="rounded-[5px]"
                  >
                    <Download
                      className={cn(
                        "font-semibold",
                        isMobile ? "size-4" : "size-5",
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Export</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCopy}
                    aria-label="copy"
                    variant="ghost"
                    size={isMobile ? "icon-sm" : "icon"}
                    className="rounded-[5px]"
                  >
                    <Copy className={cn(isMobile ? "size-4" : "size-5")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Copy Full Text</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {!isMobile && (
        <BottomBar
          handleClear={handleClear}
          handleHumanize={handleHumanize}
          handleSubmit={handleSubmit}
          isHumanizing={isHumanizing}
          isLoading={isLoading}
          outputContend={outputContend}
          userInput={userInput}
          userPackage={user?.package}
        />
      )}
    </Card>
  );
};

export default Translator;
