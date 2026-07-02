"use client";

import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { motion } from "framer-motion";
import { Brain, FileText, Globe, Shield } from "lucide-react";

const benefits = [
  {
    id: "domain_expert",
    icon: Brain,
    title: "Domain Expert AI",
    description:
      "Unlike generic tools, our AI understands medical terminology, legal concepts, and engineering principles.",
    stat: "98.7% accuracy",
  },
  {
    id: "plagiarism_safe",
    icon: Shield,
    title: "Plagiarism Protection",
    description:
      "Built-in detection ensures every sentence is original and safe for academic submission.",
    stat: "0% plagiarism rate",
  },
  {
    id: "large_files",
    icon: FileText,
    title: "Handle Large Documents",
    description:
      "Process entire dissertations, research papers, and thesis documents up to 156 pages.",
    stat: "156 pages max",
  },
  {
    id: "multilingual",
    icon: Globe,
    title: "100+ Languages",
    description:
      "Support for international students writing in English as a second language.",
    stat: "100+ languages",
  },
];

export default function KeyBenefits() {
  const { componentRef } = useComponentTracking(
    trackingList.WHY_STUDENT_CHOOSE_SECTION,
  );

  const handleBenefitClick = (id) => {
    // Placeholder handler - can be implemented as needed
  };

  return (
    <div className="mx-auto max-w-7xl pb-4 sm:pb-6 xl:pb-8">
      <motion.div
        ref={componentRef}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="from-primary/5 via-muted to-primary/5 rounded-3xl bg-gradient-to-br p-4 lg:p-6">
          <div className="mb-6 text-center">
            <h3 className="text-foreground mb-2 text-2xl font-bold sm:text-3xl">
              Why Students Choose Shothik AI
            </h3>
            <p className="text-muted-foreground mx-auto max-w-[512px] text-lg font-normal">
              Built specifically for academic writing with features that generic
              paraphrasing tools simply don&apos;t offer.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={benefit.id} className="col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div
                    onClick={() => handleBenefitClick(benefit.id)}
                    className="cursor-pointer text-center transition-transform hover:scale-105"
                  >
                    <div className="bg-card mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-shadow hover:shadow-lg">
                      <benefit.icon size={32} className="text-primary" />
                    </div>

                    <h6 className="text-foreground mb-1 text-lg font-bold">
                      {benefit.title}
                    </h6>

                    <p className="text-muted-foreground mb-1.5 text-sm leading-relaxed">
                      {benefit.description}
                    </p>

                    <p className="text-primary text-3xl font-black">
                      {benefit.stat}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
