"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ACTIVITY_THROTTLE_MS,
  ACTIVE_UPLOAD_STORAGE_KEY,
  INACTIVITY_TIMEOUT_MS,
  LAST_ACTIVITY_STORAGE_KEY,
  LOGOUT_STORAGE_KEY,
} from "@/lib/inactivity";
import { createClient } from "@/utils/supabase/client";

export function InactivityLogoutGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const lastWriteRef = useRef(0);
  const logoutInProgressRef = useRef(false);

  useEffect(() => {
    const markActivity = (force = false) => {
      const now = Date.now();

      if (!force && now - lastWriteRef.current < ACTIVITY_THROTTLE_MS) {
        return;
      }

      lastWriteRef.current = now;
      window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
    };

    const readTimestamp = (key: string) => {
      const rawValue = window.localStorage.getItem(key);
      const value = rawValue ? Number(rawValue) : NaN;

      return Number.isFinite(value) ? value : null;
    };

    const hasActiveUpload = () => {
      const activeUntil = readTimestamp(ACTIVE_UPLOAD_STORAGE_KEY);

      return Boolean(activeUntil && activeUntil > Date.now());
    };

    const redirectAfterSignOut = () => {
      router.replace("/login?reason=inactive");
      router.refresh();
    };

    const signOutForInactivity = async () => {
      if (logoutInProgressRef.current) {
        return;
      }

      logoutInProgressRef.current = true;
      window.localStorage.setItem(LOGOUT_STORAGE_KEY, String(Date.now()));
      window.localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_UPLOAD_STORAGE_KEY);

      try {
        await supabase.auth.signOut();
      } finally {
        redirectAfterSignOut();
      }
    };

    const checkTimeout = async () => {
      if (hasActiveUpload()) {
        markActivity(true);
        return;
      }

      const lastActivity = readTimestamp(LAST_ACTIVITY_STORAGE_KEY);

      if (!lastActivity) {
        markActivity(true);
        return;
      }

      if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        await signOutForInactivity();
      }
    };

    const handleActivity = () => markActivity();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkTimeout().then(() => {
          if (!logoutInProgressRef.current) {
            markActivity(true);
          }
        });
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
        window.localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
        window.localStorage.removeItem(ACTIVE_UPLOAD_STORAGE_KEY);
        void supabase.auth.signOut().finally(redirectAfterSignOut);
      }
    };
    const handlePageShow = () => {
      void supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          router.replace("/login");
          router.refresh();
        }
      });
    };

    if (readTimestamp(LAST_ACTIVITY_STORAGE_KEY)) {
      void checkTimeout();
    } else {
      markActivity(true);
    }

    handlePageShow();

    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("focus", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(checkTimeout, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("focus", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, supabase]);

  useEffect(() => {
    if (logoutInProgressRef.current) {
      return;
    }

    window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(Date.now()));
  }, [pathname]);

  return null;
}
