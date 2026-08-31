import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { AttendanceRecord, Team, TeamMember, EventMission } from '@packages/types/src';
import { CameraQRScannerModal } from '../components/CameraQRScannerModal';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Users,
  QrCode,
  Camera,
  ShieldCheck,
  Search,
  RotateCcw
} from 'lucide-react';

export const EventCheckinPage: React.FC = () => {
  const [allEvents, setAllEvents] = useState<EventMission[]>(store.getEvents());
  const [selectedEventId, setSelectedEventId] = useState<string>(allEvents[0]?.id || '');
  const [tokenInput, setTokenInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    member?: TeamMember;
    team?: Team;
    registered_events?: any[];
    time?: string;
  } | null>(null);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    store.getAttendance().filter(a => a.checkin_type === 'EVENT')
  );
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const update = () => {
      const evs = store.getEvents();
      setAllEvents(evs);
      if (!selectedEventId && evs[0]) {
        setSelectedEventId(evs[0].id);
      }
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'EVENT'));
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, [selectedEventId]);

  const selectedEvent = allEvents.find(e => e.id === selectedEventId);
  const currentEventAttendance = attendance.filter(a => a.event_id === selectedEventId);

  const handleEventCheckin = async (customToken?: string) => {
    const raw = (customToken || tokenInput).trim();
    if (!raw) return;

    if (!selectedEventId) {
      setFeedback({
        type: 'error',
        message: 'Please select an active Competition Event Track first.'
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    const res = await store.checkinEventApi({
      passport_token: raw,
      id: raw,
      event_id: selectedEventId,
      scanned_by: `Coordinator - ${selectedEvent?.code || 'Event Desk'}`,
      location: selectedEvent?.venue || 'Event Venue'
    });

    setIsProcessing(false);
    setTokenInput('');

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.reason,
        member: res.member,
        team: res.team,
        registered_events: res.registered_events,
        time: new Date().toLocaleTimeString()
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.reason,
        member: res.member,
        team: res.team,
        registered_events: res.registered_events,
        time: new Date().toLocaleTimeString()
      });
    }
  };

  const filteredAttendance = currentEventAttendance.filter(a => {
    const q = filterQuery.toLowerCase();
    return a.participant_name.toLowerCase().includes(q) ||
           a.college.toLowerCase().includes(q) ||
           (a.member_id && a.member_id.toLowerCase().includes(q));
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-fluid-5 pb-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-3 border-b border-slate-800 pb-fluid-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <Zap className="w-5 h-5 shrink-0 text-indigo-400" />
            <span className="min-w-0">Event Track Check-in Desk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scan attendee Digital Passport QR to verify team event registration & record 1-time track entry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-fluid-2">
          <div className="px-3 py-2 rounded-fluid bg-slate-900 border border-slate-700 text-xs font-mono">
            <span className="text-slate-400">TRACK ATTENDEES: </span>
            <strong className="text-indigo-400 font-bold">{currentEventAttendance.length}</strong>
          </div>
          <button
            onClick={() => store.syncFromSupabase()}
            className="tap inline-flex items-center justify-center rounded-fluid bg-slate-900 border border-slate-800 hover:text-white text-slate-400 cursor-pointer"
            title="Sync Database"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Active Event Selector (Set Once per Shift) */}
      <div className="p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid-lg space-y-fluid-3 shadow-lg">
        <label
          htmlFor="event-track-select"
          className="text-xs font-bold text-indigo-300 uppercase font-mono flex items-start gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
          <span className="min-w-0 break-token">ACTIVE EVENT TRACK (SET ONCE PER ROOM/SHIFT)</span>
        </label>
        {/* `w-full` + the global `min-width:0` keeps the very long option labels
            from stretching this card past the viewport — the native control
            truncates its own text instead. */}
        <select
          id="event-track-select"
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setFeedback(null);
          }}
          className="block w-full max-w-full min-h-touch truncate px-3.5 py-3 bg-slate-950 border border-slate-700 text-white rounded-fluid text-xs focus:border-indigo-400 focus:outline-none font-mono font-bold"
        >
          {allEvents.map((evt) => (
            <option key={evt.id} value={evt.id}>
              [{evt.event_type}] {evt.code} — {evt.mission_name} ({evt.venue})
            </option>
          ))}
        </select>
        {/* Selected-track detail: stacked definition list on phones, a row from
            the `xs` breakpoint up. */}
        {selectedEvent && (
          <dl className="grid grid-cols-1 xs:grid-cols-3 gap-fluid-2 font-mono px-fluid-3 py-fluid-2 bg-indigo-950 border border-indigo-500/40 rounded-fluid">
            <div className="min-w-0">
              <dt className="text-2xs uppercase tracking-wider text-indigo-400/80">Code</dt>
              <dd className="text-xs text-indigo-300 break-token">{selectedEvent.code}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-2xs uppercase tracking-wider text-indigo-400/80">Venue</dt>
              <dd className="text-xs text-indigo-300 break-token">{selectedEvent.venue}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-2xs uppercase tracking-wider text-indigo-400/80">Schedule</dt>
              <dd className="text-xs text-indigo-300 break-token">{selectedEvent.schedule_time}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* 2. Scanner Form */}
      <div className="p-fluid-5 bg-slate-900 border border-slate-800 rounded-fluid-lg space-y-fluid-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-fluid-2">
          <label
            htmlFor="event-scan-input"
            className="text-xs font-bold text-indigo-300 flex items-start gap-1.5 uppercase font-mono min-w-0"
          >
            <QrCode className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="min-w-0 break-token">SCAN ATTENDEE PASSPORT QR OR ENTER ID</span>
          </label>
          <span className="text-2xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40 font-mono">
            1 Scan per Event Lock
          </span>
        </div>

        {/* Scan bar sticks below the navbar (z-20 < the navbar's z-50) so the
            input stays reachable while a long PASS/FAIL banner scrolls under it. */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleEventCheckin(); }}
          className="sticky top-16 lg:top-28 z-20 bg-slate-900 py-fluid-2"
        >
          <div className="flex flex-col gap-fluid-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <input
                id="event-scan-input"
                type="text"
                autoFocus
                disabled={isProcessing}
                placeholder="Scan QR token or type Member ID (e.g. ZIN26-XXXXXX-M1)..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full min-h-touch px-3.5 py-3 bg-slate-950 border border-slate-700 text-white rounded-fluid text-xs focus:border-indigo-400 focus:outline-none font-mono font-bold"
              />
            </div>

            <div className="flex gap-fluid-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex-1 sm:flex-none min-h-touch min-w-touch px-fluid-3 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-fluid inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
                title="Scan with Camera"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Camera</span>
              </button>

              <button
                type="submit"
                disabled={isProcessing || !tokenInput.trim()}
                className="flex-[2] sm:flex-none min-h-touch px-fluid-4 sm:px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-fluid cursor-pointer transition-all shadow-md font-mono whitespace-nowrap"
              >
                {isProcessing ? 'VALIDATING...' : 'ADMIT TO TRACK'}
              </button>
            </div>
          </div>
        </form>

        {/* 3. Big PASS / FAIL Banner with Full Registered Events List */}
        {feedback && (
          <div className="pt-2 animate-fadeIn">
            {feedback.type === 'success' ? (
              <div className="p-fluid-4 bg-emerald-950/80 border-2 border-emerald-500 rounded-fluid-lg space-y-fluid-3">
                <div className="flex flex-wrap items-start justify-between gap-fluid-2">
                  <div className="flex items-start gap-2 text-emerald-400 font-black font-mono text-base min-w-0">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <span className="min-w-0 break-token">✓ PASS — ADMITTED TO {selectedEvent?.mission_name.toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-300 shrink-0">{feedback.time}</span>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-fluid-3 pt-fluid-2 text-xs font-mono border-t border-emerald-800/50">
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-2xs">ATTENDEE</span>
                    <strong className="text-white text-sm break-token">{feedback.member?.name}</strong>
                    <span className="block text-xs text-cyan-300 break-token">{feedback.member?.id}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-2xs">TEAM & COLLEGE</span>
                    <strong className="text-emerald-200 break-token">{feedback.team?.team_name} &bull; {feedback.team?.college}</strong>
                  </div>
                </div>

                {/* Coordinator Visual Confirmation: All Registered Events */}
                {feedback.team && (
                  <div className="pt-fluid-2 border-t border-emerald-800/40">
                    <span className="text-2xs text-emerald-400 font-mono uppercase tracking-wider block mb-fluid-2 break-token">
                      TEAM'S FULL REGISTERED TRACKS (VISUAL CONFIRMATION):
                    </span>
                    <div className="flex flex-wrap gap-fluid-2">
                      {feedback.team.registered_events.map(evId => {
                        const isCurrent = evId === selectedEventId;
                        const ev = store.getEventById(evId);
                        return (
                          <span
                            key={evId}
                            className={`max-w-full break-token px-2.5 py-1.5 rounded-fluid text-xs font-mono font-bold ${
                              isCurrent
                                ? 'bg-emerald-500 text-black shadow-md'
                                : 'bg-slate-900 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isCurrent && '🎯 '}{ev?.code ? `[${ev.code}] ` : ''}{ev?.mission_name || evId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-fluid-4 bg-rose-950/90 border-2 border-rose-500 rounded-fluid-lg space-y-fluid-3">
                <div className="flex flex-wrap items-start justify-between gap-fluid-2">
                  <div className="flex items-start gap-2 text-rose-400 font-black font-mono text-base min-w-0">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <span className="min-w-0 break-token">✗ FAIL — TRACK ENTRY REJECTED</span>
                  </div>
                  <span className="text-xs font-mono text-rose-300 shrink-0">{feedback.time}</span>
                </div>

                <p className="text-rose-200 text-xs font-mono font-bold break-token">
                  {feedback.message}
                </p>

                {feedback.team && (
                  <div className="pt-fluid-2 border-t border-rose-800/40">
                    <span className="text-2xs text-slate-400 font-mono uppercase tracking-wider block mb-fluid-2 break-token">
                      Team "{feedback.team.team_name}" is only registered for:
                    </span>
                    <div className="flex flex-wrap gap-fluid-2">
                      {feedback.team.registered_events.length === 0 ? (
                        <span className="text-xs font-mono text-rose-300">No events registered</span>
                      ) : (
                        feedback.team.registered_events.map(evId => {
                          const ev = store.getEventById(evId);
                          return (
                            <span key={evId} className="max-w-full break-token px-2 py-1 rounded bg-slate-900 text-slate-300 text-xs font-mono border border-slate-700">
                              {ev?.code ? `[${ev.code}] ` : ''}{ev?.mission_name || evId}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Live Checked-in Attendees Table for this Event */}
      <div className="p-fluid-5 bg-slate-900 border border-slate-800 rounded-fluid-lg space-y-fluid-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-3">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="min-w-0 break-token">Admitted to {selectedEvent?.mission_name} ({filteredAttendance.length})</span>
          </h2>

          <div className="relative w-full sm:w-64 sm:shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter admitted attendee..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full min-h-touch pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-fluid text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>
        </div>

        {/* Phones get the same rows as stacked cards — no column is dropped. */}
        <ul className="md:hidden space-y-fluid-2 font-mono">
          {filteredAttendance.length === 0 ? (
            <li className="py-fluid-5 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-fluid">
              No attendees verified for this event yet.
            </li>
          ) : (
            filteredAttendance.map((a, idx) => (
              <li
                key={a.id || idx}
                className="p-fluid-3 bg-slate-950/60 border border-slate-800 rounded-fluid space-y-fluid-2"
              >
                <div className="flex items-start justify-between gap-fluid-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white break-token">{a.participant_name}</p>
                    <p className="text-2xs text-slate-500 break-token">{a.member_id}</p>
                  </div>
                  <span className="shrink-0 text-2xs text-slate-400">
                    {new Date(a.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <dl className="grid grid-cols-1 xs:grid-cols-2 gap-fluid-2 text-xs">
                  <div className="min-w-0">
                    <dt className="text-2xs uppercase tracking-wider text-slate-500">COLLEGE</dt>
                    <dd className="text-slate-300 break-token">{a.college}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-2xs uppercase tracking-wider text-slate-500">LOCATION</dt>
                    <dd className="text-slate-400 break-token">{a.location}</dd>
                  </div>
                  <div className="min-w-0 xs:col-span-2">
                    <dt className="text-2xs uppercase tracking-wider text-slate-500">SCANNED BY</dt>
                    <dd className="text-indigo-400 break-token">{a.scanned_by}</dd>
                  </div>
                </dl>
              </li>
            ))
          )}
        </ul>

        <div className="hidden md:block overflow-x-auto scrollbar-none">
          <table className="hidden md:table w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 pr-fluid-3 whitespace-nowrap">TIME</th>
                <th className="pb-2 pr-fluid-3">PARTICIPANT</th>
                <th className="pb-2 pr-fluid-3">COLLEGE</th>
                <th className="pb-2 pr-fluid-3">LOCATION</th>
                <th className="pb-2">SCANNED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                    No attendees verified for this event yet.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a, idx) => (
                  <tr key={a.id || idx} className="hover:bg-slate-800/40 transition-colors align-top">
                    <td className="py-2.5 pr-fluid-3 text-slate-400 whitespace-nowrap">
                      {new Date(a.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 pr-fluid-3 font-bold text-white break-token">
                      {a.participant_name}
                      <span className="block text-2xs text-slate-500 font-normal break-token">{a.member_id}</span>
                    </td>
                    <td className="py-2.5 pr-fluid-3 text-slate-300 break-token">{a.college}</td>
                    <td className="py-2.5 pr-fluid-3 text-slate-400 break-token">{a.location}</td>
                    <td className="py-2.5 text-indigo-400 break-token">{a.scanned_by}</td>
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
          handleEventCheckin(scannedToken);
        }}
        title={`Scan for ${selectedEvent?.mission_name}`}
        subtitle="Hold attendee Digital Passport QR within camera view"
      />
    </div>
  );
};

export default EventCheckinPage;
