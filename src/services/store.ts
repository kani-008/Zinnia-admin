import { 
  Team, 
  TeamMember, 
  Participant, 
  EventMission, 
  AttendanceRecord, 
  EventRegistration,
  PrizePosition,
  EventType,
  AdminRole
} from '@packages/types/src';
import { OFFICIAL_MISSIONS } from '@packages/config/src/events';
import { generateTeamId, generateMemberId } from '@packages/utils/src/participant-id';
import { supabase, isSupabaseConfigured, isRealtimeEnabled } from '../lib/supabase';



const STORAGE_KEYS = {
  TEAMS: 'zin26_live_teams_v2',
  MEMBERS: 'zin26_live_members_v2',
  EVENTS: 'zin26_live_events_v6',
  REGISTRATIONS: 'zin26_live_registrations_v2',
  ATTENDANCE: 'zin26_live_attendance_v2',
  CURRENT_TEAM: 'zin26_current_team_v2',
  ADMIN_ROLE: 'zin26_admin_active_role_v2',
  AUTH_USER: 'zin26_admin_auth_user_v2'
};

class ZinniaStore {
  private listeners: Set<() => void> = new Set();
  private isSyncing = false;
  private realTimeChannel: any = null;

  constructor() {
    this.cleanLegacyStorage();
    this.syncFromSupabase();
    this.setupRealtimeSubscription();
  }

  private cleanLegacyStorage() {
    try {
      [
        'zin26_participants_v3',
        'zin26_attendance_v3',
        'zin26_registrations_v3',
        'zin26_live_participants_v1',
        'zin26_live_events_v2',
        'zin26_live_events_v3',
        'zin26_live_events_v4',
        'zin26_live_events_v5',
        'zin26_live_hand_bands_v2'
      ].forEach(k => {
        localStorage.removeItem(k);
      });
    } catch {}
  }

