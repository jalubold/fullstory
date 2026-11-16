import 'server-only';
import { cookies } from 'next/headers';
import { isProduction, appUrl } from '@/lib/server/env';
import { getContext } from '../contexts';
import type { Locale } from '../i18n';
import { getQuestionSet } from '../questions';
import { buildBlueprint, type Blueprint } from '../report';
import type { Answers, Role } from '../types';
import { bothAnswers, findByToken, type ParticipantContext } from './repo';
import { inviteTokenFor, isTokenShaped } from './tokens';

export type Stage = 'answering' | 'waiting' | 'results';

/** Everything a participant's private page may show. Never includes the partner's answers. */
export interface ParticipantView {
  token: string;
  role: Role;
  name: string;
  partnerName: string | null;
  context: { id: string; label: string };
  questionSet: string;
  stage: Stage;
  myAnswers: Answers;
  partnerJoined: boolean;
  partnerSubmitted: boolean;
  unlocked: boolean;
  /** Only for the person who started, so they can (re)share it. */
  inviteUrl: string | null;
  assessmentId: string;
}

export function toView(token: string, ctx: ParticipantContext, locale: Locale = 'en'): ParticipantView {
  const submitted = !!ctx.me.submitted_at;
  const partnerSubmitted = !!ctx.partner?.submitted_at;
  const info = getContext(ctx.assessment.context, locale);
  return {
    token,
    role: ctx.me.role,
    name: ctx.me.name,
    partnerName: ctx.partner?.name ?? null,
    context: { id: info.id, label: info.label },
    questionSet: ctx.assessment.question_set,
    stage: !submitted ? 'answering' : partnerSubmitted ? 'results' : 'waiting',
    myAnswers: ctx.me.answers ?? {},
    partnerJoined: !!ctx.partner,
    partnerSubmitted,
    unlocked: !!ctx.assessment.unlocked_at,
    inviteUrl: ctx.me.role === 'a' ? `${appUrl()}/compatible/i/${inviteTokenFor(ctx.assessment.id)}` : null,
    assessmentId: ctx.assessment.id,
  };
}

export async function loadView(token: string, locale: Locale = 'en'): Promise<{ view: ParticipantView; ctx: ParticipantContext } | null> {
  const ctx = await findByToken(token);
  return ctx ? { view: toView(token, ctx, locale), ctx } : null;
}

/** The full Blueprint in the reader's language, once both have submitted. Callers decide what to reveal (preview vs paid). */
export async function loadBlueprint(ctx: ParticipantContext, locale: Locale = 'en'): Promise<Blueprint | null> {
  const both = await bothAnswers(ctx.assessment.id);
  if (!both) return null;
  return buildBlueprint({
    set: getQuestionSet(ctx.assessment.question_set, locale),
    context: ctx.assessment.context,
    names: { a: both.a.name, b: both.b.name },
    answers: { a: both.a.answers, b: both.b.answers },
    locale,
  });
}

/* ───────────── "Continue where you left off" — this browser's private links ───────────── */

const COOKIE = 'awc_links';
const MAX_LINKS = 4;

export async function rememberedTokens(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  return raw.split('.').filter(isTokenShaped).slice(0, MAX_LINKS);
}

export async function rememberToken(token: string): Promise<void> {
  const list = [token, ...(await rememberedTokens()).filter((t) => t !== token)].slice(0, MAX_LINKS);
  (await cookies()).set(COOKIE, list.join('.'), { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/', maxAge: 180 * 86400 });
}

export async function forgetToken(token: string): Promise<void> {
  const list = (await rememberedTokens()).filter((t) => t !== token);
  const jar = await cookies();
  if (list.length) jar.set(COOKIE, list.join('.'), { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/', maxAge: 180 * 86400 });
  else jar.delete(COOKIE);
}
