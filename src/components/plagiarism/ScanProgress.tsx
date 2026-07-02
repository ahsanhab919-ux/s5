"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ScanStep {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

interface ScanProgressProps {
  loading: boolean;
  elapsedTime?: number;
  estimatedTotalTime?: number; // Estimated total scan time in seconds
}

const getInitialSteps = (): ScanStep[] => [
  {
    id: "initialize",
    label: "Initializing",
    description: "Setting up plagiarism detection workflow",
    checked: false,
  },
  {
    id: "chunking",
    label: "Analyzing Text",
    description: "Breaking down your content into analyzable segments",
    checked: false,
  },
  {
    id: "searching",
    label: "Searching Sources",
    description: "Scanning billions of web sources for matches",
    checked: false,
  },
  {
    id: "analyzing",
    label: "Comparing Content",
    description: "Analyzing similarity and detecting plagiarism",
    checked: false,
  },
  {
    id: "generating",
    label: "Generating Report",
    description: "Compiling your detailed plagiarism report",
    checked: false,
  },
];

const ScanProgress = ({ loading, elapsedTime = 0, estimatedTotalTime }: ScanProgressProps) => {
  const [items, setItems] = useState<ScanStep[]>(getInitialSteps);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);

  // Default estimated time: 2-3 minutes (120-180 seconds)
  // Use provided estimate or calculate based on elapsed time (if scan is taking longer)
  const totalAnimationTime = estimatedTotalTime || 150; // Default 150 seconds (2.5 minutes)
  const stepCount = getInitialSteps().length;
  const stepDuration = (totalAnimationTime * 1000) / stepCount; // Convert to milliseconds and divide by steps

  // Reset component state when loading starts
  useEffect(() => {
    if (loading) {
      setItems(getInitialSteps());
      setCurrentIndex(0);
      setScrollOffset(0);
      setAnimationComplete(false);
      animationStartTimeRef.current = Date.now();
    } else {
      // Reset when loading stops
      animationStartTimeRef.current = null;
      setAnimationComplete(false);
    }
  }, [loading]);

  useEffect(() => {
    // Stop animation if not loading
    if (!loading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Don't continue if animation is already complete
    if (animationComplete) {
      return;
    }

    const checkTimeout = setTimeout(() => {
      // Ensure currentIndex is always valid
      const validIndex = Math.min(currentIndex, items.length - 1);

      // Mark current item as checked
      setItems((prevItems) => {
        const newItems = [...prevItems];
        if (validIndex >= 0 && validIndex < newItems.length) {
          newItems[validIndex].checked = true;
        }
        return newItems;
      });

      // After checking, move to next item and adjust scroll
      setTimeout(() => {
        setCurrentIndex((prev) => {
          // Ensure prev is valid
          const safePrev = Math.min(prev, items.length - 1);
          const next = safePrev + 1;

          // If we've completed all items, mark animation as complete
          // Don't loop - just stay on the last step
          const maxVisibleItems = 3;
          if (next >= items.length) {
            setAnimationComplete(true);
            // Scroll to show the last item
            const maxOffset = Math.max(0, items.length - maxVisibleItems);
            setScrollOffset(maxOffset);
            // Keep currentIndex at the last item
            return items.length - 1;
          }

          // Only scroll when the next item would be outside the visible range
          // We show maxVisibleItems (3) items at a time
          // Start scrolling only when we've checked maxVisibleItems items and need to show the next one
          if (next >= maxVisibleItems && next < items.length) {
            setScrollOffset((prevOffset) => {
              // Calculate the new offset to keep the current item visible
              // The current item should be at the bottom of the visible area
              const newOffset = next - maxVisibleItems + 1;
              // Don't scroll beyond the last visible items
              const maxOffset = Math.max(0, items.length - maxVisibleItems);
              return Math.min(newOffset, maxOffset);
            });
          }
          return next;
        });
      }, 300);
    }, stepDuration);

    timeoutRef.current = checkTimeout;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, items.length, loading, animationComplete, stepDuration]);

  if (!loading) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const itemHeight = 80; // Height per item including spacing
  const maxVisibleItems = 3;

  return (
    <Card className="border-primary/20 bg-card">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Scanning in Progress</h3>
            <p className="text-muted-foreground text-sm">
              Analyzing your content for plagiarism...
            </p>
          </div>
          {elapsedTime > 0 && (
            <div className="text-muted-foreground text-sm font-medium">
              {formatTime(elapsedTime)}
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-lg">
          <div className="relative h-[280px] overflow-hidden">
            {/* Top fade overlay */}
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-12 bg-gradient-to-b from-card to-transparent"></div>

            {/* Bottom fade overlay */}
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-12 bg-gradient-to-t from-card to-transparent"></div>

            {/* Scrollable content */}
            <motion.div
              animate={{
                y: -scrollOffset * itemHeight,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
              className="py-2 will-change-transform"
            >
              {items.map((item, index) => {
                // If animation is complete, show all items except the last as checked
                // The last item remains "current" until the actual scan completes
                const isChecked = animationComplete 
                  ? index < items.length - 1 
                  : item.checked;
                // If animation is complete, the last item is the "current" one (still processing)
                const isCurrent = animationComplete 
                  ? index === items.length - 1 
                  : index === currentIndex && currentIndex < items.length;
                const visibleStart = scrollOffset;
                const visibleEnd = scrollOffset + maxVisibleItems;
                const isInView = index >= visibleStart && index < visibleEnd;

                return (
                  <motion.div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-4 rounded-lg border p-4 transition-all",
                      isChecked && "border-green-500/30 bg-green-500/5",
                      isCurrent && !isChecked && "border-primary/50 bg-primary/5",
                      !isCurrent && !isChecked && "border-border/50 bg-muted/30 opacity-60"
                    )}
                    style={{  marginBottom: "0.5rem" }}
                    animate={{
                      opacity: isInView ? 1 : 0.2,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                      <motion.div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                          isChecked
                            ? "border-emerald-500 bg-emerald-500"
                            : isCurrent
                              ? "border-primary bg-primary/10"
                              : "border-slate-300 bg-white dark:bg-slate-800"
                        )}
                        animate={{
                          scale: isChecked
                            ? [1, 1.2, 1]
                            : isCurrent
                              ? [1, 1.1, 1]
                              : 1,
                        }}
                        transition={{
                          duration: isChecked ? 0.4 : 1.5,
                          repeat: isCurrent && !isChecked ? Infinity : 0,
                          repeatType: "reverse",
                        }}
                      >
                        <AnimatePresence>
                          {isChecked ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 600,
                                damping: 20,
                              }}
                            >
                              <Check
                                className="h-3.5 w-3.5 text-white"
                                strokeWidth={3}
                              />
                            </motion.div>
                          ) : isCurrent ? (
                            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                          ) : null}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <motion.p
                          className={cn(
                            "font-medium",
                            isChecked && "text-emerald-600 dark:text-emerald-400",
                            isCurrent && !isChecked && "text-primary",
                            !isCurrent && !isChecked && "text-muted-foreground"
                          )}
                          animate={{
                            x: isChecked ? [0, 2, 0] : 0,
                          }}
                          transition={{
                            duration: 0.3,
                          }}
                        >
                          {item.label}
                        </motion.p>
                        {isCurrent && !isChecked && (
                          <span className="text-primary text-xs font-medium">
                            {animationComplete ? "Finalizing..." : "In progress..."}
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm",
                          isCurrent || isChecked
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-xs">
            This may take time 2-3 minutes depending on content length
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScanProgress;

