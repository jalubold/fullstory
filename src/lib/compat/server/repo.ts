import 'server-only';
import crypto from 'node:crypto';
import { sql, sqlOne, transaction } from '@/lib/server/db';
import { getSetting, setSetting } from '@/lib/server/repo/settings';
import { CURRENT_QUESTION_SET, getQuestionSet, sanitizeAnswers, validateAnswers } from '../questions';
import { SCORING_VERSION } from '../scoring';
import type { Answers, RelationshipContext, Role } from '../types';
import { RETENTION_DAYS } from '../retention';
import { hashToken, inviteTokenFor, isTokenShaped, newToken } from './tokens';

/**
 * Data access for Are We Compatible?. There are no accounts: a participant is
 * whoever holds their private link. Every function that returns answers is
 * scoped to one participant token, and a partner's answers are only ever
 * read once both have submitted (see ./view.ts).
 */

export interface AssessmentRow {
  id: string;
  context: RelationshipContext;
  question_set: string;
  scoring_version: string;
  unlocked_at: Date | string | null;
  unlock_order_id: string | null;
  created_at: Date | string;
  expires_at: Date | string;
}

export interface ParticipantRow {
  id: string;
  assessment_id: string;
  role: Role;
  name: string;
  answers: Answers;
  submitted_at: Date | string | null;
}


export function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // Strip control characters and collapse whitespace; keep letters from any script.
  const name = raw.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  return name.length ? name : null;
}

const ASSESSMENT_COLS = 'id, context, question_set, scoring_version, unlocked_at, unlock_order_id, created_at, expires_at';
const PARTICIPANT_COLS = 'id, assessment_id, role, name, answers, submitted_at';

export async function createAssessment(input: { context: RelationshipContext; name: string }): Promise<{ assessment: AssessmentRow; token: string }> {
  await purgeExpired();
  const id = crypto.randomUUID();
  const token = newToken();
  const assessment = await transaction(async (q) => {
    const [a] = await q<AssessmentRow>(
      `insert into compat_assessments (id, context, question_set, scoring_version, invite_token_hash, expires_at)
       values ($1, $2, $3, $4, $5, now() + make_interval(days => $6)) returning ${ASSESSMENT_COLS}`,
      [id, input.context, CURRENT_QUESTION_SET, SCORING_VERSION, hashToken(inviteTokenFor(id)), RETENTION_DAYS.open],
    );
    await q(`insert into compat_participants (id, assessment_id, role, name, token_hash) values ($1, $2, 'a', $3, $4)`, [crypto.randomUUID(), id, input.name, hashToken(token)]);
    return a;
  });
  return { assessment, token };
}

export interface ParticipantContext {
  assessment: AssessmentRow;
  me: ParticipantRow;
  /** The other participant, without their answers. */
  partner: Omit<ParticipantRow, 'answers'> | null;
}

/** Resolves a private link. Returns null for unknown, malformed or expired links. */
export async function findByToken(token: string): Promise<ParticipantContext | null> {
  if (!isTokenShaped(token)) return null;
  const me = await sqlOne<ParticipantRow>(`select ${PARTICIPANT_COLS} from compat_participants where token_hash = $1`, [hashToken(token)]);
  if (!me) return null;
  const assessment = await sqlOne<AssessmentRow>(`select ${ASSESSMENT_COLS} from compat_assessments where id = $1 and expires_at > now()`, [me.assessment_id]);
  if (!assessment) return null;
  const partner = await sqlOne<Omit<ParticipantRow, 'answers'>>(`select id, assessment_id, role, name, submitted_at from compat_participants where assessment_id = $1 and role <> $2`, [assessment.id, me.role]);
  return { assessment, me, partner };
}

