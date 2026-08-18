// مستويات العائلة
export const FAMILY_LEVELS = [
  {level:0,name:"مبتدئ",  min:0,      max:5000,   color:"#9ca3af",emoji:"🌱"},
  {level:1,name:"برونزي", min:5000,   max:15000,  color:"#cd7f32",emoji:"🥉"},
  {level:2,name:"فضي",    min:15000,  max:35000,  color:"#c0c0c0",emoji:"🥈"},
  {level:3,name:"ذهبي",   min:35000,  max:75000,  color:"#fbbf24",emoji:"🥇"},
  {level:4,name:"بلاتيني",min:75000,  max:155000, color:"#e5e4e2",emoji:"💠"},
  {level:5,name:"ماسي",   min:155000, max:315000, color:"#b9f2ff",emoji:"💎"},
  {level:6,name:"ملكي",   min:315000, max:635000, color:"#a855f7",emoji:"👑"},
  {level:7,name:"أسطوري", min:635000, max:1275000,color:"#f97316",emoji:"🔥"},
  {level:8,name:"خرافي",  min:1275000,max:2555000,color:"#ec4899",emoji:"⚡"},
  {level:9,name:"إلهي",   min:2555000,max:5115000,color:"#06b6d4",emoji:"🌟"},
  {level:10,name:"أبدي",  min:5115000,max:Infinity,color:"#ffffff",emoji:"♾️"},
];

export const WITHDRAW_TIERS = [120000,240000,360000,480000,600000,720000];

export function getLvl(d: number) {
  for (let i = FAMILY_LEVELS.length - 1; i >= 0; i--)
    if (d >= FAMILY_LEVELS[i].min) return FAMILY_LEVELS[i];
  return FAMILY_LEVELS[0];
}

export function getLvlProg(d: number) {
  const l = getLvl(d);
  if (l.max === Infinity) return 100;
  return Math.min(100, Math.floor(((d - l.min) / (l.max - l.min)) * 100));
}

export type FamilyView =
  | "list" | "create" | "my_family" | "settings"
  | "edit_family" | "requests" | "revenue"
  | "my_info" | "withdraw" | "leaderboard";
