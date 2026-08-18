import { Toaster } from "sonner";

// ── Inject custom toast CSS once ──
if (typeof document !== "undefined") {
  const id = "centered-toast-styles";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      /* ── Position: fixed center of screen ── */
      [data-sonner-toaster] {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        bottom: auto !important;
        right: auto !important;
        transform: translate(-50%, -50%) !important;
        width: auto !important;
        max-width: 320px !important;
        min-width: 240px !important;
        z-index: 99999 !important;
        pointer-events: none !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 10px !important;
      }

      /* ── Individual toast card ── */
      [data-sonner-toast] {
        pointer-events: auto !important;
        width: auto !important;
        min-width: 220px !important;
        max-width: 300px !important;
        border-radius: 20px !important;
        padding: 14px 20px !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        font-family: inherit !important;
        font-size: 14px !important;
        font-weight: 800 !important;
        text-align: center !important;
        justify-content: center !important;
        direction: rtl !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: none !important;
        box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 2px 12px rgba(0,0,0,0.2) !important;
        animation: toast-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
        transform-origin: center center !important;
      }

      /* ── Success toast ── */
      [data-sonner-toast][data-type="success"] {
        background: linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95)) !important;
        color: #ffffff !important;
      }

      /* ── Error toast ── */
      [data-sonner-toast][data-type="error"] {
        background: linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95)) !important;
        color: #ffffff !important;
      }

      /* ── Warning toast ── */
      [data-sonner-toast][data-type="warning"] {
        background: linear-gradient(135deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95)) !important;
        color: #ffffff !important;
      }

      /* ── Info / default toast ── */
      [data-sonner-toast][data-type="info"],
      [data-sonner-toast]:not([data-type]) {
        background: linear-gradient(135deg, rgba(99,102,241,0.95), rgba(79,70,229,0.95)) !important;
        color: #ffffff !important;
      }

      /* ── Loading toast ── */
      [data-sonner-toast][data-type="loading"] {
        background: linear-gradient(135deg, rgba(30,30,50,0.97), rgba(20,20,40,0.97)) !important;
        color: #e5e7eb !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
      }

      /* ── Hide default icon container ── */
      [data-sonner-toast] [data-icon] {
        display: none !important;
      }

      /* ── Toast title ── */
      [data-sonner-toast] [data-title] {
        font-size: 14px !important;
        font-weight: 800 !important;
        color: inherit !important;
        line-height: 1.4 !important;
        text-align: center !important;
      }

      /* ── Toast description ── */
      [data-sonner-toast] [data-description] {
        font-size: 12px !important;
        font-weight: 600 !important;
        color: rgba(255,255,255,0.85) !important;
        text-align: center !important;
        margin-top: 2px !important;
      }

      /* ── Close button ── */
      [data-sonner-toast] [data-close-button] {
        display: none !important;
      }

      /* ── Cancel button ── */
      [data-sonner-toast] [data-cancel] {
        display: none !important;
      }

      /* ── Action button ── */
      [data-sonner-toast] [data-action] {
        background: rgba(255,255,255,0.2) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        padding: 4px 12px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
      }

      /* ── Pop-in animation ── */
      @keyframes toast-pop-in {
        0% {
          opacity: 0;
          transform: scale(0.7) translateY(10px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      /* ── Fade-out when dismissed ── */
      [data-sonner-toast][data-removed="true"] {
        animation: toast-pop-out 0.25s ease-in forwards !important;
      }

      @keyframes toast-pop-out {
        0% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(0.8);
        }
      }

      /* ── Backdrop overlay when toast is showing ── */
      [data-sonner-toaster]::before {
        content: '';
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.25);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        z-index: -1;
        pointer-events: none;
        animation: backdrop-fade-in 0.2s ease forwards;
      }

      @keyframes backdrop-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* ── Stacked toasts ── */
      [data-sonner-toaster] [data-sonner-toast]:nth-child(2) {
        transform: scale(0.95) translateY(4px) !important;
        opacity: 0.85 !important;
      }
      [data-sonner-toaster] [data-sonner-toast]:nth-child(3) {
        transform: scale(0.9) translateY(8px) !important;
        opacity: 0.7 !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function CenteredToaster() {
  return (
    <Toaster
      position="top-center"
      duration={3000}
      visibleToasts={3}
      gap={8}
      toastOptions={{
        style: {
          fontFamily: "inherit",
        },
      }}
    />
  );
}
