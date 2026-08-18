import { useState } from "react";
import { toast } from "../lib/toast";

interface CopySakiIdProps {
  sakiId: string | number;
  color?: string;
  fontSize?: number;
  variant?: "badge" | "inline";
  badgeBg?: string;
}

function CopyIcon({ copied, color }: { copied: boolean; color: string }) {
  if (copied) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" opacity="0.7">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export default function CopySakiId({
  sakiId,
  color = "rgba(255,255,255,0.75)",
  fontSize = 11,
  variant = "inline",
  badgeBg = "rgba(255,255,255,0.2)",
}: CopySakiIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = String(sakiId);
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch {}
    setCopied(true);
    toast.success(`تم نسخ ID: ${text} 📋`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "badge") {
    return (
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 active:scale-90 transition-transform"
        style={{
          background: badgeBg,
          borderRadius: 6,
          padding: "2px 8px",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
        title="اضغط لنسخ المعرف"
      >
        <span style={{ fontSize, fontWeight: 700, color, fontFamily: "monospace" }}>
          ID: {sakiId}
        </span>
        <CopyIcon copied={copied} color={color} />
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 active:scale-90 transition-transform"
      title="اضغط لنسخ المعرف"
    >
      <span style={{ fontSize, fontWeight: 700, color, fontFamily: "monospace" }}>
        ID: {sakiId}
      </span>
      <CopyIcon copied={copied} color={color} />
    </button>
  );
}
