"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function Guarantee() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div
          className={cn(
            "bg-muted rounded-2xl p-8 text-center lg:p-12",
            "mt-16",
          )}
        >
          <div className="mx-auto max-w-3xl">
            <div className="bg-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
              <CheckCircle className="text-primary-foreground h-8 w-8" />
            </div>

            <h3
              className={cn(
                "text-foreground mb-4 text-2xl font-bold",
                "sm:text-3xl",
              )}
            >
              Your Success is Guaranteed
            </h3>

            <p
              className={cn(
                "text-muted-foreground mb-8 text-xl leading-relaxed font-normal",
              )}
            >
              If your improved paper doesn&apos;t meet your expectations,
              we&apos;ll revise it free or refund your credits. No questions
              asked.
            </p>

            <Button
              size="lg"
              onClick={() => {}}
              className={cn(
                "h-auto px-8 py-3 text-lg font-semibold shadow-lg",
                "transition-all duration-300",
                "hover:scale-105 hover:shadow-xl",
              )}
            >
              Try Risk-Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
