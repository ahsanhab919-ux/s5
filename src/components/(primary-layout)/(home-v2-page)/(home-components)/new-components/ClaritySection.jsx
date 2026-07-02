"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { cn } from "@/lib/utils";
import { useRegisterUserToBetaListMutation } from "@/redux/api/auth/authApi";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import EmailModal from "../EmailCollectModal";

export default function ClaritySection() {
  const { componentRef, trackClick } = useComponentTracking(
    trackingList.PROCESS_STEP,
  );

  const [showModal, setShowModal] = useState(false);

  const [
    registerUserForBetaList,
    { isLoading: registerUserProcessing, isError: registerUserError },
  ] = useRegisterUserToBetaListMutation();

  const handleStepClick = (idx) => {
    // trackFeatureClick will be added later
    // 

    // tracking
    trackClick(trackingList.PROCESS_STEP_CLICK, {
      step_id: `step-${idx}`,
      position: "process_step_section",
    });
  };

  const handleBenefitClick = (benefit) => {
    // trackFeatureClick will be added later
  };

  const handleEmailSubmit = async (email) => {
    try {
      const result = await registerUserForBetaList({ email }).unwrap();


      // Success toast
      toast.success(
        "Successfully registered for beta! We'll be in touch soon.",
      );

      // Close the modal
      setShowModal(false);
    } catch (error) {
      // Error toast
      toast.error(
        error?.data?.message || "Registration failed. Please try again.",
      );
    }
  };

  const steps = [
    {
      id: "upload",
      icon: "/home/cl-1.svg",
      title: "Upload Your Document",
      description:
        "Drag and drop any file up to 156 pages. We support Word docs, PDFs, and text files.",
      details: "Supports .docx, .pdf, .txt formats",
    },
    {
      id: "select",
      icon: "/home/cl-2.svg",
      title: "Choose Your Domain",
      description:
        "Select medical, law, engineering, or general academic writing for specialized AI processing.",
      details: "Domain-specific training data",
    },
    {
      id: "freeze",
      icon: "/home/cl-3.svg",
      title: "Freeze What Matters",
      description:
        "Mark important sentences, citations, or technical terms to keep them unchanged.",
      details: "Precision control over your content",
    },
    {
      id: "process",
      icon: "/home/cl-4.svg",
      title: "AI Processes Your Text",
      description:
        "Our specialized AI rewrites your content while maintaining academic integrity and domain accuracy.",
      details: "Average processing time: 2-3 seconds",
    },
    {
      id: "review",
      icon: "/home/cl-5.svg",
      title: "Plagiarism Check Included",
      description:
        "Built-in plagiarism detection ensures your improved text is original and safe to submit.",
      details: "Real-time originality verification",
    },
    {
      id: "download",
      icon: "/home/cl-6.svg",
      title: "Maintains original formatting",
      description:
        "Get your improved document in the same format, ready for submission to your professor.",
      details: "Maintains original formatting",
    },
  ];

  return (
    <>
      <section
        ref={componentRef}
        className="bg-background pt-8 pb-28 sm:pt-12 sm:pb-36 xl:pt-16 xl:pb-48"
      >
        <div className="container max-w-7xl sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mx-auto mb-12 max-w-3xl text-center md:mb-20">
              <Badge
                variant="outline"
                className="border-border bg-primary/10 text-primary mb-4 h-auto px-4 py-2 text-xs font-semibold lg:text-base"
              >
                <Zap className="size-4" />
                How It Works
              </Badge>

              <h2 className="text-foreground mb-6 text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">
                From Upload to{" "}
                <span className="text-primary block">Perfect Paper</span>
                <span className="text-muted-foreground mt-2 block text-2xl font-semibold sm:text-3xl lg:text-4xl">
                  in 6 Simple Steps
                </span>
              </h2>

              <p className="text-muted-foreground text-xl leading-relaxed font-normal">
                No complex setup. No learning curve. Just upload your document
                and let our domain-expert AI transform your writing while
                keeping what matters most.
              </p>
            </div>
          </motion.div>

          {/* How It Works Steps */}
          <div className="mb-12 grid grid-cols-1 gap-6 md:mb-20 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  className={cn(
                    "bg-muted/50 hover:border-primary/20 hover:bg-primary/5 h-full cursor-pointer rounded-2xl border-2 border-transparent p-6 transition-all lg:p-8",
                  )}
                  onClick={() => handleStepClick(index + 1)}
                >
                  {/* Step number and icon */}
                  <div className="mb-4 flex items-center justify-between md:mb-6 xl:mb-8">
                    <div className="flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 xl:h-11 xl:w-11">
                      <img
                        src={step.icon}
                        alt={step.title}
                        className="h-7 w-7 sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-10 lg:w-10 xl:h-11 xl:w-11"
                      />
                    </div>
                    <div className="flex flex-row items-end">
                      <span
                        className={cn(
                          "text-primary text-3xl leading-[0.7] font-black transition-colors sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl",
                        )}
                      >
                        {index + 1}
                      </span>
                      {/* Connection line for larger screens */}
                      <div className="bg-primary h-0.5 w-6 lg:w-7 xl:w-8" />
                    </div>
                  </div>

                  <h3 className="text-foreground mb-3 text-lg font-bold md:text-lg lg:text-xl xl:text-2xl">
                    {step.title}
                  </h3>

                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  <p className="text-primary text-sm font-medium">
                    {step.details}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex w-full justify-center">
            <Button
              // data-umami-event="Get early access"
              data-rybbit-event="Get early access"
              size="lg"
              onClick={() => {
                setShowModal(true);

                // tracking
                trackClick("cta_button", {
                  button_text: "Get early access",
                  position: "process_step_cta",
                });
              }}
              className="max-w-fit rounded-lg px-6 py-3 font-normal"
            >
              Get early access
            </Button>
          </div>
        </div>
      </section>

      <EmailModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleEmailSubmit}
      />
    </>
  );
}
