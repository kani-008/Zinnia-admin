import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink,
  Coins,
  Send,
  MailCheck
} from 'lucide-react';

export const PaymentVerificationPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalTeam, setRejectModalTeam] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    const filterParam = statusFilter === 'ALL' ? undefined : statusFilter;
    const list = await store.listAdminPaymentsApi(filterParam);
    setPayments(list);
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleVerify = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Approve payment for team "${teamName}" (${teamId})?\n\nThis will confirm received funds against your bank statement, update the database, and immediately dispatch official Entry QR Passes to the participant's email from zinnia2026@gcee.ac.in.`)) {
      return;
    }

    setProcessingId(teamId);
    const authUser = store.getAuthUser();
    const adminName = authUser?.name || 'Treasurer';
    const res = await store.verifyAdminPaymentApi(teamId, adminName);
    setProcessingId(null);

    if (res.success) {
      setActionFeedback(`✓ Approved payment for ${teamName} (${teamId}). Entry QR pass emails successfully dispatched!`);
      await loadPayments();
    } else {
      setActionFeedback(`✗ Verification failed: ${res.message}`);
    }
  };

  const handleOpenRejectModal = (payment: any) => {
    setRejectModalTeam(payment);
    setRejectionReason('Incorrect UTR reference or amount does not match bank statement credit records.');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTeam) return;
    const teamId = rejectModalTeam.team_id;
    const teamName = rejectModalTeam.teams?.team_name || teamId;

    setProcessingId(teamId);
    const authUser = store.getAuthUser();
    const adminName = authUser?.name || 'Treasurer';
    const res = await store.rejectAdminPaymentApi(teamId, rejectionReason, adminName);
    setProcessingId(null);
    setRejectModalTeam(null);

    if (res.success) {
      setActionFeedback(`✓ Payment marked as REJECTED for ${teamName}. Participant can now review and resubmit their correct UTR.`);
      await loadPayments();
    } else {
      setActionFeedback(`✗ Rejection update failed: ${res.message}`);
    }
  };

  const filteredPayments = payments.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchesTeamId = p.team_id?.toLowerCase().includes(q);
    const matchesTeamName = p.teams?.team_name?.toLowerCase().includes(q);
    const matchesUtr = p.utr_number?.toLowerCase().includes(q);
    const matchesCollege = p.teams?.college?.toLowerCase().includes(q);
    return matchesTeamId || matchesTeamName || matchesUtr || matchesCollege;
  });

  const pendingCount = payments.filter(p => p.payment_status === 'PENDING_VERIFICATION').length;
  const verifiedCount = payments.filter(p => p.payment_status === 'VERIFIED').length;
  const rejectedCount = payments.filter(p => p.payment_status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white font-sans">
              Treasurer Audit &amp; Payment Verification
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
              ₹250 / Head
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cross-reference bank statement credits against participant UTR reference numbers. Approving automatically dispatches dynamic QR entry passes from <strong className="text-slate-300">zinnia2026@gcee.ac.in</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPayments}
            disabled={loading}
            className="px-3 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-indigo-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <MailCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-500 hover:text-white cursor-pointer ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: 'All Payments', count: payments.length },
            { id: 'PENDING_VERIFICATION', label: 'Pending Review', count: pendingCount, highlight: 'text-amber-400 font-bold' },
            { id: 'VERIFIED', label: 'Verified', count: verifiedCount, highlight: 'text-emerald-400' },
            { id: 'REJECTED', label: 'Rejected', count: rejectedCount, highlight: 'text-rose-400' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-950 ${tab.highlight || 'text-slate-300'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Team ID, Name, UTR, College..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-mono focus:border-indigo-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.map((p) => {
          const team = p.teams || {};
          const status = p.payment_status || 'AWAITING_PAYMENT';
          const isPending = status === 'PENDING_VERIFICATION';
          const isVerified = status === 'VERIFIED';
          const isRejected = status === 'REJECTED';
          const amountMismatch = p.submitted_amount && p.expected_amount && Number(p.submitted_amount) !== Number(p.expected_amount);

          return (
            <div 
              key={p.team_id}
              className={`p-5 rounded-2xl border transition-all ${
                isPending ? 'bg-slate-900/90 border-amber-500/60 shadow-lg shadow-amber-950/20' :
                isVerified ? 'bg-slate-900/70 border-emerald-500/40' :
                isRejected ? 'bg-slate-900/70 border-rose-500/30' :
                'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Team Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-sans">{team.team_name || 'Team Record'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold">
                      {p.team_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                      isVerified ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                      isPending ? 'bg-amber-950 text-amber-300 border-amber-500/50 animate-pulse' :
                      isRejected ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    {team.college} &bull; {team.department} (Year {team.year})
                  </p>
                </div>

                {/* Amount & UTR Details */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">FEE (₹250/HEAD)</div>
                    <div className="text-sm font-black text-white">₹{p.expected_amount || 250}</div>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${
                    amountMismatch ? 'bg-rose-950/40 border-rose-500/60' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="text-[10px] text-slate-500 uppercase">SUBMITTED AMOUNT</div>
                    <div className={`text-sm font-black ${
                      amountMismatch ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {p.submitted_amount ? `₹${p.submitted_amount}` : 'NOT SUBMITTED'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 min-w-[170px]">
                    <div className="text-[10px] text-slate-500 uppercase">BANK UTR / REF NO</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-cyan-300 text-xs tracking-wider">
                        {p.utr_number || 'PENDING SUBMISSION'}
                      </span>
                      {p.utr_number && (
                        <button
                          type="button"
                          onClick={() => handleCopyUtr(p.utr_number)}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded text-xs transition-colors cursor-pointer"
                          title="Copy UTR to paste into Netbanking"
                        >
                          {copiedUtr === p.utr_number ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isVerified && (
                    <button
                      type="button"
                      disabled={processingId === p.team_id || !p.utr_number}
                      onClick={() => handleVerify(p.team_id, team.team_name || p.team_id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:translate-x-0.5 active:translate-y-0.5"
                      title="Confirm statement credit and email QR pass"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{processingId === p.team_id ? 'DISPATCHING...' : 'APPROVE & DISPATCH QR'}</span>
                    </button>
                  )}

                  {!isVerified && !isRejected && (
                    <button
                      type="button"
                      disabled={processingId === p.team_id}
                      onClick={() => handleOpenRejectModal(p)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-300 font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>REJECT</span>
                    </button>
                  )}

                  {isVerified && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <MailCheck className="w-3.5 h-3.5" />
                        <span>Pass Dispatched</span>
                      </span>
                      <a
                        href={`http://localhost:5173/passport?id=${p.team_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>LIVE PASS</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection notice if rejected */}
              {isRejected && p.rejection_reason && (
                <div className="mt-3 p-2.5 bg-rose-950/60 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-sans">
                  <strong>Rejection Note:</strong> {p.rejection_reason}
                </div>
              )}
            </div>
          );
        })}

        {filteredPayments.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500 text-xs font-mono bg-slate-900 border border-slate-800 rounded-2xl">
            No payment records matching the selected status and query.
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalTeam && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold font-mono text-white">REJECT PAYMENT RECORD</h3>
            </div>
            
            <p className="text-xs text-slate-400">
              Specify the reason for rejecting payment for <strong>{rejectModalTeam.teams?.team_name || rejectModalTeam.team_id}</strong> ({rejectModalTeam.team_id}). The team will see this in their payment portal and can resubmit their UTR.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                REJECTION REASON (VISIBLE TO PARTICIPANT)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalTeam(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-xs rounded-xl cursor-pointer"
              >
                CONFIRM REJECTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationPage;
