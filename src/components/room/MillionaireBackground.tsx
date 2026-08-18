export default function MillionaireBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 30%, #001a4d 0%, #000d2e 40%, #000510 100%)"
      }} />
      <div className="absolute inset-0">
        {[0,1,2,3,4,5].map((i) => (
          <div key={i} className="absolute bottom-0"
            style={{
              left: `${10 + i * 16}%`,
              width: "1px",
              height: "65%",
              background: `linear-gradient(to top, rgba(255,215,0,0.12), transparent)`,
              transform: `rotate(${-12 + i * 5}deg)`,
              transformOrigin: "bottom center",
              animation: `mill-beam ${3 + i * 0.4}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>
      {[...Array(16)].map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 23 + 8) % 90}%`,
            background: i % 3 === 0 ? "#ffd700" : i % 3 === 1 ? "#fff" : "#4fc3f7",
            opacity: 0.3 + (i % 4) * 0.1,
            animation: `mill-twinkle ${2 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.3) % 3}s`,
          }}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-28"
        style={{ background: "linear-gradient(to top, rgba(0,20,60,0.7), transparent)" }} />
      <div className="absolute top-0 left-0 right-0 h-20"
        style={{ background: "linear-gradient(to bottom, rgba(0,5,20,0.8), transparent)" }} />
      <style>{`
        @keyframes mill-beam { 0%{opacity:0.2} 100%{opacity:0.6} }
        @keyframes mill-twinkle { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.6)} }
      `}</style>
    </div>
  );
}
