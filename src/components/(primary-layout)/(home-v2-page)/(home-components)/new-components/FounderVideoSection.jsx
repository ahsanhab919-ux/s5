"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Award,
  MessageSquareQuote,
  Pause,
  Play,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";

export default function FounderVideoSection() {
  const { componentRef, trackClick } = useComponentTracking(
    trackingList.BUSINESS_SECTION,
    {
      viewThreshold: 0.3,
    },
  );

  const [isPlaying, setIsPlaying] = useState(false);

  // Mock analytics functions
  const trackFeatureClick = (action, section) => {
  };

  const trackAgentInteraction = (interaction) => {
  };

  const handleVideoPlay = () => {
    setIsPlaying(!isPlaying);
    trackFeatureClick(
      isPlaying ? "video_paused" : "video_played",
      "founder_section",
    );
  };

  const handleCtaClick = (ctaType) => {
    trackFeatureClick(`founder_${ctaType}_clicked`, "founder_section");
  };

  const handleStoryClick = () => {
    trackFeatureClick("read_story_clicked", "founder_section");
  };

  const handleVideoStats = (action) => {
    trackFeatureClick(`video_${action}`, "founder_section");
  };

  return (
    <section
      ref={componentRef}
      className={cn(
        "pb-12 sm:pb-16 md:pb-20 lg:pb-24",
        "pt-24 sm:pt-28 md:pt-36 lg:pt-48",
        "min-h-auto",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Video */}
          <div className="col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg",
                  "bg-foreground shadow-2xl",
                )}
              >
                {/* Video placeholder/thumbnail */}
                <div
                  className={cn(
                    "relative flex aspect-video items-center justify-center",
                    "from-muted to-foreground bg-gradient-to-br",
                  )}
                >
                  {!isPlaying ? (
                    <>
                      {/* Founder photo/thumbnail overlay */}
                      <div
                        className={cn(
                          "absolute inset-0",
                          "from-primary/20 to-primary/20 bg-gradient-to-br",
                        )}
                      />
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          onClick={handleVideoPlay}
                          className={cn(
                            "relative z-10",
                            "h-14 w-14 sm:h-20 sm:w-20",
                            "flex items-center justify-center",
                            "bg-background/90 text-foreground rounded-full",
                            "shadow-2xl transition-all duration-300",
                            "hover:bg-background",
                            "hover:[&_.play-icon]:text-primary",
                          )}
                        >
                          <Play
                            className={cn(
                              "play-icon h-6 w-6 sm:h-8 sm:w-8",
                              "text-muted-foreground ml-0.5",
                              "transition-colors duration-300",
                            )}
                          />
                        </button>
                      </motion.div>

                      {/* Founder name overlay */}
                      <div
                        className={cn(
                          "absolute bottom-4 left-4 sm:bottom-6 sm:left-6",
                          "text-background",
                        )}
                      >
                        <h6 className={cn("text-base font-bold sm:text-xl")}>
                          Arif Rahman
                        </h6>
                        <p
                          className={cn("text-sm sm:text-base", "text-primary")}
                        >
                          Founder & CEO, Shothik AI
                        </p>
                      </div>
                    </>
                  ) : (
                    <div
                      className={cn(
                        "absolute inset-0",
                        "flex items-center justify-center",
                        "bg-muted",
                      )}
                    >
                      <div
                        className={cn(
                          "text-background text-center",
                          "p-8 sm:p-16",
                        )}
                      >
                        <div
                          className={cn(
                            "mx-auto mb-4",
                            "h-12 w-12 sm:h-16 sm:w-16",
                            "flex items-center justify-center",
                            "bg-primary rounded-full",
                          )}
                        >
                          <Pause className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                        <h6
                          className={cn(
                            "mb-4 font-bold",
                            "text-base sm:text-xl",
                          )}
                        >
                          Video Playing...
                        </h6>
                        <p
                          className={cn(
                            "mb-4",
                            "text-sm sm:text-base",
                            "text-muted-foreground",
                          )}
                        >
                          In a real deployment, this would show the founder
                          video
                        </p>
                        <Button
                          onClick={handleVideoPlay}
                          variant="ghost"
                          className={cn(
                            "text-primary underline",
                            "hover:text-primary/90",
                          )}
                        >
                          Click to pause
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video controls bar */}
                <div
                  className={cn(
                    "absolute right-0 bottom-0 left-0",
                    "from-foreground/80 bg-gradient-to-t to-transparent",
                    "p-4 sm:p-8",
                  )}
                >
                  <div className={cn("flex items-center", "gap-4 sm:gap-8")}>
                    <button
                      onClick={handleVideoPlay}
                      className={cn(
                        "h-8 w-8 sm:h-10 sm:w-10",
                        "flex items-center justify-center",
                        "bg-background/20 text-background rounded",
                        "transition-colors",
                        "hover:bg-background/30",
                      )}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Play className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                    <div
                      className={cn("h-1 flex-1 rounded", "bg-background/20")}
                    >
                      <div className={cn("h-1 w-1/3 rounded", "bg-primary")} />
                    </div>
                    <p className={cn("text-background", "text-xs sm:text-sm")}>
                      2:47
                    </p>
                  </div>
                </div>
              </div>

              {/* Video stats */}
              <div
                className={cn(
                  "flex items-center",
                  "gap-6 sm:gap-12",
                  "mt-6",
                  "text-sm",
                )}
              >
                <Button
                  onClick={() => handleVideoStats("views_clicked")}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto min-w-0 p-0",
                    "text-xs sm:text-sm",
                    "text-muted-foreground",
                    "hover:text-primary",
                  )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  47,291 views
                </Button>
                <Button
                  onClick={() => handleVideoStats("rating_clicked")}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto min-w-0 p-0",
                    "text-xs sm:text-sm",
                    "text-muted-foreground",
                    "hover:text-primary",
                  )}
                >
                  <Star className="mr-2 h-4 w-4 fill-yellow-500 text-yellow-500" />
                  4.9 rating
                </Button>
                <Button
                  onClick={() => handleVideoStats("feature_clicked")}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto min-w-0 p-0",
                    "text-xs sm:text-sm",
                    "text-muted-foreground",
                    "hover:text-primary",
                  )}
                >
                  <Award className="text-primary mr-2 h-4 w-4" />
                  Featured by TechCrunch
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right: Content */}
          <div className="col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className={cn("flex flex-col", "gap-8 sm:gap-12 md:gap-16")}>
                {/* Badge */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "self-start",
                    "h-auto px-4 py-2",
                    "text-sm sm:text-base",
                    "bg-primary/10 text-primary",
                    "border-primary/20 border",
                  )}
                >
                  <MessageSquareQuote className="mr-1 h-4 w-4" />
                  Message from our Founder
                </Badge>

                {/* Headline */}
                <div>
                  <h2
                    className={cn(
                      "leading-tight font-bold",
                      "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
                      "mb-4 sm:mb-8",
                      "text-foreground",
                    )}
                  >
                    &quot;Every Student Deserves{" "}
                    <span className="text-primary block">
                      AI That Understands
                    </span>
                    Their Domain&quot;
                  </h2>

                  <p
                    className={cn(
                      "text-base sm:text-lg md:text-xl",
                      "leading-relaxed font-normal",
                      "text-muted-foreground",
                    )}
                  >
                    As a former PhD student who struggled with domain-specific
                    writing, I built Shothik AI to solve the problem every
                    academic faces: generic tools that don&apos;t understand
                    your field.
                  </p>
                </div>

                {/* Key points */}
                <div className="flex flex-col gap-6">
                  {[
                    {
                      dotClass: "bg-primary",
                      containerClass: "bg-primary/10",
                      title: "Built by Academics, for Academics",
                      description:
                        "Our team includes PhD researchers from medical, legal, and engineering backgrounds.",
                    },
                    {
                      dotClass: "bg-blue-500",
                      containerClass: "bg-blue-500/10",
                      title: "Trusted by Top Universities",
                      description:
                        "Students at Harvard, MIT, Stanford already use Shothik AI for their research papers.",
                    },
                    {
                      dotClass: "bg-purple-500",
                      containerClass: "bg-purple-500/10",
                      title: "Continuous Innovation",
                      description:
                        "We ship new domain-specific features every week based on student feedback.",
                    },
                  ].map((point, index) => (
                    <div
                      key={index}
                      className={cn("flex items-start", "gap-4 sm:gap-8")}
                    >
                      <div
                        className={cn(
                          "h-6 w-6 sm:h-8 sm:w-8",
                          "flex items-center justify-center rounded-full",
                          "mt-0.5 shrink-0",
                          point.containerClass,
                        )}
                      >
                        <div
                          className={cn(
                            "h-2 w-2 sm:h-3 sm:w-3",
                            "rounded-full",
                            point.dotClass,
                          )}
                        />
                      </div>
                      <div>
                        <h6
                          className={cn(
                            "mb-1 font-semibold",
                            "text-base sm:text-lg",
                            "text-foreground",
                          )}
                        >
                          {point.title}
                        </h6>
                        <p
                          className={cn(
                            "text-sm sm:text-base",
                            "leading-relaxed",
                            "text-muted-foreground",
                          )}
                        >
                          {point.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
