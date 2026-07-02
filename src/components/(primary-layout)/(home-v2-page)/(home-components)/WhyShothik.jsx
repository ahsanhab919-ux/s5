"use client";
import { cn } from "@/lib/utils";
import * as motion from "motion/react-client";
import Image from "next/image";
import BgContainer from "./components/hero/BgContainer";

export default function WhyShothik() {
  return (
    <BgContainer
      className={cn("bg-primary/8", "py-8 md:py-16", "px-4 sm:px-6 md:px-12")}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2
          className={cn(
            "text-center font-bold",
            "text-[1.8rem] sm:text-[2rem] md:text-[3rem] lg:text-[3rem]",
            "mb-4 sm:mb-8 md:mb-12 lg:mb-16 xl:mb-20",
            "mt-4 sm:mt-12 md:mt-16 lg:mt-16 xl:mt-20",
          )}
        >
          Why Choose{" "}
          <span
            className={cn(
              "from-primary via-primary to-primary/70 bg-gradient-to-br",
              "bg-clip-text text-transparent",
            )}
          >
            Shothik AI ?
          </span>
        </h2>
      </motion.div>

      {/* Boost productivity */}
      <div
        className={cn(
          "grid grid-cols-12 gap-4 sm:gap-6 md:gap-8",
          "items-center justify-center",
          "mb-8 sm:mb-10 md:mb-12",
        )}
      >
        <div className="col-span-12 sm:col-span-6">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p
              className={cn(
                "text-muted-foreground font-bold",
                "ml-0.5",
                "text-[20px] sm:text-[24px] md:text-[28px]",
                "my-4",
              )}
            >
              01
            </p>
            <h3
              className={cn(
                "font-bold",
                "text-[1.2rem] sm:text-[1.3rem] md:text-[2rem]",
                "leading-tight",
              )}
            >
              Boost Productivity
            </h3>
          </motion.div>
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className={cn("text-muted-foreground", "mt-4")}>
              Streamline your workflow with AI-powered tools that handle complex
              tasks, letting you focus on what matters most.
            </p>
          </motion.div>
        </div>
        <div
          className={cn(
            "col-span-12 sm:col-span-6",
            "relative mb-8 sm:mb-0",
            "flex items-center justify-center",
          )}
        >
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <Image
              src="/home/why-1.png"
              alt="AI Detector Illustration"
              className={cn("mx-auto h-auto w-full max-w-[400px]")}
              width={400}
              height={400}
            />
          </motion.div>
        </div>
      </div>

      {/* Perfect Your Language */}
      <div
        className={cn(
          "grid grid-cols-12 gap-4 sm:gap-6 md:gap-8",
          "items-center justify-center",
          "mb-8 sm:mb-10 md:mb-12",
        )}
      >
        <div
          className={cn(
            "col-span-12 sm:col-span-6",
            "order-2 sm:order-1",
            "mb-8 sm:mb-0",
            "flex items-center justify-center",
          )}
        >
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Image
              width={400}
              height={400}
              src="/home/why-2.png"
              alt="Bypass GPT"
              className={cn("mx-auto h-auto w-full max-w-[400px]")}
            />
          </motion.div>
        </div>
        <div className={cn("col-span-12 sm:col-span-6", "order-1 sm:order-2")}>
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p
              className={cn(
                "text-muted-foreground font-bold",
                "ml-0.5",
                "text-[20px] sm:text-[24px] md:text-[28px]",
                "my-4",
              )}
            >
              02
            </p>
            <h3
              className={cn(
                "font-bold",
                "text-[1.2rem] sm:text-[1.3rem] md:text-[2rem]",
                "leading-tight",
              )}
            >
              Perfect Your Language
            </h3>
          </motion.div>
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <p className={cn("text-muted-foreground", "mt-4")}>
              From grammar fixes to flawless translations, Shothik.ai ensures
              every word you write is polished and impactful.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tailored to Your Needs */}
      <div
        className={cn(
          "grid grid-cols-12 gap-4 sm:gap-6 md:gap-8",
          "items-center justify-center",
          "mb-8 sm:mb-10 md:mb-12",
        )}
      >
        <div className="col-span-12 sm:col-span-6">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p
              className={cn(
                "text-muted-foreground font-bold",
                "ml-0.5",
                "text-[20px] sm:text-[22px] md:text-[24px]",
                "my-4",
              )}
            >
              03
            </p>
            <h3
              className={cn(
                "font-bold",
                "text-[1.2rem] sm:text-[1.3rem] md:text-[2rem]",
                "leading-tight",
              )}
            >
              Tailored to Your Needs
            </h3>
          </motion.div>
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className={cn("text-muted-foreground", "mt-4")}>
              No matter your industry or goal, our features adapt to your unique
              requirements, making Shothik.ai your versatile language partner.
            </p>
          </motion.div>
        </div>
        <div
          className={cn(
            "col-span-12 sm:col-span-6",
            "relative mb-8 sm:mb-0",
            "flex items-center justify-center",
          )}
        >
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <Image
              width={400}
              height={400}
              src="/home/why-3.png"
              alt="AI Detector Illustration"
              className={cn("mx-auto h-auto w-full max-w-[400px]")}
            />
          </motion.div>
        </div>
      </div>
    </BgContainer>
  );
}
