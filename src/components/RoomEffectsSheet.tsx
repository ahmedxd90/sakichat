// @ts-nocheck
import { useState, useEffect } from "react";

const STORAGE_KEY = "room_effects_prefs";

export interface RoomEffectsPrefs {
  showGiftVideo: boolean;      // شاشة الهدية الكاملة (GiftVideoOverlay / SVGAGiftOverlay)
  showFlyingGift: boolean;     // الصورة المصغرة الطائرة (FlyingSeatGift)
  showGiftBanner: boolean;     // شريط الهدايا الطائر (GiftFlyingBanner)
}

export function loadRoomEffectsPrefs(): RoomEffectsPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { showGiftVideo: true, showFlyingGift: true, showGiftBanner: true, ...JSON.parse(raw) };
  } catch {}
  return { showGiftVideo: true, showFlyingGift: true, showGiftBanner: true };
}

function saveRoomEffectsPrefs(prefs: RoomEffectsPrefs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
}

interface Props {
  onClose: () => void;
  prefs: RoomEffectsPrefs;
  onChange: (prefs: RoomEffectsPrefs) => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
      style={{ background: value ? "#00bfa5" : "rgba(255,255,255,0.15)" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}

export default function RoomEffectsSheet({ onClose, prefs, onChange }: Props) {
  const items = [
    {
      key: "showGiftVideo" as keyof RoomEffectsPrefs,
      icon: "🎬",
      title: "شاشة الهدية الكاملة",
      desc: "تظهر عند إرسال هدية بتأثير فيديو أو SVGA",
      color: "#a855f7",
      bg: "rgba(168,85,247,0.12)",
      border: "rgba(168,85,247,0.3)",
    },
    {
      key: "showFlyingGift" as keyof RoomEffectsPrefs,
      icon: "🎁",
      title: "الهدية الطائرة للمقعد",
      desc: "الصورة المصغرة التي تطير من المنتصف إلى المقعد",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.3)",
    },
    {
      key: "showGiftBanner" as keyof RoomEffectsPrefs,
      icon: "🎀",
      title: "شريط الهدايا الطائر",
      desc: "الشريط الذي يظهر في أعلى الشاشة عند إرسال هدية",
      color: "#ec4899",
      bg: "rgba(236,72,153,0.12)",
      border: "rgba(236,72,153,0.3)",
    },
  ];

  const handleToggle = (key: keyof RoomEffectsPrefs, val: boolean) => {
    const next = { ...prefs, [key]: val };
    onChange(next);
    saveRoomEffectsPrefs(next);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-white/10 animate-slide-up-sheet"
        style={{ background: "#1a1a2e" }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: "rgba(0,191,165,0.15)", border: "1.5px solid rgba(0,191,165,0.3)" }}>
            ✨
          </div>
          <div>
            <h3 className="text-white font-black text-base">تأثيرات الغرفة</h3>
            <p className="text-gray-400 text-xs mt-0.5">تحكم في التأثيرات المرئية لديك فقط</p>
          </div>
        </div>

        {/* Items */}
        <div className="px-4 pb-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: item.bg, border: `1px solid ${item.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(0,0,0,0.2)" }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">{item.title}</p>
                <p className="text-gray-400 text-[11px] mt-0.5 leading-tight">{item.desc}</p>
              </div>
              <Toggle value={prefs[item.key]} onChange={(v) => handleToggle(item.key, v)} />
            </div>
          ))}
        </div>

        {/* Info note */}
        <div className="mx-4 mb-4 mt-2 rounded-2xl px-4 py-3 flex items-start gap-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-base flex-shrink-0 mt-0.5">💡</span>
          <p className="text-gray-400 text-[11px] leading-relaxed">
            هذه الإعدادات شخصية وتؤثر على ما تراه أنت فقط، ولا تؤثر على الآخرين في الغرفة.
          </p>
        </div>

        <button onClick={onClose}
          className="w-[calc(100%-32px)] mx-4 mb-6 py-3 rounded-2xl text-gray-400 font-medium text-sm"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          إغلاق
        </button>
      </div>
    </div>
  );
}
