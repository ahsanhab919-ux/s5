"use client";

import { Button } from "@/components/ui/button";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { useRegisterUserToBetaListMutation } from "@/redux/api/auth/authApi";
import { motion } from "framer-motion";
import { CheckCircle, Globe, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import EmailModal from "../EmailCollectModal";

export default function CTASection() {
  const [showModal, setShowModal] = useState(false);

  const { componentRef, trackClick } = useComponentTracking(
    trackingList.START_WRITING_SECTION,
  );

  const [
    registerUserForBetaList,
    { isLoading: registerUserProcessing, isError: registerUserError },
  ] = useRegisterUserToBetaListMutation();

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

  return (
    <>
      <section
        ref={componentRef}
        className="from-primary via-primary/90 to-primary/80 relative bg-gradient-to-r py-12 sm:py-20 md:py-40"
      >
        <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              {/* Main Heading */}
              <h1 className="text-primary-foreground mb-8 text-[2.25rem] leading-tight font-bold sm:text-5xl">
                Stop Struggling. Start Succeeding.
              </h1>

              {/* Subtitle */}
              <p className="text-primary-foreground/90 mx-auto mb-16 max-w-3xl text-xl leading-relaxed">
                Leave it to us. Your next A+ paper is just 60 seconds away. Join
                students who&apos;ve already transformed their academic success.
              </p>

              {/* CTA Button Section */}
              <div className="mx-auto mb-12 max-w-md">
                <div className="relative mb-12">
                  {/* Enhanced CTA Button */}
                  <Button
                    // data-umami-event="Start Writing Better Papers Now"
                    data-rybbit-event="Start Writing Better Papers Now"
                    onClick={() => {
                      setShowModal(true);

                      // tracking
                      trackClick(trackingList.CTA_BUTTON, {
                        button_text: "Start Writing Better Papers Now",
                        postion: "start_writing_section",
                      });
                    }}
                    className="bg-background text-primary hover:bg-background/90 relative h-16 w-full overflow-hidden px-8 text-lg font-bold shadow-lg"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      Start Writing Better Papers Now
                    </span>
                  </Button>

                  {/* Scarcity indicator */}
                  <div className="bg-destructive text-destructive-foreground absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap">
                    457 spots left this month
                  </div>
                </div>
                {/* Guarantee text */}
                <div className="text-center">
                  <p className="text-primary-foreground/80 text-sm">
                    No credit card • 14-day guarantee • Instant access
                  </p>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="text-primary-foreground/80 mb-8 flex flex-col items-center justify-center gap-3 text-sm sm:flex-row sm:gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span className="text-sm">14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={16} />
                  <span className="text-sm">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={16} />
                  <span className="text-sm">Available worldwide</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="flex flex-wrap items-center justify-center gap-4 opacity-80">
                <p className="text-primary-foreground/70 text-xs">
                  Accepted payments:
                </p>
                <div className="text-primary-foreground/70 flex items-center gap-2 text-xs">
                  <span>Visa</span>
                  <span>•</span>
                  <span>Mastercard</span>
                  <span>•</span>
                  <span>bKash</span>
                  <span>•</span>
                  <span>UPI</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* email collect modal */}
      <EmailModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleEmailSubmit}
      />
    </>
  );
}
