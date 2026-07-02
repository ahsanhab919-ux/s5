"use client";

// components/analytics/AnalyticsLoader.jsx
import { useAnalytics } from "@/hooks/useAnalytics";
import { markScriptsLoaded } from "@/redux/slices/analyticsSlice";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function AnalyticsLoader() {
  const dispatch = useDispatch();
  const { consent, isLoaded } = useSelector((state) => state.analytics);
  const [userInteracted, setUserInteracted] = useState(false);
  const [scriptsReady, setScriptsReady] = useState(false);
  const { initializeWithConsent } = useAnalytics();

  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracted(true);
      // Remove listeners after first interaction
      document.removeEventListener("scroll", handleInteraction);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };

    // Only add listeners if user has given consent but hasn't interacted yet
    if (consent && !userInteracted) {
      document.addEventListener("scroll", handleInteraction, { passive: true });
      document.addEventListener("click", handleInteraction);
      document.addEventListener("keydown", handleInteraction);
      document.addEventListener("touchstart", handleInteraction, {
        passive: true,
      });
    }

    return () => {
      document.removeEventListener("scroll", handleInteraction);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [consent, userInteracted]);

  // Mark scripts as loaded when all are ready
  useEffect(() => {
    if (scriptsReady && !isLoaded) {
      dispatch(markScriptsLoaded());
      initializeWithConsent(true);
      // 
    }
  }, [scriptsReady, isLoaded, dispatch]);

  const handleAllScriptsLoaded = () => {
    setScriptsReady(true);
  };

  // Only render scripts if user has given consent AND interacted
  // const shouldLoadScripts = consent && userInteracted; // when
  const shouldLoadScripts = true;

  return (
    <>
      {shouldLoadScripts && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=G-5E6P963WDP`}
            // src={`https://www.googletagmanager.com/gtag/js?id=G-5E6P963WDP`}
            strategy="afterInteractive"
            onLoad={() => {
              window.dataLayer = window.dataLayer || [];
              window.gtag = function () {
                window.dataLayer.push(arguments);
              };
              gtag("js", new Date());
              gtag("config", "G-5E6P963WDP");
              handleAllScriptsLoaded();
            }}
          />

          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','GTM-PPRFW7NP');
              `,
            }}
          />

          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />

          <Script
            id="clarity-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "ss2g1wxzt3");
              `,
            }}
          />
        </>
      )}
    </>
  );
}
