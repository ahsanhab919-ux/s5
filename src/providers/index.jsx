"use client";

import store from "@/redux/store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider } from "react-redux";
import AnalyticsLoader from "../components/analytics/AnalyticsProvider";
import { NotificationProvider } from "./NotificationProvider";
import TanstackQueryProvider from "./TanstackQueryProvider";
import { AuthProvider } from "./AuthProvider";

function ConditionalGoogleProvider({ children }) {
  const hasGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Don't load Google OAuth if no client ID or if it's an empty string
  if (!hasGoogleClientId || hasGoogleClientId.trim() === "") {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={hasGoogleClientId}>
      {children}
    </GoogleOAuthProvider>
  );
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <TanstackQueryProvider>
        <AnalyticsLoader />
        <NotificationProvider>
          <AuthProvider>
            <ConditionalGoogleProvider>{children}</ConditionalGoogleProvider>
          </AuthProvider>
        </NotificationProvider>
      </TanstackQueryProvider>
    </Provider>
  );
}
