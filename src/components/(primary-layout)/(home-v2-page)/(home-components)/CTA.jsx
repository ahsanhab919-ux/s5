import * as motion from "motion/react-client";
import Caption from "./components/cta/Caption";
import CTAImage from "./components/cta/CTAImage";
import UserActionButton from "./components/hero/UserActionButton";

export default function CTA() {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.h2
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-center text-[1.8rem] leading-tight font-bold sm:text-[2rem] md:text-[3rem] lg:text-[3rem]"
      >
        Get started with <span className="text-primary">Shothik AI</span> today
      </motion.h2>

      <motion.p
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
        className="text-muted-foreground max-w-prose text-center text-base"
      >
        <Caption /> and take the first step towards a more efficient,
        productive, and effective future.
      </motion.p>

      <UserActionButton />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="relative h-[150px] w-full sm:h-[250px] md:h-[300px] lg:h-[430px] xl:h-[430px]"
      >
        <CTAImage />
      </motion.div>
    </div>
  );
}
