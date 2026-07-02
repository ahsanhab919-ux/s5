"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const ViewMoreButton = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        router.push("/b2b");
      }}
      variant="default"
      size="sm"
      className={cn("text-[0.9rem] font-normal")}
    >
      View More
      <ChevronRight />
    </Button>
  );
};

export default ViewMoreButton;
