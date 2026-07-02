"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPageRedirectProvider({
  children,
}: {
  children: React.ReactNode | null;
}) {
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (path === "/") {
      router.replace("/agents");
    }
  }, [path, router]);

  if (path === "/") {
    return null;
  }

  return <>{children}</>;
}
