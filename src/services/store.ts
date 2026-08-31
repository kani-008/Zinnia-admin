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
  recordEntryCheckin(
    identifier: string,
    scannedBy = 'Gate Terminal',
    targetMemberId?: string
  ): { success: boolean; message: string; record?: AttendanceRecord; team?: Team; member?: TeamMember; participant?: Participant } {
    const lookup = this.lookupEntity(identifier);
    if (!lookup.team && !lookup.member) {
      return { success: false, message: `Attendee ID or QR "${identifier}" not found.` };
    }

    const team = lookup.team || (lookup.member ? this.getTeamById(lookup.member.team_id) : undefined);
    const member = targetMemberId 
      ? this.getMemberById(targetMemberId) 
      : (lookup.member || team?.members?.[0]);

    if (!team || !member) {
      return { success: false, message: 'Could not resolve attendee team details.' };
    }

    const attendance = this.getAttendance();
    const alreadyCheckedIn = attendance.find(
      a => (a.member_id === member.id || a.agent_id === member.id) && a.checkin_type === 'ENTRY'
    );

    if (alreadyCheckedIn) {
      const timeStr = new Date(alreadyCheckedIn.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        success: false,
        message: `${member.name} (${team.team_name}) is ALREADY CHECKED IN at ${timeStr}. Duplicate entry prevented.`,
        team,
        member,
        participant: this.getParticipantByAgentId(member.id)
      };
    }

    const record: AttendanceRecord = {
      team_id: team.team_id,
      member_id: member.id,
      agent_id: member.id,
      passport_token_used: member.passport_token || identifier,
      participant_name: `${member.name} [${team.team_name}]`,
      college: team.college,
      checkin_type: 'ENTRY',
      scanned_by: scannedBy,
      scanned_at: new Date().toISOString(),
      location: 'Main Security Gate'
    };

    attendance.unshift(record);
    this.setStorage(STORAGE_KEYS.ATTENDANCE, attendance);

    if (isSupabaseConfigured()) {
      supabase.from('attendance').insert([{
        team_id: record.team_id,
        member_id: record.member_id,
        passport_token_used: record.passport_token_used,
        participant_name: record.participant_name,
        college: record.college,
        checkin_type: record.checkin_type,
        scanned_by: record.scanned_by,
        location: record.location
      }]).then();
    }

    this.notifySubscribers();

    return {
      success: true,
      message: `Gate Entry granted for ${member.name} (${team.team_name})`,
      record,
      team,
      member,
      participant: this.getParticipantByAgentId(member.id)
    };
  }

  recordFoodDistribution(
    identifier: string,
    scannedBy = 'Dining Counter'
  ): { success: boolean; message: string; member?: TeamMember; participant?: Participant } {
    const lookup = this.lookupEntity(identifier);
    if (!lookup.member) {
      return { success: false, message: `Attendee ID or QR "${identifier}" not recognized.` };
    }

    const member = lookup.member;
    const team = lookup.team || this.getTeamById(member.team_id);

    if (member.food_collected) {
      const timeStr = member.food_collected_at 
        ? new Date(member.food_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : 'earlier';
      return {
        success: false,
        message: `FOOD ALREADY CLAIMED: ${member.name} claimed meal at ${timeStr}.`
      };
    }

    member.food_collected = true;
    member.food_collected_at = new Date().toISOString();

    const allMembers = this.getTeamMembers();
    const idx = allMembers.findIndex(m => m.id === member.id);
    if (idx !== -1) {
      allMembers[idx] = member;
      this.setStorage(STORAGE_KEYS.MEMBERS, allMembers);
    }

    if (isSupabaseConfigured()) {
      supabase.from('team_members').update({
        food_collected: true,
        food_collected_at: member.food_collected_at
      }).eq('id', member.id).then();
    }

    this.notifySubscribers();

    return {
      success: true,
      message: `Lunch token claimed for ${member.name} (${team?.team_name || 'Team'})`,
      member,
      participant: this.getParticipantByAgentId(member.id)
    };
  }

  recordEventCheckin(
    identifier: string,
    eventId: string,
    scannedBy = 'Event Desk'
  ): { success: boolean; message: string; record?: AttendanceRecord } {
    const lookup = this.lookupEntity(identifier);
    if (!lookup.member) {
      return { success: false, message: `Attendee ID or QR "${identifier}" not recognized.` };
    }

    const member = lookup.member;
    const team = lookup.team || this.getTeamById(member.team_id);
    const event = this.getEventById(eventId);

    if (!event) {
      return { success: false, message: 'Invalid event track selected.' };
    }

    if (!team || !team.registered_events.includes(eventId)) {
      return {
        success: false,
        message: `ACCESS DENIED: ${member.name} (${team?.team_name || 'Team'}) is NOT registered for "${event.mission_name}".`
      };
    }

    const attendance = this.getAttendance();
    const alreadyCheckedIn = attendance.find(
      a => (a.member_id === member.id || a.agent_id === member.id) && a.checkin_type === 'EVENT' && a.event_id === eventId
    );

    if (alreadyCheckedIn) {
      return {
        success: false,
        message: `${member.name} was already verified for this event at ${new Date(alreadyCheckedIn.scanned_at).toLocaleTimeString()}.`
      };
    }

    const record: AttendanceRecord = {
      team_id: team.team_id,
      member_id: member.id,
      agent_id: member.id,
      passport_token_used: member.passport_token || identifier,
      participant_name: `${member.name} (${team.team_name})`,
      college: team.college,
      checkin_type: 'EVENT',
      event_id: event.id,
      event_name: event.mission_name,
      scanned_by: scannedBy,
      scanned_at: new Date().toISOString(),
      location: event.venue
    };

    attendance.unshift(record);
    this.setStorage(STORAGE_KEYS.ATTENDANCE, attendance);

    if (isSupabaseConfigured()) {
      supabase.from('attendance').insert([{
        team_id: record.team_id,
        member_id: record.member_id,
        passport_token_used: record.passport_token_used,
        participant_name: record.participant_name,
        college: record.college,
        checkin_type: record.checkin_type,
        event_id: record.event_id,
        scanned_by: record.scanned_by,
        location: record.location
      }]).then();
    }

    this.notifySubscribers();

    return {
      success: true,
      message: `Event track verified: ${member.name} admitted to ${event.mission_name}`,
      record
    };
  }

  // --- API CHECK-IN HANDLERS ---
  async checkinEntryApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team }> {
    try {
      const token = localStorage.getItem('admin_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/checkin/entry', {
        method: 'POST',
        headers,
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (data && data.success) {
        await this.syncFromSupabase();
      }
      return {
        success: data?.success ?? (res.status === 200),
        reason: data?.reason || (data?.success ? 'Campus entry granted' : 'Check-in failed'),
        member: data?.member,
        team: data?.team
      };
    } catch (e: any) {
      return {
        success: false,
        reason: e.message || 'Campus entry verification error.'
      };
    }
  }

  async checkinEventApi(params: {
    passport_token?: string;
    id?: string;
    event_id: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team; registered_events?: any[] }> {
    try {
      const token = localStorage.getItem('admin_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/checkin/event', {
        method: 'POST',
        headers,
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (data && data.success) {
        await this.syncFromSupabase();
      }
      return {
        success: data?.success ?? (res.status === 200),
        reason: data?.reason || (data?.success ? 'Event check-in verified' : 'Check-in rejected'),
        member: data?.member,
        team: data?.team,
        registered_events: data?.registered_events
      };
    } catch (e: any) {
      return {
        success: false,
        reason: e.message || 'Event track check-in error.'
      };
    }
  }

  async checkinFoodApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team; food_preference?: 'VEG' | 'NON_VEG' }> {
    try {
      const token = localStorage.getItem('admin_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/checkin/food', {
        method: 'POST',
        headers,
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (data && data.success) {
        await this.syncFromSupabase();
      }
      return {
        success: data?.success ?? (res.status === 200),
        reason: data?.reason || (data?.success ? 'Food token claimed' : 'Claim failed'),
        member: data?.member,
        team: data?.team,
        food_preference: data?.food_preference
      };
    } catch (e: any) {
      return {
        success: false,
        reason: e.message || 'Food distribution service error.'
      };
    }
  }

  async resendPassportApi(memberId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/passport-dispatch/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId })
      });
      const data = await res.json();
      return {
        success: data?.success ?? (res.status === 200),
        message: data?.message || (data?.success ? 'Passport dispatched' : 'Dispatch failed')
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Dispatch request failed'
      };
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


