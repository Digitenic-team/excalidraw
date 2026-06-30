import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

import type { User } from "../app-jotai";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    "You're not authorized to access this workspace. Your account is not on the allowlist. Please contact the administrator to request access.",
};

export const useAuth = (
  setUser: (user: User | null) => void,
  onAuthError?: (message: string) => void,
) => {
  useEffect(() => {
    // Check for token in URL params, which happens after GitHub login redirect.
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    // The backend redirects here with ?error=... when login is rejected
    // (e.g. the user is not on the access allowlist).
    const error = searchParams.get("error");
    if (error) {
      const message =
        AUTH_ERROR_MESSAGES[error] ??
        "We couldn't sign you in. Your account may not have permission to access this workspace, or the sign-in didn't complete. Please contact the administrator if you believe you should have access.";
      onAuthError?.(message);
      // Clean the error from the URL so it doesn't reappear on refresh.
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (token) {
      localStorage.setItem("token", token);
      // Clean the token from the URL.
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decodedToken: any = jwtDecode(storedToken);
        // Check if token is expired.
        if (decodedToken.exp * 1000 > Date.now()) {
          setUser({
            id: decodedToken.sub,
            subject: decodedToken.sub,
            login: decodedToken.login,
            email: decodedToken.email,
            avatarUrl: decodedToken.avatarUrl,
            name: decodedToken.name,
          });
        } else {
          // Token is expired, remove it.
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  }, [setUser]);
};
