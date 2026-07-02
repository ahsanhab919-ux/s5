"use client";

import { cn } from "@/lib/utils";
import * as motion from "motion/react-client";
import ViewMoreButton from "./components/b2b/ViewMoreButton";

export default function B2bFeatures() {
  return (
    <div
      className={cn(
        "relative bg-cover bg-center bg-no-repeat",
        "bg-[url('/home/b2b-background.png')]",
        "py-16 sm:py-20 md:py-20",
        "px-4 sm:px-8 md:px-12",
      )}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className={cn(
          "text-foreground text-center font-bold",
          "text-[1.8rem] sm:text-2xl md:text-4xl lg:text-4xl",
          "mb-16 leading-tight sm:mb-12",
          "[&>span]:block",
        )}
      >
        Shothik AI Solutions for Businesses
        <div className="flex items-center justify-center gap-4">
          <span
            className={cn(
              "from-primary to-primary bg-gradient-to-r",
              "bg-clip-text text-transparent",
            )}
          >
            Tailored for B2B Innovation
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 items-center sm:grid-cols-2 md:grid-cols-2">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="col-span-1"
        >
          <div className="flex items-center justify-start gap-8">
            <div className="flex flex-col items-start justify-start">
              <h3
                className={cn(
                  "text-foreground leading-tight font-bold",
                  "text-xl sm:text-xl md:text-3xl",
                )}
              >
                Transform Your Business with <br />
                <span className="text-primary font-bold">
                  AI-Powered Solutions
                </span>
              </h3>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-foreground text-base">
              Leverage cutting-edge AI solutions to optimize your business
              processes, enhance productivity, and drive innovation across your
              organization.
            </p>
          </div>
          <div className="mt-8">
            <ViewMoreButton />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
