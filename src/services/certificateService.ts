import { 
  GeneratedCertificate, 
  CertificateType, 
  CertificateTemplateConfig,
  EventMission, 
  Participant 
} from '@packages/types/src';
import { store } from './store';

export const DEFAULT_TEMPLATES: Record<CertificateType, CertificateTemplateConfig> = {
  PARTICIPATION: {
    type: 'PARTICIPATION',
    title: 'CERTIFICATE OF PARTICIPATION',
    subtitle: 'This is to officially certify that the temporal agent has actively participated in the operational symposium mission.',
    badge_label: 'OFFICIAL PARTICIPANT',
    primary_color: '#00f0ff',
    border_color: 'rgba(0, 240, 255, 0.4)',
    signatory_1: { name: 'Dr. A. Rajesh, M.E., Ph.D.', title: 'Staff Convener & Head, CSE' },
    signatory_2: { name: 'Dr. V. Sundar, Ph.D.', title: 'Principal, GCE Salem' }
  },
  WINNER_1ST: {
    type: 'WINNER_1ST',
    title: 'CERTIFICATE OF EXCELLENCE // 1ST PRIZE',
    subtitle: 'Awarded to the vanguard temporal agent/team for securing FIRST PLACE with exceptional problem solving and technical excellence.',
    badge_label: 'FIRST PLACE // CHAMPION',
    primary_color: '#f59e0b',
    border_color: 'rgba(245, 158, 11, 0.6)',
    signatory_1: { name: 'Dr. A. Rajesh, M.E., Ph.D.', title: 'Staff Convener & Head, CSE' },
    signatory_2: { name: 'Dr. V. Sundar, Ph.D.', title: 'Principal, GCE Salem' }
  },
  WINNER_2ND: {
    type: 'WINNER_2ND',
    title: 'CERTIFICATE OF MERIT // 2ND PRIZE',
    subtitle: 'Awarded to the temporal agent/team for securing SECOND PLACE in the operational mission.',
    badge_label: 'SECOND PLACE // RUNNER UP',
    primary_color: '#94a3b8',
    border_color: 'rgba(148, 163, 184, 0.6)',
    signatory_1: { name: 'Dr. A. Rajesh, M.E., Ph.D.', title: 'Staff Convener & Head, CSE' },
    signatory_2: { name: 'Dr. V. Sundar, Ph.D.', title: 'Principal, GCE Salem' }
  },
  WINNER_3RD: {
    type: 'WINNER_3RD',
    title: 'CERTIFICATE OF MERIT // 3RD PRIZE',
    subtitle: 'Awarded to the temporal agent/team for securing THIRD PLACE in the operational mission.',
    badge_label: 'THIRD PLACE // COMMENDATION',
    primary_color: '#d97706',
    border_color: 'rgba(217, 119, 6, 0.6)',
    signatory_1: { name: 'Dr. A. Rajesh, M.E., Ph.D.', title: 'Staff Convener & Head, CSE' },
    signatory_2: { name: 'Dr. V. Sundar, Ph.D.', title: 'Principal, GCE Salem' }
  },
  SPECIAL_RECOGNITION: {
    type: 'SPECIAL_RECOGNITION',
    title: 'SPECIAL RECOGNITION AWARD',
    subtitle: 'Honoring exceptional innovation, design mastery, or creative distinction in the CHRONOS continuum.',
    badge_label: 'SPECIAL DISTINCTION',
    primary_color: '#8b5cf6',
    border_color: 'rgba(139, 92, 246, 0.6)',
    signatory_1: { name: 'Dr. A. Rajesh, M.E., Ph.D.', title: 'Staff Convener & Head, CSE' },
    signatory_2: { name: 'Dr. V. Sundar, Ph.D.', title: 'Principal, GCE Salem' }
  }
};

class CertificateService {
  private templates: Record<CertificateType, CertificateTemplateConfig> = DEFAULT_TEMPLATES;

  getTemplates() {
    return this.templates;
  }

  updateTemplate(type: CertificateType, config: Partial<CertificateTemplateConfig>) {
    this.templates[type] = {
      ...this.templates[type],
      ...config
    };
  }

