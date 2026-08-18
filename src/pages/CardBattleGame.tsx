// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";

const BET_AMOUNTS = [1000, 10000, 50000, 100000];

// ── SVG Card Components ──────────────────────────────────────────────────────

function SuitSymbol({ suit, size = 14 }: { suit: string; size?: number }) {
  const color = suit === "♥" || suit === "♦" ? "#e53e3e" : "#1a202c";
  return (
    <text fontSize={size} fill={color} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
      {suit}
    </text>
  );
}

function PlayingCard({
  rank,
  suit,
  faceDown = false,
  width = 52,
  height = 72,
  glowing = false,
  style = {},
}: {
  rank: string;
  suit: string;
  faceDown?: boolean;
  width?: number;
  height?: number;
  glowing?: boolean;
  style?: React.CSSProperties;
}) {
  const isRed = suit === "♥" || suit === "♦";
  const textColor = isRed ? "#c53030" : "#1a202c";
  const r = 5;

  if (faceDown) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
        <defs>
          <linearGradient id="card-back-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="50%" stopColor="#2d5a8e" />
            <stop offset="100%" stopColor="#1a2f4a" />
          </linearGradient>
          <pattern id="card-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="none" />
            <path d="M0,4 L4,0 L8,4 L4,8 Z" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect x="1" y="1" width={width - 2} height={height - 2} rx={r} ry={r}
          fill="url(#card-back-grad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <rect x="1" y="1" width={width - 2} height={height - 2} rx={r} ry={r}
          fill="url(#card-pattern)" />
        <rect x="4" y="4" width={width - 8} height={height - 8} rx={r - 1} ry={r - 1}
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <text x={width / 2} y={height / 2 + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={Math.floor(width * 0.35)} fill="rgba(255,255,255,0.25)" fontWeight="900">
          ♠
        </text>
      </svg>
    );
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
      <defs>
        <linearGradient id={`card-grad-${rank}-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0f0f0" />
        </linearGradient>
        {glowing && (
          <filter id="card-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      {/* Shadow */}
      <rect x="2" y="2" width={width - 2} height={height - 2} rx={r} ry={r}
        fill="rgba(0,0,0,0.3)" />
      {/* Card body */}
      <rect x="0" y="0" width={width - 2} height={height - 2} rx={r} ry={r}
        fill={`url(#card-grad-${rank}-${suit})`}
        stroke={isRed ? "rgba(197,48,48,0.3)" : "rgba(26,32,44,0.2)"}
        strokeWidth="1"
        filter={glowing ? "url(#card-glow)" : undefined}
      />
      {/* Top-left rank */}
      <text x="4" y="12" fontSize={Math.floor(width * 0.22)} fill={textColor} fontWeight="900" fontFamily="Georgia, serif">
        {rank}
      </text>
      <text x="4" y="22" fontSize={Math.floor(width * 0.2)} fill={textColor} textAnchor="start">
        {suit}
      </text>
      {/* Center suit */}
      <text x={(width - 2) / 2} y={(height - 2) / 2 + 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.floor(width * 0.38)} fill={textColor} opacity="0.85">
        {suit}
      </text>
      {/* Bottom-right rank (rotated) */}
      <g transform={`rotate(180, ${(width - 2) / 2}, ${(height - 2) / 2})`}>
        <text x="4" y="12" fontSize={Math.floor(width * 0.22)} fill={textColor} fontWeight="900" fontFamily="Georgia, serif">
          {rank}
        </text>
        <text x="4" y="22" fontSize={Math.floor(width * 0.2)} fill={textColor} textAnchor="start">
          {suit}
        </text>
      </g>
    </svg>
  );
}

// ── Joker Character SVG ──────────────────────────────────────────────────────
function JokerCharacter({ size = 80, glowing = false }: { size?: number; glowing?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id="joker-face" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#f5e6c8" />
          <stop offset="100%" stopColor="#e8d5a3" />
        </radialGradient>
        <radialGradient id="joker-hat" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
        {glowing && (
          <filter id="joker-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      {/* Hat */}
      <path d="M20,42 L30,15 L50,10 L70,15 L80,42 Z" fill="url(#joker-hat)" stroke="#6d28d9" strokeWidth="1.5" filter={glowing ? "url(#joker-glow)" : undefined} />
      {/* Hat brim */}
      <ellipse cx="50" cy="42" rx="32" ry="6" fill="#5b21b6" stroke="#7c3aed" strokeWidth="1" />
      {/* Hat band */}
      <path d="M22,36 L78,36" stroke="#f59e0b" strokeWidth="3" />
      {/* Hat bells */}
      <circle cx="30" cy="12" r="4" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
      <circle cx="50" cy="8" r="4" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
      <circle cx="70" cy="12" r="4" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
      {/* Face */}
      <ellipse cx="50" cy="62" rx="22" ry="20" fill="url(#joker-face)" stroke="#d4a96a" strokeWidth="1.5" />
      {/* Eyes */}
      <ellipse cx="42" cy="57" rx="4" ry="4.5" fill="white" stroke="#333" strokeWidth="1" />
      <ellipse cx="58" cy="57" rx="4" ry="4.5" fill="white" stroke="#333" strokeWidth="1" />
      <circle cx="43" cy="58" r="2.5" fill="#1a1a2e" />
      <circle cx="59" cy="58" r="2.5" fill="#1a1a2e" />
      <circle cx="44" cy="57" r="1" fill="white" />
      <circle cx="60" cy="57" r="1" fill="white" />
      {/* Eyebrows - arched evilly */}
      <path d="M38,52 Q42,49 46,52" stroke="#5a3e1b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M54,52 Q58,49 62,52" stroke="#5a3e1b" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Joker smile */}
      <path d="M35,68 Q42,78 50,72 Q58,78 65,68" stroke="#c53030" strokeWidth="2.5" fill="rgba(220,38,38,0.15)" strokeLinecap="round" />
      {/* Cheek diamonds */}
      <path d="M33,63 L36,60 L39,63 L36,66 Z" fill="#ef4444" opacity="0.7" />
      <path d="M61,63 L64,60 L67,63 L64,66 Z" fill="#ef4444" opacity="0.7" />
      {/* Collar */}
      <path d="M28,80 L35,75 L50,82 L65,75 L72,80 L65,90 L35,90 Z" fill="#7c3aed" stroke="#6d28d9" strokeWidth="1" />
      <path d="M35,75 L50,82 L65,75" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ── Batman Character SVG ─────────────────────────────────────────────────────
function BatmanCharacter({ size = 80, glowing = false }: { size?: number; glowing?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id="batman-face" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#2d3748" />
          <stop offset="100%" stopColor="#1a202c" />
        </radialGradient>
        <radialGradient id="batman-cape" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#2d3748" />
          <stop offset="100%" stopColor="#0d1117" />
        </radialGradient>
        {glowing && (
          <filter id="batman-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      {/* Cape */}
      <path d="M10,100 L20,50 L50,40 L80,50 L90,100 Z" fill="url(#batman-cape)" filter={glowing ? "url(#batman-glow)" : undefined} />
      {/* Cowl */}
      <ellipse cx="50" cy="52" rx="24" ry="22" fill="url(#batman-face)" stroke="#4a5568" strokeWidth="1.5" />
      {/* Bat ears */}
      <path d="M30,35 L26,12 L38,30 Z" fill="#1a202c" stroke="#4a5568" strokeWidth="1" />
      <path d="M70,35 L74,12 L62,30 Z" fill="#1a202c" stroke="#4a5568" strokeWidth="1" />
      {/* Eye mask */}
      <path d="M26,48 Q32,42 42,46 Q38,52 26,52 Z" fill="#0d1117" />
      <path d="M74,48 Q68,42 58,46 Q62,52 74,52 Z" fill="#0d1117" />
      {/* White eyes */}
      <ellipse cx="35" cy="48" rx="5" ry="3.5" fill="white" opacity="0.9" />
      <ellipse cx="65" cy="48" rx="5" ry="3.5" fill="white" opacity="0.9" />
      {/* Pupils */}
      <ellipse cx="35" cy="48" rx="2.5" ry="2.5" fill="#1a202c" />
      <ellipse cx="65" cy="48" rx="2.5" ry="2.5" fill="#1a202c" />
      {/* Nose */}
      <path d="M47,56 L50,60 L53,56" stroke="#4a5568" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Stern mouth */}
      <path d="M40,65 L50,62 L60,65" stroke="#718096" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Chin */}
      <path d="M38,70 Q50,78 62,70" stroke="#4a5568" strokeWidth="1" fill="none" />
      {/* Bat symbol on chest */}
      <path d="M50,82 L38,76 L42,82 L35,80 L42,88 L50,85 L58,88 L65,80 L58,82 L62,76 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.5" />
    </svg>
  );
}

// ── Draw / Shield Character ──────────────────────────────────────────────────
function DrawCharacter({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      {/* Shield */}
      <path d="M50,10 L80,25 L80,55 Q80,80 50,92 Q20,80 20,55 L20,25 Z"
        fill="url(#shield-grad)" stroke="#818cf8" strokeWidth="2" />
      {/* Shield inner */}
      <path d="M50,18 L73,30 L73,55 Q73,74 50,84 Q27,74 27,55 L27,30 Z"
        fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      {/* Joker half */}
      <clipPath id="left-half">
        <rect x="20" y="10" width="30" height="82" />
      </clipPath>
      <path d="M50,10 L80,25 L80,55 Q80,80 50,92 Q20,80 20,55 L20,25 Z"
        fill="#7c3aed" clipPath="url(#left-half)" />
      {/* Batman half */}
      <clipPath id="right-half">
        <rect x="50" y="10" width="30" height="82" />
      </clipPath>
      <path d="M50,10 L80,25 L80,55 Q80,80 50,92 Q20,80 20,55 L20,25 Z"
        fill="#1a202c" clipPath="url(#right-half)" />
      {/* Center line */}
      <line x1="50" y1="10" x2="50" y2="92" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      {/* J on left */}
      <text x="35" y="58" textAnchor="middle" fontSize="22" fill="#f59e0b" fontWeight="900" fontFamily="Georgia, serif">J</text>
      {/* B on right */}
      <text x="65" y="58" textAnchor="middle" fontSize="22" fill="#fbbf24" fontWeight="900" fontFamily="Georgia, serif">B</text>
      {/* Stars */}
      <text x="50" y="30" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.6)">★</text>
      <text x="50" y="80" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)">✦</text>
    </svg>
  );
}

// ── Poker Table SVG ──────────────────────────────────────────────────────────
function PokerTable({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative w-full" style={{ maxWidth: 360, margin: "0 auto" }}>
      <svg width="100%" viewBox="0 0 360 200" style={{ display: "block" }}>
        <defs>
          <radialGradient id="table-felt" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="60%" stopColor="#14532d" />
            <stop offset="100%" stopColor="#052e16" />
          </radialGradient>
          <radialGradient id="table-edge" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#451a03" />
          </radialGradient>
          <filter id="table-shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.6)" />
          </filter>
        </defs>
        {/* Table outer edge (wood) */}
        <ellipse cx="180" cy="100" rx="175" ry="95" fill="url(#table-edge)" filter="url(#table-shadow)" />
        {/* Table felt */}
        <ellipse cx="180" cy="100" rx="162" ry="82" fill="url(#table-felt)" />
        {/* Inner felt ring */}
        <ellipse cx="180" cy="100" rx="155" ry="75" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        {/* Center logo */}
        <ellipse cx="180" cy="100" rx="40" ry="22" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <text x="180" y="96" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)" fontWeight="900" fontFamily="Arial Black, sans-serif">CARD</text>
        <text x="180" y="108" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)" fontWeight="900" fontFamily="Arial Black, sans-serif">BATTLE</text>
        {/* Chip dots */}
        {[30, 90, 150, 210, 270, 330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x = 180 + 130 * Math.cos(rad);
          const y = 100 + 65 * Math.sin(rad);
          return (
            <circle key={i} cx={x} cy={y} r="4"
              fill={["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"][i]}
              opacity="0.5" />
          );
        })}
      </svg>
      {/* Overlay content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ── Card Hand Display ────────────────────────────────────────────────────────
const JOKER_CARDS = [
  { rank: "A", suit: "♠" },
  { rank: "K", suit: "♠" },
  { rank: "Q", suit: "♠" },
  { rank: "J", suit: "♠" },
  { rank: "10", suit: "♠" },
];
const BATMAN_CARDS = [
  { rank: "A", suit: "♦" },
  { rank: "K", suit: "♦" },
  { rank: "Q", suit: "♦" },
  { rank: "J", suit: "♦" },
  { rank: "10", suit: "♦" },
];

interface Props {
  onBack: () => void;
}

export default function CardBattleGame({ onBack }: Props) {
  const profile = useQuery(api.profiles.getMyProfile);
  const currentRound = useQuery(api.cardBattle.getCurrentRound);
  const lastRounds = useQuery(api.cardBattle.getLastRounds);
  const leaderboard = useQuery(api.cardBattle.getLeaderboard);
  const todayWinnings = useQuery(api.cardBattle.getMyTodayWinnings);
  const betsSummary = useQuery(
    api.cardBattle.getRoundBetsSummary,
    currentRound ? { roundId: currentRound._id } : "skip"
  );
  const myBets = useQuery(
    api.cardBattle.getMyBetsForRound,
    currentRound ? { roundId: currentRound._id } : "skip"
  );
  const activePlayers = useQuery(
    api.cardBattle.getActivePlayers,
    currentRound ? { roundId: currentRound._id } : "skip"
  );

  const [resultRoundId, setResultRoundId] = useState<string | null>(null);
  const topWinners = useQuery(
    api.cardBattle.getRoundTopWinners,
    resultRoundId ? { roundId: resultRoundId as any } : "skip"
  );

  const placeBet = useMutation(api.cardBattle.placeBet);
  const startNewRound = useMutation(api.cardBattle.startNewRound);

  const [selAmt, setSelAmt] = useState(1000);
  const [placing, setPlacing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showLB, setShowLB] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Animation state
  const [phase, setPhase] = useState<"betting" | "stopped" | "revealing" | "result">("betting");
  const [winnerTeam, setWinnerTeam] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [dealingCards, setDealingCards] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevRoundRef = useRef<string | null>(null);

  // Timer
  useEffect(() => {
    if (!currentRound) return;
    const update = () =>
      setTimeLeft(Math.ceil(Math.max(0, currentRound.endsAt - Date.now()) / 1000));
    update();
    timerRef.current = setInterval(update, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentRound?.endsAt]);

  // Auto-start round
  useEffect(() => {
    if (currentRound === null) startNewRound().catch(() => {});
  }, [currentRound]);

  // Phase management
  useEffect(() => {
    if (!currentRound) return;
    if (currentRound.status === "betting" && timeLeft > 0) {
      setPhase("betting");
      setCardsRevealed(false);
    } else if (currentRound.status === "betting" && timeLeft <= 0) {
      setPhase("stopped");
    }
  }, [currentRound?.status, timeLeft]);

  // Detect new finished round
  useEffect(() => {
    if (!lastRounds?.length) return;
    const last = lastRounds[0];
    if (!last.winnerTeam || last._id === prevRoundRef.current) return;
    prevRoundRef.current = last._id;
    setResultRoundId(last._id);

    setPhase("revealing");
    setDealingCards(true);
    setCardsRevealed(false);

    setTimeout(() => {
      setDealingCards(false);
      setCardsRevealed(true);
      setWinnerTeam(last.winnerTeam!);
      setPhase("result");
      setShowResult(true);
      setTimeout(() => {
        setShowResult(false);
        setWinnerTeam(null);
        setCardsRevealed(false);
        setResultRoundId(null);
        setPhase("betting");
      }, 7000);
    }, 2500);
  }, [lastRounds?.[0]?._id]);

  const handleBet = async (tk: string) => {
    if (!currentRound || currentRound.status !== "betting" || timeLeft <= 0 || placing) return;
    setPlacing(true);
    try {
      await placeBet({ roundId: currentRound._id, teamKey: tk, amount: selAmt });
      const labels: Record<string, string> = { joker: "الجوكر", batman: "باتمان", draw: "تعادل" };
      toast.success(`✅ رهنت ${selAmt.toLocaleString()} 🪙 على ${labels[tk]}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPlacing(false);
    }
  };

  const myBetMap: Record<string, number> = {};
  myBets?.forEach((b) => {
    myBetMap[b.teamKey] = (myBetMap[b.teamKey] ?? 0) + b.amount;
  });

  const isBetting = currentRound?.status === "betting" && timeLeft > 0;
  const totalPool = Object.values(betsSummary ?? {}).reduce((s, v) => s + v.total, 0);
  const timerPct = Math.min(100, (timeLeft / 20) * 100);
  const timerColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f97316" : "#a855f7";

  const fmt = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  };

  const TEAM_INFO = {
    joker: { label: "الجوكر", color: "#a855f7", darkColor: "#4c1d95", glow: "rgba(168,85,247,0.7)", multiplier: 2 },
    batman: { label: "باتمان", color: "#3b82f6", darkColor: "#1e3a5f", glow: "rgba(59,130,246,0.7)", multiplier: 2 },
    draw: { label: "تعادل", color: "#f59e0b", darkColor: "#78350f", glow: "rgba(245,158,11,0.8)", multiplier: 8 },
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg,#050510 0%,#0a0520 50%,#050510 100%)" }}
      dir="rtl"
    >
      {/* ── ANIMATED BG ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle,#a855f7,transparent 70%)", animation: "cb-float 6s ease-in-out infinite" }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle,#3b82f6,transparent 70%)", animation: "cb-float 8s ease-in-out infinite 2s" }} />
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: `${1 + (i % 3) * 0.5}px`, height: `${1 + (i % 3) * 0.5}px`,
              top: `${(i * 37) % 100}%`, left: `${(i * 61) % 100}%`,
              opacity: 0.04 + (i % 5) * 0.02,
              animation: `cb-twinkle ${2 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.3) % 4}s`,
            }}
          />
        ))}
      </div>

      {/* ── HEADER ── */}
      <div className="relative flex items-center justify-between px-3 py-2.5 flex-shrink-0 z-10"
        style={{ background: "rgba(5,5,16,0.97)", borderBottom: "1px solid rgba(168,85,247,0.15)" }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">🃏</span>
              <h1 className="text-white font-black text-base leading-none">Card Battle</h1>
              <button onClick={() => setShowRules(true)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                style={{ background: "rgba(255,255,255,0.1)", color: "#9ca3af" }}>?</button>
            </div>
            <p className="text-purple-400 text-[9px] opacity-70">جولة #{currentRound?.roundNumber ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLB(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl active:scale-95"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <span className="text-base">🏆</span>
            <span className="text-yellow-400 font-black text-[10px]">Top</span>
          </button>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <span className="text-sm">🪙</span>
            <span className="text-yellow-400 font-black text-xs">{fmt(profile?.goldCoins ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* ── ACTIVE PLAYERS STRIP ── */}
      <div className="flex-shrink-0 z-10 px-3 py-2"
        style={{ background: "rgba(5,5,16,0.9)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: "cb-blink 1s ease-in-out infinite" }} />
            <span className="text-gray-500 text-[9px] font-bold">لاعبون</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {!activePlayers || activePlayers.length === 0 ? (
              <span className="text-gray-600 text-[9px]">لا يوجد لاعبون بعد</span>
            ) : (
              activePlayers.map((p: any) => (
                <div key={p.userId} className="flex-shrink-0 flex flex-col items-center gap-0.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden"
                    style={{ border: "1.5px solid rgba(168,85,247,0.4)" }}>
                    {p.profile?.avatarUrl ? (
                      <img src={p.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black text-[9px]"
                        style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
                        {p.profile?.name?.[0] ?? "؟"}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-600 text-[7px] truncate" style={{ maxWidth: 28 }}>
                    {p.profile?.name?.split(" ")[0] ?? "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="px-3 pt-3 pb-6 space-y-3">

          {/* ── PHASE BADGE ── */}
          <div className="flex items-center justify-center">
            {phase === "betting" && isBetting && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.35)" }}>
                <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: "cb-blink 1s ease-in-out infinite" }} />
                <span className="text-purple-300 font-black text-xs">الرهان مفتوح</span>
              </div>
            )}
            {phase === "stopped" && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)" }}>
                <div className="w-2 h-2 rounded-full bg-red-400" style={{ animation: "cb-blink 0.5s ease-in-out infinite" }} />
                <span className="text-red-300 font-black text-xs">توقف الرهان</span>
              </div>
            )}
            {phase === "revealing" && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)" }}>
                <div className="text-base" style={{ animation: "cb-spin 0.5s linear infinite" }}>🃏</div>
                <span className="text-yellow-300 font-black text-xs">كشف الأوراق...</span>
              </div>
            )}
            {phase === "result" && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)" }}>
                <span className="text-base">🎉</span>
                <span className="text-green-300 font-black text-xs">النتيجة!</span>
              </div>
            )}
          </div>

          {/* ── POKER TABLE ── */}
          <div className="relative">
            <PokerTable>
              <div className="flex items-center justify-between w-full px-6">
                {/* Joker cards */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex" style={{ gap: "-8px" }}>
                    {JOKER_CARDS.slice(0, 3).map((c, i) => (
                      <div key={i} style={{ marginLeft: i > 0 ? -14 : 0, zIndex: i }}>
                        <PlayingCard
                          rank={c.rank} suit={c.suit}
                          faceDown={!cardsRevealed}
                          width={32} height={44}
                          glowing={cardsRevealed && winnerTeam === "joker"}
                          style={{
                            transform: `rotate(${(i - 1) * 8}deg)`,
                            transition: "all 0.5s ease",
                            filter: cardsRevealed && winnerTeam === "joker" ? "drop-shadow(0 0 6px rgba(168,85,247,0.9))" : "none",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-[8px] text-purple-400 font-black">الجوكر</span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center">
                  <span className="text-white font-black text-xs opacity-60">VS</span>
                </div>

                {/* Batman cards */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex">
                    {BATMAN_CARDS.slice(0, 3).map((c, i) => (
                      <div key={i} style={{ marginLeft: i > 0 ? -14 : 0, zIndex: i }}>
                        <PlayingCard
                          rank={c.rank} suit={c.suit}
                          faceDown={!cardsRevealed}
                          width={32} height={44}
                          glowing={cardsRevealed && winnerTeam === "batman"}
                          style={{
                            transform: `rotate(${(i - 1) * -8}deg)`,
                            transition: "all 0.5s ease",
                            filter: cardsRevealed && winnerTeam === "batman" ? "drop-shadow(0 0 6px rgba(59,130,246,0.9))" : "none",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-[8px] text-blue-400 font-black">باتمان</span>
                </div>
              </div>
            </PokerTable>
          </div>

          {/* ── TIMER ── */}
          {isBetting && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-3">
                <div className="text-4xl font-black tabular-nums leading-none"
                  style={{ color: timerColor, textShadow: `0 0 20px ${timerColor}90`, fontFamily: "Arial Black, sans-serif" }}>
                  {timeLeft}
                </div>
                <div>
                  <p className="text-gray-300 text-xs font-bold">ثانية للرهان</p>
                  <p className="text-gray-600 text-[10px]">المجموع: {fmt(totalPool)} 🪙</p>
                </div>
              </div>
              <div className="w-full max-w-xs h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${timerPct}%`,
                    background: `linear-gradient(90deg, ${timerColor}, ${timerColor}80)`,
                    boxShadow: `0 0 6px ${timerColor}`,
                  }}
                />
              </div>
            </div>
          )}

          {/* ── BET AMOUNTS ── */}
          <div className="flex gap-2">
            {BET_AMOUNTS.map((amt) => (
              <button key={amt} onClick={() => setSelAmt(amt)}
                className="flex-1 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95"
                style={selAmt === amt ? {
                  background: "linear-gradient(135deg,#a855f7,#7c3aed)",
                  color: "white",
                  boxShadow: "0 4px 14px rgba(168,85,247,0.5)",
                } : {
                  background: "rgba(255,255,255,0.05)",
                  color: "#9ca3af",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                {amt >= 1000 ? `${(amt / 1000).toFixed(0)}K` : amt}🪙
              </button>
            ))}
          </div>

          {/* ── TEAM CARDS (Joker / Batman / Draw) ── */}
          <div className="grid grid-cols-3 gap-2.5">
            {(["joker", "batman", "draw"] as const).map((tk) => {
              const info = TEAM_INFO[tk];
              const myBet = myBetMap[tk] ?? 0;
              const pool = betsSummary?.[tk]?.total ?? 0;
              const count = betsSummary?.[tk]?.count ?? 0;
              const isWinner = winnerTeam === tk;
              return (
                <button key={tk}
                  onClick={() => handleBet(tk)}
                  disabled={!isBetting || placing}
                  className="relative rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-all active:scale-95"
                  style={{
                    background: isWinner
                      ? `linear-gradient(135deg,${info.color}30,${info.color}10)`
                      : myBet > 0
                      ? `linear-gradient(135deg,${info.color}18,rgba(0,0,0,0.3))`
                      : "rgba(255,255,255,0.04)",
                    border: isWinner
                      ? `2px solid ${info.color}`
                      : myBet > 0
                      ? `2px solid ${info.color}90`
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isWinner
                      ? `0 0 30px ${info.glow}, inset 0 0 20px ${info.color}10`
                      : myBet > 0
                      ? `0 0 14px ${info.glow}50`
                      : "none",
                    opacity: !isBetting && !isWinner && phase !== "result" ? 0.55 : 1,
                    animation: isWinner ? "cb-winner-pulse 0.6s ease-in-out infinite" : "none",
                  }}
                >
                  {myBet > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black z-10"
                      style={{ background: "#22c55e", color: "white", boxShadow: "0 0 8px rgba(34,197,94,0.6)" }}>✓</div>
                  )}
                  {tk === "joker" && <JokerCharacter size={56} glowing={isWinner} />}
                  {tk === "batman" && <BatmanCharacter size={56} glowing={isWinner} />}
                  {tk === "draw" && <DrawCharacter size={56} />}
                  <span className="text-white text-[10px] font-black leading-tight">{info.label}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}40` }}>
                    ×{info.multiplier}
                  </span>
                  {myBet > 0 && (
                    <span className="text-[9px] text-green-400 font-bold">{fmt(myBet)} 🪙</span>
                  )}
                  {pool > 0 && (
                    <span className="text-[8px] text-gray-600">{fmt(pool)} ({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl px-3 py-2.5 flex items-center gap-2"
              style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <span className="text-lg">📈</span>
              <div>
                <p className="text-gray-500 text-[9px]">كسبت اليوم</p>
                <p className="text-green-400 font-black text-sm">{fmt(todayWinnings ?? 0)} 🪙</p>
              </div>
            </div>
            <div className="rounded-2xl px-3 py-2.5 flex items-center gap-2"
              style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="text-lg">🪙</span>
              <div>
                <p className="text-gray-500 text-[9px]">رصيدي</p>
                <p className="text-yellow-400 font-black text-sm">{fmt(profile?.goldCoins ?? 0)}</p>
              </div>
            </div>
          </div>

          {/* ── LAST 10 ROUNDS ── */}
          <div>
            <p className="text-gray-500 text-[10px] font-bold mb-1.5">📜 آخر 10 جولات</p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {!lastRounds ? (
                <div className="flex items-center justify-center w-full py-2">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : lastRounds.length === 0 ? (
                <p className="text-gray-600 text-xs py-2">لا توجد جولات بعد</p>
              ) : (
                lastRounds.map((round: any, idx: number) => {
                  const info = TEAM_INFO[round.winnerTeam as keyof typeof TEAM_INFO];
                  return (
                    <div key={round._id}
                      className="flex-shrink-0 flex flex-col items-center gap-1 rounded-xl px-2 py-2"
                      style={{
                        background: idx === 0 ? `${info?.color ?? "#a855f7"}15` : "rgba(255,255,255,0.04)",
                        border: idx === 0 ? `1px solid ${info?.color ?? "#a855f7"}40` : "1px solid rgba(255,255,255,0.07)",
                        minWidth: "52px",
                      }}>
                      {round.winnerTeam === "joker" && <JokerCharacter size={28} />}
                      {round.winnerTeam === "batman" && <BatmanCharacter size={28} />}
                      {round.winnerTeam === "draw" && <DrawCharacter size={28} />}
                      <span className="text-[8px] font-black" style={{ color: info?.color ?? "#fff" }}>
                        ×{info?.multiplier}
                      </span>
                      <span className="text-gray-600 text-[7px]">#{round.roundNumber}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── RESULT OVERLAY ── */}
      {showResult && winnerTeam && (() => {
        const info = TEAM_INFO[winnerTeam as keyof typeof TEAM_INFO];
        return (
          <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}>
            <div className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg,#0a0520,#050510)",
                border: `1px solid ${info.color}50`,
                boxShadow: `0 0 60px ${info.glow}`,
                animation: "cb-win-pop 0.5s ease-out",
              }}>
              {/* Winner header */}
              <div className="p-5 text-center"
                style={{ background: `linear-gradient(135deg,${info.color}20,transparent)`, borderBottom: `1px solid ${info.color}25` }}>
                <p className="text-gray-400 font-black text-xs mb-3">🃏 نتيجة الجولة</p>
                <div className="flex justify-center mb-2" style={{ animation: "cb-winner-pulse 0.6s ease-in-out infinite" }}>
                  {winnerTeam === "joker" && <JokerCharacter size={80} glowing />}
                  {winnerTeam === "batman" && <BatmanCharacter size={80} glowing />}
                  {winnerTeam === "draw" && <DrawCharacter size={80} />}
                </div>
                <p className="text-white font-black text-2xl">{info.label}</p>
                <div className="inline-block mt-1 px-4 py-1 rounded-full text-sm font-black"
                  style={{ background: `${info.color}25`, color: info.color, border: `1px solid ${info.color}40` }}>
                  ×{info.multiplier}
                </div>

                {/* Winning cards display */}
                <div className="flex justify-center gap-1 mt-3">
                  {(winnerTeam === "joker" ? JOKER_CARDS : winnerTeam === "batman" ? BATMAN_CARDS : JOKER_CARDS).map((c, i) => (
                    <PlayingCard key={i} rank={c.rank} suit={c.suit} width={36} height={50}
                      style={{ animation: `cb-card-flip 0.3s ease-out ${i * 0.1}s both` }} />
                  ))}
                </div>

                {myBetMap[winnerTeam] > 0 && (
                  <div className="mt-3 p-2.5 rounded-2xl"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <p className="text-green-400 font-black text-xs">🎊 مبروك! ربحت</p>
                    <p className="text-green-300 font-black text-lg">+{fmt(myBetMap[winnerTeam] * info.multiplier)} 🪙</p>
                  </div>
                )}
              </div>

              {/* Top 3 winners */}
              <div className="p-4">
                <p className="text-gray-400 text-[10px] font-black mb-3 text-center">🏆 أعلى الفائزين في الجولة</p>
                {!topWinners || topWinners.length === 0 ? (
                  <p className="text-gray-600 text-xs text-center py-3">لا يوجد فائزون في هذه الجولة</p>
                ) : (
                  <div className="space-y-2">
                    {topWinners.map((entry: any, idx: number) => (
                      <div key={entry.userId}
                        className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
                        style={{
                          background: idx === 0 ? "rgba(245,158,11,0.12)" : idx === 1 ? "rgba(156,163,175,0.08)" : "rgba(205,127,50,0.08)",
                          border: idx === 0 ? "1px solid rgba(245,158,11,0.35)" : idx === 1 ? "1px solid rgba(156,163,175,0.2)" : "1px solid rgba(205,127,50,0.2)",
                          animation: `cb-win-pop ${0.3 + idx * 0.15}s ease-out`,
                        }}>
                        <span className="text-xl flex-shrink-0">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                          style={{ border: `2px solid ${idx === 0 ? "#f59e0b" : idx === 1 ? "#9ca3af" : "#cd7f32"}` }}>
                          {entry.profile?.avatarUrl ? (
                            <img src={entry.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-sm"
                              style={{ background: `linear-gradient(135deg,${info.color},${info.darkColor})`, color: "white" }}>
                              {entry.profile?.name?.[0] ?? "؟"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-black text-xs truncate">{entry.profile?.name ?? "مجهول"}</p>
                          <p className="text-gray-500 text-[9px]">فائز 🎉</p>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 font-black text-sm">+{fmt(entry.totalWon)}</p>
                          <p className="text-gray-600 text-[8px]">🪙</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LEADERBOARD MODAL ── */}
      {showLB && (
        <div className="absolute inset-0 z-[250] flex flex-col"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowLB(false)}>
          <div className="mt-auto w-full rounded-t-3xl flex flex-col"
            style={{ background: "#080818", border: "1px solid rgba(168,85,247,0.2)", maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <h2 className="text-white font-black text-base">🏆 المتصدرون</h2>
              <button onClick={() => setShowLB(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-3 py-3 space-y-2">
              {!leaderboard ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-10">لا يوجد لاعبون بعد</p>
              ) : (
                leaderboard.map((entry: any, idx: number) => (
                  <div key={entry._id}
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
                    style={{
                      background: idx === 0 ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
                      border: idx === 0 ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                    <span className="text-base font-black w-6 text-center flex-shrink-0">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                    </span>
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
                      {entry.profile?.avatarUrl ? (
                        <img src={entry.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-black text-xs">
                          {entry.profile?.name?.[0] ?? "؟"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-xs truncate">{entry.profile?.name ?? "مجهول"}</p>
                      <p className="text-gray-500 text-[9px]">{entry.gamesPlayed} جولة</p>
                    </div>
                    <p className="text-yellow-400 font-black text-xs">{fmt(entry.totalWon)} 🪙</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RULES MODAL ── */}
      {showRules && (
        <div className="absolute inset-0 z-[250] flex items-end"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowRules(false)}>
          <div className="w-full rounded-t-3xl p-5 space-y-4"
            style={{ background: "#0f0f1e", border: "1px solid rgba(168,85,247,0.2)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black text-lg">📖 قواعد Card Battle</h2>
              <button onClick={() => setShowRules(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl p-3"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <p className="text-purple-400 font-black mb-1">🎯 كيف تلعب؟</p>
                <p className="text-gray-300 text-xs leading-relaxed">
                  اختر مبلغ الرهان ثم اضغط على الفريق. كل جولة 20 ثانية! عند انتهاء الوقت تُكشف الأوراق. إذا فاز فريقك تحصل على مبلغك × المضاعف!
                </p>
              </div>
              <div className="rounded-2xl p-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-white font-black text-xs mb-2">🃏 الفرق والمضاعفات</p>
                <div className="space-y-2">
                  {[
                    { tk: "joker", label: "الجوكر", mult: 2, prob: "45%", color: "#a855f7" },
                    { tk: "batman", label: "باتمان", mult: 2, prob: "45%", color: "#3b82f6" },
                    { tk: "draw", label: "تعادل", mult: 8, prob: "10%", color: "#f59e0b" },
                  ].map((z) => (
                    <div key={z.tk} className="flex items-center gap-2">
                      <div style={{ width: 28, height: 28 }}>
                        {z.tk === "joker" && <JokerCharacter size={28} />}
                        {z.tk === "batman" && <BatmanCharacter size={28} />}
                        {z.tk === "draw" && <DrawCharacter size={28} />}
                      </div>
                      <span className="text-gray-300 text-xs flex-1">{z.label}</span>
                      <span className="text-xs font-black" style={{ color: z.color }}>×{z.mult}</span>
                      <span className="text-gray-600 text-[10px]">{z.prob}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowRules(false)}
              className="w-full py-3 rounded-2xl font-black text-white"
              style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
              فهمت! لنلعب 🎮
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cb-float {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        @keyframes cb-twinkle {
          0%,100% { opacity: 0.04; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.8); }
        }
        @keyframes cb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cb-win-pop {
          0% { transform: scale(0.75) translateY(20px); opacity: 0; }
          70% { transform: scale(1.04) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes cb-winner-pulse {
          0%,100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.08); filter: brightness(1.3); }
        }
        @keyframes cb-blink {
          0%,100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes cb-card-flip {
          0% { transform: rotateY(90deg) scale(0.8); opacity: 0; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
