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
      scanned_by: 'Dining Hall Coordinator',
      location: 'Dining Counter A'
    });

    setIsProcessing(false);
    setTokenInput('');

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.reason,
        member: res.member,
        team: res.team,
        time: new Date().toLocaleTimeString()
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.reason,
        member: res.member,
        team: res.team,
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

  return (
    <div className="mx-auto w-full max-w-5xl pb-safe">
      {/* Header */}
      <div className="border-b border-slate-800 pb-fluid-4">
        <h1 className="flex items-start gap-2 text-xl font-bold text-white font-sans">
          <Utensils className="w-5 h-5 mt-0.5 shrink-0 text-amber-400" />
          <span className="min-w-0">Food & Refreshment Token Desk</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scan attendee Digital Passport QR for 1-time lunch token distribution lock.
        </p>
      </div>

      {/*
        Sticky scan console: on a phone the counter strip sits directly under the
        title as a full-width bar, and both it and the scan input stay pinned
        while the claimed list scrolls beneath. The offset tracks the navbar's
        real height and sits under its z-50: ~57px on phones (min-h-touch row +
        py-fluid-2 + border), but ~112px from `lg`, where the h-16 header row
        gains the desktop link rail beneath it. Matches the other scanner pages.
      */}
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
              <span className="shrink-0 text-2xs bg-amber-950 text-amber-300 px-2 py-1 rounded border border-amber-500/40 font-mono">
                1-Time Food Lock
              </span>
            </div>

            <div className="flex flex-col gap-fluid-2 sm:flex-row sm:items-stretch">
              <input
                type="text"
                autoFocus
                disabled={isProcessing}
                placeholder="Scan QR token hex code or type Member ID (e.g. ZIN26-XXXXXX-M1)..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full min-h-touch px-fluid-3 py-3 bg-slate-950 border border-slate-700 text-white rounded-fluid text-sm focus:border-amber-400 focus:outline-none font-mono font-bold sm:w-auto sm:flex-1"
              />

              <div className="flex gap-fluid-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="tap inline-flex flex-1 items-center justify-center gap-1.5 px-fluid-4 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-fluid cursor-pointer transition-colors border border-slate-700 sm:flex-none"
                  title="Scan with Camera"
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>Camera</span>
                </button>

                <button
                  type="submit"
                  disabled={isProcessing || !tokenInput.trim()}
                  className="tap inline-flex flex-[1.6] items-center justify-center px-fluid-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-fluid cursor-pointer transition-all shadow-md font-mono sm:flex-none sm:px-fluid-6"
                >
                  {isProcessing ? 'VALIDATING...' : 'CLAIM FOOD TOKEN'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Big PASS / FAIL Banner — sits below the sticky console so a tall
          result card can never be pinned off-screen. */}
      {feedback && (
        <div className="mt-fluid-4 animate-fadeIn">
          {feedback.type === 'success' ? (
            <div className="p-fluid-4 bg-emerald-950/80 border-2 border-emerald-500 rounded-fluid-xl space-y-fluid-3 sm:p-fluid-5">
              <div className="flex flex-wrap items-center justify-between gap-fluid-2">
                <div className="flex min-w-0 items-center gap-2 text-emerald-400 font-black font-mono text-lg">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span className="break-token">✓ PASS — MEAL TOKEN CLAIMED</span>
                </div>
                <span className="shrink-0 text-xs font-mono text-emerald-300">{feedback.time}</span>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-fluid-3 pt-fluid-3 text-xs font-mono border-t border-emerald-800/50">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-2xs">PARTICIPANT</span>
                  <strong className="text-white text-base break-token">{feedback.member?.name}</strong>
                  <span className="block text-xs text-cyan-300 break-token">{feedback.member?.id}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block text-2xs">STATUS</span>
                  <strong className="text-emerald-200 text-sm break-token">1 Meal Issued &bull; Food Lock Active</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-fluid-4 bg-rose-950/90 border-2 border-rose-500 rounded-fluid-xl space-y-fluid-2 sm:p-fluid-5">
              <div className="flex flex-wrap items-center justify-between gap-fluid-2">
                <div className="flex min-w-0 items-center gap-2 text-rose-400 font-black font-mono text-lg">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <span className="break-token">✗ FAIL — FOOD TOKEN REJECTED</span>
                </div>
                <span className="shrink-0 text-xs font-mono text-rose-300">{feedback.time}</span>
              </div>

              <p className="text-rose-200 text-sm font-mono font-bold break-token">
                {feedback.message}
              </p>

              {feedback.member && (
                <div className="text-xs font-mono text-slate-400 pt-fluid-1 break-token">
                  Participant: <strong className="text-white">{feedback.member.name}</strong> ({feedback.member.id})
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
          {/* Tablet / desktop: real table */}
          <table className="hidden md:table w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">CLAIM TIME</th>
                <th className="pb-2">PARTICIPANT</th>
                <th className="pb-2">MEMBER ID</th>
                <th className="pb-2">PHONE</th>
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
                    <td className="py-2.5 pr-3 text-slate-400 break-token">{m.phone}</td>
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

          {/* Phone: the same rows as stacked cards */}
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
                    <span className="shrink-0 px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-2xs whitespace-nowrap">
                      ✓ CLAIMED
                    </span>
                  </div>

                  <div className="mt-fluid-2 pt-fluid-2 grid grid-cols-2 gap-fluid-2 border-t border-slate-800/60">
                    <div className="min-w-0">
                      <span className="block text-2xs text-slate-500">CLAIM TIME</span>
                      <span className="block text-xs text-slate-300">
                        {m.food_collected_at
                          ? new Date(m.food_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Claimed'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-2xs text-slate-500">PHONE</span>
                      <span className="block text-xs text-slate-300 break-token">{m.phone}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Camera QR Modal */}
      <CameraQRScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(scannedToken) => {
          setIsCameraOpen(false);
          handleFoodCheckin(scannedToken);
        }}
        title="Scan Participant Passport for Lunch Token"
        subtitle="Hold attendee Digital Passport QR within camera view"
      />
    </div>
  );
};

export default FoodCheckinPage;
