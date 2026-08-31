import React, { useState, useEffect, useMemo } from 'react';
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
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [tokenInput, setTokenInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const authUser = store.getAuthUser();
  const isCoordinator = authUser?.role === 'EVENT_COORDINATOR';
  const allowedEvents: string[] = authUser?.allowed_events || [];

  const displayedEvents = useMemo(() => {
    if (isCoordinator && allowedEvents.length > 0) {
      const filtered = allEvents.filter(e => allowedEvents.includes(e.id) || allowedEvents.includes(e.code));
      return filtered.length > 0 ? filtered : allEvents;
    }
    return allEvents;
  }, [allEvents, isCoordinator, allowedEvents]);

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
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'EVENT'));
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  useEffect(() => {
    if (displayedEvents.length > 0) {
      if (!selectedEventId || !displayedEvents.some(e => e.id === selectedEventId)) {
        setSelectedEventId(displayedEvents[0].id);
      }
    }
  }, [displayedEvents, selectedEventId]);

  const selectedEvent = displayedEvents.find(e => e.id === selectedEventId) || allEvents.find(e => e.id === selectedEventId);
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
      scanned_by: authUser?.name ? `${authUser.name} (${selectedEvent?.code || 'Desk'})` : `Coordinator - ${selectedEvent?.code || 'Event Desk'}`,
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
            Scan attendee Digital Passport QR to verify team event registration &amp; record single-use track entry.
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

      {/* 1. Active Event Selector (Scoped to coordinator permissions per Phase 7) */}
      <div className="p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid-lg space-y-fluid-3 shadow-lg">
        <label
          htmlFor="event-track-select"
          className="text-xs font-bold text-indigo-300 uppercase font-mono flex items-start gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
          <span className="min-w-0 break-token">
            {displayedEvents.length === 1 ? 'ASSIGNED COMPETITION TRACK' : 'ACTIVE EVENT TRACK (SELECT ROOM/TRACK)'}
          </span>
        </label>

        {displayedEvents.length === 1 ? (
          <div className="p-3.5 bg-indigo-950/70 border border-indigo-500/50 rounded-fluid flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div className="font-mono">
              <span className="text-2xs text-indigo-400 uppercase tracking-wider block font-bold">COORDINATOR ASSIGNMENT</span>
              <strong className="text-white text-sm block">[{displayedEvents[0].code}] {displayedEvents[0].mission_name}</strong>
              <span className="text-slate-400 text-xs block">Venue: {displayedEvents[0].venue} &bull; Coordinator: {authUser?.name || 'Authorized'}</span>
            </div>
            <span className="shrink-0 self-start xs:self-auto px-2.5 py-1 bg-indigo-900/80 border border-indigo-400/40 text-indigo-200 text-2xs font-mono font-bold rounded-md">
              🔒 ASSIGNED TRACK
            </span>
          </div>
        ) : (
          <select
            id="event-track-select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setFeedback(null);
            }}
            className="block w-full max-w-full min-h-touch truncate px-3.5 py-3 bg-slate-950 border border-slate-700 text-white rounded-fluid text-xs focus:border-indigo-400 focus:outline-none font-mono font-bold"
          >
            {displayedEvents.map((evt) => (
              <option key={evt.id} value={evt.id}>
                [{evt.event_type}] {evt.code} — {evt.mission_name} ({evt.venue})
              </option>
            ))}
          </select>
        )}

        {selectedEvent && (
          <dl className="grid grid-cols-1 xs:grid-cols-3 gap-fluid-2 font-mono px-fluid-3 py-fluid-2 bg-indigo-950 border border-indigo-500/40 rounded-fluid">
            <div className="min-w-0">
              <dt className="text-2xs uppercase tracking-wider text-indigo-400/80">Code</dt>
              <dd className="text-xs text-indigo-300 break-token font-bold">{selectedEvent.code}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-2xs uppercase tracking-wider text-indigo-400/80">Venue</dt>
              <dd className="text-xs text-indigo-300 break-token font-bold">{selectedEvent.venue || 'Main Campus'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-2xs uppercase tracking-wider text-indigo-400/80">Schedule</dt>
              <dd className="text-xs text-indigo-300 break-token font-bold">{selectedEvent.schedule_time || '10:00 AM'}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* 2. QR Scanner Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-fluid-xl p-fluid-3 shadow-lg sm:p-fluid-5">
        <form onSubmit={(e) => { e.preventDefault(); handleEventCheckin(); }} className="space-y-fluid-3">
          <div className="flex flex-wrap items-center justify-between gap-fluid-2">
            <label className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase font-mono">
              <QrCode className="w-4 h-4 shrink-0 text-indigo-400" />
              <span className="break-token">SCAN PARTICIPANT PASSPORT QR OR ENTER ID</span>
            </label>
            <span className="shrink-0 text-2xs bg-indigo-950 text-indigo-300 px-2 py-1 rounded border border-indigo-500/40 font-mono font-bold">
              Track Roster Clearance
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-fluid-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Scan QR or paste Passport Token / Member ID..."
              className="flex-1 min-h-touch px-fluid-3 py-fluid-2 bg-slate-950 border border-slate-700 rounded-fluid text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
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
                className="tap flex-1 sm:flex-none min-h-touch px-fluid-4 py-fluid-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs rounded-fluid transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'CHECKING...' : 'VERIFY & CHECK-IN'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Feedback Banner */}
      {feedback && (
        <div className="mt-fluid-4 animate-fadeIn">
          {feedback.type === 'success' ? (
            <div className="p-fluid-4 bg-emerald-950/80 border-2 border-emerald-500 rounded-fluid-xl space-y-fluid-3 sm:p-fluid-5">
              <div className="flex flex-wrap items-center justify-between gap-fluid-2">
                <div className="flex min-w-0 items-center gap-2 text-emerald-400 font-black font-mono text-lg">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span className="break-token">✓ PASS — ADMITTED TO {selectedEvent?.mission_name?.toUpperCase()}</span>
                </div>
                <span className="shrink-0 text-xs font-mono text-emerald-300 font-bold">{feedback.time}</span>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-3 gap-fluid-3 pt-fluid-3 text-xs font-mono border-t border-emerald-800/50">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-2xs uppercase">ATTENDEE</span>
                  <strong className="text-white text-sm break-token">{feedback.member?.name}</strong>
                  <span className="block text-2xs text-cyan-300 break-token">{feedback.member?.id}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block text-2xs uppercase">SQUAD / TEAM</span>
                  <strong className="text-white text-sm break-token">{feedback.team?.team_name || 'Team'}</strong>
                  <span className="block text-2xs text-slate-300 break-token">{feedback.team?.college}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block text-2xs uppercase">VERIFICATION</span>
                  <strong className="text-emerald-300 text-sm break-token">✓ Registered &amp; Checked-In</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-fluid-4 bg-rose-950/90 border-2 border-rose-500 rounded-fluid-xl space-y-fluid-2 sm:p-fluid-5">
              <div className="flex flex-wrap items-center justify-between gap-fluid-2">
                <div className="flex min-w-0 items-center gap-2 text-rose-400 font-black font-mono text-lg">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <span className="break-token">✗ FAIL — ENTRY DENIED</span>
                </div>
                <span className="shrink-0 text-xs font-mono text-rose-300 font-bold">{feedback.time}</span>
              </div>

              <p className="text-rose-200 text-sm font-mono font-bold break-token">
                {feedback.message}
              </p>

              {feedback.member && (
                <div className="text-xs font-mono text-slate-300 pt-fluid-1 break-token">
                  Attendee: <strong className="text-white">{feedback.member.name}</strong> ({feedback.member.id})
                  {feedback.team && <span> &bull; Team: <strong className="text-white">{feedback.team.team_name}</strong></span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Track Attendance Feed */}
      <div className="p-fluid-3 bg-slate-900 border border-slate-800 rounded-fluid-xl shadow-xl sm:p-fluid-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-3">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="min-w-0">Admitted Attendees ({filteredAttendance.length})</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            <input
              type="text"
              placeholder="Search admitted attendees..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full min-h-touch pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-fluid text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>
        </div>

        <div className="mt-fluid-4">
          <table className="hidden md:table w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">CHECKIN TIME</th>
                <th className="pb-2">ATTENDEE</th>
                <th className="pb-2">COLLEGE</th>
                <th className="pb-2">SCANNED BY</th>
                <th className="pb-2">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                    No attendees checked into this event track yet.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a) => (
                  <tr key={a.id || a.scanned_at} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pr-3 text-slate-400 whitespace-nowrap">
                      {new Date(a.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 pr-3 font-bold text-white break-token">
                      {a.participant_name}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300 break-token">{a.college}</td>
                    <td className="py-2.5 pr-3 text-indigo-300 break-token">{a.scanned_by}</td>
                    <td className="py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-2xs whitespace-nowrap">
                        ✓ ADMITTED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Phone: stacked cards */}
          <div className="md:hidden space-y-fluid-2">
            {filteredAttendance.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-fluid">
                No attendees checked into this event track yet.
              </div>
            ) : (
              filteredAttendance.map((a) => (
                <div
                  key={a.id || a.scanned_at}
                  className="p-fluid-3 bg-slate-950/60 border border-slate-800 rounded-fluid font-mono"
                >
                  <div className="flex items-start justify-between gap-fluid-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white break-token">{a.participant_name}</p>
                      <p className="text-xs text-slate-400 break-token">{a.college}</p>
                    </div>
                    <span className="shrink-0 px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-2xs whitespace-nowrap">
                      ✓ ADMITTED
                    </span>
                  </div>

                  <div className="mt-fluid-2 pt-fluid-2 flex items-center justify-between border-t border-slate-800/60 text-xs">
                    <span className="text-slate-500 text-2xs">
                      {new Date(a.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-indigo-400 text-2xs font-bold">{a.scanned_by}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CameraQRScannerModal title="Scan Event Entry Pass" isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(scanned) => {
          handleEventCheckin(scanned);
          setIsCameraOpen(false);
        }}
      />
    </div>
  );
};

export default EventCheckinPage;

