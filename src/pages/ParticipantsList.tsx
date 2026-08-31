import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { Team, TeamMember } from '@packages/types/src';
import { 
  Users, 
  Search, 
  Trash2, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  User,
  ShieldCheck,
  Utensils,
  Send,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { exportParticipantsExcel } from '../services/exportService';

export const ParticipantsListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<Team[]>(store.getTeams());
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const allTeams = store.getTeams();
      setTeams(allTeams);
      // Auto-expand all teams initially
      const initialExp: Record<string, boolean> = {};
      allTeams.forEach(t => { initialExp[t.team_id] = true; });
      setExpandedTeams(initialExp);
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await store.syncFromSupabase();
    setTeams(store.getTeams());
    setIsRefreshing(false);
  };

  const toggleExpand = (teamId: string) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const filteredTeams = teams.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchesTeam = t.team_id.toLowerCase().includes(q) ||
                        t.team_name.toLowerCase().includes(q) ||
                        t.college.toLowerCase().includes(q);
    const matchesMember = t.members?.some(m => 
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.passport_token && m.passport_token.toLowerCase().includes(q))
    );
    return matchesTeam || matchesMember;
  });

  const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (window.confirm(`Are you sure you want to remove team "${teamName}" (${teamId}) and all associated members?`)) {
      await store.deleteParticipant(teamId);
      setTeams(store.getTeams());
    }
  };

  const handleCopyPassLink = (member: TeamMember) => {
    const token = member.passport_token || member.id;
    const url = `${window.location.origin}/passport?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResendPass = async (member: TeamMember, team: Team) => {
    setSendingId(member.id);
    const token = member.passport_token || member.id;
    const passLink = `${window.location.origin}/passport?token=${token}`;
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');

    // Send via API
    try {
      await store.resendPassportApi(member.id);
    } catch {}

    // Open WhatsApp link
    const message = encodeURIComponent(
      `⚡ *ZINNIA 2026 — DIGITAL PASSPORT*\n\n` +
      `Hello ${member.name}! Here is your Digital Pass for Zinnia 2026:\n\n` +
      `🔗 *Pass Link:* ${passLink}\n` +
      `🛡️ *Member ID:* ${member.id}\n` +
      `👥 *Team:* ${team.team_name}\n\n` +
      `_Show this QR at the gate for admission and lunch token._`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    setActionFeedback(`✓ Re-dispatched digital pass for ${member.name}`);
    setSendingId(null);
  };

  return (
    <div className="space-y-fluid-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-fluid-3 border-b border-slate-800 pb-fluid-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white flex items-start gap-2 font-sans">
            <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <span className="min-w-0 break-words">
              Team &amp; Participant Master Registry ({teams.length} Teams, {totalMembers} Attendees)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete database of registered teams, individual digital passports, and dispatch logs.
          </p>
        </div>

        <div className="flex flex-col xs:flex-row items-stretch gap-fluid-2 w-full lg:w-auto shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="w-full xs:w-auto min-h-touch px-fluid-3 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-indigo-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live DB</span>
          </button>

          <button
            onClick={exportParticipantsExcel}
            className="w-full xs:w-auto min-h-touch px-fluid-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md text-center"
          >
            EXPORT EXCEL (.XLSX)
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-fluid-3 bg-slate-900 border border-indigo-500/40 rounded-fluid-lg text-xs text-indigo-300 font-mono flex items-start justify-between gap-fluid-2">
          <span className="min-w-0 break-token py-1.5">{actionFeedback}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="tap shrink-0 -my-1 -mr-1 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-white transition-colors"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by Team Name, Team ID, Attendee Name, Passport Token, or College..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full min-h-touch pl-10 pr-fluid-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-fluid-lg text-xs focus:border-indigo-400 focus:outline-none font-mono"
        />
      </div>

      {/* Teams & Members Accordion List */}
      <div className="space-y-fluid-4">
        {filteredTeams.map((team) => {
          const isExpanded = expandedTeams[team.team_id] !== false;
          const membersList = team.members || [];

          return (
            <div key={team.team_id} className="bg-slate-900 border border-slate-800 rounded-fluid-xl overflow-hidden shadow-lg transition-all">
              {/* Team Header Row */}
              <div
                onClick={() => toggleExpand(team.team_id)}
                className="p-fluid-3 min-h-touch bg-slate-950/80 hover:bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-fluid-3 cursor-pointer border-b border-slate-800/80"
              >
                <div className="flex items-start gap-fluid-2 min-w-0">
                  <div className="text-indigo-400 p-1 shrink-0 mt-0.5">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-bold text-white font-sans break-words">{team.team_name}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-2xs font-bold border border-indigo-500/40 break-token">
                        {team.team_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-0.5 break-words">
                      {team.college} &bull; {team.department} ({team.year} Year)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-fluid-2 gap-y-fluid-2 text-xs font-mono md:shrink-0">
                  <div className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap">
                    <span>Members: <strong>{membersList.length}</strong></span>
                  </div>

                  <div className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap">
                    <span>Events: <strong>{team.registered_events.length}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.team_id, team.team_name);
                    }}
                    className="tap ml-auto md:ml-0 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                    title="Remove Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Members Expanded Table */}
              {isExpanded && (
                <div className="p-fluid-3 bg-slate-900">
                  {/* Phone / small-tablet: one stacked card per member (same data as the table) */}
                  <div className="md:hidden space-y-fluid-3">
                    {membersList.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-fluid-lg border border-slate-800 bg-slate-950/50 p-fluid-3 space-y-fluid-3"
                      >
                        {/* Identity */}
                        <div className="flex items-start justify-between gap-fluid-2">
                          <div className="min-w-0">
                            <span className="block text-sm font-bold text-white font-sans break-words">{member.name}</span>
                            <span className="block text-2xs text-cyan-400 font-mono break-token mt-0.5">{member.id}</span>
                          </div>
                          {member.is_leader ? (
                            <span className="shrink-0 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-2xs font-mono font-bold">
                              LEADER
                            </span>
                          ) : (
                            <span className="shrink-0 text-slate-500 text-2xs font-mono">MEMBER</span>
                          )}
                        </div>

                        {/* Contact + credentials */}
                        <dl className="space-y-fluid-2">
                          <div>
                            <dt className="text-2xs font-mono uppercase tracking-wide text-slate-500">Email</dt>
                            <dd className="text-xs font-mono text-slate-300 break-token">{member.email}</dd>
                          </div>

                          <div>
                            <dt className="text-2xs font-mono uppercase tracking-wide text-slate-500">Phone</dt>
                            <dd className="text-xs font-mono text-slate-400 break-token">{member.phone}</dd>
                          </div>

                          <div>
                            <dt className="text-2xs font-mono uppercase tracking-wide text-slate-500 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 shrink-0" />
                              Passport Token
                            </dt>
                            <dd
                              className="mt-1 px-2 py-1 rounded bg-slate-950 border border-cyan-500/30 text-cyan-300 text-2xs font-mono break-token"
                              title={member.passport_token}
                            >
                              {member.passport_token ? `🔑 ${member.passport_token.slice(0, 12)}...` : 'TOKEN-UNSET'}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-2xs font-mono uppercase tracking-wide text-slate-500 flex items-center gap-1">
                              <Utensils className="w-3 h-3 shrink-0" />
                              Food Token
                            </dt>
                            <dd className="text-xs font-mono font-bold">
                              {member.food_collected ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 shrink-0" /> CLAIMED
                                </span>
                              ) : (
                                <span className="text-amber-400">READY</span>
                              )}
                            </dd>
                          </div>
                        </dl>

                        {/* Dispatch / actions */}
                        <div className="flex items-stretch gap-fluid-2">
                          <button
                            type="button"
                            onClick={() => handleCopyPassLink(member)}
                            className="flex-1 min-h-touch px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
                            title="Copy Passport Link"
                          >
                            {copiedId === member.id ? <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                            <span>{copiedId === member.id ? 'Copied' : 'Link'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={sendingId === member.id}
                            onClick={() => handleResendPass(member, team)}
                            className="flex-1 min-h-touch px-2.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm disabled:opacity-60"
                            title="Resend Passport via WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5 shrink-0" />
                            <span>{sendingId === member.id ? 'Sending...' : 'Resend'}</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {membersList.length === 0 && (
                      <div className="py-3 text-center text-slate-500 text-xs font-mono">
                        No member records found for this team.
                      </div>
                    )}
                  </div>

                  {/* Tablet and up: the real table */}
                  <div className="hidden md:block overflow-x-auto scrollbar-none">
                    <table className="hidden md:table w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs">
                          <th className="pb-2 px-2">ROLE</th>
                          <th className="pb-2 px-2">ATTENDEE NAME</th>
                          <th className="pb-2 px-2">CONTACT</th>
                          <th className="pb-2 px-2">PASSPORT TOKEN</th>
                          <th className="pb-2 px-2">FOOD TOKEN</th>
                          <th className="pb-2 px-2 text-right">DISPATCH / ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {membersList.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-950/40">
                            <td className="py-2.5 px-2 font-mono align-top">
                              {member.is_leader ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-2xs font-bold">
                                  LEADER
                                </span>
                              ) : (
                                <span className="text-slate-500 text-2xs">MEMBER</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 align-top">
                              <span className="font-bold text-white block break-words">{member.name}</span>
                              <span className="text-2xs text-cyan-400 font-mono break-token">{member.id}</span>
                            </td>
                            <td className="py-2.5 px-2 font-mono text-slate-400 align-top">
                              <div className="break-token">{member.email}</div>
                              <div className="text-2xs text-slate-500 break-token">{member.phone}</div>
                            </td>
                            <td className="py-2.5 px-2 font-mono align-top">
                              <span
                                className="px-2 py-0.5 rounded bg-slate-950 border border-cyan-500/30 text-cyan-300 text-2xs font-mono block max-w-[clamp(6rem,11vw,11rem)] truncate"
                                title={member.passport_token}
                              >
                                {member.passport_token ? `🔑 ${member.passport_token.slice(0, 12)}...` : 'TOKEN-UNSET'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 font-mono font-bold align-top">
                              {member.food_collected ? (
                                <span className="text-emerald-400 flex items-center gap-1 text-xs">
                                  <Check className="w-3.5 h-3.5 shrink-0" /> CLAIMED
                                </span>
                              ) : (
                                <span className="text-amber-400 text-xs">READY</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right align-top">
                              <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyPassLink(member)}
                                  className="min-h-touch px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-700"
                                  title="Copy Passport Link"
                                >
                                  {copiedId === member.id ? <Check className="w-3 h-3 shrink-0 text-emerald-400" /> : <Copy className="w-3 h-3 shrink-0" />}
                                  <span>{copiedId === member.id ? 'Copied' : 'Link'}</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={sendingId === member.id}
                                  onClick={() => handleResendPass(member, team)}
                                  className="min-h-touch px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm disabled:opacity-60"
                                  title="Resend Passport via WhatsApp"
                                >
                                  <Send className="w-3 h-3 shrink-0" />
                                  <span>{sendingId === member.id ? 'Sending...' : 'Resend'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {membersList.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-3 text-center text-slate-500">
                              No member records found for this team.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="p-fluid-6 bg-slate-900 border border-slate-800 rounded-fluid-xl text-center text-slate-500 text-xs font-mono break-words">
            No registered teams or attendees matching current search query.
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsListPage;
