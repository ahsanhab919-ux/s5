"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { motion } from "framer-motion";
import { Brain, Languages, Palette, Rocket, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Write Like You, Not a Robot",
    description:
      "Transform AI-generated text into authentic writing that sounds like your natural voice. Pass every human review.",
  },
  {
    icon: Palette,
    title: "Freeze What Matters",
    description:
      "Protect your critical ideas, citations, and technical terms while improving everything else. You control what changes.",
  },
  {
    icon: Zap,
    title: "From Panic to Perfect",
    description:
      "Turn hours of rewriting into minutes. Meet every deadline without sacrificing quality or pulling all-nighters.",
  },
  {
    icon: Languages,
    title: "Research in Any Language",
    description:
      "Access global research in 100+ languages. Write your papers in perfect English, regardless of your background.",
  },
  {
    icon: Shield,
    title: "Never Get Flagged Again",
    description:
      "Your work passes every plagiarism check and AI detector. Submit with complete confidence.",
  },
  {
    icon: Rocket,
    title: "Academic to Professional",
    description:
      "One platform that grows with you from student assignments to career success. Build skills that last.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function FeaturesSection() {
  const { componentRef } = useComponentTracking(trackingList.FEATURE_SECTION);

  return (
    <section
      ref={componentRef}
      className="pt-4 pb-8 sm:pt-6 sm:pb-12 xl:pt-8 xl:pb-15"
    >
      <div className="mx-auto max-w-screen-lg px-4 sm:px-6 md:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Header Section */}
          <div className="mx-auto mb-4 max-w-4xl text-center sm:mb-6 md:mb-10">
            <motion.div variants={itemVariants}>
              <h2 className="text-foreground mb-4 text-[2rem] leading-[1.2] font-extrabold sm:text-[2.5rem] md:text-[3rem]">
                Powerful Features for Better Writing
              </h2>
            </motion.div>

            <motion.div variants={itemVariants}>
              <p className="text-muted-foreground mx-auto max-w-[42rem] text-[1.125rem] leading-7 md:text-[1.25rem] md:leading-8">
                Discover how Shothik AI transforms your writing process with
                intelligent features designed for creators, marketers, and
                professionals.
              </p>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-4 lg:grid-cols-3">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="h-full"
                >
                  <Card className="h-full rounded-2xl p-4 transition-all sm:p-6">
                    <CardContent className="p-0">
                      <div className="bg-muted mb-3 inline-flex h-12 w-12 items-center justify-center rounded-md">
                        <IconComponent className="text-foreground h-6 w-6" />
                      </div>

                      <h3 className="text-foreground mb-2 text-[1.125rem] leading-snug font-bold sm:text-[1.25rem]">
                        {feature.title}
                      </h3>

                      <p className="text-muted-foreground text-sm leading-6 sm:text-base">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
