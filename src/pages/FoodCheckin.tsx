import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { TeamMember, Team } from '@packages/types/src';
import { CameraQRScannerModal } from '../components/CameraQRScannerModal';
import { 
  Utensils, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Camera, 
  Search, 
  RotateCcw,
  Users
} from 'lucide-react';

export const FoodCheckinPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    member?: TeamMember;
    team?: Team;
    food_preference?: 'VEG' | 'NON_VEG';
    time?: string;
  } | null>(null);

  const [members, setMembers] = useState<TeamMember[]>(store.getTeamMembers());
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const update = () => {
      setMembers(store.getTeamMembers());
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const totalMembers = members.length;
  const claimedMembers = members.filter(m => m.food_collected);
  const claimedCount = claimedMembers.length;

  const handleFoodCheckin = async (customToken?: string) => {
    const raw = (customToken || tokenInput).trim();
    if (!raw) return;

    setIsProcessing(true);
    setFeedback(null);

    const res = await store.checkinFoodApi({
      passport_token: raw,
      id: raw,
      scanned_by: 'Dining Hall Staff',
      location: 'Dining Counter A'
    });

    setIsProcessing(false);
    setTokenInput('');

    const resolvedPref = (res as any).food_preference || 
                         res.member?.food_preference || 
                         'VEG';

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.reason,
        member: res.member,
        team: res.team,
        food_preference: resolvedPref,
        time: new Date().toLocaleTimeString()
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.reason,
        member: res.member,
        team: res.team,
        food_preference: resolvedPref,
        time: new Date().toLocaleTimeString()
      });
    }
  };

  const filteredClaimed = claimedMembers.filter(m => {
    const q = filterQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) ||
           m.email.toLowerCase().includes(q) ||
           m.id.toLowerCase().includes(q);
  });

  const isNonVeg = feedback?.food_preference === 'NON_VEG';

  return (
    <div className="mx-auto w-full max-w-5xl pb-safe">
      {/* Header */}
      <div className="border-b border-slate-800 pb-fluid-4">
        <h1 className="flex items-start gap-2 text-xl font-bold text-white font-sans">
          <Utensils className="w-5 h-5 mt-0.5 shrink-0 text-amber-400" />
          <span className="min-w-0">Food & Refreshment Token Desk</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scan attendee Digital Passport QR for instant Veg / Non-Veg badge display & single-use meal lock.
        </p>
      </div>

      {/* Sticky scan console */}
      <div className="sticky top-14 lg:top-28 z-30 bg-slate-950 pt-fluid-4 pb-fluid-4">
        {/* Claimed / total counter + sync */}
        <div className="mb-fluid-3 flex items-stretch gap-fluid-2 sm:justify-end">
          <div className="flex min-h-touch flex-1 items-center justify-center gap-2 rounded-fluid border border-slate-700 bg-slate-900 px-fluid-3 py-fluid-2 text-xs font-mono sm:flex-none sm:justify-start">
            <Users className="w-4 h-4 shrink-0 text-slate-500" />
            <span className="min-w-0 break-token">
              <span className="text-slate-400">MEALS CLAIMED: </span>
              <strong className="text-amber-400 font-bold">{claimedCount}</strong>
              <span className="text-slate-500"> / {totalMembers}</span>
            </span>
          </div>
          <button
            onClick={() => store.syncFromSupabase()}
            className="tap inline-flex shrink-0 items-center justify-center rounded-fluid bg-slate-900 border border-slate-800 hover:text-white text-slate-400 cursor-pointer transition-colors"
            title="Sync Database"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Scanner Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-fluid-xl p-fluid-3 shadow-lg sm:p-fluid-5">
          <form onSubmit={(e) => { e.preventDefault(); handleFoodCheckin(); }} className="space-y-fluid-3">
            <div className="flex flex-wrap items-center justify-between gap-fluid-2">
              <label className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-amber-300 uppercase font-mono">
                <QrCode className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="break-token">SCAN ATTENDEE PASSPORT QR OR ENTER ID</span>
              </label>
              <span className="shrink-0 text-2xs bg-amber-950 text-amber-300 px-2 py-1 rounded border border-amber-500/40 font-mono font-bold">
                1-Time Food Lock Active
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-fluid-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Scan QR or paste Passport Token / Member ID..."
                className="flex-1 min-h-touch px-fluid-3 py-fluid-2 bg-slate-950 border border-slate-700 rounded-fluid text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />

              <div className="flex items-center gap-fluid-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="tap inline-flex min-h-touch items-center justify-center gap-1.5 px-fluid-3 py-fluid-2 bg-slate-800 hover:bg-slate-700 text-white rounded-fluid text-xs font-mono border border-slate-600 transition-colors cursor-pointer"
                  title="Open Camera Scanner"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden xs:inline">CAMERA</span>
                </button>

                <button
                  type="submit"
                  disabled={isProcessing || !tokenInput.trim()}
                  className="tap flex-1 sm:flex-none min-h-touch px-fluid-4 py-fluid-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs rounded-fluid transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'VALIDATING...' : 'CLAIM FOOD TOKEN'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Arm's Length Large Color-Coded PASS / FAIL Banner (Phase 6 Fix) */}
      {feedback && (
        <div className="mt-fluid-4 animate-fadeIn">
          {feedback.type === 'success' ? (
            <div className={`p-fluid-5 border-4 rounded-fluid-xl shadow-2xl transition-all ${
              isNonVeg 
                ? 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-950/50' 
                : 'bg-emerald-950/95 border-emerald-500 text-emerald-100 shadow-emerald-950/50'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-fluid-2 pb-fluid-3 border-b border-white/20">
                <div className="flex min-w-0 items-center gap-2 font-black font-mono text-lg sm:text-xl">
                  <CheckCircle2 className="w-7 h-7 shrink-0" />
                  <span className="break-token">✓ PASS — MEAL ISSUED</span>
                </div>
                <span className="shrink-0 text-xs font-mono font-bold px-2 py-1 rounded bg-black/40 border border-white/20">
                  {feedback.time}
                </span>
              </div>

              {/* Huge arm's-length meal preference indicator */}
              <div className="py-fluid-4 text-center">
                <span className="text-2xs sm:text-xs font-mono uppercase tracking-widest text-white/70 block mb-1">
                  MEAL TYPE TO DISPENSE:
                </span>
                <div className={`text-3xl sm:text-5xl font-black font-mono tracking-wider drop-shadow-md uppercase ${
                  isNonVeg ? 'text-rose-300' : 'text-emerald-300'
                }`}>
                  {isNonVeg ? '🍗 NON-VEG MEAL' : '🌱 VEG MEAL'}
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-fluid-3 pt-fluid-3 text-xs font-mono border-t border-white/20">
                <div className="min-w-0">
                  <span className="text-white/60 block text-2xs uppercase">ATTENDEE</span>
                  <strong className="text-white text-base break-token">{feedback.member?.name}</strong>
                  <span className="block text-xs text-cyan-200 break-token">{feedback.member?.id}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-white/60 block text-2xs uppercase">TOKEN SECURITY LOCK</span>
                  <strong className="text-white text-sm break-token">✓ 1-Time Food Distribution Recorded</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-fluid-4 bg-rose-950/90 border-2 border-rose-500 rounded-fluid-xl space-y-fluid-2 sm:p-fluid-5">
              <div className="flex flex-wrap items-center justify-between gap-fluid-2">
                <div className="flex min-w-0 items-center gap-2 text-rose-400 font-black font-mono text-lg">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <span className="break-token">✗ FAIL — MEAL CLAIM REJECTED</span>
                </div>
                <span className="shrink-0 text-xs font-mono text-rose-300">{feedback.time}</span>
              </div>

              <p className="text-rose-200 text-sm font-mono font-bold break-token">
                {feedback.message}
              </p>

              {feedback.member && (
                <div className="text-xs font-mono text-slate-300 pt-fluid-1 break-token flex items-center gap-2">
                  <span>Attendee: <strong className="text-white">{feedback.member.name}</strong> ({feedback.member.id})</span>
                  <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                    isNonVeg ? 'bg-rose-900 text-rose-200' : 'bg-emerald-900 text-emerald-200'
                  }`}>
                    {isNonVeg ? '🍗 NON-VEG' : '🌱 VEG'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Claimed Attendees Feed */}
      <div className="mt-fluid-5 p-fluid-3 bg-slate-900 border border-slate-800 rounded-fluid-xl shadow-xl sm:p-fluid-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-3">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Utensils className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="min-w-0">Claimed Meals ({filteredClaimed.length})</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            <input
              type="text"
              placeholder="Search meal claim..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full min-h-touch pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-fluid text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        <div className="mt-fluid-4">
          <table className="hidden md:table w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">CLAIM TIME</th>
                <th className="pb-2">PARTICIPANT</th>
                <th className="pb-2">MEMBER ID</th>
                <th className="pb-2">MEAL PREFERENCE</th>
                <th className="pb-2">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClaimed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                    No food tokens claimed yet.
                  </td>
                </tr>
              ) : (
                filteredClaimed.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pr-3 text-slate-400 whitespace-nowrap">
                      {m.food_collected_at
                        ? new Date(m.food_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Claimed'}
                    </td>
                    <td className="py-2.5 pr-3 font-bold text-white break-token">
                      {m.name} {m.is_leader && '👑'}
                    </td>
                    <td className="py-2.5 pr-3 text-cyan-400 break-token">{m.id}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                        m.food_preference === 'NON_VEG'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {m.food_preference === 'NON_VEG' ? '🍗 NON-VEG' : '🌱 VEG'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-2xs whitespace-nowrap">
                        ✓ CLAIMED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Phone: stacked cards */}
          <div className="md:hidden space-y-fluid-2">
            {filteredClaimed.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-fluid">
                No food tokens claimed yet.
              </div>
            ) : (
              filteredClaimed.map((m) => (
                <div
                  key={m.id}
                  className="p-fluid-3 bg-slate-950/60 border border-slate-800 rounded-fluid font-mono"
                >
                  <div className="flex items-start justify-between gap-fluid-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white break-token">
                        {m.name} {m.is_leader && '👑'}
                      </p>
                      <p className="text-xs text-cyan-400 break-token">{m.id}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-1 rounded text-2xs font-bold ${
                      m.food_preference === 'NON_VEG'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {m.food_preference === 'NON_VEG' ? '🍗 NON-VEG' : '🌱 VEG'}
                    </span>
                  </div>

                  <div className="mt-fluid-2 pt-fluid-2 flex items-center justify-between border-t border-slate-800/60 text-xs">
                    <span className="text-slate-500 text-2xs">
                      {m.food_collected_at
                        ? new Date(m.food_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Claimed'}
                    </span>
                    <span className="text-emerald-400 text-2xs font-bold">✓ 1-TIME MEAL ISSUED</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CameraQRScannerModal title="Scan Food Token QR" isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(scanned) => {
          handleFoodCheckin(scanned);
          setIsCameraOpen(false);
        }}
      />
    </div>
  );
};

export default FoodCheckinPage;


