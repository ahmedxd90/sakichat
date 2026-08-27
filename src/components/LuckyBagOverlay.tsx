// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

interface LuckyBagOverlayProps {
  bagId: string;
  bagType: "normal" | "super";
  senderName: string;
  senderAvatarUrl?: string;
  totalCoins: number;
  maxRecipients: number;
  expiresAt: string;
  onClose: () => void;
}

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatCoinsFull(n: number) {
  return n.toLocaleString("ar-EG");
}

// ── Coin sound ──────────────────────────────────────────────────────────────
function playCoinSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    });
    for (let i = 0; i < 10; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600 + i * 180, ctx.currentTime + 0.5 + i * 0.05);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + 0.5 + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5 + i * 0.05 + 0.15);
      osc.start(ctx.currentTime + 0.5 + i * 0.05);
      osc.stop(ctx.currentTime + 0.5 + i * 0.05 + 0.15);
    }
  } catch (e) {}
}

// ── Dragon SVG ───────────────────────────────────────────────────────────────
function DragonCharacter({ phase, isAttacking }: { phase: string; isAttacking: boolean }) {
  return (
    <div
      className="relative"
      style={{
        animation: isAttacking
          ? "dragonAttack 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards"
          : phase === "open"
          ? "dragonFloat 2s ease-in-out infinite"
          : "dragonIdle 3s ease-in-out infinite",
        filter: isAttacking
          ? "drop-shadow(0 0 30px rgba(255,100,0,1)) drop-shadow(0 0 60px rgba(255,200,0,0.8))"
          : "drop-shadow(0 0 15px rgba(255,100,0,0.6)) drop-shadow(0 0 30px rgba(255,50,0,0.3))",
      }}
    >
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
        {/* Fire breath when attacking */}
        {isAttacking && (
          <>
            <ellipse cx="130" cy="100" rx="35" ry="12" fill="rgba(255,100,0,0.7)" className="animate-pulse"/>
            <ellipse cx="148" cy="100" rx="18" ry="7" fill="rgba(255,200,0,0.8)" className="animate-pulse"/>
            {[...Array(8)].map((_, i) => (
              <circle key={i}
                cx={115 + i * 6} cy={95 + (i % 3) * 5}
                r={4 - i * 0.3}
                fill={i < 3 ? "#ff6400" : i < 6 ? "#ffaa00" : "#ffff00"}
                opacity={0.9 - i * 0.1}
              />
            ))}
          </>
        )}

        {/* Wings */}
        <path d="M55 70 Q20 30 10 60 Q25 55 40 75 Z" fill="#8b0000" opacity="0.9"/>
        <path d="M55 70 Q15 25 5 50 Q20 48 38 72 Z" fill="#cc0000" opacity="0.7"/>
        <path d="M55 70 Q90 30 100 60 Q85 55 70 75 Z" fill="#8b0000" opacity="0.9"/>
        <path d="M55 70 Q95 25 105 50 Q90 48 72 72 Z" fill="#cc0000" opacity="0.7"/>

        {/* Wing veins */}
        <path d="M55 70 Q20 30 10 60" stroke="#ff4400" strokeWidth="1.5" fill="none" opacity="0.6"/>
        <path d="M55 70 Q90 30 100 60" stroke="#ff4400" strokeWidth="1.5" fill="none" opacity="0.6"/>

        {/* Body */}
        <ellipse cx="55" cy="100" rx="28" ry="38" fill="#cc0000"/>
        <ellipse cx="55" cy="100" rx="28" ry="38" fill="url(#dragonBodyGrad)"/>

        {/* Belly scales */}
        <ellipse cx="55" cy="105" rx="18" ry="26" fill="#ff8c00" opacity="0.6"/>
        {[90, 100, 110, 118].map((y, i) => (
          <ellipse key={i} cx="55" cy={y} rx={14 - i * 1.5} ry="4" fill="#ffaa00" opacity="0.4"/>
        ))}

        {/* Tail */}
        <path d="M55 135 Q40 148 30 145 Q35 138 45 138 Q50 140 55 135Z" fill="#cc0000"/>
        <path d="M30 145 Q20 150 18 143 Q25 140 30 145Z" fill="#ff4400"/>

        {/* Neck */}
        <ellipse cx="55" cy="68" rx="16" ry="20" fill="#cc0000"/>

        {/* Head */}
        <ellipse cx="55" cy="48" rx="22" ry="20" fill="#cc0000"/>
        <ellipse cx="55" cy="48" rx="22" ry="20" fill="url(#dragonHeadGrad)"/>

        {/* Snout */}
        <ellipse cx="78" cy="52" rx="14" ry="9" fill="#cc0000"/>
        <ellipse cx="78" cy="52" rx="14" ry="9" fill="url(#dragonSnoutGrad)"/>

        {/* Nostrils */}
        <circle cx="84" cy="50" r="2.5" fill="#8b0000"/>
        <circle cx="84" cy="55" r="2.5" fill="#8b0000"/>

        {/* Fire from mouth when attacking */}
        {isAttacking && (
          <>
            <path d="M90 52 Q110 48 125 52 Q110 56 90 52Z" fill="#ff6400"/>
            <path d="M90 52 Q115 45 135 50 Q115 58 90 52Z" fill="#ffaa00" opacity="0.8"/>
          </>
        )}

        {/* Eyes */}
        <ellipse cx="62" cy="44" rx="6" ry="7" fill="#1a0000"/>
        <ellipse cx="62" cy="44" rx="4" ry="5" fill="#ff0000"/>
        <ellipse cx="62" cy="44" rx="2" ry="3" fill="#ffff00"/>
        <circle cx="63" cy="43" r="1" fill="white" opacity="0.8"/>

        {/* Horns */}
        <path d="M48 30 Q44 15 50 10 Q52 20 52 30Z" fill="#8b0000"/>
        <path d="M62 28 Q60 13 66 8 Q66 18 64 28Z" fill="#8b0000"/>
        <path d="M48 30 Q44 15 50 10 Q52 20 52 30Z" fill="url(#hornGrad)"/>
        <path d="M62 28 Q60 13 66 8 Q66 18 64 28Z" fill="url(#hornGrad)"/>

        {/* Spines on back */}
        {[65, 75, 85, 95, 108].map((y, i) => (
          <path key={i}
            d={`M${30 + i * 2} ${y} Q${22 + i * 2} ${y - 12} ${28 + i * 2} ${y}`}
            fill="#ff4400" opacity="0.8"
          />
        ))}

        {/* Claws */}
        <path d="M35 130 Q28 138 25 135 Q30 130 35 130Z" fill="#8b0000"/>
        <path d="M40 132 Q33 142 30 138 Q35 133 40 132Z" fill="#8b0000"/>
        <path d="M75 130 Q82 138 85 135 Q80 130 75 130Z" fill="#8b0000"/>
        <path d="M70 132 Q77 142 80 138 Q75 133 70 132Z" fill="#8b0000"/>

        {/* Glow eyes when attacking */}
        {isAttacking && (
          <ellipse cx="62" cy="44" rx="8" ry="9" fill="rgba(255,255,0,0.3)" className="animate-ping"/>
        )}

        <defs>
          <linearGradient id="dragonBodyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,100,0,0.3)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)"/>
          </linearGradient>
          <linearGradient id="dragonHeadGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,80,0,0.2)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)"/>
          </linearGradient>
          <linearGradient id="dragonSnoutGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,60,0,0.3)"/>
            <stop offset="100%" stopColor="rgba(200,0,0,0.1)"/>
          </linearGradient>
          <linearGradient id="hornGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,100,0,0.5)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ── Treasure Chest ───────────────────────────────────────────────────────────
function TreasureChest({ isOpen, isGlowing, isShaking }: { isOpen: boolean; isGlowing: boolean; isShaking: boolean }) {
  return (
    <div
      className="relative transition-all duration-700"
      style={{
        transform: isShaking ? undefined : isGlowing ? "scale(1.1)" : "scale(1)",
        animation: isShaking ? "chestShake 0.15s ease-in-out infinite" : undefined,
        filter: isGlowing
          ? "drop-shadow(0 0 40px rgba(255,215,0,1)) drop-shadow(0 0 80px rgba(255,215,0,0.6))"
          : "drop-shadow(0 0 10px rgba(200,160,0,0.4))",
      }}
    >
      <svg width="180" height="155" viewBox="0 0 180 155" fill="none">
        {/* Ground glow */}
        {isGlowing && (
          <ellipse cx="90" cy="142" rx="80" ry="16" fill="rgba(255,215,0,0.4)"/>
        )}

        {/* Shadow */}
        <ellipse cx="90" cy="140" rx="65" ry="10" fill="rgba(0,0,0,0.5)"/>

        {/* Chest base */}
        <rect x="15" y="75" width="150" height="65" rx="10" fill="#5c2d0a"/>
        <rect x="15" y="75" width="150" height="65" rx="10" fill="url(#chestBaseG)"/>

        {/* Gold bands */}
        <rect x="15" y="85" width="150" height="10" fill="#c8a000" opacity="0.9"/>
        <rect x="15" y="108" width="150" height="10" fill="#c8a000" opacity="0.9"/>
        <rect x="80" y="75" width="20" height="65" fill="#c8a000" opacity="0.9"/>

        {/* Rivets */}
        {[25,45,65,95,115,135,155].map((x, i) => (
          <circle key={i} cx={x} cy="91" r="4" fill="#ffd700" opacity="0.95"/>
        ))}
        {[25,45,65,95,115,135,155].map((x, i) => (
          <circle key={i} cx={x} cy="114" r="4" fill="#ffd700" opacity="0.95"/>
        ))}

        {/* Lid */}
        <rect x="15" y={isOpen ? 15 : 55} width="150" height="32" rx="10" fill="#7a3d10"
          style={{ transition: "y 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}/>
        <rect x="15" y={isOpen ? 15 : 55} width="150" height="32" rx="10" fill="url(#chestLidG)"
          style={{ transition: "y 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}/>
        <rect x="15" y={isOpen ? 37 : 77} width="150" height="10" fill="#c8a000" opacity="0.9"
          style={{ transition: "y 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}/>

        {/* Lock */}
        {!isOpen && (
          <g transform="translate(80, 90)">
            <rect x="0" y="8" width="20" height="15" rx="3" fill="#c8a000"/>
            <path d="M3 8 Q10 -4 17 8" stroke="#c8a000" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <circle cx="10" cy="16" r="3" fill="#8b6d00"/>
          </g>
        )}

        {/* Coins spilling out */}
        {isOpen && (
          <>
            <ellipse cx="90" cy="72" rx="55" ry="22" fill="rgba(255,215,0,0.55)"/>
            {[...Array(20)].map((_, i) => (
              <circle key={i}
                cx={38 + (i % 10) * 11}
                cy={58 + Math.floor(i / 10) * 14}
                r={7 - (i % 3)}
                fill="#ffd700"
                opacity={0.95 - i * 0.02}
                className="animate-bounce"
                style={{ animationDelay: `${i * 0.03}s`, animationDuration: "0.5s" }}
              />
            ))}
            {[...Array(20)].map((_, i) => (
              <circle key={`s${i}`}
                cx={40 + (i % 10) * 11}
                cy={56 + Math.floor(i / 10) * 14}
                r={2}
                fill="white" opacity={0.5}
              />
            ))}
          </>
        )}

        <defs>
          <linearGradient id="chestBaseG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)"/>
          </linearGradient>
          <linearGradient id="chestLidG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ── Coin Rain Particle ────────────────────────────────────────────────────────
interface RainCoin {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

function CoinRain({ active }: { active: boolean }) {
  const [coins, setCoins] = useState<RainCoin[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) { setCoins([]); return; }
    const arr: RainCoin[] = Array.from({ length: 40 }, () => ({
      id: idRef.current++,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 2,
      size: 16 + Math.random() * 20,
      rotation: Math.random() * 360,
    }));
    setCoins(arr);
  }, [active]);

  if (!active || coins.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {coins.map((c) => (
        <div key={c.id}
          className="absolute"
          style={{
            left: `${c.x}%`,
            top: "-40px",
            fontSize: `${c.size}px`,
            animation: `coinRainFall ${c.duration}s ease-in ${c.delay}s infinite`,
            transform: `rotate(${c.rotation}deg)`,
            filter: "drop-shadow(0 0 6px rgba(255,215,0,0.9))",
          }}>
          🪙
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LuckyBagOverlay({
  bagId, bagType, senderName, senderAvatarUrl,
  totalCoins, maxRecipients, expiresAt, onClose,
}: LuckyBagOverlayProps) {
  const [phase, setPhase] = useState<"countdown" | "open" | "result">("countdown");
  const [countdown, setCountdown] = useState(bagType === "super" ? 20 : 5);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [isChestShaking, setIsChestShaking] = useState(false);
  const [isDragonAttacking, setIsDragonAttacking] = useState(false);
  const [coinRainActive, setCoinRainActive] = useState(false);
  const [goldFlash, setGoldFlash] = useState(false);
  const [myWin, setMyWin] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  useEffect(() => {
    const checkClaimed = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('lucky_bag_claims').select('*').eq('bag_id', bagId).eq('user_id', user.id).single();
      if (data) {
        setAlreadyClaimed(true);
        setHasClaimed(true);
      }
    };
    checkClaimed();
  }, [bagId]);

  useEffect(() => {
    const total = bagType === "super" ? 20 : 5;
    setCountdown(total);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("open");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [bagType]);

  const handleOpen = async () => {
    if (hasClaimed || claiming) return;

    // Dragon attack animation
    setIsChestShaking(true);
    setTimeout(() => setIsDragonAttacking(true), 300);
    setTimeout(() => {
      setIsChestShaking(false);
      setIsDragonAttacking(false);
      setIsChestOpen(true);
      setGoldFlash(true);
      setCoinRainActive(true);
      playCoinSound();
      setTimeout(() => setGoldFlash(false), 800);
      setTimeout(() => setCoinRainActive(false), 5000);
    }, 900);

    setClaiming(true);
    try {
      const { data: won, error } = await supabase.rpc('claim_lucky_bag', { target_bag_id: bagId });
      if (error) throw error;
      setMyWin(won);
      setHasClaimed(true);
      setTimeout(() => setPhase("result"), 2200);
    } catch (e: any) {
      toast.error(e.message || "عذراً، انتهت الحقيبة!");
      setIsChestShaking(false);
      setIsDragonAttacking(false);
    } finally {
      setClaiming(false);
    }
  };

  const total = bagType === "super" ? 20 : 5;
  const progress = countdown / total;
  const isSuper = bagType === "super";
  const accentColor = isSuper ? "#fbbf24" : "#a855f7";
  const accentGlow = isSuper ? "rgba(251,191,36,0.7)" : "rgba(168,85,247,0.7)";

  const gradBg = isSuper
    ? "linear-gradient(180deg, #080500 0%, #150e00 40%, #080500 100%)"
    : "linear-gradient(180deg, #0a0015 0%, #12001f 50%, #0a0a15 100%)";

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden" style={{ background: gradBg }}>

      {/* Gold flash overlay */}
      {goldFlash && (
        <div className="absolute inset-0 z-50 pointer-events-none"
          style={{ background: "rgba(255,215,0,0.35)", animation: "goldFlash 0.8s ease-out forwards" }}/>
      )}

      {/* Coin rain */}
      <CoinRain active={coinRainActive} />

      {/* Background sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="absolute rounded-full animate-ping"
            style={{
              width: `${2 + (i % 4)}px`, height: `${2 + (i % 4)}px`,
              left: `${(i * 3.4) % 100}%`, top: `${(i * 3.1) % 100}%`,
              background: isSuper ? "#fbbf24" : "#a855f7",
              animationDelay: `${(i * 0.11) % 2}s`,
              animationDuration: `${1.2 + (i % 3) * 0.4}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Close button */}
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-20 active:scale-90 transition-transform">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Sender info */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        <div className="w-11 h-11 rounded-full overflow-hidden border-2"
          style={{ borderColor: accentColor, boxShadow: `0 0 12px ${accentGlow}` }}>
          {senderAvatarUrl
            ? <img src={senderAvatarUrl} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #ec4899)` }}>{senderName[0]}</div>
          }
        </div>
        <div>
          <p className="text-white text-xs font-bold">{senderName}</p>
          <p className="text-xs font-bold" style={{ color: accentColor }}>{isSuper ? "⭐ سوبر" : "🎁 عادية"}</p>
        </div>
      </div>

      {/* ── COUNTDOWN PHASE ── */}
      {phase === "countdown" && (
        <div className="flex flex-col items-center gap-4 px-6 w-full max-w-sm mt-8">
          <h1 className="text-2xl font-black text-white text-center">
            {isSuper ? "⭐ حقيبة الحظ السوبر!" : "🎁 حقيبة الحظ!"}
          </h1>
          <p className="text-gray-400 text-sm text-center">
            <span style={{ color: accentColor }} className="font-bold">{formatCoins(totalCoins)} 🪙</span>
            {" "}تُوزَّع على{" "}
            <span style={{ color: accentColor }} className="font-bold">{maxRecipients}</span>
            {" "}شخص
          </p>

          {/* Chest preview */}
          <TreasureChest isOpen={false} isGlowing={false} isShaking={false}/>

          {/* Countdown ring */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
              <circle cx="80" cy="80" r="70" fill="none" stroke={accentColor}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress)}`}
                style={{ transition: "stroke-dashoffset 0.9s linear", filter: `drop-shadow(0 0 10px ${accentColor})` }}
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="font-black text-6xl" style={{ color: accentColor, textShadow: `0 0 25px ${accentGlow}` }}>
                {countdown}
              </span>
              <span className="text-gray-400 text-xs mt-1">ثانية</span>
            </div>
          </div>

          <p className="text-gray-500 text-xs animate-pulse">🐉 التنين يستعد للهجوم!</p>
        </div>
      )}

      {/* ── OPEN PHASE ── */}
      {phase === "open" && (
        <div className="flex flex-col items-center gap-2 px-4 w-full max-w-sm mt-4">
          <h1 className="text-2xl font-black text-white text-center animate-bounce">
            🐉 افتح الصندوق!
          </h1>

          {/* Dragon + Chest */}
          <div className="flex items-end justify-center gap-0 relative w-full">
            {/* Dragon on left, facing right */}
            <div style={{ transform: "scaleX(-1)", marginBottom: "8px" }}>
              <DragonCharacter phase="open" isAttacking={isDragonAttacking}/>
            </div>
            <TreasureChest isOpen={isChestOpen} isGlowing={isChestOpen} isShaking={isChestShaking}/>
          </div>

          {/* Gold glow when open */}
          {isChestOpen && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(255,215,0,0.2) 0%, transparent 65%)" }}/>
          )}

          {/* Open button */}
          {!hasClaimed && !isChestOpen && (
            <button
              onClick={handleOpen}
              disabled={claiming}
              className="w-full py-5 rounded-3xl font-black text-xl active:scale-95 transition-all mt-2"
              style={{
                background: isSuper
                  ? "linear-gradient(135deg,#ff6400,#fbbf24,#ff6400)"
                  : "linear-gradient(135deg,#a855f7,#ec4899)",
                backgroundSize: "200% 100%",
                animation: "btnShimmer 2s linear infinite",
                boxShadow: isSuper
                  ? "0 8px 40px rgba(255,100,0,0.6), 0 0 60px rgba(255,200,0,0.3)"
                  : `0 8px 40px ${accentGlow}`,
                color: "white",
              }}
            >
              {claiming ? "⏳ التنين يهاجم..." : "🐉 أطلق التنين!"}
            </button>
          )}

          {hasClaimed && !myWin && (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
              <p className="text-gray-400 text-sm">⏳ التنين يحسب حصتك...</p>
            </div>
          )}
        </div>
      )}

      {/* ── RESULT PHASE ── */}
      {phase === "result" && (
        <div className="flex flex-col items-center gap-4 px-6 w-full max-w-sm text-center mt-4">
          {/* Dragon celebrating */}
          <div style={{ animation: "dragonFloat 1.5s ease-in-out infinite" }}>
            <DragonCharacter phase="result" isAttacking={false}/>
          </div>

          <h1 className="text-4xl font-black"
            style={{ color: accentColor, textShadow: `0 0 30px ${accentGlow}` }}>
            مبروك! 🎉
          </h1>

          {myWin !== null && myWin > 0 ? (
            <>
              {/* Big win card */}
              <div className="rounded-3xl px-6 py-5 w-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}11)`,
                  border: `2px solid ${accentColor}88`,
                  boxShadow: `0 8px 40px ${accentGlow}`,
                }}>
                {/* Shimmer */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)", animation: "btnShimmer 2s linear infinite" }}/>

                <p className="text-gray-400 text-sm mb-1 relative z-10">🐉 التنين أعطاك</p>
                <p className="font-black relative z-10"
                  style={{ fontSize: "3.5rem", color: accentColor, textShadow: `0 0 20px ${accentGlow}`, lineHeight: 1.1 }}>
                  {formatCoins(myWin)}
                </p>
                <p className="text-yellow-300 text-xl mt-1 relative z-10">🪙 عملة ذهبية</p>

                {/* Exact amount */}
                <div className="mt-3 pt-3 border-t relative z-10" style={{ borderColor: `${accentColor}33` }}>
                  <p className="text-gray-500 text-xs">المبلغ الدقيق</p>
                  <p className="font-bold text-sm" style={{ color: accentColor }}>
                    {formatCoinsFull(myWin)} عملة
                  </p>
                </div>

                {/* Share info */}
                <div className="mt-2 relative z-10">
                  <p className="text-gray-500 text-xs">
                    من أصل {formatCoins(totalCoins)} 🪙 موزعة على {maxRecipients} شخص
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: accentColor }}>
                    حصتك: {((myWin / totalCoins) * 100).toFixed(1)}% من الإجمالي
                  </p>
                </div>
              </div>

              <p className="text-gray-500 text-sm">✅ تم إضافة العملات لرصيدك</p>
            </>
          ) : (
            <div className="rounded-3xl px-8 py-6 w-full"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-gray-400 text-sm">لقد فتحت هذه الحقيبة مسبقاً</p>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95 transition-all"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #ec4899)`,
              boxShadow: `0 8px 30px ${accentGlow}`,
            }}>
            🐉 رائع! إغلاق
          </button>
        </div>
      )}

      <style>{`
        @keyframes dragonFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes dragonIdle {
          0%, 100% { transform: translateY(0) rotate(-1deg) scale(1); }
          50% { transform: translateY(-6px) rotate(1deg) scale(1.02); }
        }
        @keyframes dragonAttack {
          0% { transform: translateX(0) scale(1); }
          30% { transform: translateX(40px) scale(1.15) rotate(-5deg); }
          60% { transform: translateX(70px) scale(1.2) rotate(-8deg); }
          80% { transform: translateX(50px) scale(1.1) rotate(-3deg); }
          100% { transform: translateX(0) scale(1) rotate(0deg); }
        }
        @keyframes chestShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-6px) rotate(-3deg); }
          75% { transform: translateX(6px) rotate(3deg); }
        }
        @keyframes coinRainFall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes goldFlash {
          0% { opacity: 0.35; }
          50% { opacity: 0.5; }
          100% { opacity: 0; }
        }
        @keyframes btnShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
