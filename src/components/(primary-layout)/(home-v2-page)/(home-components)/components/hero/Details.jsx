"use client";

import { useRegisterUserToBetaListMutation } from "@/redux/api/auth/authApi";
import * as motion from "motion/react-client";
import { useState } from "react";
import { toast } from "react-toastify";
import EmailModal from "../../EmailCollectModal";
import AnimatedText from "./AnimatedText";
import UserActionButton from "./UserActionButton";

const Details = ({ trackClick }) => {
  const [showModal, setShowModal] = useState(false);

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
    }
  };

  return (
    <>
      <div className="relative z-[12] flex w-full flex-col items-center xl:gap-3">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-foreground text-center text-[2.5em] leading-none font-bold tracking-tight sm:text-[3.25em] md:text-[2.75em] lg:text-[3.75em] xl:text-[4.75em]">
            <AnimatedText />
            {/* <span
            style={{
              fontWeight: 700,
              color: "#00A76F",
              background: "linear-gradient(135deg, #00A76F 40%, #3A7A69 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            before you do.
          </span> */}
          </h2>
          {/* <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            letterSpacing: "-9%",
            color: "#00A76F",
            background: "linear-gradient(135deg, #00A76F 40%, #3A7A69 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        ></Typography> */}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-muted-foreground my-2 max-w-[800px] text-center text-base xl:text-[1.25em]">
            {/* AI that understands your thoughts before you do. Paraphrasing, */}
            {/* Humanizer, Grammer Fix, and AI Agents at your service.  */}
            Shothik is a general ai agent that understands your thoughts before
            you do. It doesn&apos;t just think, it delivers results.
            Paraphrasing, Humanizer, Grammer Fix, and AI Agents at your service.
          </p>
        </motion.div>

        {/* <Box
        component={motion.div}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        sx={{
          display: "flex",
          alignItems: "start",
          gap: 1,
          flexDirection: {
            xs: "column",
            sm: "column",
            md: "row",
            lg: "row",
            xl: "row",
          },
          marginBottom: "16px",
        }}
      >
        <Rating value={5} readOnly color="#00A76F" />
        <Typography sx={{ color: "text.secondary" }}>
          Rated&nbsp;4.9/5&nbsp;| Based on&nbsp;{" "}
          <span style={{ color: "#00A76F", fontWeight: 600 }}>400,000+</span>{" "}
          &nbsp;happy clients
        </Typography>
      </Box> */}
        <UserActionButton setShowModal={setShowModal} trackClick={trackClick} />
      </div>

      {/* Email collect modal */}
      <EmailModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleEmailSubmit}
      />
    </>
  );
};

export default Details;
