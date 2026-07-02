import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Action to mark scripts as loaded (called by AnalyticsLoader component)
export const markScriptsLoaded = createAsyncThunk(
  "analytics/markLoaded",
  async () => {
    // Scripts are already loaded by Next.js Script components
    return { scriptsLoaded: true };
  },
);

export const initializeAnalytics = createAsyncThunk(
  "analytics/initialize",
  async ({ consent }) => {
    if (!consent) throw new Error("Consent required");
    return { isLoaded: true, consent };
  },
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    isLoaded: false, // for tracking scripts loaded state handler
    consent: true, // Cookie consent to let user know we use tracking
    events: [], // actual events
    sessionId: null, // unique visitors session Id
    userId: null, // userId if user is signed up
    abTests: {}, // AB testing data
    loading: false, // for general states updating or similar states
    error: null, // any error occur will be handled
  },
  reducers: {
    setConsent: (state, action) => {
      state.consent = action.payload;
    },
    trackEvent: (state, action) => {
      const event = {
        ...action.payload,
        timestamp: Date.now(),
        sessionId: state.sessionId,
        userId: state.userId,
      };

      state.events.push(event);

      // Fire to external services if loaded and consent given
      if (state.isLoaded && state.consent) {
        fireToExternalServices(event);
      }
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    setABTestVariant: (state, action) => {
      const { testName, variant } = action.payload;
      state.abTests[testName] = variant;
    },
    clearEvents: (state) => {
      state.events = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoaded = action.payload.isLoaded;
        state.consent = action.payload.consent;
      })
      .addCase(initializeAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setConsent,
  trackEvent,
  setSessionId,
  setUserId,
  setABTestVariant,
  clearEvents,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;

// Helper function to fire events to external services
const fireToExternalServices = async (event) => {
  // GA4
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag("event", event.event_name, {
        ...(event.parameters || {}),
        session_id: event.sessionId,
        user_id: event.userId,
      });
    } catch (err) {
      console.error("GA4 event failed:", err);
    }
  }

  // GA4
  // if (window.gtag) {
  //   window.gtag('event', event.event_name, {
  //     ...(event.parameters || {})});
  // }

  // GTM Data Layer
  // if (window.dataLayer) {
  //   window.dataLayer.push({
  //     event: event.event_name,
  //     ...event.parameters,
  //   });
  // }

  if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
    try {
      window.dataLayer.push({
        event: event.event_name,
        ...(event.parameters || {}),
        sessionId: event.sessionId,
      });
    } catch (err) {
      console.error("GTM event failed:", err);
    }
  }

  // Meta Pixel
  // if (window.fbq && event.event_name === 'conversion') {
  //   window.fbq('track', event.parameters.conversion_name, {
  //     value: event.parameters.value
  //   });
  // }

  // ------------------------
  // Meta Pixel
  // ------------------------
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      if (
        event.event_name === "conversion" &&
        event.parameters?.conversion_name
      ) {
        // Standard "conversion" event
        window.fbq("track", event.parameters.conversion_name, {
          value: event.parameters.value || 0,
          currency: event.parameters.currency || "USD",
          ...(event.parameters.extra || {}),
        });
      } else {
        // Any other custom event
        window.fbq("trackCustom", event.event_name, event.parameters || {});
      }
    } catch (err) {
      console.error("Meta Pixel event failed:", err);
    }
  }

  // ------------------------
  // Zoho Webhook
  // ------------------------
  // IMPORTANT: This needs to be handled and reviewed on ZOHO platform how they want the data.
  // );
  // await fetch("/api/zoho-webhook", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(event),
  // });
};
