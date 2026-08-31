import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { AttendanceRecord, Team, TeamMember } from '@packages/types/src';
import { CameraQRScannerModal } from '../components/CameraQRScannerModal';
import {
  DoorOpen,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  UserCheck,
  Search,
  Camera,
  RotateCcw
} from 'lucide-react';

export const EntryCheckinPage: React.FC = () => {
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

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    store.getAttendance().filter(a => a.checkin_type === 'ENTRY')
  );
  const [teams, setTeams] = useState<Team[]>(store.getTeams());
  const [members, setMembers] = useState<TeamMember[]>(store.getTeamMembers());
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const update = () => {
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'ENTRY'));
      setTeams(store.getTeams());
      setMembers(store.getTeamMembers());
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const totalMembers = members.length;
  const checkedInCount = attendance.length;

  const handleEntryCheckin = async (customToken?: string) => {
    const raw = (customToken || tokenInput).trim();
    if (!raw) return;

    setIsProcessing(true);
    setFeedback(null);

    const res = await store.checkinEntryApi({
      passport_token: raw,
      id: raw,
      scanned_by: 'Main Campus Gate Coordinator',
      location: 'Gate 1'
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

  const filteredAttendance = attendance.filter(a => {
    const q = filterQuery.toLowerCase();
    return a.participant_name.toLowerCase().includes(q) ||
           a.college.toLowerCase().includes(q) ||
           (a.member_id && a.member_id.toLowerCase().includes(q));
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-fluid-5 pb-safe">
      {/* Header */}
      <div className="flex flex-col gap-fluid-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-fluid-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <DoorOpen className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="min-w-0 break-token">Campus Gate Entry Scanner</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 break-token">
            Scan attendee Digital Passport QR (or enter Member ID) for one-time admission.
          </p>
        </div>

        {/* Live Counters — full-width strip under the title on phones */}
        <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
          <div className="flex-1 sm:flex-none min-w-0 px-3 py-fluid-3 rounded-fluid bg-slate-900 border border-slate-700 text-xs font-mono text-center sm:text-left break-token">
            <span className="text-slate-400">GATE ADMISSIONS: </span>
            <strong className="text-cyan-400 font-bold">{checkedInCount}</strong>
            <span className="text-slate-500"> / {totalMembers}</span>
          </div>
          <button
            onClick={() => store.syncFromSupabase()}
            className="tap inline-flex items-center justify-center shrink-0 rounded-fluid bg-slate-900 border border-slate-800 hover:text-white text-slate-400 cursor-pointer"
            title="Sync Database"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scanner Box — stays pinned under the navbar so the log scrolls beneath it */}
      <div className="sticky top-14 lg:top-28 z-30 p-fluid-5 bg-slate-900 border border-slate-800 rounded-fluid-xl space-y-fluid-3 shadow-xl max-h-[78dvh] overflow-y-auto scroll-touch">
        <form onSubmit={(e) => { e.preventDefault(); handleEntryCheckin(); }} className="space-y-fluid-3">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase font-mono min-w-0">
              <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="min-w-0 break-token">SCAN PASSPORT QR TOKEN OR ENTER MEMBER ID</span>
            </label>
            <span className="text-2xs bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 font-mono shrink-0">
              1-Time Gate Lock
            </span>
          </div>

          <div className="flex flex-col gap-fluid-2 sm:flex-row sm:gap-2">
            <div className="relative min-w-0 sm:flex-1">
              <input
                type="text"
                autoFocus
                disabled={isProcessing}
                placeholder="Scan QR token hex code or type Member ID (e.g. ZIN26-XXXXXX-M1)..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full min-h-touch pl-3 pr-3 py-3 bg-slate-950 border border-slate-700 text-white rounded-fluid text-xs focus:border-cyan-400 focus:outline-none font-mono font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="tap flex-1 sm:flex-none px-3 sm:px-4 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-fluid inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
                title="Scan with Web Camera"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Camera</span>
              </button>

              <button
                type="submit"
                disabled={isProcessing || !tokenInput.trim()}
                className="tap flex-[2] sm:flex-none px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs rounded-fluid cursor-pointer transition-all shadow-md font-mono"
              >
                {isProcessing ? 'VALIDATING...' : 'ADMIT PASS'}
              </button>
            </div>
          </div>
        </form>

        {/* Big PASS / FAIL Status Result Banner */}
        {feedback && (
          <div className="pt-2 animate-fadeIn">
            {feedback.type === 'success' ? (
              <div className="p-fluid-4 bg-emerald-950/80 border-2 border-emerald-500 rounded-fluid-xl space-y-fluid-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-black font-mono text-base min-w-0">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <span className="min-w-0 break-token">✓ PASS — GATE ADMISSION GRANTED</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-300 shrink-0">{feedback.time}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-fluid-3 pt-2 text-xs font-mono border-t border-emerald-800/50">
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-2xs">PARTICIPANT NAME</span>
                    <strong className="text-white text-sm break-token">{feedback.member?.name || 'Attendee'}</strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-2xs">TEAM & COLLEGE</span>
                    <strong className="text-emerald-200 break-token">{feedback.team?.team_name || 'Team'} &bull; {feedback.team?.college}</strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-2xs">MEMBER ID</span>
                    <strong className="text-cyan-300 break-token">{feedback.member?.id}</strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-2xs">REASON</span>
                    <span className="text-slate-300 break-token">{feedback.message}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-fluid-4 bg-rose-950/90 border-2 border-rose-500 rounded-fluid-xl space-y-fluid-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-black font-mono text-base min-w-0">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <span className="min-w-0 break-token">✗ FAIL — GATE ENTRY REJECTED</span>
                  </div>
                  <span className="text-xs font-mono text-rose-300 shrink-0">{feedback.time}</span>
                </div>
                <p className="text-rose-200 text-xs font-mono font-bold break-token">
                  {feedback.message}
                </p>
                {feedback.member && (
                  <div className="text-xs font-mono text-slate-400 pt-1 break-token">
                    Participant: <strong className="text-white">{feedback.member.name}</strong> ({feedback.member.id})
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Recent Admissions Table */}
      <div className="p-fluid-5 bg-slate-900 border border-slate-800 rounded-fluid-xl space-y-fluid-4 shadow-xl">
        <div className="flex flex-col gap-fluid-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2 min-w-0">
            <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="min-w-0 break-token">Recent Gate Check-ins ({filteredAttendance.length})</span>
          </h2>

          <div className="relative w-full sm:w-auto sm:min-w-[16rem]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search checked-in attendee..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full min-h-touch pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-fluid text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        {/* Phone: stacked cards carrying every column of the table below */}
        <ul className="md:hidden space-y-fluid-3">
          {filteredAttendance.length === 0 ? (
            <li className="py-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-fluid">
              No gate entries recorded yet.
            </li>
          ) : (
            filteredAttendance.map((a, idx) => (
              <li
                key={a.id || idx}
                className="p-fluid-3 bg-slate-950/60 border border-slate-800 rounded-fluid font-mono text-xs space-y-fluid-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-2xs text-slate-500">PARTICIPANT</span>
                    <strong className="block font-bold text-white break-token">{a.participant_name}</strong>
                    <span className="block text-2xs text-slate-500 font-normal break-token">{a.member_id}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-2xs text-slate-500">TIME</span>
                    <span className="text-slate-400">
                      {new Date(a.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <dl className="grid grid-cols-1 xs:grid-cols-2 gap-fluid-2 pt-fluid-2 border-t border-slate-800/60">
                  <div className="min-w-0">
                    <dt className="text-2xs text-slate-500">COLLEGE</dt>
                    <dd className="text-slate-300 break-token">{a.college}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-2xs text-slate-500">LOCATION</dt>
                    <dd className="text-slate-400 break-token">{a.location || 'Main Gate'}</dd>
                  </div>
                  <div className="min-w-0 xs:col-span-2">
                    <dt className="text-2xs text-slate-500">SCANNED BY</dt>
                    <dd className="text-cyan-400 break-token">{a.scanned_by}</dd>
                  </div>
                </dl>
              </li>
            ))
          )}
        </ul>

        {/* Tablet & up: the real table */}
        <div className="hidden md:block overflow-x-auto scrollbar-none">
          <table className="hidden md:table w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 pr-3 font-bold whitespace-nowrap">TIME</th>
                <th className="pb-2 pr-3 font-bold">PARTICIPANT</th>
                <th className="pb-2 pr-3 font-bold">COLLEGE</th>
                <th className="pb-2 pr-3 font-bold">LOCATION</th>
                <th className="pb-2 font-bold">SCANNED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                    No gate entries recorded yet.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a, idx) => (
                  <tr key={a.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pr-3 text-slate-400 whitespace-nowrap align-top">
                      {new Date(a.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 pr-3 font-bold text-white break-token align-top">
                      {a.participant_name}
                      <span className="block text-2xs text-slate-500 font-normal break-token">{a.member_id}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300 break-token align-top">{a.college}</td>
                    <td className="py-2.5 pr-3 text-slate-400 break-token align-top">{a.location || 'Main Gate'}</td>
                    <td className="py-2.5 text-cyan-400 break-token align-top">{a.scanned_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera QR Modal */}
      <CameraQRScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(scannedToken) => {
          setIsCameraOpen(false);
          handleEntryCheckin(scannedToken);
        }}
        title="Scan Participant Passport QR"
        subtitle="Hold the attendee's digital passport QR within camera view"
      />
    </div>
  );
};

export default EntryCheckinPage;
