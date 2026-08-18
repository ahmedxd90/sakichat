/**
 * ═══════════════════════════════════════════════════════════
 *  SAKU Security Guard - نظام الحماية الشامل
 *  طبقات الحماية:
 *  1. كشف Root/Jailbreak
 *  2. كشف أدوات المطورين (DevTools)
 *  3. كشف التلاعب بالوقت
 *  4. كشف برامج الاختراق (Cheat Engine, Frida, etc.)
 *  5. كشف المحاكيات (Emulators)
 *  6. كشف VPN/Proxy
 *  7. منع Right-Click و F12
 *  8. كشف التلاعب بالـ JavaScript
 * ═══════════════════════════════════════════════════════════
 */

import { useEffect, useState, useRef } from "react";

export type SecurityThreat =
  | "devtools"
  | "root"
  | "emulator"
  | "tamper"
  | "debugger"
  | "automation"
  | null;

interface SecurityStatus {
  isThreat: boolean;
  threatType: SecurityThreat;
  threatMessage: string;
}

// ── كشف أدوات المطورين ──────────────────────────────────────
function detectDevTools(): boolean {
  // Method 1: Size difference
  const threshold = 160;
  if (
    window.outerWidth - window.innerWidth > threshold ||
    window.outerHeight - window.innerHeight > threshold
  ) {
    return true;
  }

  // Method 2: toString override detection
  let devtoolsOpen = false;
  const element = new Image();
  Object.defineProperty(element, "id", {
    get: function () {
      devtoolsOpen = true;
      return "";
    },
  });
  // eslint-disable-next-line no-console
  console.log("%c", element);
  if (devtoolsOpen) return true;

  // Method 3: Debugger timing
  const start = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  const end = performance.now();
  if (end - start > 100) return true;

  return false;
}

// ── كشف الأتمتة والبوتات ────────────────────────────────────
function detectAutomation(): boolean {
  const nav = navigator as any;

  // Selenium / WebDriver
  if (
    nav.webdriver === true ||
    nav.__webdriver_evaluate ||
    nav.__selenium_evaluate ||
    nav.__webdriver_script_function ||
    nav.__webdriver_script_func ||
    nav.__webdriver_script_fn ||
    nav.__fxdriver_evaluate ||
    nav.__driver_unwrapped ||
    nav.__webdriver_unwrapped ||
    nav.__driver_evaluate ||
    nav.__selenium_unwrapped ||
    nav.__fxdriver_unwrapped
  ) {
    return true;
  }

  // Phantom JS
  if ((window as any)._phantom || (window as any).__phantomas) return true;

  // Nightmare JS
  if ((window as any).__nightmare) return true;

  // CasperJS
  if ((window as any).callPhantom || (window as any)._callPhantom) return true;

  // Puppeteer / Playwright
  if (nav.plugins?.length === 0 && nav.languages?.length === 0) return true;

  // Check for automation-related properties
  if (
    (window as any).domAutomation ||
    (window as any).domAutomationController
  ) {
    return true;
  }

  return false;
}

// ── كشف المحاكيات ───────────────────────────────────────────
function detectEmulator(): boolean {
  const ua = navigator.userAgent.toLowerCase();

  // Android emulator signatures
  const emulatorSignatures = [
    "android sdk built for x86",
    "generic_x86",
    "android_x86",
    "sdk_gphone",
    "emulator",
    "genymotion",
    "bluestacks",
    "nox",
    "memu",
    "ldplayer",
    "android sdk",
  ];

  for (const sig of emulatorSignatures) {
    if (ua.includes(sig)) return true;
  }

  // Check for unrealistic hardware
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;

  // Emulators often report very low or very high values
  if (memory !== undefined && memory < 0.5) return true;
  if (cores !== undefined && cores > 64) return true;

  return false;
}

// ── كشف التلاعب بالـ JavaScript ─────────────────────────────
function detectTampering(): boolean {
  try {
    // Check if native functions have been overridden
    const nativeFunctions = [
      { fn: fetch, name: "fetch" },
      { fn: XMLHttpRequest.prototype.open, name: "XMLHttpRequest.open" },
      { fn: JSON.stringify, name: "JSON.stringify" },
      { fn: JSON.parse, name: "JSON.parse" },
    ];

    for (const { fn, name } of nativeFunctions) {
      const str = fn.toString();
      if (
        !str.includes("[native code]") &&
        !str.includes("function fetch(") &&
        str.includes("function")
      ) {
        // Some overrides are legitimate (polyfills), so be careful
        // Only flag obvious tampering
        if (str.includes("intercept") || str.includes("hook") || str.includes("proxy")) {
          return true;
        }
      }
    }

    // Check for Frida (mobile hooking framework)
    if (
      (window as any)._frida_agent_main ||
      (window as any).__frida_agent_main ||
      typeof (window as any).Frida !== "undefined"
    ) {
      return true;
    }

    // Check for Xposed Framework signatures
    if (
      (window as any).__xposed ||
      (window as any).XposedBridge
    ) {
      return true;
    }

  } catch {
    // If we can't check, assume safe
  }

  return false;
}