export async function findByInvite(inviteToken: string): Promise<{ assessment: AssessmentRow; inviter: Omit<ParticipantRow, 'answers'>; joined: boolean } | null> {
  if (!isTokenShaped(inviteToken)) return null;
  const assessment = await sqlOne<AssessmentRow>(`select ${ASSESSMENT_COLS} from compat_assessments where invite_token_hash = $1 and expires_at > now()`, [hashToken(inviteToken)]);
  if (!assessment) return null;
  const people = await sql<Omit<ParticipantRow, 'answers'>>(`select id, assessment_id, role, name, submitted_at from compat_participants where assessment_id = $1`, [assessment.id]);
  const inviter = people.find((p) => p.role === 'a');
  if (!inviter) return null;
  return { assessment, inviter, joined: people.some((p) => p.role === 'b') };
}

/** Accepts an invitation. Atomic: only the first claim wins; returns null if already taken. */
export async function claimInvite(assessmentId: string, name: string): Promise<string | null> {
  const token = newToken();
  const rows = await sql<{ id: string }>(
    `insert into compat_participants (id, assessment_id, role, name, token_hash) values ($1, $2, 'b', $3, $4)
     on conflict (assessment_id, role) do nothing returning id`,
    [crypto.randomUUID(), assessmentId, name, hashToken(token)],
  );
  if (!rows.length) return null;
  await sql('update compat_assessments set updated_at = now() where id = $1', [assessmentId]);
  return token;
}

export class AnswerError extends Error {}

/** Saves progress (partial answers). Ignored once the participant has submitted. */
export async function saveProgress(ctx: ParticipantContext, raw: Record<string, unknown>): Promise<Answers> {
  if (ctx.me.submitted_at) return ctx.me.answers;
  const answers = sanitizeAnswers(getQuestionSet(ctx.assessment.question_set), raw);
  await sql(`update compat_participants set answers = $2, updated_at = now() where id = $1 and submitted_at is null`, [ctx.me.id, JSON.stringify(answers)]);
  return answers;
}

/** Final submission. Answers are locked afterwards so results never shift under either person. */
export async function submitAnswers(ctx: ParticipantContext, raw: Record<string, unknown>): Promise<{ bothDone: boolean }> {
  if (ctx.me.submitted_at) return { bothDone: !!ctx.partner?.submitted_at };
  const set = getQuestionSet(ctx.assessment.question_set);
  const check = validateAnswers(set, raw);
  if (!check.ok) throw new AnswerError('Please answer every question before submitting.');
  const answers = sanitizeAnswers(set, raw);
  return transaction(async (q) => {
    await q(`update compat_participants set answers = $2, submitted_at = now(), updated_at = now() where id = $1 and submitted_at is null`, [ctx.me.id, JSON.stringify(answers)]);
    const [{ n }] = await q<{ n: number }>(`select count(*)::int as n from compat_participants where assessment_id = $1 and submitted_at is not null`, [ctx.assessment.id]);
    const bothDone = Number(n) === 2;
    // Completed results are kept longer than unfinished ones.
    if (bothDone) await q(`update compat_assessments set expires_at = now() + make_interval(days => $2), updated_at = now() where id = $1`, [ctx.assessment.id, RETENTION_DAYS.complete]);
    return { bothDone };
  });
}

/** Both participants' answers. Only call after both have submitted. */
export async function bothAnswers(assessmentId: string): Promise<Record<Role, ParticipantRow> | null> {
  const rows = await sql<ParticipantRow>(`select ${PARTICIPANT_COLS} from compat_participants where assessment_id = $1 and submitted_at is not null`, [assessmentId]);
  const a = rows.find((r) => r.role === 'a');
  const b = rows.find((r) => r.role === 'b');
  return a && b ? { a, b } : null;
}

/** Permanently deletes an assessment and both participants' answers. */
export async function deleteAssessment(id: string): Promise<void> {
  await sql('delete from compat_assessments where id = $1', [id]);
}

/** Removes expired assessments. Runs at most once an hour, piggybacking on normal traffic. */
export async function purgeExpired(): Promise<void> {
  try {
    const last = Number((await getSetting('compat:purged_at')) ?? 0);
    if (Date.now() - last < 3600_000) return;
    await setSetting('compat:purged_at', String(Date.now()));
    await sql('delete from compat_assessments where expires_at < now()');
  } catch (e) {
    console.error('[compat] purge failed', e);
  }
}