  finalizeEventResults(
    eventId: string,
    winners: { position: 1 | 2 | 3; participantId: string }[]
  ): { success: boolean; message?: string } {
    const events = store.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found' };

    event.results_finalized = true;
    event.results_finalized_at = new Date().toISOString();

    winners.forEach(w => {
      if (w.participantId) {
        store.assignPrizePosition(eventId, w.participantId, w.position);
      }
    });

    return { success: true };
  }

  getEligibleCertificatesForParticipant(participantId: string): GeneratedCertificate[] {
    const participant = store.getParticipants().find(
      p => p.team_id === participantId || p.agent_id === participantId
    );
    if (!participant) return [];

    const targetTeamId = participant.team_id;
    const attendanceRecords = store.getAttendance().filter(
      a => (a.team_id === targetTeamId || a.member_id === participantId || a.agent_id === participantId) && 
           a.checkin_type === 'EVENT' && a.event_id
    );

    const registrations = store.getEventRegistrations().filter(
      r => r.agent_id === targetTeamId || r.team_members?.includes(participantId)
    );

    const allEvents = store.getEvents();
    const certificates: GeneratedCertificate[] = [];

    for (const att of attendanceRecords) {
      const event = allEvents.find(e => e.id === att.event_id);
      if (!event || !event.results_finalized) continue;

      const reg = registrations.find(r => r.event_id === event.id);
      const position = reg?.position || null;

      let certType: CertificateType = 'PARTICIPATION';
      if (position === 1) certType = 'WINNER_1ST';
      else if (position === 2) certType = 'WINNER_2ND';
      else if (position === 3) certType = 'WINNER_3RD';

      const shortId = (participant.agent_id || participant.team_id || 'PART').replace('ZIN26-', '');
      const certNum = `ZIN26-CERT-${shortId}-${event.code}`;

      certificates.push({
        certificate_number: certNum,
        participant_id: targetTeamId,
        agent_id: participant.agent_id || participant.team_id,
        participant_name: participant.name || participant.team_name,
        college: participant.college,
        department: participant.department,
        event_id: event.id,
        event_name: event.mission_name,
        event_title: event.title,
        event_type: event.event_type,
        position,
        type: certType,
        issue_date: event.results_finalized_at 
          ? new Date(event.results_finalized_at).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
        verified: true,
        qr_verification_token: `VERIFY_${certNum}_CHRONOS`
      });
    }

    return certificates;
  }

  generateCertificatesForEvent(eventId: string): GeneratedCertificate[] {
    const event = store.getEvents().find(e => e.id === eventId);
    if (!event || !event.results_finalized) return [];

    const attendedParticipants = store.getAttendance()
      .filter(a => a.event_id === eventId && a.checkin_type === 'EVENT');

    const registrations = store.getEventRegistrations()
      .filter(r => r.event_id === eventId);

    const allParticipants = store.getParticipants();
    const certs: GeneratedCertificate[] = [];

    attendedParticipants.forEach(att => {
      const p = allParticipants.find(part => part.team_id === att.team_id || part.agent_id === att.agent_id);
      if (!p) return;

      const reg = registrations.find(r => r.agent_id === p.team_id);
      const position = reg?.position || null;

      let certType: CertificateType = 'PARTICIPATION';
      if (position === 1) certType = 'WINNER_1ST';
      else if (position === 2) certType = 'WINNER_2ND';
      else if (position === 3) certType = 'WINNER_3RD';

      const shortId = (p.agent_id || p.team_id || 'PART').replace('ZIN26-', '');
      const certNum = `ZIN26-CERT-${shortId}-${event.code}`;

      certs.push({
        certificate_number: certNum,
        participant_id: p.team_id,
        agent_id: p.agent_id || p.team_id,
        participant_name: p.name || p.team_name,
        college: p.college,
        department: p.department,
        event_id: event.id,
        event_name: event.mission_name,
        event_title: event.title,
        event_type: event.event_type,
        position,
        type: certType,
        issue_date: event.results_finalized_at 
          ? new Date(event.results_finalized_at).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
        verified: true,
        qr_verification_token: `VERIFY_${certNum}_CHRONOS`
      });
    });

    return certs;
  }
}

export const certificateService = new CertificateService();
