"use client";

import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Box as BoxIcon, Building2, CheckCircle, Globe } from "lucide-react";
import Image from "next/image";

const timelineData = [
  {
    year: "2022",
    title: "Company Founded",
    description: "Started with a vision to democratize AI in fintech",
    icon: CheckCircle,
    bgColor: "#f1f8e9",
    cardIcon: "/journey/j-1.svg",
  },
  {
    year: "2023",
    title: "First AI Agent Deployed",
    description: "Launched our flagship risk assessment AI agent",
    icon: BoxIcon,
    bgColor: "#ffffff",
    cardIcon: "/journey/j-2.svg",
  },
  {
    year: "2024",
    title: "500+ Institutions",
    description: "Reached milestone of serving 500+ financial institutions",
    icon: Building2,
    bgColor: "#f1f8e9",
    cardIcon: "/journey/j-3.svg",
  },
  {
    year: "2025",
    title: "Global Expansion",
    description:
      "Expanding to serve financial institutions across 25+ countries",
    icon: Globe,
    bgColor: "#ffffff",
    cardIcon: "/journey/j-4.svg",
  },
];

const JourneyTimeline = () => {
  const { componentRef } = useComponentTracking(trackingList.JOURNEY_SECTION);

  return (
    <section
      ref={componentRef}
      className={cn("pt-4 sm:pt-6 xl:pt-8", "pb-14 sm:pb-18 xl:pb-24")}
    >
      <div className={cn("mx-auto max-w-7xl", "px-4 sm:px-6 lg:px-8")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div
            className={cn(
              "mx-auto max-w-[600px] text-center",
              "mb-10 md:mb-20",
            )}
          >
            <h2
              className={cn(
                "text-[2rem] sm:text-[2.5rem] lg:text-[3rem]",
                "text-foreground font-bold",
                "mb-6 leading-[1.2]",
              )}
            >
              Our Journey
            </h2>

            <p
              className={cn(
                "text-[0.95rem] md:text-base lg:text-[1.25rem]",
                "text-muted-foreground",
                "leading-[1.6] font-normal",
              )}
            >
              From startup to industry leader, see how we&apos;ve grown to
              become the trusted AI platform for financial institutions
              worldwide.
            </p>
          </div>
        </motion.div>

        <div className={cn("relative mx-auto max-w-[800px]")}>
          {/* Timeline line - positioned absolutely */}
          <div
            className={cn(
              "absolute top-0 bottom-20 left-[9px]",
              "bg-border w-[3px] rounded-full",
              "z-[1] h-full",
            )}
          />

          {/* Timeline items */}
          <div
            className={cn(
              "flex flex-col",
              "gap-8 lg:gap-10 xl:gap-12",
              "relative",
            )}
          >
            {timelineData?.map((data, index) => (
              <div key={index} className={cn("relative flex items-start")}>
                {/* Timeline dot */}
                <div
                  className={cn(
                    "relative z-[2] mt-1",
                    "top-5 sm:top-6 md:top-7 lg:top-[30px] xl:top-10",
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full",
                      "bg-primary",
                      "flex items-center justify-center",
                      "border-background border-4",
                      "shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "relative z-[2] mt-1",
                    "top-6 sm:top-6 md:top-7 lg:top-[30px] xl:top-10",
                    "ml-[10px] sm:ml-[34px] md:ml-10 lg:ml-[60px] xl:ml-[70px]",
                    "mr-0 md:mr-[10px]",
                  )}
                >
                  <p
                    className={cn(
                      "text-xs lg:text-sm xl:text-base",
                      "text-muted-foreground",
                      "mb-1 leading-[1.3]",
                    )}
                  >
                    {data.year}
                  </p>
                </div>
                {/* Content card */}
                <div
                  className={cn(
                    "ml-16 flex-1",
                    "p-4 md:p-6 xl:p-8",
                    "bg-card border-border border",
                    "rounded-xl lg:rounded-2xl",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
                    "transition-all duration-300 ease-in-out",
                    "flex flex-col sm:flex-row",
                    "gap-3 lg:gap-4 xl:gap-5",
                    "items-center sm:items-start",
                    "hover:bg-accent hover:border-accent",
                    "hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
                    "hover:-translate-y-0.5",
                  )}
                >
                  {/* Icon container */}
                  <div
                    className={cn(
                      "flex items-center justify-center",
                      "p-3 lg:p-4 xl:p-5",
                      "bg-background rounded-xl",
                      "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                      "shrink-0",
                      "min-w-[52px] lg:min-w-[60px] xl:min-w-[68px]",
                      "min-h-[52px] lg:min-h-[60px] xl:min-h-[68px]",
                      "transition-all duration-300 ease-in-out",
                      "hover:bg-background",
                      "hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]",
                    )}
                  >
                    <Image
                      src={data?.cardIcon}
                      alt={data?.title}
                      width={28}
                      height={28}
                      className="h-auto max-h-[28px] w-auto max-w-[28px]"
                    />
                  </div>

                  {/* Text content */}
                  <div className={cn("flex flex-1 flex-col")}>
                    <h3
                      className={cn(
                        "text-base lg:text-lg xl:text-xl",
                        "text-foreground font-semibold",
                        "mb-2 leading-[1.3]",
                        "text-center sm:text-left",
                      )}
                    >
                      {data.title}
                    </h3>
                    <p
                      className={cn(
                        "text-sm lg:text-base",
                        "text-muted-foreground",
                        "leading-[1.6]",
                        "text-center sm:text-left",
                      )}
                    >
                      {data.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneyTimeline;
