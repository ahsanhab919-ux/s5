"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { useRegisterUserToBetaListMutation } from "@/redux/api/auth/authApi";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Building,
  GraduationCap,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const studentStories = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Computer Science Student → Software Engineer",
    company: "Google",
    university: "Stanford University",
    story:
      "Shothik AI didn't just help me write better papers - it taught me to think more clearly. The presentation agent helped me land my Google internship, and now I use similar AI workflows in my full-time role.",
    achievement: "Dream job at Google",
    metric: "GPA: 3.2 → 3.8",
    timeframe: "Senior Year",
    avatar: "SC",
    gradientFrom: "#3B82F6",
    gradientTo: "#9333EA",
  },
  {
    id: 2,
    name: "Marcus Johnson",
    role: "Graduate Student → Research Scientist",
    company: "MIT Research Lab",
    university: "MIT",
    story:
      "The AI agents handle research documentation and data analysis, letting me focus on breakthrough discoveries. My thesis advisor was amazed by my productivity increase.",
    achievement: "Published 3 research papers",
    metric: "Research output +300%",
    timeframe: "PhD Program",
    avatar: "MJ",
    gradientFrom: "#10B981",
    gradientTo: "#0D9488",
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    role: "Pre-med Student → Medical School",
    company: "Johns Hopkins",
    university: "Harvard University",
    story:
      "From organic chemistry reports to my medical school personal statement - Shothik AI helped me communicate complex ideas clearly and confidently.",
    achievement: "Accepted to Johns Hopkins",
    metric: "MCAT prep time -40%",
    timeframe: "Application Year",
    avatar: "ER",
    gradientFrom: "#F43F5E",
    gradientTo: "#EC4899",
  },
];

const universities = [
  "Stanford",
  "MIT",
  "Harvard",
  "Princeton",
  "Yale",
  "Columbia",
  "Berkeley",
  "Cornell",
];

export default function JobsTestimonialsSection() {
  const [showModal, setShowModal] = useState(false);

  const { componentRef, trackClick } = useComponentTracking(
    trackingList.REAL_RESULT,
    {
      viewThreshold: 0.3,
    },
  );

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success", // 'success', 'error', 'warning', 'info'
  });

  const [
    registerUserForBetaList,
    { isLoading: registerUserProcessing, isError: registerUserError },
  ] = useRegisterUserToBetaListMutation();

  const handleEmailSubmit = async (email) => {
    try {
      const result = await registerUserForBetaList({ email }).unwrap();


      // Success toast
      setToast({
        open: true,
        message: "Successfully registered for beta! We'll be in touch soon.",
        severity: "success",
      });

      // Close the modal
      setShowModal(false);
    } catch (error) {
      // Error toast
      setToast({
        open: true,
        message:
          error?.data?.message || "Registration failed. Please try again.",
        severity: "error",
      });
    }
  };

  const handleCloseToast = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <section ref={componentRef} className="min-h-screen py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Jobs-style Header */}
          <div className="mb-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-foreground mb-12 text-4xl font-light lg:text-6xl">
                Real Students.
              </h2>
              <h3 className="text-muted-foreground mb-16 text-3xl font-light lg:text-5xl">
                Real Results.
              </h3>
              <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
                From struggling with assignments to landing dream careers. See
                how Shothik AI transforms academic journeys.
              </p>
            </motion.div>
          </div>

          {/* Student Success Stories */}
          <div className="mb-16 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
            {studentStories.map((story, index) => (
              <div key={story.id} className="flex">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="flex flex-1"
                >
                  <Card className="rounded-[14px] p-8 shadow-[0_12px_24px_-4px_rgba(145,158,171,0.16)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1">
                    <CardContent className="p-0">
                      {/* Story Header */}
                      <div className="mb-6 flex items-start gap-8">
                        <Avatar
                          className="size-16 text-lg font-bold text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]"
                          style={{
                            background: `linear-gradient(135deg, ${story.gradientFrom} 0%, ${story.gradientTo} 100%)`,
                          }}
                        >
                          <AvatarFallback>{story.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h6 className="text-foreground mb-2 text-lg font-semibold">
                            {story.name}
                          </h6>
                          <p className="text-muted-foreground mb-2 text-sm">
                            {story.university}
                          </p>
                          <div className="flex items-center gap-2">
                            <GraduationCap
                              size={12}
                              className="text-muted-foreground"
                            />
                            <span className="text-muted-foreground text-xs">
                              {story.timeframe}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Achievement Badge */}
                      <div className="bg-muted border-border mb-6 rounded-xl border p-6">
                        <div className="mb-4 flex items-center gap-4">
                          <Award size={16} className="text-primary" />
                          <p className="text-foreground text-sm font-medium">
                            {story.achievement}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <TrendingUp size={16} className="text-primary" />
                          <p className="text-foreground text-sm">
                            {story.metric}
                          </p>
                        </div>
                      </div>

                      {/* Story Content */}
                      <p className="text-foreground mb-6 text-base leading-relaxed italic">
                        &quot;{story.story}&quot;
                      </p>

                      {/* Career Transition */}
                      <div className="bg-muted flex items-center justify-between rounded-xl p-6">
                        <div>
                          <p className="text-muted-foreground mb-2 text-xs">
                            Now at
                          </p>
                          <div className="flex items-center gap-2">
                            <Building size={16} className="text-foreground" />
                            <p className="text-foreground text-sm font-semibold">
                              {story.company}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={20} className="text-primary" />
                      </div>

                      {/* Star Rating */}
                      <div className="mt-6 flex justify-center">
                        <div className="flex gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className="fill-primary text-primary"
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            ))}
          </div>

          {/* University Trust Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <p className="text-muted-foreground mb-6 block text-sm font-medium tracking-wider">
                Trusted by students at top universities
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
