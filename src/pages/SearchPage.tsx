import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { VipName, VipBadge } from "../components/VipBadge";
import { ARAB_COUNTRIES } from "../data/countries";
import LevelBadgeInline from "../components/LevelBadgeInline";
import { toast } from "sonner";
import CopySakiId from "../components/CopySakiId";

interface SearchPageProps {
  onBack: () => void;
  onUserSelect: (userId: Id<"users">) => void;
}

export default function SearchPage({ onBack, onUserSelect }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const results = useQuery(api.social.searchUsers, { query });
  const followAll = useMutation(api.followAll.followAll);
  const [followingAll, setFollowingAll] = useState(false);

  const handleFollowAll = async () => {
    if (!results || results.length === 0) return;
    setFollowingAll(true);
    try {
      const ids = results.map((u) => u.userId) as Id<"users">[];
      const count = await followAll({ userIds: ids });
      toast.success(`تمت متابعة ${count} مستخدم ✅`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setFollowingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f0f1a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو saki_id..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-gray-500 hover:text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-4">
        {!query.trim() ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">ابحث عن مستخدمين</p>
            <p className="text-gray-600 text-xs mt-1">بالاسم أو رقم saki_id</p>
          </div>
        ) : !results ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-400 text-sm">لا توجد نتائج لـ "{query}"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header row with count + follow all */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs">{results.length} نتيجة</p>
              <button
                onClick={handleFollowAll}
                disabled={followingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #a855f7, #ec4899)",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(168,85,247,0.4)",
                }}
              >
                {followingAll ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ...</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    <span>متابعة الجميع</span>
                  </>
                )}
              </button>
            </div>

            {results.map((user) => {
              const isVip = user.isVip ?? false;
              const country = ARAB_COUNTRIES.find((c) => c.code === user.country);
              return (
                <button
                  key={user._id}
                  onClick={() => {
                    if ((user as any).isPrivateProfile) {
                      toast("هذا ملف شخصي خاص، لا يمكنك الدخول إليه", { duration: 2500 });
                      return;
                    }
                    onUserSelect(user.userId);
                  }}
                  className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 hover:border-purple-500/30 hover:bg-white/8 transition-all active:scale-98 text-right"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-lg">{user.name[0]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isVip ? (
                        <VipName name={user.name} level={user.vipLevel} />
                      ) : (
                        <p className="text-white font-semibold text-sm">{user.name}</p>
                      )}
                      {isVip && <VipBadge size="sm" level={user.vipLevel} />}
                      <LevelBadgeInline wealthLevel={user.wealthLevel} charismaLevel={user.charismaLevel} size="xs" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CopySakiId sakiId={user.sakiId} color="#a78bfa" fontSize={11} />
                      {country && <span className="text-gray-500 text-xs">{country.flag} {country.name}</span>}
                    </div>
                    {user.bio && <p className="text-gray-500 text-xs truncate mt-0.5">{user.bio}</p>}
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1 text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      <span className="text-xs">{user.followersCount ?? 0}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
