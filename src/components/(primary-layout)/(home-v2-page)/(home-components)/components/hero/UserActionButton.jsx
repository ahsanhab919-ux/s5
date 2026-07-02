"use client";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

const UserActionButton = ({ setShowModal, trackClick }) => {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const packageName = user?.package;
  // const userMsg = !packageName ? "Sign up for free" : "Explore the Features";
  const userMsg = "Join the waitlist";

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
    >
      <Button
        className="h-11 rounded-md px-4"
        onClick={() => {
          // if (user?.email) {
          //   router.push("/paraphrase");
          // } else {
          //   dispatch(setShowLoginModal(true));
          // }
          // this was before, don't remove it 👆

          setShowModal(true);

          // tracking
          trackClick("cta_button", {
            button_text: userMsg,
            position: "hero_section",
          });
        }}
      >
        <span className="text-base leading-6 tracking-tight">{userMsg}</span>
      </Button>
    </motion.div>
  );
};

export default UserActionButton;
