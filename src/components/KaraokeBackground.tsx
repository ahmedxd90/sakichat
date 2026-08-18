// Saki Karaoke theme: deep violet stage background with a quiet center for seat overlays.
const KARAOKE_BACKGROUND = "/manus-storage/saki-karaoke-room-bg_465f7a38.png";

export default function KaraokeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#10021f]" aria-hidden="true">
      <img
        src={KARAOKE_BACKGROUND}
        alt=""
        className="h-full w-full object-cover object-center"
        style={{ filter: "saturate(1.08) contrast(1.06) brightness(0.68)" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(168,85,247,0.32),transparent_48%),linear-gradient(180deg,rgba(19,3,39,0.18),rgba(10,1,22,0.72))]" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(90deg,transparent,rgba(217,70,239,0.22),transparent)] opacity-80" />
    </div>
  );
}

export { KARAOKE_BACKGROUND };

/* Karaoke visual rule: violet stage light, dark center, no competing text or cards. */
// The image URL is owned by the WebDev project lifecycle; do not replace with a local asset path.
