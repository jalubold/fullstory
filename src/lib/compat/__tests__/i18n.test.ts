import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getContexts } from '../contexts';
import { localeFromRequest, pickLocale } from '../i18n';
import { getQuestionSet } from '../questions';
import { QUESTION_SET_V1 } from '../questions/v1';
import { QUESTION_SET_V1_ID } from '../questions/v1.id';
import { buildBlueprint } from '../report';
import { score } from '../scoring';
import type { Answers } from '../types';

const en = getQuestionSet('v1', 'en');
const id = getQuestionSet('v1', 'id');

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const sheet = (): Answers => Object.fromEntries(en.questions.map((q) => [q.id, q.options[Math.floor(rand() * q.options.length)].id]));

describe('locale detection', () => {
  it('prefers the explicit choice, then the IP country, then the browser', () => {
    assert.equal(pickLocale({ cookie: 'en', country: 'ID' }), 'en');
    assert.equal(pickLocale({ cookie: 'id', country: 'US' }), 'id');
    assert.equal(pickLocale({ country: 'ID' }), 'id');
    assert.equal(pickLocale({ country: 'id' }), 'id');
    assert.equal(pickLocale({ country: 'SG', acceptLanguage: 'id-ID,id;q=0.9' }), 'en');
    assert.equal(pickLocale({ acceptLanguage: 'id-ID,id;q=0.9,en;q=0.8' }), 'id');
    assert.equal(pickLocale({ acceptLanguage: 'en-US' }), 'en');
    assert.equal(pickLocale({ cookie: 'fr' }), 'en');
    assert.equal(pickLocale({}), 'en');
  });

  it('reads cookie and headers from a request', () => {
    const req = (h: Record<string, string>) => ({ headers: { get: (n: string) => h[n.toLowerCase()] ?? null } });
    assert.equal(localeFromRequest(req({ 'x-vercel-ip-country': 'ID' })), 'id');
    assert.equal(localeFromRequest(req({ 'x-vercel-ip-country': 'ID', cookie: 'a=1; awc_lang=en' })), 'en');
    assert.equal(localeFromRequest(req({ 'x-vercel-ip-country': 'NL' })), 'en');
  });
});

describe('Indonesian question set', () => {
  it('translates every question, option, pair and blind spot', () => {
    for (const d of QUESTION_SET_V1.dimensions) assert.ok(QUESTION_SET_V1_ID.dimensions[d.id]?.label, d.id);
    for (const q of QUESTION_SET_V1.questions) {
      const t = QUESTION_SET_V1_ID.questions[q.id];
      assert.ok(t, q.id);
      for (const o of q.options) {
        const to = t.options[o.id];
        assert.ok(to?.label && to.trait && to.plural, `${q.id}.${o.id}`);
        assert.notEqual(to.label, o.label, `${q.id}.${o.id} untranslated`);
        assert.match(to.trait, /^[^A-Z]/, `${q.id}.${o.id} trait starts lowercase`);
        assert.doesNotMatch(to.trait, /\.$/, `${q.id}.${o.id} trait has no trailing period`);
      }
      for (const p of [...(q.complements ?? []), ...(q.frictions ?? [])]) assert.ok(t.pairs?.[`${p.a}|${p.b}`], `${q.id} pair ${p.a}|${p.b}`);
      assert.equal(t.blindSpots?.length ?? 0, q.blindSpots?.length ?? 0, `${q.id} blind spots`);
    }
  });

  it('keeps ids, order and weights identical to English', () => {
    assert.deepEqual(
      id.questions.map((q) => [q.id, q.kind, q.weight, q.options.map((o) => o.id)]),
      en.questions.map((q) => [q.id, q.kind, q.weight, q.options.map((o) => o.id)]),
    );
  });

  it('scores identically in both languages', () => {
    for (let i = 0; i < 100; i++) {
      const a = sheet();
      const b = sheet();
      const re = score(en, a, b);
      const ri = score(id, a, b);
      assert.deepEqual(ri.overall, re.overall);
      assert.deepEqual(ri.dimensions, re.dimensions);
      assert.equal(ri.signature, re.signature);
      assert.deepEqual(ri.axes, re.axes);
      assert.deepEqual(ri.comparisons.map((c) => [c.relation, c.alignment, !!c.blindSpot]), re.comparisons.map((c) => [c.relation, c.alignment, !!c.blindSpot]));
    }
  });

  it('has Indonesian relationship stages', () => {
    assert.equal(getContexts('id').length, getContexts('en').length);
    assert.equal(getContexts('id').find((c) => c.id === 'dating')?.label, 'Pacaran');
  });
});

describe('Indonesian Blueprint', () => {
  const names = { a: 'Ayu', b: 'Bima' };
  it('is fully in Indonesian, well-formed, for many random pairs', () => {
    const englishMarkers = /\b(You both|Because|the other|while|aligned|answered|feels most loved)\b/;
    for (let i = 0; i < 200; i++) {
      const bp = buildBlueprint({ set: id, context: 'dating', names, answers: { a: sheet(), b: sheet() }, locale: 'id' });
      const text = JSON.stringify(bp);
      assert.ok(!/undefined|NaN/.test(text), `run ${i}`);
      assert.doesNotMatch(text, englishMarkers, `run ${i}: English left in Indonesian report`);
      assert.equal(bp.locale, 'id');
      assert.ok(bp.strengths.length >= 3 && bp.actions.length >= 2 && bp.starters.length === 8);
    }
  });

  it('matches the English Blueprint structurally', () => {
    const a = sheet();
    const b = sheet();
    const e = buildBlueprint({ set: en, context: 'married', names, answers: { a, b } });
    const x = buildBlueprint({ set: id, context: 'married', names, answers: { a, b }, locale: 'id' });
    assert.equal(x.overview.alignment, e.overview.alignment);
    assert.equal(x.overview.signature.id, e.overview.signature.id);
    for (const k of ['together', 'differ', 'strengths', 'blindSpots', 'starters', 'actions'] as const) {
      assert.deepEqual(
        (x[k] as Array<{ id?: string; horizon?: string }>).map((i) => i.id ?? i.horizon),
        (e[k] as Array<{ id?: string; horizon?: string }>).map((i) => i.id ?? i.horizon),
        k,
      );
    }
  });
});
