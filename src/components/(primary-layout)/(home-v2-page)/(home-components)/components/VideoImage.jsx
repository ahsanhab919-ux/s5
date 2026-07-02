"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Image from "next/image";
import { useSelector } from "react-redux";

const VideoImage = ({ lightImage, darkImage, width, height }) => {
  const { theme } = useSelector((state) => state.settings);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={cn(
        "relative z-0 overflow-hidden rounded-[70px]",
        "h-[380px] lg:h-[480px]",
        "w-[300px] lg:w-[400px]",
      )}
    >
      <Image
        src={theme === "dark" ? darkImage : lightImage}
        className="h-full max-w-full rounded-[70px] object-cover"
        alt="Hero video"
        unoptimized
        width={width}
        height={height}
      />
    </motion.div>
  );
};

export default VideoImage;
