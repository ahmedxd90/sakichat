import { useState, useEffect, useRef } from "react";

export function usePWAUpdate() {
  const [updateReady, setUpdateReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const markedRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const markReady = (reg: ServiceWorkerRegistration) => {
      if (markedRef.current) return;
      markedRef.current = true;
      regRef.current = reg;
      setRegistration(reg);
      setUpdateReady(true);
    };

    const attachListener = (reg: ServiceWorkerRegistration) => {
      regRef.current = reg;
      if (reg.waiting && navigator.serviceWorker.controller) {
        markReady(reg);
        return;
      }
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            markReady(reg);
          }
        });
      });
    };

    const init = async () => {
      try {
        let reg = await navigator.serviceWorker.getRegistration("/");
        if (!reg) {
          reg = await navigator.serviceWorker.register("/sw-custom.js", { scope: "/" });
        }
        attachListener(reg);
        try { await reg.update(); } catch (_) {}
        // تحقق كل دقيقة من وجود تحديث جديد
        intervalRef.current = setInterval(async () => {
          try {
            const r = regRef.current || await navigator.serviceWorker.getRegistration("/");
            if (!r) return;
            await r.update();
            if (r.waiting && navigator.serviceWorker.controller) markReady(r);
          } catch (_) {}
        }, 60_000);
      } catch (err) {
        console.warn("[PWA] usePWAUpdate error:", err);
      }
    };

    init();

    navigator.serviceWorker.ready.then((reg) => {
      if (!regRef.current) attachListener(reg);
      if (reg.waiting && navigator.serviceWorker.controller) markReady(reg);
    }).catch(() => {});

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const dismiss = () => setUpdateReady(false);
  return { updateReady, registration, dismiss };
}
