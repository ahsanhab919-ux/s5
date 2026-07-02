"use client";

import { setSessionId, setUserId } from "@/redux/slices/analyticsSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AnalyticsLoader from "./AnalyticsLoader";

export default function AnalyticsProvider({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Initialize session
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;
    dispatch(setSessionId(sessionId));

    // Set user ID if available
    const userId = user._id;
    if (userId) {
      dispatch(setUserId(userId));
    }
  }, [dispatch]);

  return (
    <>
      <AnalyticsLoader />
      {children}
    </>
  );
}
