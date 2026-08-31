import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import {
  Users,
  DoorOpen,
  Utensils,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [participants, setParticipants] = useState(store.getParticipants());
  const [attendance, setAttendance] = useState(store.getAttendance());
  const [events, setEvents] = useState(store.getEvents());

  useEffect(() => {
    const updateAll = () => {
      setParticipants(store.getParticipants());
      setAttendance(store.getAttendance());
      setEvents(store.getEvents());
    };
    updateAll();
    const unsub = store.subscribe(updateAll);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const totalRegistered = participants.length;
  const gateEntries = attendance.filter(a => a.checkin_type === 'ENTRY').length;
  const foodClaimed = participants.filter(p => p.food_collected).length;
  const eventCheckins = attendance.filter(a => a.checkin_type === 'EVENT').length;

  const techEvents = events.filter(e => e.event_type === 'TECH');
  const nonTechEvents = events.filter(e => e.event_type === 'NON_TECH');

  const stats = [
    { title: 'Total Registered', count: totalRegistered, icon: Users, color: 'text-indigo-400', link: '/participants' },
    { title: 'Gate Turnout', count: `${gateEntries} / ${totalRegistered}`, icon: DoorOpen, color: 'text-emerald-400', link: '/entry' },
    { title: 'Food Distributed', count: `${foodClaimed} / ${totalRegistered}`, icon: Utensils, color: 'text-amber-400', link: '/food' },
    { title: 'Event Check-ins', count: eventCheckins, icon: Zap, color: 'text-fuchsia-400', link: '/events' }
  ];

  return (
    <div className="space-y-fluid-5">
      <div className="border-b border-slate-800 pb-fluid-4 flex flex-wrap justify-between items-center gap-fluid-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white font-sans break-token">Symposium Command Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5 break-token">Live metrics and operations for ZINNIA 2026</p>
        </div>
      </div>

      {/* Stats Grid — single column on narrow phones, 2-up from xs, 4-up from lg */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-fluid-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              to={stat.link}
              className="p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid flex flex-col gap-fluid-2 min-h-touch hover:border-indigo-500 transition-colors"
            >
              <div className="flex justify-between items-start gap-fluid-2">
                <div className="text-slate-400 text-xs min-w-0">{stat.title}</div>
                <Icon className={`w-5 h-5 shrink-0 ${stat.color}`} />
              </div>
              {/* whitespace-nowrap keeps `12 / 250` from breaking across the slash */}
              <div className="text-2xl font-bold text-white mt-auto whitespace-nowrap tabular-nums leading-none">
                {stat.count}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Events Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-fluid-5">
        {/* Technical Events */}
        <div className="p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid space-y-fluid-3">
          <h3 className="font-bold text-white text-sm font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
            <span className="min-w-0 break-token">Technical Events ({techEvents.length})</span>
          </h3>
          <div className="space-y-fluid-2 text-xs">
            {techEvents.map(e => (
              /* Phone: mission name over a muted venue line. Row from sm. */
              <div
                key={e.id}
                className="p-fluid-3 bg-slate-950 rounded flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-fluid-3"
              >
                <div className="min-w-0">
                  <span className="font-bold text-indigo-400">{e.code}: </span>
                  <span className="text-white break-token">{e.mission_name}</span>
                </div>
                <span className="text-slate-400 min-w-0 break-token sm:text-right">{e.venue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Non-Technical Events */}
        <div className="p-fluid-4 bg-slate-900 border border-slate-800 rounded-fluid space-y-fluid-3">
          <h3 className="font-bold text-white text-sm font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 shrink-0" />
            <span className="min-w-0 break-token">Non-Technical Events ({nonTechEvents.length})</span>
          </h3>
          <div className="space-y-fluid-2 text-xs">
            {nonTechEvents.map(e => (
              /* Phone: mission name over a muted venue line. Row from sm. */
              <div
                key={e.id}
                className="p-fluid-3 bg-slate-950 rounded flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-fluid-3"
              >
                <div className="min-w-0">
                  <span className="font-bold text-fuchsia-400">{e.code}: </span>
                  <span className="text-white break-token">{e.mission_name}</span>
                </div>
                <span className="text-slate-400 min-w-0 break-token sm:text-right">{e.venue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
