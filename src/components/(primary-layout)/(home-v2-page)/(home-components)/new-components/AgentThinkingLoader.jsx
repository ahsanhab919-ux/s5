"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import Image from "next/image";

const AgentThinkingLoader = ({
  message = "Agent is thinking...",
  steps = [
    "Analyzing your request",
    "Processing information",
    "Generating response",
  ],
}) => {
  return (
    <div className="mt-2 flex w-full max-w-full items-center gap-2 overflow-hidden rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2 sm:gap-3 sm:p-3 lg:mt-3">
      {/* Animated Mascot */}
      <div className="relative h-10 w-10 shrink-0 sm:h-12 sm:w-12">
        <motion.div
          className="h-full w-full"
          animate={{
            rotate: [-3, 3, -3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src={"/home/shothik-mascot.png"}
            alt="AI thinking"
            className="h-full w-full object-contain"
          />
        </motion.div>

        {/* Thinking bubbles */}
        <div className="absolute -top-2 -right-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-green-500"
              style={{
                right: i * 16,
                top: i * -12,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Brain icon indicator */}
        <motion.div
          className="bg-background absolute -right-1 -bottom-1 flex items-center justify-center rounded-full border border-green-200 p-1 shadow-sm"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        >
          <Brain className="size-3 text-green-600" />
        </motion.div>
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1 overflow-hidden">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="mb-1 text-xs leading-tight font-medium text-green-700 sm:text-sm">
            {message}
          </p>
        </motion.div>

        {/* Animated steps */}
        <div className="flex flex-col gap-0.5">
          {steps.map((step, index) => (
            <motion.div
              key={step}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.5 }}
            >
              <motion.div
                className="h-1 w-1 shrink-0 rounded-full bg-green-500"
                animate={{
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              />
              <span className="text-[0.625rem] leading-tight text-green-600 sm:text-xs">
                {step}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sparkle animation */}
      <div className="flex shrink-0 items-center justify-center">
        <motion.div
          animate={{
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Sparkles className="size-3.5 text-green-500 sm:size-4" />
        </motion.div>
      </div>
    </div>
  );
};

export default AgentThinkingLoader;
