// @ts-nocheck
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

interface SuperLuckyBagExplosionProps {
  bagId: string;
  totalCoins: number;
  maxRecipients: number;
  senderName: string;
  onClose: () => void;
}

function formatCoinsFull(n: number) {
  return n.toLocaleString("ar-EG");
}

// ── Audio ─────────────────────────────────────────────────────────────────────
function playJetSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Jet engine - high frequency roar
    for (let j = 0; j < 4; j++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120 + j * 80, ctx.currentTime + j * 0.15);
      osc.frequency.exponentialRampToValueAtTime(400 + j * 100, ctx.currentTime + j * 0.15 + 2);
      g.gain.setValueAtTime(0, ctx.currentTime + j * 0.15);
      g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + j * 0.15 + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + j * 0.15 + 2.5);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(ctx.currentTime + j * 0.15);
      osc.stop(ctx.currentTime + j * 0.15 + 2.5);
    }
    // Whoosh noise
    const bufSize = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 1.2));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass"; filt.frequency.value = 1200; filt.Q.value = 0.3;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.6, ctx.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
    src.connect(filt); filt.connect(gn); gn.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + 3);
  } catch (e) {}
}

function playExplosionSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4));
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 300;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(1.5, ctx.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    src.connect(filt); filt.connect(gn); gn.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + 2);
  } catch (e) {}
}

function playCoinSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [1047, 1319, 1568, 2093, 2637, 3136].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.5, ctx.currentTime + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.4);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.08); o.stop(ctx.currentTime + i * 0.08 + 0.4);
    });
  } catch (e) {}
}

// ── Realistic Military Jet SVG ────────────────────────────────────────────────
function MilitaryJet({ flip = false, scale = 1 }: { flip?: boolean; scale?: number }) {
  return (
    <svg
      width={140 * scale} height={60 * scale}
      viewBox="0 0 200 80"
      fill="none"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      {/* Main fuselage */}
      <path d="M180 38 Q160 30 120 32 Q80 30 40 35 Q20 37 5 40 Q20 43 40 45 Q80 50 120 48 Q160 50 180 42Z"
        fill="#4a5568"/>
      <path d="M180 38 Q160 30 120 32 Q80 30 40 35 Q20 37 5 40 Q20 43 40 45 Q80 50 120 48 Q160 50 180 42Z"
        fill="url(#fuselageGrad)"/>
      {/* Nose cone - sharp */}
      <path d="M180 38 L200 40 L180 42Z" fill="#718096"/>
      <path d="M180 38 L198 40 L180 42Z" fill="#a0aec0"/>
      {/* Cockpit canopy */}
      <path d="M140 32 Q150 22 165 28 Q170 30 165 38 Q150 38 140 38Z" fill="#63b3ed" opacity="0.85"/>
      <path d="M142 33 Q150 25 163 30 Q167 32 163 37 Q150 37 142 37Z" fill="#90cdf4" opacity="0.6"/>
      {/* Cockpit frame */}
      <path d="M140 32 Q150 22 165 28 Q170 30 165 38 Q150 38 140 38Z"
        stroke="#4a5568" strokeWidth="1" fill="none"/>
      {/* Main delta wings */}
      <path d="M100 38 Q90 15 50 5 Q55 20 70 30 Q85 35 100 38Z" fill="#2d3748"/>
      <path d="M100 38 Q90 15 50 5 Q55 20 70 30 Q85 35 100 38Z" fill="url(#wingGrad)" opacity="0.5"/>
      <path d="M100 42 Q90 65 50 75 Q55 60 70 50 Q85 45 100 42Z" fill="#2d3748"/>
      <path d="M100 42 Q90 65 50 75 Q55 60 70 50 Q85 45 100 42Z" fill="url(#wingGrad)" opacity="0.5"/>
      {/* Wing leading edge highlight */}
      <path d="M100 38 Q90 15 50 5" stroke="#718096" strokeWidth="1.5" fill="none" opacity="0.7"/>
      <path d="M100 42 Q90 65 50 75" stroke="#718096" strokeWidth="1.5" fill="none" opacity="0.7"/>
      {/* Tail fins */}
      <path d="M30 38 Q22 25 15 22 Q18 32 25 38Z" fill="#4a5568"/>
      <path d="M30 42 Q22 55 15 58 Q18 48 25 42Z" fill="#4a5568"/>
      <path d="M35 38 Q30 28 25 25 Q28 33 33 38Z" fill="#718096" opacity="0.6"/>
      <path d="M35 42 Q30 52 25 55 Q28 47 33 42Z" fill="#718096" opacity="0.6"/>
      {/* Engine nacelles */}
      <ellipse cx="60" cy="38" rx="12" ry="5" fill="#1a202c"/>
      <ellipse cx="60" cy="38" rx="10" ry="4" fill="#2d3748"/>
      {/* Engine exhaust glow */}
      <ellipse cx="8" cy="40" rx="8" ry="5" fill="#f6ad55" opacity="0.9"/>
      <ellipse cx="4" cy="40" rx="6" ry="4" fill="#fc8181" opacity="0.8"/>
      <ellipse cx="1" cy="40" rx="4" ry="3" fill="#fbd38d" opacity="0.7"/>
      {/* Afterburner rings */}
      <ellipse cx="12" cy="40" rx="5" ry="3" fill="none" stroke="#f6ad55" strokeWidth="1" opacity="0.6"/>
      <ellipse cx="18" cy="40" rx="4" ry="2.5" fill="none" stroke="#fbd38d" strokeWidth="0.8" opacity="0.4"/>
      {/* Missiles under wings */}
      <rect x="75" y="28" width="20" height="4" rx="2" fill="#718096"/>
      <path d="M95 28 L98 30 L95 32Z" fill="#a0aec0"/>
      <rect x="75" y="48" width="20" height="4" rx="2" fill="#718096"/>
      <path d="M95 48 L98 50 L95 52Z" fill="#a0aec0"/>
      {/* Camouflage patches */}
      <path d="M120 33 Q130 31 140 33 Q135 36 120 36Z" fill="#2d3748" opacity="0.5"/>
      <path d="M90 35 Q100 33 110 35 Q105 38 90 38Z" fill="#1a202c" opacity="0.4"/>
      {/* National star marking */}
      <circle cx="115" cy="40" r="5" fill="#2b6cb0" opacity="0.8"/>
      <circle cx="115" cy="40" r="3" fill="white" opacity="0.9"/>
      <circle cx="115" cy="40" r="1.5" fill="#e53e3e" opacity="0.9"/>
      <defs>
        <linearGradient id="fuselageGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)"/>
          <stop offset="50%" stopColor="rgba(255,255,255,0.05)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)"/>
        </linearGradient>
        <linearGradient id="wingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.2)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Parachute + Chest Drop ────────────────────────────────────────────────────
function ParachuteDrop({ dropping }: { dropping: boolean }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{
        animation: dropping ? "parachuteFall 3s cubic-bezier(0.25,0.46,0.45,0.94) forwards" : undefined,
      }}
    >
      {/* Parachute canopy */}
      <svg width="100" height="80" viewBox="0 0 120 90" fill="none">
        {/* Canopy */}
        <path d="M10 50 Q60 0 110 50" fill="#dc2626" opacity="0.9"/>
        <path d="M10 50 Q60 0 110 50" fill="url(#chuteGrad)" opacity="0.6"/>
        {/* Canopy panels */}
        <path d="M10 50 Q35 5 60 2 Q60 25 60 50Z" fill="#b91c1c" opacity="0.7"/>
        <path d="M110 50 Q85 5 60 2 Q60 25 60 50Z" fill="#ef4444" opacity="0.5"/>
        <path d="M35 48 Q47 8 60 2 Q60 25 60 48Z" fill="#dc2626" opacity="0.4"/>
        <path d="M85 48 Q73 8 60 2 Q60 25 60 48Z" fill="#dc2626" opacity="0.4"/>
        {/* Vent hole */}
        <ellipse cx="60" cy="8" rx="8" ry="5" fill="rgba(255,255,255,0.3)"/>
        {/* Suspension lines */}
        {[10, 30, 50, 70, 90, 110].map((x, i) => (
          <line key={i} x1={x} y1="50" x2="60" y2="85" stroke="#fbbf24" strokeWidth="0.8" opacity="0.8"/>
        ))}
        <defs>
          <linearGradient id="chuteGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)"/>
          </linearGradient>
        </defs>
      </svg>
      {/* Golden chest hanging */}
      <GoldenChestSmall />
    </div>
  );
}

