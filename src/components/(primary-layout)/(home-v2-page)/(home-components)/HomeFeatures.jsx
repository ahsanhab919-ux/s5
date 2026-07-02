"use client";

import { cn } from "@/lib/utils";
import * as motion from "motion/react-client";
import BgContainer from "./components/hero/BgContainer";
import UserActionButton from "./components/hero/UserActionButton";
import VideoImage from "./components/VideoImage";

export default function HomeFeatures() {
  return (
    <BgContainer
      className={cn("bg-background mb-3 px-4 py-16 sm:px-8 md:px-12")}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className={cn(
          "mb-16 text-center font-bold sm:mb-12",
          "text-[1.8rem] sm:text-2xl md:text-3xl lg:text-3xl",
          "leading-tight",
          "[&>span]:block",
        )}
      >
        Powerful Features That Set{" "}
        <div className="flex items-center justify-center gap-4">
          <span
            className={cn(
              "from-primary to-primary bg-gradient-to-r",
              "bg-clip-text text-transparent",
            )}
          >
            Shothik AI
          </span>
          <span className="text-foreground">Apart</span>
        </div>
      </motion.div>

      {/* Bypass GPT Section */}
      <div className="grid grid-cols-1 items-center justify-between sm:grid-cols-2 md:grid-cols-2">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="col-span-1"
        >
          <div className="flex items-center justify-start gap-8">
            <div className="flex flex-col items-start justify-start">
              <h3
                className={cn(
                  "leading-tight font-bold",
                  "text-xl sm:text-xl md:text-2xl",
                )}
              >
                Unleash AI Potential with <br />
                <span className="text-primary font-bold">Humanize GPT</span>
              </h3>
            </div>
          </div>

          <div className="my-4">
            <p className="text-muted-foreground text-base">
              Working closely in partnership with the AI detector, you can
              verify and authenticate, distinguishing between human-written and
              AI-generated content with precision and confidence.
            </p>
          </div>

          <UserActionButton />
        </motion.div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="col-span-1 pl-0 md:pl-20"
        >
          <VideoImage
            lightImage="/home/bypass-light.webp"
            darkImage="/home/bypass-dark.webp"
            width={450}
            height={450}
            object="fill"
          />
        </motion.div>
      </div>

      {/* AI Detector Section */}
      <div className="grid grid-cols-1 items-center justify-between sm:grid-cols-2 md:grid-cols-2">
        {/* Video Grid */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="order-2 col-span-1 sm:order-1"
        >
          <VideoImage
            lightImage="/home/ai-detector-light.webp"
            darkImage="/home/ai-detector-dark.webp"
            width={400}
            height={400}
          />
        </motion.div>

        {/* Text Content Grid */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          viewport={{ once: true }}
          className="order-1 col-span-1 sm:order-2"
        >
          <div className="flex items-center justify-start gap-8">
            <div className="flex flex-col items-start justify-start gap-1">
              <h3
                className={cn(
                  "leading-tight font-bold",
                  "text-xl sm:text-xl md:text-2xl",
                )}
              >
                Harness the Power of <br /> Advanced{" "}
                <span className="text-primary font-bold">AI Detector</span>
              </h3>
            </div>
          </div>
          <div className="my-4">
            <p className="text-muted-foreground text-base">
              Direct communications with AI-driven queries. The Humanize GPT
              feature ensures you receive unrestrained, detailed, and
              comprehensive responses, enabling a seamless experience for
              complex tasks.
            </p>
          </div>

          <UserActionButton />
        </motion.div>
      </div>

      {/* Translator Section */}
      <div className="grid grid-cols-1 items-center justify-between gap-8 sm:grid-cols-2 md:grid-cols-2">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          viewport={{ once: true }}
          className="col-span-1"
        >
          <div className="flex items-center justify-start gap-8">
            <div className="flex flex-col items-start justify-start gap-1">
              <h3
                className={cn(
                  "leading-tight font-bold",
                  "text-xl sm:text-xl md:text-2xl",
                )}
              >
                Break Language Barriers <br /> with{" "}
                <span className="text-primary font-bold"> Translator</span>
              </h3>
            </div>
          </div>

          <div className="my-4">
            <p className="text-muted-foreground text-base">
              Working closely in partnership with the AI detector, you can
              verify and authenticate, distinguishing between human-written and
              AI-generated content with precision and confidence.
            </p>
          </div>
          <UserActionButton />
        </motion.div>
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.19 }}
          viewport={{ once: true }}
          className="col-span-1 pl-0 md:pl-20"
        >
          <VideoImage
            lightImage="/home/translator-light.webp"
            darkImage="/home/translator-dark.webp"
            width={400}
            height={400}
          />
        </motion.div>
      </div>
    </BgContainer>
  );
}