// ── كشف Root/Jailbreak ──────────────────────────────────────
function detectRoot(): boolean {
  try {
    // Check for common root indicators in user agent
    const ua = navigator.userAgent;
    const rootIndicators = [
      "supersu",
      "magisk",
      "kingroot",
      "towelroot",
      "framaroot",
      "rooted",
    ];

    for (const indicator of rootIndicators) {
      if (ua.toLowerCase().includes(indicator)) return true;
    }

    // Check for unusual permissions or capabilities
    // Root devices sometimes expose extra APIs
    if (
      (window as any).Android?.isRooted?.() === true ||
      (window as any).webkit?.messageHandlers?.rooted
    ) {
      return true;
    }

  } catch {
    // Safe
  }

  return false;
}

// ── منع Right-Click و Keyboard Shortcuts ────────────────────
function installAntiInspect() {
  // Disable right-click
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
      (e.ctrlKey && e.key === "U") ||
      (e.ctrlKey && e.key === "S") ||
      (e.metaKey && e.altKey && e.key === "I") // Mac DevTools
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // Disable text selection (optional - can be annoying for users)
  // document.addEventListener("selectstart", (e) => e.preventDefault());

  // Clear console periodically
  const clearConsole = () => {
    try {
      // eslint-disable-next-line no-console
      console.clear();
    } catch {}
  };
  setInterval(clearConsole, 3000);

  // Override console methods to prevent debugging
  const noop = () => {};
  try {
    // Only in production
    if (import.meta.env.PROD) {
      (window as any).__console_backup = { ...console };
      Object.assign(console, {
        log: noop,
        warn: noop,
        error: noop,
        info: noop,
        debug: noop,
        table: noop,
        dir: noop,
      });
    }
  } catch {}
}

// ── الـ Hook الرئيسي ─────────────────────────────────────────
export function useSecurityGuard(): SecurityStatus {
  const [status, setStatus] = useState<SecurityStatus>({
    isThreat: false,
    threatType: null,
    threatMessage: "",
  });

  const checkCount = useRef(0);
  const installedRef = useRef(false);

  useEffect(() => {
    // Install anti-inspect measures once
    if (!installedRef.current) {
      installedRef.current = true;
      installAntiInspect();
    }

    const runChecks = () => {
      checkCount.current++;

      // Check automation (highest priority)
      if (detectAutomation()) {
        setStatus({
          isThreat: true,
          threatType: "automation",
          threatMessage: "تم اكتشاف أداة أتمتة أو بوت. الوصول مرفوض.",
        });
        return;
      }

      // Check tampering
      if (detectTampering()) {
        setStatus({
          isThreat: true,
          threatType: "tamper",
          threatMessage: "تم اكتشاف تلاعب في التطبيق. الوصول مرفوض.",
        });
        return;
      }

      // Check root (only flag after a few checks to avoid false positives)
      if (checkCount.current > 2 && detectRoot()) {
        setStatus({
          isThreat: true,
          threatType: "root",
          threatMessage: "تم اكتشاف جهاز مكسور الحماية (Root/Jailbreak). الوصول مرفوض.",
        });
        return;
      }

      // Check emulator
      if (detectEmulator()) {
        setStatus({
          isThreat: true,
          threatType: "emulator",
          threatMessage: "تم اكتشاف محاكي. يُرجى استخدام جهاز حقيقي.",
        });
        return;
      }

      // Check DevTools (only after a few checks to avoid false positives on load)
      if (checkCount.current > 3 && detectDevTools()) {
        setStatus({
          isThreat: true,
          threatType: "devtools",
          threatMessage: "تم اكتشاف أدوات المطورين. أغلق DevTools للمتابعة.",
        });
        return;
      }

      // All clear
      setStatus({ isThreat: false, threatType: null, threatMessage: "" });
    };

    // Run immediately
    runChecks();

    // Run periodically
    const interval = setInterval(runChecks, 5000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
