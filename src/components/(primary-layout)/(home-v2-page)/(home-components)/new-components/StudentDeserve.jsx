"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useAnimation, useInView } from "framer-motion";
import { CheckCircle, GraduationCap, Lightbulb } from "lucide-react";
import { useEffect, useRef } from "react";

const AnimatedTimelineItem = ({ children, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, delay: index * 0.2 },
      });
    }
  }, [isInView, controls, index]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 50 }}
      animate={controls}
      className="relative"
    >
      {children}
    </motion.div>
  );
};

const TimelineConnector = ({ index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ height: 0 }}
      animate={isInView ? { height: "100%" } : { height: 0 }}
      transition={{ duration: 0.8, delay: index * 0.3 }}
      className="bg-primary absolute top-12 left-6 z-0 w-0.5"
    />
  );
};

export default function StudentDeserve() {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto max-w-6xl px-4 pt-8 pb-10 md:pt-16 md:pb-20">
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-foreground mb-6 text-center text-3xl leading-tight font-bold sm:text-4xl md:text-5xl lg:text-6xl">
            &quot;Every Student Deserves{" "}
            <span className="text-primary">AI That Understands</span> Their
            Domain&quot;
          </h1>

          <p className="text-muted-foreground mx-auto mb-12 max-w-[600px] text-center text-base leading-relaxed md:text-lg">
            As a former PhD student who struggled with domain-specific writing,
            I built Shothik AI to solve the problem every academic faces:
            generic tools that don&apos;t understand your field.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 items-start gap-8 md:gap-12 lg:grid-cols-2">
          {/* Left Side - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={
              isHeroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }
            }
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative mb-8 overflow-hidden rounded-xl shadow-2xl lg:mb-0">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
                alt="AI Technology"
                className="h-[250px] w-full object-cover md:h-[350px]"
              />
              <div className="from-primary/10 to-primary/10 absolute inset-0 bg-gradient-to-br" />
            </div>

            {/* Testimonial Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={
                isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="mt-8 border shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-4">
                    <Avatar className="size-[60px] shrink-0">
                      <AvatarImage
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"
                        alt="Arif Rahman"
                      />
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-muted-foreground mb-4 leading-relaxed italic">
                        &quot;I spent countless nights rewriting papers because
                        generic paraphrasing tools couldn&apos;t handle medical
                        terminology. That frustration became our mission: build
                        AI that actually understands what you&apos;re writing
                        about.&quot;
                      </p>
                      <h3 className="text-foreground font-semibold">
                        Arif Rahman
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        PHD BIOMEDICAL ENGINEERING, FOUNDER & CEO
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Right Side - Timeline Features */}
          <div className="relative lg:pl-8">
            {/* Timeline Items */}
            <div className="relative">
              {/* Feature 1 */}
              <AnimatedTimelineItem index={0}>
                <div className="relative z-10 flex items-start gap-6">
                  <div className="bg-primary flex size-12 shrink-0 items-center justify-center rounded-full">
                    <GraduationCap className="text-primary-foreground size-6" />
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="text-foreground mb-2 text-lg font-semibold">
                      Built by Academics, for Academics
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Our team includes PhD researchers from medical, legal, and
                      engineering backgrounds.
                    </p>
                  </div>
                </div>
              </AnimatedTimelineItem>

              <TimelineConnector index={0} />

              {/* Feature 2 */}
              <AnimatedTimelineItem index={1}>
                <div className="relative z-10 flex items-start gap-6">
                  <div className="bg-primary flex size-12 shrink-0 items-center justify-center rounded-full">
                    <CheckCircle className="text-primary-foreground size-6" />
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="text-foreground mb-2 text-lg font-semibold">
                      Trusted by Top Universities
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Students at Harvard, MIT, Stanford already use Shothik AI
                      for their research papers.
                    </p>
                  </div>
                </div>
              </AnimatedTimelineItem>

              <TimelineConnector index={1} />

              {/* Feature 3 */}
              <AnimatedTimelineItem index={2}>
                <div className="relative z-10 flex items-start gap-6">
                  <div className="bg-primary flex size-12 shrink-0 items-center justify-center rounded-full">
                    <Lightbulb className="text-primary-foreground size-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground mb-2 text-lg font-semibold">
                      Continuous Innovation
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We ship new domain-specific features every week based on
                      student feedback.
                    </p>
                  </div>
                </div>
              </AnimatedTimelineItem>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row md:mt-16">
            <Button
              variant="default"
              size="lg"
              className="min-w-[200px] rounded-lg px-8 py-3 text-base font-semibold shadow-lg sm:min-w-auto"
            >
              Start your free trial
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary/5 min-w-[200px] rounded-lg px-8 py-3 text-base font-semibold sm:min-w-auto"
            >
              Read Our Story
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
