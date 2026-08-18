import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Robust hardware back handler for Android.
 * - Uses Capacitor App plugin for native Android back button.
 * - Uses history.pushState buffer as fallback for PWA.
 */

const BUFFER_SIZE = 15;

function fillBuffer() {
  if (Capacitor.isNativePlatform()) return;
  for (let i = 0; i < BUFFER_SIZE; i++) {
    window.history.pushState({ sakuBack: true, i }, "");
  }
}

export function useHardwareBack(onBack: () => void, enabled = true) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) return;

    // --- Native Capacitor Handler ---
    let nativeListener: any = null;
    if (Capacitor.isNativePlatform()) {
      nativeListener = App.addListener('backButton', (data) => {
        if (enabledRef.current) {
          // If we are handling the back button, we call onBack and don't exit the app
          onBackRef.current();
        } else if (!data.canGoBack) {
          // If we are at the root and back is not enabled for this component, let the app exit
          App.exitApp();
        }
      });
    }

    // --- Web/PWA Fallback Handler ---
    const webHandler = (_e: PopStateEvent) => {
      if (!enabledRef.current) return;
      if (Capacitor.isNativePlatform()) return; // Native handled above

      fillBuffer();
      onBackRef.current();
    };

    if (!Capacitor.isNativePlatform()) {
      fillBuffer();
      window.addEventListener("popstate", webHandler);
    }

    return () => {
      if (nativeListener) nativeListener.remove();
      window.removeEventListener("popstate", webHandler);
    };
  }, [enabled]);
}
