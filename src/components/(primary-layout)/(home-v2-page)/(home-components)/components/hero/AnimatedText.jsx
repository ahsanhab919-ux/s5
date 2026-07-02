"use client";

import useResponsive from "@/hooks/ui/useResponsive";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AnimatedText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useResponsive("down", "md");
  const texts = [
    "AI that writes like you",
    "Write better",
    "Work smarter",
    "Launch faster",
  ];

  useEffect(() => {
    // Only run animation interval if not mobile
    if (isMobile) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, 4000); // Longer duration to accommodate word animations

    return () => clearInterval(interval);
  }, [texts.length, isMobile]);

  // Find the longest text to reserve space
  const longestText = texts.reduce((a, b) => (a.length > b.length ? a : b));

  const containerVariants = {
    enter: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    center: {
      transition: {
        staggerChildren: 0.08,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const wordVariants = {
    enter: {
      y: 30,
      opacity: 0,
    },
    center: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: {
      y: -30,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  // For mobile, just show static text
  if (isMobile) {
    return <span>{texts[0]}</span>; // Show first text or you can choose any default
  }

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "hidden", // Changed from "hidden" to "visible"
        minWidth: "fit-content", // Ensure minimum width
      }}
    >
      {/* Invisible text to reserve space - now with proper spacing */}
      <span
        style={{
          visibility: "hidden",
          position: "static",
          whiteSpace: "nowrap", // Prevent text wrapping
          paddingRight: "0.25em", // Account for the last word's margin
        }}
        aria-hidden="true"
      >
        {longestText.split(" ").map((word, index) => (
          <span
            key={index}
            style={{
              marginRight:
                index < longestText.split(" ").length - 1 ? "0.25em" : "0",
            }}
          >
            {word}
          </span>
        ))}
      </span>

      {/* Animated text container */}
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          whiteSpace: "nowrap", // Prevent wrapping
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            variants={containerVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              display: "inline-block",
            }}
          >
            {texts[currentIndex].split(" ").map((word, wordIndex) => (
              <motion.span
                key={wordIndex}
                variants={wordVariants}
                style={{
                  display: "inline-block",
                  marginRight:
                    wordIndex < texts[currentIndex].split(" ").length - 1
                      ? "0.25em"
                      : "0",
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
