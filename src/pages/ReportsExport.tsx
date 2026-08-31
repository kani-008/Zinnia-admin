import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download 
} from 'lucide-react';
import { 
  exportParticipantsExcel, 
  exportAttendanceExcel, 
  exportFoodExcel, 
  exportEventsReportExcel 
} from '../services/exportService';
import { store } from '../services/store';

export const ReportsExportPage: React.FC = () => {
  const [participants, setParticipants] = useState(store.getParticipants());
  const [attendance, setAttendance] = useState(store.getAttendance());
  const [events, setEvents] = useState(store.getEvents());

  useEffect(() => {
    const update = () => {
      setParticipants(store.getParticipants());
      setAttendance(store.getAttendance());
      setEvents(store.getEvents());
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const foodClaimed = participants.filter(p => p.food_collected).length;

  return (
    <div className="max-w-4xl mx-auto space-y-fluid-6">
      <div className="border-b border-slate-800 pb-fluid-4">
        <h1 className="text-xl font-bold text-white flex items-start gap-fluid-2 font-sans">
          <FileSpreadsheet className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          <span className="min-w-0">Excel Reports & Department Data Export</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Export official symposium documentation spreadsheets.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-fluid-4">
        <div className="min-w-0 p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid-lg space-y-fluid-3 flex flex-col justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm font-sans break-token">Participants Master (.xlsx)</h3>
            <p className="text-slate-400 text-xs mt-1">Total {participants.length} registered participant records.</p>
          </div>
          <button
            onClick={exportParticipantsExcel}
            className="w-full min-h-touch px-fluid-3 py-fluid-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs leading-tight rounded inline-flex items-center justify-center text-center gap-fluid-2"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>EXPORT PARTICIPANTS</span>
          </button>
        </div>

        <div className="min-w-0 p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid-lg space-y-fluid-3 flex flex-col justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm font-sans break-token">Attendance Logs (.xlsx)</h3>
            <p className="text-slate-400 text-xs mt-1">Gate arrival and event check-in timestamps ({attendance.length} scans).</p>
          </div>
          <button
            onClick={exportAttendanceExcel}
            className="w-full min-h-touch px-fluid-3 py-fluid-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs leading-tight rounded inline-flex items-center justify-center text-center gap-fluid-2"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>EXPORT ATTENDANCE</span>
          </button>
        </div>

        <div className="min-w-0 p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid-lg space-y-fluid-3 flex flex-col justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm font-sans break-token">Food Distribution (.xlsx)</h3>
            <p className="text-slate-400 text-xs mt-1">Lunch tokens claimed: {foodClaimed} / {participants.length}.</p>
          </div>
          <button
            onClick={exportFoodExcel}
            className="w-full min-h-touch px-fluid-3 py-fluid-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs leading-tight rounded inline-flex items-center justify-center text-center gap-fluid-2"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>EXPORT FOOD LOGS</span>
          </button>
        </div>

        <div className="min-w-0 p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid-lg space-y-fluid-3 flex flex-col justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm font-sans break-token">Events Analytics (.xlsx)</h3>
            <p className="text-slate-400 text-xs mt-1">Summary breakdown across {events.length} competitions.</p>
          </div>
          <button
            onClick={exportEventsReportExcel}
            className="w-full min-h-touch px-fluid-3 py-fluid-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs leading-tight rounded inline-flex items-center justify-center text-center gap-fluid-2"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>EXPORT EVENTS REPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
