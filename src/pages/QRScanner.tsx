import React, { useState } from 'react';
import { store } from '../services/store';
import { QrCode, CheckCircle2, AlertTriangle, Camera } from 'lucide-react';
import { CameraQRScannerModal } from '../components/CameraQRScannerModal';

export const QRScannerPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleLookup = (customInput?: string) => {
    const token = (customInput || tokenInput).trim();
    if (!token) return;

    const lookup = store.lookupEntity(token);
    if (lookup.member) {
      const member = lookup.member;
      const team = lookup.team || store.getTeamById(member.team_id);
      const attendance = store.getAttendance().filter(a => a.member_id === member.id);
      const isCheckedIn = attendance.some(a => a.checkin_type === 'ENTRY');
      const eventCheckins = attendance.filter(a => a.checkin_type === 'EVENT');

      setResult({
        found: true,
        member,
        team,
        isCheckedIn,
        attendance,
        eventCheckins
      });
    } else {
      setResult({
        found: false,
        message: `No participant or team matching Passport Token / ID / Email "${token}" found.`
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-fluid-5">
      <div className="border-b border-slate-800 pb-fluid-3">
        <h1 className="text-xl font-bold text-white font-sans flex items-start gap-2">
          <QrCode className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <span className="min-w-0">Universal Passport &amp; Badge Inspector</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scan Digital Passport QR or enter Member ID / Team ID to inspect full access status.
        </p>
      </div>

      <div className="p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid-xl space-y-fluid-3 shadow-lg">
        {/* The scan input stays reachable while a tall result panel scrolls
            beneath it. z-30 keeps it under the navbar's z-50. */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleLookup(); }}
          className="sticky top-14 sm:top-16 lg:top-28 z-30 bg-slate-900 pb-fluid-2 space-y-3"
        >
          <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
            Scan Passport QR or Enter Token / ID / Email
          </label>
          <div className="flex flex-col xs:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Scan QR token hex code or ID..."
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                className="w-full min-h-touch pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:border-indigo-400 focus:outline-none uppercase font-mono font-bold"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="tap px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-700 shrink-0"
                title="Scan with Camera"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="tap flex-1 xs:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl inline-flex items-center justify-center cursor-pointer transition-colors font-mono shadow-md"
              >
                INSPECT
              </button>
            </div>
          </div>
        </form>

        {result && (
          <div className="pt-fluid-3 border-t border-slate-800">
            {result.found ? (
              <div className="p-fluid-4 bg-slate-950 border border-emerald-500/50 rounded-fluid-lg space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono min-w-0">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="break-token">PASSPORT CREDENTIAL VALIDATED</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-400 break-token">{result.member.id}</span>
                </div>

                <div className="min-w-0">
                  <div className="text-white font-bold text-base font-sans break-token">{result.member.name}</div>
                  <div className="text-slate-300 break-token">{result.team?.college} &bull; {result.team?.team_name}</div>
                  <div className="text-slate-400 text-xs font-mono break-token">{result.team?.department} (Year {result.team?.year})</div>
                  <div className="text-slate-500 text-2xs font-mono pt-1 break-token">
                    Token: {result.member.passport_token || 'N/A'}
                  </div>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 min-w-0">
                    <span className="text-2xs text-slate-500 block uppercase">1. GATE STATUS</span>
                    <span className={`font-bold break-token ${result.isCheckedIn ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.isCheckedIn ? '✓ ADMITTED' : 'NOT ENTERED'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 min-w-0">
                    <span className="text-2xs text-slate-500 block uppercase">2. FOOD TOKEN</span>
                    <span className={`font-bold break-token ${result.member.food_collected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.member.food_collected ? '✓ CLAIMED' : 'READY TO CLAIM'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 min-w-0 xs:col-span-2">
                    <span className="text-2xs text-slate-500 block uppercase break-token">3. REGISTERED EVENTS ({result.team?.registered_events.length || 0})</span>
                    <div className="flex flex-wrap items-start gap-1 mt-1 min-w-0">
                      {result.team?.registered_events.map((evId: string) => {
                        const isAdmitted = result.eventCheckins.some((a: any) => a.event_id === evId);
                        const ev = store.getEventById(evId);
                        return (
                          <span
                            key={evId}
                            className={`px-2 py-0.5 rounded text-2xs font-mono max-w-full break-token ${
                              isAdmitted
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-900 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isAdmitted ? '✓ ' : ''}{ev?.code ? `[${ev.code}] ` : ''}{ev?.mission_name || evId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-fluid-3 bg-rose-950/80 border border-rose-500/50 rounded-fluid-lg text-rose-300 text-xs flex items-start gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="min-w-0 break-token">{result.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <CameraQRScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(scannedToken) => {
          setIsCameraOpen(false);
          setTokenInput(scannedToken);
          handleLookup(scannedToken);
        }}
        title="Inspect Digital Passport QR"
        subtitle="Hold attendee Passport QR in camera view"
      />
    </div>
  );
};

export default QRScannerPage;
