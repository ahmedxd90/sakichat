// @ts-nocheck
import SVGADisplay from "./SVGADisplay";

export default function VipTitleUpload({ titlePreview, titleMediaType, uploading, onUpload }: {
  titlePreview: string | null;
  titleMediaType?: string | null;
  uploading: boolean;
  onUpload: (e: any) => void;
}) {
  const isSvga = titleMediaType === "svga" || titlePreview?.toLowerCase().includes(".svga");

  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
      <div
        className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)" }}
      >
        {titlePreview ? (
          isSvga ? (
            <SVGADisplay src={titlePreview} width={48} height={48} loop />
          ) : (
            <img src={titlePreview} alt="" className="w-full h-full object-contain" />
          )
        ) : (
          <span className="text-xl">🏷️</span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-white text-xs font-bold mb-0.5">لقب VIP</p>
        <p className="text-gray-500 text-[9px] mb-1">يظهر بجانب اسم المستخدم · يدعم PNG / GIF / SVGA</p>
        <label className="cursor-pointer">
          <span
            className="text-[10px] px-2 py-1 rounded-lg"
            style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}
          >
            {uploading ? "جارٍ الرفع..." : "اختر ملف (صورة أو SVGA)"}
          </span>
          <input
            type="file"
            accept="image/*,.svga"
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
