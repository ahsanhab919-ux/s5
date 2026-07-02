"use client";

import {
  useGetUserLimitQuery,
  useGetUserQuery,
  useLoginMutation,
} from "@/redux/api/auth/authApi";
import { setShowLoginModal, setShowRegisterModal } from "@/redux/slices/auth";
import { useGoogleOneTapLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useDispatch, useSelector } from "react-redux";

// Component that uses Google One Tap Login hook
// Only rendered when GoogleOAuthProvider is available
const GoogleOneTapLogin = () => {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);
  const { isLoading } = useGetUserQuery(undefined, {
    skip: !accessToken,
  });
  const [login] = useLoginMutation();

  useGoogleOneTapLogin({
    onSuccess: async (res) => {
      try {
        const { email, name } = jwtDecode(res.credential);

        const response = await login({
          auth_type: "google",
          googleToken: res.credential,
          oneTapLogin: true,
          oneTapUser: {
            email,
            name,
          },
        });

        if (response?.data) {
          dispatch(setShowRegisterModal(false));
          dispatch(setShowLoginModal(false));
        }
      } catch (error) {
        console.error(error);
      }
    },
    flow: "auth-code",
    onError: (err) => {
      console.error(err);
    },
    scope: "email profile",
    disabled: isLoading || user?.email,
  });

  return null;
};

const AuthApplier = () => {
  const { accessToken } = useSelector((state) => state.auth);
  useGetUserQuery(undefined, {
    skip: !accessToken,
  });
  useGetUserLimitQuery();

  // Only render Google One Tap Login if Google Client ID is configured
  // This ensures the hook is only called when GoogleOAuthProvider is available
  const hasGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Check if client ID exists and is not empty (matching ConditionalGoogleProvider logic)
  if (!hasGoogleClientId || hasGoogleClientId.trim() === "") {
    return null;
  }

  return <GoogleOneTapLogin />;
};

export default AuthApplier;
