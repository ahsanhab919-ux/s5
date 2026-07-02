"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { initFacebookPixel } from "./fbconfig";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

export default function FacebookPixel() {
  const router = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!FB_PIXEL_ID || typeof FB_PIXEL_ID !== "string" || FB_PIXEL_ID.trim() === "") {
      return;
    }

    try {
      initFacebookPixel(FB_PIXEL_ID);
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "PageView");
      }
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize Facebook Pixel:", error);
    }
  }, [router]);

  if (!FB_PIXEL_ID || !isInitialized) return null;
  
  return (
    <>
      <script
        async
        src={`https://connect.facebook.net/en_US/fbevents.js`}
      ></script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
