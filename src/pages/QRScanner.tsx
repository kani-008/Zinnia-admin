import React, { useState } from 'react';
import { store } from '../services/store';
import { QrCode, Search, CheckCircle2, AlertTriangle, Utensils, Zap, Shield, Camera } from 'lucide-react';
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
    <div className="max-w-xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white font-sans flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-400" />
          Universal Passport & Badge Inspector
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scan Digital Passport QR or enter Member ID / Team ID to inspect full access status.
        </p>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
        <form onSubmit={(e) => { e.preventDefault(); handleLookup(); }} className="space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
            Scan Passport QR or Enter Token / ID / Email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                autoFocus
                placeholder="Scan QR token hex code or ID..."
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:border-indigo-400 focus:outline-none uppercase font-mono font-bold"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
              title="Scan with Camera"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors font-mono shadow-md"
            >
              INSPECT
            </button>
          </div>
        </form>

        {result && (
          <div className="pt-4 border-t border-slate-800">
            {result.found ? (
              <div className="p-5 bg-slate-950 border border-emerald-500/50 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PASSPORT CREDENTIAL VALIDATED</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-400">{result.member.id}</span>
                </div>

                <div>
                  <div className="text-white font-bold text-base font-sans">{result.member.name}</div>
                  <div className="text-slate-300">{result.team?.college} &bull; {result.team?.team_name}</div>
                  <div className="text-slate-400 text-[11px] font-mono">{result.team?.department} (Year {result.team?.year})</div>
                  <div className="text-slate-500 text-[10px] font-mono pt-1">
                    Token: {result.member.passport_token || 'N/A'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">1. GATE STATUS</span>
                    <span className={`font-bold ${result.isCheckedIn ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.isCheckedIn ? '✓ ADMITTED' : 'NOT ENTERED'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">2. FOOD TOKEN</span>
                    <span className={`font-bold ${result.member.food_collected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.member.food_collected ? '✓ CLAIMED' : 'READY TO CLAIM'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase">3. REGISTERED EVENTS ({result.team?.registered_events.length || 0})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.team?.registered_events.map((evId: string) => {
                        const isAdmitted = result.eventCheckins.some((a: any) => a.event_id === evId);
                        const ev = store.getEventById(evId);
                        return (
                          <span 
                            key={evId} 
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
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
              <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{result.message}</span>
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