// ── Small Golden Chest ────────────────────────────────────────────────────────
function GoldenChestSmall() {
  return (
    <svg width="70" height="55" viewBox="0 0 90 70" fill="none">
      {/* Shadow */}
      <ellipse cx="45" cy="68" rx="30" ry="4" fill="rgba(0,0,0,0.3)"/>
      {/* Base */}
      <rect x="8" y="35" width="74" height="30" rx="5" fill="#92400e"/>
      <rect x="8" y="35" width="74" height="30" rx="5" fill="url(#chestSmallBase)"/>
      {/* Gold bands */}
      <rect x="8" y="35" width="74" height="6" rx="3" fill="#fbbf24"/>
      <rect x="8" y="59" width="74" height="6" rx="3" fill="#fbbf24"/>
      <rect x="8" y="35" width="6" height="30" rx="3" fill="#fbbf24"/>
      <rect x="76" y="35" width="6" height="30" rx="3" fill="#fbbf24"/>
      {/* Lid */}
      <rect x="8" y="15" width="74" height="22" rx="5" fill="#b45309"/>
      <rect x="8" y="15" width="74" height="22" rx="5" fill="url(#chestSmallLid)"/>
      <rect x="8" y="15" width="74" height="6" rx="3" fill="#fbbf24"/>
      <rect x="8" y="31" width="74" height="6" rx="3" fill="#fbbf24"/>
      {/* Lock */}
      <rect x="37" y="28" width="16" height="12" rx="3" fill="#fbbf24"/>
      <path d="M40 28 Q40 22 45 22 Q50 22 50 28" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <circle cx="45" cy="34" r="3" fill="#92400e"/>
      {/* Gems */}
      {[18, 38, 58, 72].map((x, i) => (
        <circle key={i} cx={x} cy="50" r="4"
          fill={["#ef4444","#3b82f6","#10b981","#8b5cf6"][i]}
          stroke="#fbbf24" strokeWidth="1"/>
      ))}
      {/* Shine */}
      <ellipse cx="30" cy="22" rx="12" ry="4" fill="rgba(255,255,255,0.3)" transform="rotate(-10 30 22)"/>
      <defs>
        <linearGradient id="chestSmallBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,180,0,0.4)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)"/>
        </linearGradient>
        <linearGradient id="chestSmallLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,200,0,0.5)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.2)"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Open Chest ────────────────────────────────────────────────────────────────
function OpenChest() {
  return (
    <svg width="180" height="160" viewBox="0 0 200 180" fill="none">
      {/* Ground shadow */}
      <ellipse cx="100" cy="172" rx="70" ry="8" fill="rgba(0,0,0,0.4)"/>
      {/* Base */}
      <rect x="15" y="90" width="170" height="75" rx="8" fill="#92400e"/>
      <rect x="15" y="90" width="170" height="75" rx="8" fill="url(#openChestBase)"/>
      {/* Gold bands base */}
      <rect x="15" y="90" width="170" height="10" rx="5" fill="#fbbf24"/>
      <rect x="15" y="155" width="170" height="10" rx="5" fill="#fbbf24"/>
      <rect x="15" y="90" width="10" height="75" rx="5" fill="#fbbf24"/>
      <rect x="175" y="90" width="10" height="75" rx="5" fill="#fbbf24"/>
      {/* Interior glow */}
      <rect x="25" y="100" width="150" height="55" rx="4" fill="rgba(251,191,36,0.15)"/>
      {/* Coins inside */}
      {[...Array(15)].map((_, i) => (
        <ellipse key={i}
          cx={40 + (i % 5) * 28} cy={115 + Math.floor(i / 5) * 14}
          rx="12" ry="8"
          fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"
          style={{ animation: `coinPop${i % 3} ${0.3 + i * 0.06}s ease-out forwards`, opacity: 0 }}
        />
      ))}
      {/* Lid - open (rotated back) */}
      <rect x="15" y="10" width="170" height="45" rx="8" fill="#b45309"/>
      <rect x="15" y="10" width="170" height="45" rx="8" fill="url(#openChestLid)"/>
      <rect x="15" y="10" width="170" height="10" rx="5" fill="#fbbf24"/>
      <rect x="15" y="45" width="170" height="10" rx="5" fill="#fbbf24"/>
      {/* Lock open */}
      <rect x="85" y="48" width="30" height="20" rx="4" fill="#fbbf24"/>
      <path d="M90 48 Q90 35 100 35 Q110 35 110 48" stroke="#fbbf24" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.4"/>
      {/* Gems on chest */}
      {[30, 65, 100, 135, 165].map((x, i) => (
        <circle key={i} cx={x} cy="128"
          r={6}
          fill={["#ef4444","#3b82f6","#10b981","#8b5cf6","#f59e0b"][i]}
          stroke="#fbbf24" strokeWidth="2"/>
      ))}
      {/* Shine on lid */}
      <ellipse cx="70" cy="25" rx="25" ry="7" fill="rgba(255,255,255,0.3)" transform="rotate(-8 70 25)"/>
      {/* Gold light rays */}
      {[...Array(8)].map((_, i) => (
        <line key={i}
          x1="100" y1="90"
          x2={100 + Math.cos(i * Math.PI / 4) * 80}
          y2={90 + Math.sin(i * Math.PI / 4) * 80}
          stroke="#fbbf24" strokeWidth="1.5" opacity="0.3"
          style={{ animation: `rayPulse 1.5s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
        />
      ))}
      <defs>
        <linearGradient id="openChestBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,200,0,0.4)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)"/>
        </linearGradient>
        <linearGradient id="openChestLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,220,0,0.5)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.2)"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Realistic Forest + Military Scene ────────────────────────────────────────
function ForestScene() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMax meet"
      className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="skyForest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0f1a"/>
          <stop offset="30%" stopColor="#0d1a2e"/>
          <stop offset="60%" stopColor="#1a2a1a"/>
          <stop offset="100%" stopColor="#0d1a0d"/>
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3a0a"/>
          <stop offset="100%" stopColor="#0d1a05"/>
        </linearGradient>
        <linearGradient id="treeTrunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2d1b0a"/>
          <stop offset="50%" stopColor="#4a2e0f"/>
          <stop offset="100%" stopColor="#1a0f05"/>
        </linearGradient>
        <linearGradient id="treeLeaves1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a0a"/>
          <stop offset="100%" stopColor="#0d2a05"/>
        </linearGradient>
        <linearGradient id="treeLeaves2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a5a10"/>
          <stop offset="100%" stopColor="#1a3a08"/>
        </linearGradient>
        <radialGradient id="moonForest" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,220,0.95)"/>
          <stop offset="100%" stopColor="rgba(255,255,220,0)"/>
        </radialGradient>
        <filter id="treeShadow">
          <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.5)"/>
        </filter>
        <filter id="glowFilter">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect width="400" height="600" fill="url(#skyForest)"/>

      {/* Stars */}
      {[[20,15],[60,8],[100,20],[150,5],[200,12],[250,7],[300,18],[350,4],[380,22],
        [40,35],[90,28],[140,40],[190,25],[240,32],[290,22],[340,38],[370,15],
        [15,55],[70,48],[120,60],[170,45],[220,52],[270,42],[320,58],[360,35]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={0.6 + (i%3)*0.5} fill="white"
          opacity={0.4 + (i%4)*0.15}
          style={{animation:`starTwinkle ${1.5+(i%5)*0.4}s ease-in-out infinite`,animationDelay:`${i*0.18}s`}}/>
      ))}

      {/* Moon with glow */}
      <circle cx="340" cy="45" r="30" fill="url(#moonForest)"/>
      <circle cx="340" cy="45" r="24" fill="#fef9c3"/>
      <circle cx="348" cy="40" r="18" fill="#fef08a"/>
      <circle cx="332" cy="42" r="4" fill="rgba(0,0,0,0.08)"/>
      <circle cx="344" cy="52" r="3" fill="rgba(0,0,0,0.06)"/>
      <circle cx="352" cy="38" r="2" fill="rgba(0,0,0,0.05)"/>

      {/* Distant fog/mist */}
      <path d="M0 280 Q100 265 200 272 Q300 265 400 275 L400 310 L0 310Z"
        fill="rgba(200,220,200,0.08)"/>
      <path d="M0 295 Q80 285 160 290 Q240 283 320 288 Q360 285 400 292 L400 320 L0 320Z"
        fill="rgba(180,210,180,0.06)"/>

      {/* Background trees - far */}
      {[0,30,60,90,120,150,180,210,240,270,300,330,360,390].map((x,i) => (
        <g key={i}>
          <rect x={x+8} y={220+(i%3)*15} width={8+(i%3)*2} height={80+(i%4)*20} fill="url(#treeTrunk)" opacity="0.5"/>
          <path d={`M${x} ${220+(i%3)*15} L${x+12} ${160+(i%3)*10} L${x+24} ${220+(i%3)*15}Z`}
            fill="#0d2a05" opacity="0.6"/>
          <path d={`M${x+2} ${200+(i%3)*12} L${x+12} ${148+(i%3)*8} L${x+22} ${200+(i%3)*12}Z`}
            fill="#1a3a08" opacity="0.5"/>
        </g>
      ))}

      {/* Mid trees */}
      {[[-10,0],[30,10],[80,5],[130,0],[180,8],[230,3],[280,10],[330,0],[370,5]].map(([x,dy],i) => (
        <g key={i} filter="url(#treeShadow)">
          <rect x={x+14} y={280+dy} width={12+(i%3)*3} height={120+(i%4)*25} fill="url(#treeTrunk)"/>
          {/* Pine tree layers */}
          <path d={`M${x} ${280+dy} L${x+20} ${210+dy} L${x+40} ${280+dy}Z`} fill="url(#treeLeaves1)"/>
          <path d={`M${x+3} ${258+dy} L${x+20} ${195+dy} L${x+37} ${258+dy}Z`} fill="url(#treeLeaves2)"/>
          <path d={`M${x+6} ${238+dy} L${x+20} ${182+dy} L${x+34} ${238+dy}Z`} fill="#2a5a10"/>
          <path d={`M${x+8} ${220+dy} L${x+20} ${170+dy} L${x+32} ${220+dy}Z`} fill="#3a6a18"/>
          {/* Snow on tips */}
          <path d={`M${x+16} ${170+dy} L${x+20} ${162+dy} L${x+24} ${170+dy}Z`} fill="rgba(255,255,255,0.4)"/>
        </g>
      ))}

      {/* Ground */}
      <path d="M0 390 Q100 375 200 382 Q300 375 400 385 L400 600 L0 600Z" fill="url(#groundGrad)"/>
      {/* Ground details - grass tufts */}
      {[20,50,80,110,140,170,200,230,260,290,320,350,380].map((x,i) => (
        <g key={i}>
          <path d={`M${x} 390 Q${x+3} 382 ${x+6} 390`} stroke="#2a5a10" strokeWidth="1.5" fill="none" opacity="0.7"/>
          <path d={`M${x+8} 392 Q${x+11} 383 ${x+14} 392`} stroke="#1a4a08" strokeWidth="1.5" fill="none" opacity="0.6"/>
          <path d={`M${x+4} 388 Q${x+7} 378 ${x+10} 388`} stroke="#3a6a18" strokeWidth="1.5" fill="none" opacity="0.5"/>
        </g>
      ))}

      {/* Rocks */}
      {[[30,385],[90,388],[160,383],[240,387],[310,384],[370,386]].map(([x,y],i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={8+(i%3)*4} ry={5+(i%2)*2} fill="#374151" opacity="0.8"/>
          <ellipse cx={x-2} cy={y-1} rx={6+(i%3)*3} ry={3+(i%2)*1.5} fill="#4b5563" opacity="0.6"/>
        </g>
      ))}

      {/* ── SOLDIERS ── */}
      {/* Soldier 1 - standing with rifle */}
      <g transform="translate(60, 340)">
        {/* Body */}
        <rect x="8" y="20" width="14" height="22" rx="2" fill="#2d4a1a"/>
        <rect x="8" y="20" width="14" height="22" rx="2" fill="url(#soldierCamo)"/>
        {/* Head with helmet */}
        <ellipse cx="15" cy="16" rx="8" ry="7" fill="#3d5a22"/>
        <path d="M7 14 Q15 8 23 14" fill="#2d4a1a"/>
        {/* Face */}
        <ellipse cx="15" cy="17" rx="5" ry="5" fill="#c8a882"/>
        <circle cx="13" cy="16" r="1" fill="#4a3020"/>
        <circle cx="17" cy="16" r="1" fill="#4a3020"/>
        <path d="M13 19 Q15 21 17 19" stroke="#8b6040" strokeWidth="0.8" fill="none"/>
        {/* Arms */}
        <rect x="2" y="22" width="6" height="14" rx="2" fill="#2d4a1a" transform="rotate(-15 5 22)"/>
        <rect x="22" y="22" width="6" height="14" rx="2" fill="#2d4a1a" transform="rotate(10 25 22)"/>
        {/* Legs */}
        <rect x="8" y="40" width="6" height="18" rx="2" fill="#1a2d0a"/>
        <rect x="16" y="40" width="6" height="18" rx="2" fill="#1a2d0a"/>
        {/* Boots */}
        <rect x="7" y="56" width="8" height="5" rx="1" fill="#1a1a0a"/>
        <rect x="15" y="56" width="8" height="5" rx="1" fill="#1a1a0a"/>
        {/* Rifle */}
        <rect x="-5" y="24" width="28" height="3" rx="1" fill="#4a3020"/>
        <rect x="18" y="22" width="4" height="7" rx="1" fill="#3a2010"/>
        <rect x="-8" y="24.5" width="6" height="2" rx="0.5" fill="#5a4030"/>
        {/* Backpack */}
        <rect x="22" y="20" width="8" height="14" rx="2" fill="#3d5a22"/>
        <defs>
          <pattern id="soldierCamo" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="#2d4a1a"/>
            <rect x="0" y="0" width="3" height="3" fill="#1a2d0a" opacity="0.6"/>
            <rect x="4" y="4" width="3" height="3" fill="#3d5a22" opacity="0.5"/>
            <rect x="2" y="5" width="2" height="2" fill="#1a2d0a" opacity="0.4"/>
          </pattern>
        </defs>
      </g>

      {/* Soldier 2 - crouching */}
      <g transform="translate(290, 355)">
        <rect x="6" y="18" width="14" height="18" rx="2" fill="#2d4a1a"/>
        <ellipse cx="13" cy="14" rx="7" ry="6" fill="#3d5a22"/>
        <path d="M6 12 Q13 7 20 12" fill="#2d4a1a"/>
        <ellipse cx="13" cy="15" rx="4.5" ry="4.5" fill="#c8a882"/>
        <circle cx="11" cy="14" r="0.8" fill="#4a3020"/>
        <circle cx="15" cy="14" r="0.8" fill="#4a3020"/>
        {/* Crouching legs */}
        <path d="M6 36 Q4 44 8 48 Q12 44 12 36Z" fill="#1a2d0a"/>
        <path d="M14 36 Q16 44 20 48 Q22 44 20 36Z" fill="#1a2d0a"/>
        <rect x="5" y="46" width="7" height="4" rx="1" fill="#1a1a0a"/>
        <rect x="17" y="46" width="7" height="4" rx="1" fill="#1a1a0a"/>
        {/* Rifle aimed */}
        <rect x="-8" y="20" width="30" height="3" rx="1" fill="#4a3020" transform="rotate(-10 10 20)"/>
      </g>

      {/* Soldier 3 - with binoculars */}
      <g transform="translate(170, 345)">
        <rect x="8" y="20" width="14" height="22" rx="2" fill="#2d4a1a"/>
        <ellipse cx="15" cy="15" rx="8" ry="7" fill="#3d5a22"/>
        <path d="M7 13 Q15 7 23 13" fill="#2d4a1a"/>
        <ellipse cx="15" cy="16" rx="5" ry="5" fill="#c8a882"/>
        <circle cx="13" cy="15" r="1" fill="#4a3020"/>
        <circle cx="17" cy="15" r="1" fill="#4a3020"/>
        {/* Binoculars */}
        <rect x="3" y="22" width="8" height="5" rx="2" fill="#1a1a1a"/>
        <rect x="12" y="22" width="8" height="5" rx="2" fill="#1a1a1a"/>
        <circle cx="7" cy="24.5" r="2.5" fill="#2d3748" stroke="#4a5568" strokeWidth="0.5"/>
        <circle cx="16" cy="24.5" r="2.5" fill="#2d3748" stroke="#4a5568" strokeWidth="0.5"/>
        <rect x="8" y="40" width="6" height="18" rx="2" fill="#1a2d0a"/>
        <rect x="16" y="40" width="6" height="18" rx="2" fill="#1a2d0a"/>
        <rect x="7" y="56" width="8" height="5" rx="1" fill="#1a1a0a"/>
        <rect x="15" y="56" width="8" height="5" rx="1" fill="#1a1a0a"/>
      </g>

      {/* ── HORSES ── */}
      {/* Horse 1 */}
      <g transform="translate(100, 340)">
        {/* Body */}
        <ellipse cx="30" cy="30" rx="28" ry="16" fill="#5a3a1a"/>
        <ellipse cx="30" cy="30" rx="28" ry="16" fill="url(#horseBodyGrad)"/>
        {/* Neck */}
        <path d="M48 20 Q55 10 52 5 Q48 8 44 15 Q46 18 48 20Z" fill="#5a3a1a"/>
        {/* Head */}
        <ellipse cx="52" cy="8" rx="10" ry="7" fill="#5a3a1a"/>
        <path d="M58 5 Q65 3 64 8 Q60 10 58 8Z" fill="#5a3a1a"/>
        {/* Eye */}
        <circle cx="55" cy="7" r="2" fill="#1a0a00"/>
        <circle cx="55.5" cy="6.5" r="0.8" fill="white" opacity="0.7"/>
        {/* Nostril */}
        <ellipse cx="62" cy="9" rx="1.5" ry="1" fill="#3a1a00"/>
        {/* Mane */}
        <path d="M48 5 Q50 0 52 3 Q54 0 56 3 Q58 0 60 3" stroke="#2a1a00" strokeWidth="2" fill="none"/>
        <path d="M44 10 Q46 5 48 8 Q50 4 52 7" stroke="#2a1a00" strokeWidth="1.5" fill="none"/>
        {/* Tail */}
        <path d="M2 28 Q-5 20 -8 25 Q-5 30 2 32" stroke="#3a2010" strokeWidth="3" fill="none"/>
        <path d="M2 28 Q-6 35 -9 30" stroke="#2a1a00" strokeWidth="2" fill="none"/>
        {/* Legs */}
        <rect x="12" y="42" width="7" height="22" rx="3" fill="#4a2a0a"/>
        <rect x="22" y="42" width="7" height="22" rx="3" fill="#4a2a0a"/>
        <rect x="34" y="42" width="7" height="22" rx="3" fill="#4a2a0a"/>
        <rect x="44" y="42" width="7" height="22" rx="3" fill="#4a2a0a"/>
        {/* Hooves */}
        {[12,22,34,44].map((x,i) => (
          <rect key={i} x={x} y={62} width={7} height={4} rx="2" fill="#1a0a00"/>
        ))}
        {/* Saddle */}
        <path d="M20 18 Q30 14 40 18 Q38 24 30 24 Q22 24 20 18Z" fill="#8b4513"/>
        <path d="M22 18 Q30 15 38 18 Q36 22 30 22 Q24 22 22 18Z" fill="#a0522d"/>
        {/* Rider silhouette */}
        <rect x="24" y="4" width="12" height="16" rx="2" fill="#2d4a1a"/>
        <ellipse cx="30" cy="2" rx="6" ry="5" fill="#3d5a22"/>
        <defs>
          <linearGradient id="horseBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,200,150,0.2)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)"/>
          </linearGradient>
        </defs>
      </g>

      {/* Horse 2 - galloping */}
      <g transform="translate(310, 348) scale(0.85)">
        <ellipse cx="30" cy="28" rx="26" ry="14" fill="#3a2a1a"/>
        <path d="M46 18 Q53 8 50 3 Q46 6 42 13 Q44 16 46 18Z" fill="#3a2a1a"/>
        <ellipse cx="50" cy="6" rx="9" ry="6" fill="#3a2a1a"/>
        <path d="M56 3 Q63 1 62 6 Q58 8 56 6Z" fill="#3a2a1a"/>
        <circle cx="53" cy="5" r="1.8" fill="#1a0a00"/>
        <circle cx="53.5" cy="4.5" r="0.7" fill="white" opacity="0.7"/>
        <path d="M46 3 Q48 -2 50 1 Q52 -2 54 1" stroke="#1a0a00" strokeWidth="2" fill="none"/>
        <path d="M2 26 Q-4 18 -7 23 Q-4 28 2 30" stroke="#2a1a00" strokeWidth="2.5" fill="none"/>
        {/* Galloping legs */}
        <path d="M10 40 Q8 52 12 58 Q16 52 14 40Z" fill="#2a1a0a"/>
        <path d="M20 42 Q22 54 26 58 Q28 52 24 42Z" fill="#2a1a0a"/>
        <path d="M32 40 Q28 52 32 58 Q36 52 36 40Z" fill="#2a1a0a"/>
        <path d="M44 38 Q46 50 50 54 Q52 48 48 38Z" fill="#2a1a0a"/>
        {[10,20,32,44].map((x,i) => (
          <ellipse key={i} cx={x+3} cy={58} rx={4} ry={2} fill="#1a0a00"/>
        ))}
        <path d="M18 16 Q28 12 38 16 Q36 22 28 22 Q20 22 18 16Z" fill="#6b3410"/>
        <rect x="22" y="2" width="12" height="14" rx="2" fill="#2d4a1a"/>
        <ellipse cx="28" cy="0" rx="6" ry="5" fill="#3d5a22"/>
      </g>

      {/* Campfire */}
      <g transform="translate(220, 370)">
        {/* Logs */}
        <rect x="-12" y="12" width="24" height="5" rx="2" fill="#4a2e0f" transform="rotate(-20 0 14)"/>
        <rect x="-12" y="12" width="24" height="5" rx="2" fill="#3a2010" transform="rotate(20 0 14)"/>
        {/* Flames */}
        <path d="M0 12 Q-5 4 -2 0 Q0 5 2 0 Q5 4 0 12Z" fill="#f97316" opacity="0.9"
          style={{animation:"flameFlicker 0.5s ease-in-out infinite"}}/>
        <path d="M0 12 Q-3 6 0 2 Q3 6 0 12Z" fill="#fbbf24" opacity="0.8"
          style={{animation:"flameFlicker 0.4s ease-in-out infinite",animationDelay:"0.1s"}}/>
        <path d="M0 12 Q-1 8 0 5 Q1 8 0 12Z" fill="white" opacity="0.6"
          style={{animation:"flameFlicker 0.3s ease-in-out infinite",animationDelay:"0.05s"}}/>
        {/* Glow */}
        <ellipse cx="0" cy="14" rx="15" ry="5" fill="rgba(249,115,22,0.2)"/>
      </g>

      {/* Military tent */}
      <g transform="translate(330, 340)">
        <path d="M0 50 L25 10 L50 50Z" fill="#2d4a1a"/>
        <path d="M0 50 L25 10 L50 50Z" fill="url(#tentGrad)" opacity="0.5"/>
        <path d="M5 50 L25 15 L45 50Z" fill="#1a2d0a" opacity="0.4"/>
        <line x1="25" y1="10" x2="25" y2="0" stroke="#4a3020" strokeWidth="2"/>
        <circle cx="25" cy="0" r="2" fill="#fbbf24"/>
        <path d="M15 50 L20 35 L30 35 L35 50Z" fill="#0d1a05"/>
        <defs>
          <linearGradient id="tentGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)"/>
          </linearGradient>
        </defs>
      </g>

      {/* Searchlight beam */}
      <path d="M50 380 L80 200 L120 200 L100 380Z" fill="rgba(255,255,200,0.04)"/>
      <ellipse cx="75" cy="380" rx="25" ry="8" fill="rgba(255,255,200,0.15)"
        style={{animation:"searchlight 3s ease-in-out infinite"}}/>
    </svg>
  );
}

// ── Falling Coins ─────────────────────────────────────────────────────────────
function FallingCoins({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(25)].map((_, i) => (
        <div key={i} className="absolute"
          style={{
            left: `${3 + (i * 3.8) % 94}%`,
            top: "-30px",
            animation: `coinFall ${1.0 + (i % 6) * 0.25}s ease-in forwards`,
            animationDelay: `${i * 0.1}s`,
          }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
            <circle cx="14" cy="14" r="10" fill="#f59e0b"/>
            <circle cx="14" cy="14" r="7" fill="#fbbf24" opacity="0.5"/>
            <text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400e">$</text>
            <ellipse cx="10" cy="10" rx="3" ry="2" fill="rgba(255,255,255,0.4)" transform="rotate(-30 10 10)"/>
          </svg>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SuperLuckyBagExplosion({
  bagId, totalCoins, maxRecipients, senderName, onClose,
}: SuperLuckyBagExplosionProps) {
  const [phase, setPhase] = useState<"jets" | "drop" | "land" | "open" | "claimed">("jets");
  const [chestOpen, setChestOpen] = useState(false);
  const [coinsRaining, setCoinsRaining] = useState(false);
  const [claimedCoins, setClaimedCoins] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasClaimed, setHasClaimed] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const checkClaimed = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('lucky_bag_claims').select('*').eq('bag_id', bagId).eq('user_id', user.id).single();
      setHasClaimed(!!data);
    };
    checkClaimed();
  }, [bagId]);

  const claimBag = async (args: any) => {};

  useEffect(() => {
    playJetSound();
    const t1 = setTimeout(() => { playExplosionSound(); setPhase("drop"); }, 2800);
    const t2 = setTimeout(() => setPhase("land"), 5500);
    const t3 = setTimeout(() => setPhase("open"), 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleOpen = async () => {
    if (loading || hasClaimed) return;
    setLoading(true);
    try {
      const coins = await claimBag({ bagId });
      setChestOpen(true);
      setCoinsRaining(true);
      playCoinSound();
      setClaimedCoins(coins);
      setPhase("claimed");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] overflow-hidden" style={{ background: "#050a05" }}>
      {/* Forest + Military scene */}
      <ForestScene />

      {/* Falling coins */}
      <FallingCoins active={coinsRaining} />

      {/* ── JETS PHASE ── */}
      {phase === "jets" && (
        <>
          {/* Jet 1 - left to right */}
          <div className="absolute" style={{ top: "12%", animation: "jetSweepLR 2.8s ease-in forwards", zIndex: 15 }}>
            <MilitaryJet />
          </div>
          {/* Jet 2 - right to left */}
          <div className="absolute" style={{ top: "22%", animation: "jetSweepRL 2.5s ease-in forwards", zIndex: 15 }}>
            <MilitaryJet flip />
          </div>
          {/* Jet 3 - smaller, higher */}
          <div className="absolute" style={{ top: "6%", animation: "jetSweepLR2 2.2s ease-in forwards", zIndex: 15 }}>
            <MilitaryJet scale={0.7} />
          </div>
          {/* Jet 4 */}
          <div className="absolute" style={{ top: "30%", animation: "jetSweepRL2 3s ease-in forwards", zIndex: 15 }}>
            <MilitaryJet flip scale={0.8} />
          </div>
          {/* Explosion flashes */}
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: `${8 + (i%4)*6}px`, height: `${8 + (i%4)*6}px`,
                left: `${15 + (i*6.5)%70}%`, top: `${5 + (i*5.3)%35}%`,
                background: ["#fbbf24","#ef4444","#f97316","#ffffff"][i%4],
                animation: `flashParticle ${0.6+(i%3)*0.3}s ease-out forwards`,
                animationDelay: `${0.5+i*0.15}s`,
                opacity: 0,
              }}
            />
          ))}
          {/* Smoke trails */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: `${20+i*8}px`, height: `${20+i*8}px`,
                left: `${20+(i*12)%60}%`, top: `${8+(i*7)%25}%`,
                background: "rgba(150,150,150,0.3)",
                animation: `smokeExpand ${1+i*0.2}s ease-out forwards`,
                animationDelay: `${0.8+i*0.2}s`,
                opacity: 0,
              }}
            />
          ))}
        </>
      )}

      {/* ── DROP PHASE ── */}
      {phase === "drop" && (
        <div className="absolute" style={{ left: "50%", transform: "translateX(-50%)", zIndex: 20, animation: "parachuteDrop 2.7s cubic-bezier(0.25,0.46,0.45,0.94) forwards" }}>
          <ParachuteDrop dropping />
        </div>
      )}

      {/* ── LAND PHASE ── */}
      {(phase === "land" || phase === "open") && !chestOpen && (
        <div className="absolute flex flex-col items-center"
          style={{ bottom: "28%", left: "50%", transform: "translateX(-50%)", zIndex: 20, animation: "chestBounce 0.5s ease-out forwards" }}>
          <GoldenChestSmall />
        </div>
      )}

      {/* ── OPEN CHEST ── */}
      {(phase === "claimed" || chestOpen) && (
        <div className="absolute flex flex-col items-center"
          style={{ bottom: "22%", left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
          <OpenChest />
        </div>
      )}

      {/* ── OPEN BUTTON ── */}
      {phase === "open" && !chestOpen && (
        <div className="absolute flex flex-col items-center gap-3"
          style={{ bottom: "8%", left: "50%", transform: "translateX(-50%)", zIndex: 30, animation: "btnAppear 0.5s ease-out forwards" }}>
          {hasClaimed ? (
            <div className="px-6 py-4 rounded-2xl text-center" style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <p className="text-gray-300 text-sm font-bold">لقد فتحت هذه الحقيبة مسبقاً ✅</p>
              <button onClick={onClose} className="mt-2 text-gray-400 text-xs underline">إغلاق</button>
            </div>
          ) : (
            <>
              <div className="text-center px-4 py-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(251,191,36,0.3)" }}>
                <p className="text-yellow-300 font-black text-lg">🎁 حقيبة حظ سوبر!</p>
                <p className="text-gray-300 text-sm">من <span className="text-yellow-400 font-bold">{senderName}</span></p>
                <p className="text-gray-400 text-xs mt-1">{formatCoinsFull(totalCoins)} 🪙 لـ {maxRecipients} شخص</p>
              </div>
              <button onClick={handleOpen} disabled={loading}
                className="px-10 py-4 rounded-2xl text-black font-black text-xl active:scale-95 transition-transform disabled:opacity-60 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b,#fbbf24)", backgroundSize: "200% 100%", animation: "btnShimmer 2s linear infinite", boxShadow: "0 6px 30px rgba(251,191,36,0.8), 0 0 60px rgba(251,191,36,0.4)" }}>
                {loading
                  ? <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"/>
                  : <><span>افتح الصندوق</span><span className="text-2xl">🔓</span></>
                }
              </button>
              <button onClick={onClose} className="text-gray-500 text-xs">تخطي</button>
            </>
          )}
        </div>
      )}

      {/* ── CLAIMED RESULT ── */}
      {phase === "claimed" && claimedCoins !== null && (
        <div className="absolute flex flex-col items-center gap-4"
          style={{ top: "10%", left: "50%", transform: "translateX(-50%)", zIndex: 40, animation: "claimReveal 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards", whiteSpace: "nowrap" }}>
          <div className="px-8 py-6 rounded-3xl text-center"
            style={{ background: "linear-gradient(135deg,rgba(0,0,0,0.9),rgba(20,10,0,0.95))", border: "2px solid rgba(251,191,36,0.7)", boxShadow: "0 0 50px rgba(251,191,36,0.5), 0 0 100px rgba(251,191,36,0.2)" }}>
            <p className="text-yellow-300 text-base font-bold mb-2">🎉 مبروك!</p>
            <p className="text-white font-black text-5xl mb-2">{formatCoinsFull(claimedCoins)}</p>
            <p className="text-yellow-400 text-xl font-bold">🪙 عملة ذهبية</p>
            <p className="text-gray-400 text-sm mt-2">تمت إضافتها لحسابك فوراً ✅</p>
          </div>
          <button onClick={onClose}
            className="px-10 py-4 rounded-2xl text-black font-black text-lg active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow: "0 4px 25px rgba(251,191,36,0.6)" }}>
            رائع! 🎊
          </button>
        </div>
      )}

      {/* Sender info */}
      <div className="absolute top-4 left-0 right-0 flex justify-center" style={{ zIndex: 25 }}>
        <div className="px-4 py-2 rounded-2xl flex items-center gap-2"
          style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(251,191,36,0.4)" }}>
          <span className="text-yellow-400 text-lg">🎁</span>
          <span className="text-white text-sm font-bold">{senderName}</span>
          <span className="text-gray-400 text-xs">أرسل حقيبة حظ سوبر!</span>
        </div>
      </div>

      <style>{`
        @keyframes jetSweepLR {
          0% { left: -20%; opacity: 0; }
          5% { opacity: 1; }
          100% { left: 115%; opacity: 0.9; }
        }
        @keyframes jetSweepRL {
          0% { right: -20%; left: auto; opacity: 0; }
          5% { opacity: 1; }
          100% { right: 115%; left: auto; opacity: 0.9; }
        }
        @keyframes jetSweepLR2 {
          0% { left: -15%; opacity: 0; }
          8% { opacity: 1; }
          100% { left: 110%; opacity: 0.7; }
        }
        @keyframes jetSweepRL2 {
          0% { right: -15%; left: auto; opacity: 0; }
          8% { opacity: 1; }
          100% { right: 110%; left: auto; opacity: 0.7; }
        }
        @keyframes flashParticle {
          0% { transform: scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes smokeExpand {
          0% { transform: scale(0); opacity: 0; }
          30% { opacity: 0.5; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes parachuteDrop {
          0% { top: -20%; opacity: 0; }
          10% { opacity: 1; }
          100% { top: 30%; opacity: 1; }
        }
        @keyframes chestBounce {
          0% { transform: translateX(-50%) translateY(-20px); }
          40% { transform: translateX(-50%) translateY(8px); }
          70% { transform: translateX(-50%) translateY(-5px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        @keyframes coinFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
        @keyframes coinPop0 {
          0% { transform: translate(0,0) scale(0); opacity: 0; }
          100% { transform: translate(-40px,30px) scale(1); opacity: 1; }
        }
        @keyframes coinPop1 {
          0% { transform: translate(0,0) scale(0); opacity: 0; }
          100% { transform: translate(0,35px) scale(1); opacity: 1; }
        }
        @keyframes coinPop2 {
          0% { transform: translate(0,0) scale(0); opacity: 0; }
          100% { transform: translate(40px,30px) scale(1); opacity: 1; }
        }
        @keyframes claimReveal {
          0% { transform: translateX(-50%) scale(0.4); opacity: 0; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes btnAppear {
          0% { transform: translateX(-50%) translateY(40px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes btnShimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes flameFlicker {
          0%, 100% { transform: scaleX(1) scaleY(1); }
          33% { transform: scaleX(1.3) scaleY(0.85); }
          66% { transform: scaleX(0.8) scaleY(1.15); }
        }
        @keyframes searchlight {
          0%, 100% { transform: translateX(0); opacity: 0.15; }
          50% { transform: translateX(60px); opacity: 0.25; }
        }
        @keyframes rayPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
