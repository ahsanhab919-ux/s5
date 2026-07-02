import { cn } from "@/lib/utils";
import Image from "next/image";

const CTAImage = ({ className }) => {
  return (
    <div className={cn("relative overflow-hidden rounded-[10px]", className)}>
      <Image
        src={"/home/cta-light.png"}
        alt="Sample illustration"
        layout="fill"
        objectFit="contain"
        className="inline-block rounded-[10px] dark:hidden"
      />
      <Image
        src={"/home/cta-dark.png"}
        alt="Sample illustration"
        layout="fill"
        objectFit="contain"
        className="hidden rounded-[10px] dark:inline-block"
      />
    </div>
  );
};

export default CTAImage;