  private setupRealtimeSubscription() {
    if (!isRealtimeEnabled()) return;
    try {
      this.realTimeChannel = supabase
        .channel('admin-schema-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_payments' }, () => this.syncFromSupabase())
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifySubscribers(): void {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('Store listener error:', e); }
    });
  }

  // --- SYNC FROM SUPABASE ---
  async syncFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured() || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const { data: dbTeams, error: tErr } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: dbMembers, error: mErr } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      const localTeams = this.getStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
      const localMembers = this.getStorage<TeamMember[]>(STORAGE_KEYS.MEMBERS, []);

      let mergedTeams = [...localTeams];
      if (!tErr && dbTeams) {
        dbTeams.forEach((dt: any) => {
          const idx = mergedTeams.findIndex(lt => lt.team_id === dt.team_id);
          const formatted: Team = {
            team_id: dt.team_id,
            team_name: dt.team_name,
            college: dt.college,
            department: dt.department,
            year: dt.year,
            registered_events: dt.registered_events || [],
            payment: dt.payment || false,
            payment_status: dt.payment_status || (dt.payment ? 'VERIFIED' : 'AWAITING_PAYMENT'),
            utr_number: dt.utr_number,
            created_at: dt.created_at,
            updated_at: dt.updated_at
          };
          if (idx >= 0) mergedTeams[idx] = { ...mergedTeams[idx], ...formatted };
          else mergedTeams.push(formatted);
        });
      }

      let mergedMembers = [...localMembers];
      if (!mErr && dbMembers) {
        dbMembers.forEach((dm: any) => {
          const idx = mergedMembers.findIndex(lm => lm.id === dm.id);
          const formatted: TeamMember = {
            id: dm.id,
            team_id: dm.team_id,
            name: dm.name,
            email: dm.email,
            phone: dm.phone,
            is_leader: dm.is_leader || false,
            passport_token: dm.passport_token,
            passport_issued_at: dm.passport_issued_at,
            passport_sent_at: dm.passport_sent_at,
            food_preference: dm.food_preference || 'VEG',
            food_collected: dm.food_collected || false,
            food_collected_at: dm.food_collected_at,
            created_at: dm.created_at
          };
          if (idx >= 0) mergedMembers[idx] = { ...mergedMembers[idx], ...formatted };
          else mergedMembers.push(formatted);
        });
      }

      mergedTeams = mergedTeams.map(t => ({
        ...t,
        members: mergedMembers.filter(m => m.team_id === t.team_id)
      }));

      this.setStorage(STORAGE_KEYS.TEAMS, mergedTeams);
      this.setStorage(STORAGE_KEYS.MEMBERS, mergedMembers);

      // Events
      const { data: dbEvents, error: eErr } = await supabase
        .from('events')
        .select('*')
        .order('code', { ascending: true });

      if (!eErr && dbEvents && dbEvents.length > 0) {
        const currentEvents = this.getStorage<EventMission[]>(STORAGE_KEYS.EVENTS, OFFICIAL_MISSIONS);
        const mergedEvents = currentEvents.map(base => {
          const matched = dbEvents.find(db => 
            (db.code && db.code.toString().padStart(2, '0') === base.code) ||
            (db.id && db.id.toLowerCase() === base.id.toLowerCase()) ||
            (db.mission_name && db.mission_name.toLowerCase() === base.mission_name.toLowerCase()) ||
            (db.title && db.title.toLowerCase() === base.title.toLowerCase())
          );

          if (matched) {
            return {
              ...base,
              mission_name: matched.mission_name || matched.title || matched.name || base.mission_name,
              title: matched.title || matched.mission_name || matched.name || base.title,
              venue: matched.venue || base.venue,
              schedule_time: matched.schedule_time || base.schedule_time,
              status: matched.status || base.status,
              description: matched.description || base.description,
            };
          }
          return base;
        });

        this.setStorage(STORAGE_KEYS.EVENTS, mergedEvents);
      }

      // Event registrations
      const { data: dbRegs, error: rErr } = await supabase
        .from('event_registrations')
        .select('*');

      if (!rErr && dbRegs) {
        this.setStorage(STORAGE_KEYS.REGISTRATIONS, dbRegs);
      }

      // Attendance
      const { data: dbAttendance, error: aErr } = await supabase
        .from('attendance')
        .select('*')
        .order('scanned_at', { ascending: false });

      if (!aErr && dbAttendance) {
        this.setStorage(STORAGE_KEYS.ATTENDANCE, dbAttendance);
      }

      this.notifySubscribers();
    } catch (e) {
      console.warn('Supabase sync notice:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  private getStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  // --- TEAMS & MEMBERS ---
  getTeams(): Team[] {
    const rawTeams = this.getStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
    const allMembers = this.getTeamMembers();
    return rawTeams.map(t => ({
      ...t,
      members: allMembers.filter(m => m.team_id === t.team_id)
    }));
  }

  getTeamMembers(): TeamMember[] {
    return this.getStorage<TeamMember[]>(STORAGE_KEYS.MEMBERS, []);
  }

  getTeamById(teamId: string): Team | undefined {
    const cleaned = teamId.trim().toUpperCase();
    const teams = this.getTeams();
    return teams.find(t => t.team_id.toUpperCase() === cleaned);
  }

  getMemberById(memberId: string): TeamMember | undefined {
    const cleaned = memberId.trim().toUpperCase();
    return this.getTeamMembers().find(m => m.id.toUpperCase() === cleaned);
  }

  getMemberByPassportToken(token: string): TeamMember | undefined {
    const cleaned = token.trim();
    if (!cleaned) return undefined;
    return this.getTeamMembers().find(
      m => m.passport_token && m.passport_token.toLowerCase() === cleaned.toLowerCase()
    );
  }

  getMemberByEmail(email: string): TeamMember | undefined {
    const cleaned = email.trim().toLowerCase();
    return this.getTeamMembers().find(m => m.email.toLowerCase() === cleaned);
  }

  lookupEntity(query: string): { team?: Team; member?: TeamMember; isTeamMatch?: boolean } {
    const cleaned = query.trim();
    if (!cleaned) return {};

    const memberByToken = this.getMemberByPassportToken(cleaned);
    if (memberByToken) {
      const team = this.getTeamById(memberByToken.team_id);
      return { team, member: memberByToken };
    }

    const memberById = this.getMemberById(cleaned);
    if (memberById) {
      const team = this.getTeamById(memberById.team_id);
      return { team, member: memberById };
    }

    const teamById = this.getTeamById(cleaned);
    if (teamById) {
      const leader = teamById.members?.find(m => m.is_leader) || teamById.members?.[0];
      return { team: teamById, member: leader, isTeamMatch: true };
    }

    const memberByEmail = this.getMemberByEmail(cleaned);
    if (memberByEmail) {
      const team = this.getTeamById(memberByEmail.team_id);
      return { team, member: memberByEmail };
    }

    return {};
  }

  getParticipants(): Participant[] {
    const teams = this.getTeams();
    const result: Participant[] = [];
    
    teams.forEach(team => {
      if (team.members && team.members.length > 0) {
        team.members.forEach(member => {
          result.push({
            agent_id: member.id,
            team_id: team.team_id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            college: team.college,
            department: team.department,
            year: team.year,
            registered_events: team.registered_events,
            payment: team.payment,
            payment_status: team.payment_status,
            food_preference: member.food_preference,
            food_collected: member.food_collected,
            food_collected_at: member.food_collected_at,
            created_at: member.created_at,
            members: team.members
          } as Participant);
        });
      } else {
        result.push({
          agent_id: team.team_id,
          team_id: team.team_id,
          name: team.team_name,
          email: '',
          phone: '',
          college: team.college,
          department: team.department,
          year: team.year,
          registered_events: team.registered_events,
          payment: team.payment,
          payment_status: team.payment_status,
          created_at: team.created_at
        } as Participant);
      }
    });

    return result;
  }

  getParticipantByAgentId(id: string): Participant | undefined {
    const res = this.lookupEntity(id);
    if (res.member) {
      const team = res.team || this.getTeamById(res.member.team_id);
      return {
        agent_id: res.member.id,
        team_id: team?.team_id || res.member.team_id,
        name: res.member.name,
        email: res.member.email,
        phone: res.member.phone,
        college: team?.college || '',
        department: team?.department || '',
        year: team?.year || 'IV',
        registered_events: team?.registered_events || [],
        payment: team?.payment || false,
        payment_status: team?.payment_status,
        food_preference: res.member.food_preference,
        food_collected: res.member.food_collected,
        food_collected_at: res.member.food_collected_at,
        created_at: res.member.created_at,
        members: team?.members
      } as Participant;
    }
    return undefined;
  }

  getParticipantByIdOrEmail(query: string): Participant | undefined {
    const res = this.lookupEntity(query);
    if (res.member) return this.getParticipantByAgentId(res.member.id);
    return undefined;
  }

  async getParticipantByIdOrEmailAsync(query: string): Promise<Participant | undefined> {
    const local = this.getParticipantByIdOrEmail(query);
    if (local) return local;

    if (isSupabaseConfigured()) {
      const cleaned = query.trim();
      const { data: memberData } = await supabase
        .from('team_members')
        .select('*')
        .or(`id.eq.${cleaned},email.eq.${cleaned},passport_token.eq.${cleaned}`)
        .limit(1);

      if (memberData && memberData.length > 0) {
        await this.syncFromSupabase();
        return this.getParticipantByAgentId(memberData[0].id);
      }
    }
    return undefined;
  }

  // --- CHECK-IN LOGIC ---
  // The former recordEntryCheckin / recordFoodDistribution / recordEventCheckin
  // helpers were removed. They wrote attendance to localStorage, fired a
  // fire-and-forget Supabase insert whose result was never checked, and then
  // returned { success: true } unconditionally — so a failed write still showed
  // "Gate Entry granted" on the scanner. Their duplicate detection also read
  // per-device localStorage, so two staff phones shared no state and the same
  // person could be admitted twice without either device noticing.
  //
  // All check-ins now go through the *Api methods below, which post to the
  // server, require an admin token, and surface failures to the operator.

  // --- CHECK-IN TRANSPORT ---
  // Single place where scanner requests reach the server. Distinguishes the
  // three failure modes an operator needs to tell apart at a checkpoint:
  //   network/API down  -> the scan did NOT register, retry or use another device
  //   auth failure      -> this device must sign in again
  //   business refusal  -> the scan registered and the answer is "no" (unpaid,
  //                        not registered, already checked in)
  // It never invents a success. If we cannot reach the server, that is a failure.
  private async postCheckin(
    path: string,
    params: Record<string, unknown>
  ): Promise<{ success: boolean; reason: string; data?: any }> {
    const token = localStorage.getItem('admin_token') || '';
    if (!token) {
      return { success: false, reason: 'NOT SIGNED IN: this device has no admin session. Sign in again.' };
    }

    let res: Response;
    try {
      res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(params)
      });
    } catch (e: any) {
      return {
        success: false,
        reason: `NETWORK ERROR: could not reach the check-in server (${e?.message || 'offline'}). The scan was NOT recorded — retry.`
      };
    }

    if (res.status === 401 || res.status === 403) {
      let msg = '';
      try { msg = (await res.json())?.message || ''; } catch { /* non-JSON body */ }
      return {
        success: false,
        reason: msg || 'ACCESS DENIED: your session is invalid or lacks permission for this checkpoint. Sign in again.'
      };
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      return {
        success: false,
        reason: `SERVER ERROR ${res.status}: unreadable response. The scan was NOT recorded — retry.`
      };
    }

    if (data?.success) {
      await this.syncFromSupabase();
      return { success: true, reason: data.reason || 'Check-in confirmed', data };
    }

    return { success: false, reason: data?.reason || data?.message || `Check-in refused (HTTP ${res.status}).`, data };
  }

  // --- API CHECK-IN HANDLERS ---
  async checkinEntryApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team }> {
    const r = await this.postCheckin('/api/admin/checkin/entry', params);
    return { success: r.success, reason: r.reason, member: r.data?.member, team: r.data?.team };
  }

  async checkinEventApi(params: {
    passport_token?: string;
    id?: string;
    event_id: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team; registered_events?: any[] }> {
    const r = await this.postCheckin('/api/admin/checkin/event', params);
    return {
      success: r.success,
      reason: r.reason,
      member: r.data?.member,
      team: r.data?.team,
      registered_events: r.data?.registered_events
    };
  }

  async checkinFoodApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team; food_preference?: 'VEG' | 'NON_VEG' }> {
    const r = await this.postCheckin('/api/admin/checkin/food', params);
    return {
      success: r.success,
      reason: r.reason,
      member: r.data?.member,
      team: r.data?.team,
      food_preference: r.data?.food_preference
    };
  }

  async resendPassportApi(memberId: string): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('admin_token') || '';
    try {
      const res = await fetch('/api/passport-dispatch/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ member_id: memberId })
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, message: 'Not authorised to resend passes. Sign in again.' };
      }

      const data = await res.json();

      // The endpoint reports success for the request as a whole, so inspect the
      // per-recipient results before telling the treasurer the pass went out.
      const results: any[] = data?.details?.results || data?.results || [];
      const failed = results.filter(r => r && !r.success);
      if (failed.length > 0) {
        const why = failed[0]?.error || 'delivery failed';
        return { success: false, message: `Resend failed for ${failed.length} recipient(s): ${why}` };
      }

      if (!data?.success) {
        return { success: false, message: data?.message || data?.error || 'Dispatch failed' };
      }

      return { success: true, message: data?.message || 'Passport dispatched' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Dispatch request failed' };
    }
  }

  // --- ADMIN PAYMENT APIS ---
  async listAdminPaymentsApi(statusFilter?: string): Promise<any[]> {
    try {
      const token = localStorage.getItem('admin_token') || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = statusFilter ? `/api/admin/payments?status=${statusFilter}` : '/api/admin/payments';
      const res = await fetch(url, { headers });
      const data = await res.json();
      return data.payments || [];
    } catch (e: any) {
      console.warn('Failed to list payments:', e);
      return [];
    }
  }

  async verifyAdminPaymentApi(teamId: string, adminId: string = 'Treasurer') { return this.verifyPaymentApi(teamId, adminId); }

  async verifyPaymentApi(teamId: string, adminId: string = 'Treasurer'): Promise<{
    success: boolean;
    message?: string;
    payment_status?: string;
  }> {
    try {
      const token = localStorage.getItem('admin_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ team_id: teamId, admin_name: adminId })
      });
      const data = await res.json();
      await this.syncFromSupabase();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to verify payment.' };
    }
  }

  async rejectAdminPaymentApi(teamId: string, rejectionReason: string, adminId: string = 'Treasurer'): Promise<{
    success: boolean;
    message?: string;
    payment_status?: string;
  }> {
    try {
      const token = localStorage.getItem('admin_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers,
        body: JSON.stringify({ team_id: teamId, reason: rejectionReason, admin_name: adminId })
      });
      const data = await res.json();
      await this.syncFromSupabase();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to reject payment.' };
    }
  }

  // --- EVENTS ---
  getEvents(filterType?: EventType): EventMission[] {
    const events = this.getStorage<EventMission[]>(STORAGE_KEYS.EVENTS, OFFICIAL_MISSIONS);
    if (filterType) {
      return events.filter(e => e.event_type === filterType);
    }
    return events;
  }

  getEventById(id: string): EventMission | undefined {
    return this.getEvents().find(e => e.id === id);
  }

  getEventRegistrations(): EventRegistration[] {
    return this.getStorage<EventRegistration[]>(STORAGE_KEYS.REGISTRATIONS, []);
  }

  assignPrizePosition(eventId: string, targetId: string, position: 1 | 2 | 3 | null, isTeam = false): void {
    const regs = this.getEventRegistrations();
    let reg = regs.find(r => r.event_id === eventId && (r.agent_id === targetId || r.team_members?.includes(targetId)));
    if (!reg) {
      reg = {
        agent_id: targetId,
        event_id: eventId,
        position,
        registered_at: new Date().toISOString()
      };
      regs.push(reg);
    } else {
      reg.position = position;
    }
    this.setStorage(STORAGE_KEYS.REGISTRATIONS, regs);
    this.notifySubscribers();
  }

  // --- ATTENDANCE ---
  getAttendance(): AttendanceRecord[] {
    return this.getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  }

  async deleteParticipant(id: string): Promise<void> {
    const teams = this.getTeams().filter(t => t.team_id !== id && !t.members?.some(m => m.id === id));
    const members = this.getTeamMembers().filter(m => m.id !== id && m.team_id !== id);

    this.setStorage(STORAGE_KEYS.TEAMS, teams);
    this.setStorage(STORAGE_KEYS.MEMBERS, members);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('event_registrations').delete().eq('team_id', id);
        await supabase.from('team_payments').delete().eq('team_id', id);
        await supabase.from('attendance').delete().eq('team_id', id);
        await supabase.from('attendance').delete().eq('member_id', id);
        await supabase.from('team_members').delete().eq('team_id', id);
        await supabase.from('team_members').delete().eq('id', id);
        await supabase.from('teams').delete().eq('team_id', id);
      } catch (err) {
        console.warn('Supabase delete team error:', err);
      }
    }

    this.notifySubscribers();
  }

  // --- AUTHENTICATION & ROLE MANAGEMENT ---
  getAdminRole(): AdminRole {
    return this.getStorage(STORAGE_KEYS.ADMIN_ROLE, 'SUPER_ADMIN');
  }

  setAdminRole(role: AdminRole): void {
    this.setStorage(STORAGE_KEYS.ADMIN_ROLE, role);
  }

  async loginAdminApi(username: string, password: string): Promise<{
    success: boolean;
    message?: string;
    user?: any;
    token?: string;
  }> {
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = await res.json();
      if (data.success && data.user) {
        this.setStorage(STORAGE_KEYS.AUTH_USER, data.user);
        if (data.token) {
          localStorage.setItem('admin_token', data.token);
        }
        if (data.user.role) {
          this.setAdminRole(data.user.role);
        }
        this.notifySubscribers();
      }
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Authentication failed.' };
    }
  }

  logoutAdmin(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem('admin_token');
    this.notifySubscribers();
  }

  getAuthUser(): any {
    return this.getStorage(STORAGE_KEYS.AUTH_USER, null);
  }

  isAuthenticated(): boolean {
    return !!this.getAuthUser();
  }
}

export const store = new ZinniaStore();


