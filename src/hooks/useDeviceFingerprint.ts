import { useEffect, useState } from "react";

// Generate a stable device fingerprint using browser APIs
async function generateFingerprint(): Promise<string> {
  try {
    // Try FingerprintJS first
    const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  } catch {
    // Fallback: manual fingerprint
    return generateManualFingerprint();
  }
}

function generateManualFingerprint(): string {
  const components: string[] = [];

  // Screen
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency
  components.push(String(navigator.hardwareConcurrency ?? 0));

  // Device memory
  components.push(String((navigator as any).deviceMemory ?? 0));

  // Canvas fingerprint
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("SAKU🎙️", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("SAKU🎙️", 4, 17);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {}

  // WebGL
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (gl) {
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      components.push(`${vendor}~${renderer}`);
    }
  } catch {}

  // Audio fingerprint
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const analyser = ctx.createAnalyser();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      oscillator.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(0);
      const data = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(data);
      oscillator.stop();
      ctx.close();
      components.push(data.slice(0, 10).join(","));
    }
  } catch {}

  // Hash the components
  const str = components.join("|||");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `fp_${Math.abs(hash).toString(36)}_${str.length.toString(36)}`;
}

// Store fingerprint in localStorage for persistence
const STORAGE_KEY = "saku_device_fp";

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setFingerprint(stored);
      return;
    }

    generateFingerprint().then((fp) => {
      localStorage.setItem(STORAGE_KEY, fp);
      setFingerprint(fp);
    });
  }, []);

  return fingerprint;
}

export function getStoredFingerprint(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
