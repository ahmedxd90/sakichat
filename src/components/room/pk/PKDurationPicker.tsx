// @ts-nocheck
import { DURATIONS } from "./PKTypes";

interface PKDurationPickerProps {
  value: number;
  onChange: (v: number) => void;
}

export default function PKDurationPicker({ value, onChange }: PKDurationPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {DURATIONS.map((d) => (
        <button
          key={d.value}
          onClick={() => onChange(d.value)}
          className="py-2.5 rounded-xl text-xs font-bold transition-all"
          style={
            value === d.value
              ? { background: "rgba(249,115,22,0.25)", border: "1px solid rgba(249,115,22,0.5)", color: "#fb923c" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
          }
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
