import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { certificateService } from '../services/certificateService';
import { Award, CheckCircle2 } from 'lucide-react';

export const CertificateAdminPage: React.FC = () => {
  const [events, setEvents] = useState(store.getEvents());
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [winner1, setWinner1] = useState('');
  const [winner2, setWinner2] = useState('');
  const [winner3, setWinner3] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const evs = store.getEvents();
      setEvents(evs);
      if (!selectedEventId && evs[0]) {
        setSelectedEventId(evs[0].id);
      }
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    const winners: { position: 1 | 2 | 3; participantId: string }[] = [];
    if (winner1) winners.push({ position: 1, participantId: winner1 });
    if (winner2) winners.push({ position: 2, participantId: winner2 });
    if (winner3) winners.push({ position: 3, participantId: winner3 });

    const res = certificateService.finalizeEventResults(selectedEventId, winners);
    if (res.success) {
      setFeedback(`Results finalized for ${selectedEvent?.mission_name}!`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-fluid-6">
      <div className="border-b border-slate-800 pb-fluid-4">
        <h1 className="text-xl font-bold text-white flex items-start gap-fluid-2 font-sans">
          <Award className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <span className="min-w-0">Prize Allocation & E-Certificate Generator</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Allocate 1st, 2nd, and 3rd place winners and generate verified certificates.</p>
      </div>

      <form onSubmit={handleFinalize} className="p-fluid-5 bg-slate-900 border border-slate-800 rounded-fluid-lg space-y-fluid-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Select Event</label>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="w-full min-h-touch px-fluid-3 py-fluid-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                [{ev.event_type}] {ev.code} - {ev.mission_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-fluid-4 pt-fluid-1">
          <div className="min-w-0">
            <label className="block text-xs font-bold text-amber-400 mb-1">1st Place (Winner ID)</label>
            <input
              type="text"
              placeholder="e.g. ZIN26-A8F41C"
              value={winner1}
              onChange={e => setWinner1(e.target.value)}
              className="w-full min-h-touch px-fluid-3 py-fluid-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-amber-400 uppercase"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-300 mb-1">2nd Place (Runner-up ID)</label>
            <input
              type="text"
              placeholder="e.g. ZIN26-B9G52D"
              value={winner2}
              onChange={e => setWinner2(e.target.value)}
              className="w-full min-h-touch px-fluid-3 py-fluid-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 uppercase"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-bold text-amber-600 mb-1">3rd Place (ID)</label>
            <input
              type="text"
              placeholder="e.g. ZIN26-C1H63E"
              value={winner3}
              onChange={e => setWinner3(e.target.value)}
              className="w-full min-h-touch px-fluid-3 py-fluid-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-amber-600 uppercase"
            />
          </div>
        </div>

        <div className="pt-fluid-1">
          <button
            type="submit"
            className="w-full min-h-touch inline-flex items-center justify-center text-center px-fluid-3 py-fluid-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs leading-tight rounded"
          >
            FINALIZE RESULTS & ISSUE CERTIFICATES
          </button>
        </div>

        {feedback && (
          <div className="p-fluid-3 bg-emerald-950/80 border border-emerald-500/50 rounded text-emerald-300 text-xs flex items-start gap-fluid-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="min-w-0 break-token">{feedback}</span>
          </div>
        )}
      </form>
    </div>
  );
};
