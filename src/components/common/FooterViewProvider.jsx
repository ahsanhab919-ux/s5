"use client";

import { usePathname } from "next/navigation";

export default function FooterViewProvider({ children }) {
  const pathname = usePathname();

  // Split pathname into segments: ["agents", "research"] for /agents/research
  const pathSegments = pathname.split("/").filter(Boolean);

  // Check if we're on a dynamic agent route like /agents/[agentType]
  // Examples: /agents/research, /agents/presentation (hide footer)
  // But /agents (base route) should show footer
  const isOnDynamicAgentRoute =
    pathSegments.length >= 2 && pathSegments[0] === "agents";

  if (isOnDynamicAgentRoute) {
    return null;
  }

  return <>{children}</>;
}
