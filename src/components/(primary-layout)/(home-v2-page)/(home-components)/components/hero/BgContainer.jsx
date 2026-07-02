"use client";
import { cn } from "@/lib/utils";
import React from "react";

const BgContainer = React.forwardRef(function BgContainer(
  { children, className },
  ref,
) {
  return (
    <div ref={ref} className={cn("mb-6", className)}>
      {children}
    </div>
  );
});

export default BgContainer;
