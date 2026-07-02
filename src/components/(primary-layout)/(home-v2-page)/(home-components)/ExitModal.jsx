"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { useExitIntent } from "@/hooks/useExitIntent";
import { trackingList } from "@/lib/trackingList";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export default function ExitModal({ setOpen }) {
  const [showExitIntent, setShowExitIntent] = useState(false);
  const { componentRef, trackClick } = useComponentTracking(
    trackingList.EXIT_INTENT_MODAL,
  );

  // Exit intent for modal
  useExitIntent(() => {
    if (showExitIntent) {
      trackClick("exit_intent_in_modal", {
        open_modal_time: Date.now(),
      });
    }
  });

  useEffect(() => {
    let isExitIntentShown = false;

    // Handle browser close/refresh attempts
    const handleBeforeUnload = (e) => {
      if (!isExitIntentShown) {
        // Prevent the default browser dialog
        e.preventDefault();

        // Show our custom modal
        setShowExitIntent(true);
        isExitIntentShown = true;

        // For older browsers compatibility
        e.returnValue = "";
        return "";
      }
    };

    // Handle keyboard shortcuts (Ctrl+W, Ctrl+F4, Alt+F4, etc.)
    const handleKeyDown = (e) => {
      if (!isExitIntentShown) {
        // Ctrl+W (close tab), Ctrl+F4 (close tab), Ctrl+R (refresh), F5 (refresh)
        if (
          (e.ctrlKey &&
            (e.key === "w" ||
              e.key === "W" ||
              e.key === "r" ||
              e.key === "R")) ||
          (e.ctrlKey && e.key === "F4") ||
          (e.altKey && e.key === "F4") ||
          e.key === "F5"
        ) {
          e.preventDefault();
          setShowExitIntent(true);
          isExitIntentShown = true;
        }
      }
    };

    // Handle mouse leave (moving cursor to close button area)
    const handleMouseLeave = (e) => {
      if (!isExitIntentShown && e.clientY <= 0) {
        setShowExitIntent(true);
        isExitIntentShown = true;
      }
    };

    // Handle browser navigation (back button, etc.)
    const handlePopState = (e) => {
      if (!isExitIntentShown) {
        setShowExitIntent(true);
        isExitIntentShown = true;
        // Push the current state back to prevent actual navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Add event listeners
    // window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("popstate", handlePopState);

    // Push initial state for popstate handling
    window.history.pushState(null, "", window.location.href);

    // Cleanup
    return () => {
      // window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleClose = () => {
    setShowExitIntent(false);
  };

  const handleClaimFree = () => {
    setShowExitIntent(false);
    setOpen(true);
    // window.open("/signup", "_blank");
  };

  return (
    <div ref={componentRef}>
      {/* Demo button to show modal */}
      {/* <Button 
        variant="contained" 
        onClick={() => setShowExitIntent(true)}
        sx={{ mb: 2 }}
      >
        Show Exit Intent Modal
      </Button> */}

      <Dialog
        open={showExitIntent}
        onOpenChange={(v) => (!v ? handleClose() : null)}
      >
        <DialogContent className="relative w-full max-w-[448px] rounded-2xl p-6 text-center sm:p-8">
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground absolute top-4 right-4"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="space-y-3">
            <h3 className="text-foreground text-xl leading-snug font-bold">
              Wait! Don&apos;t Leave Yet
            </h3>

            <p className="text-muted-foreground text-sm leading-6">
              Get your first paper improved free. Join 50,000+ students already
              using Shothik AI.
            </p>

            <div className="mt-2 space-y-2">
              <Button
                // data-umami-event="Claim Free Paper Review"
                data-rybbit-event="Claim Free Paper Review"
                className="h-11 w-full text-base font-semibold"
                onClick={handleClaimFree}
              >
                Claim Free Paper Review
              </Button>

              <Button
                data-umami-event="No thanks, I'll struggle with my writing"
                data-rybbit-event="No thanks, I'll struggle with my writing"
                variant="ghost"
                className="h-10 w-full text-sm"
                onClick={handleClose}
              >
                No thanks, I&apos;ll struggle with my writing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
