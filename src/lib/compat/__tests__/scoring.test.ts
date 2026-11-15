import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getQuestionSet, sanitizeAnswers, validateAnswers } from '../questions';
import { buildBlueprint, buildPreview } from '../report';
import { compareQuestion, score, SCORING_VERSION } from '../scoring';
import type { Answers, Question } from '../types';

const set = getQuestionSet('v1');
const q = (id: string) => set.questions.find((x) => x.id === id)! as Question;

/** Answer every question with the option at `index` (clamped). */
const uniform = (index: number): Answers => Object.fromEntries(set.questions.map((x) => [x.id, x.options[Math.min(index, x.options.length - 1)].id]));

describe('question set v1', () => {
  it('has 20 questions, 4 per dimension, 3–5 options each', () => {
    assert.equal(set.questions.length, 20);
    for (const d of set.dimensions) assert.equal(set.questions.filter((x) => x.dimension === d.id).length, 4, d.id);
    for (const x of set.questions) assert.ok(x.options.length >= 3 && x.options.length <= 5, x.id);
  });

  it('has unique ids and authored pairs that reference real options', () => {
    assert.equal(new Set(set.questions.map((x) => x.id)).size, set.questions.length);
    for (const x of set.questions) {
      const ids = new Set(x.options.map((o) => o.id));
      assert.equal(ids.size, x.options.length, `${x.id} option ids`);
      for (const p of [...(x.complements ?? []), ...(x.frictions ?? [])]) assert.ok(ids.has(p.a) && ids.has(p.b), `${x.id} pair ${p.a}/${p.b}`);
      for (const r of x.blindSpots ?? []) for (const o of r.options) assert.ok(ids.has(o), `${x.id} blind spot ${o}`);
      for (const o of x.options) for (const v of Object.values(o.axes ?? {})) assert.ok(v! >= -1 && v! <= 1, `${x.id}.${o.id} axis range`);
    }
  });

  it('validates complete and rejects partial or tampered answer sheets', () => {
    assert.deepEqual(validateAnswers(set, uniform(0)), { ok: true });
    const partial = { ...uniform(0) };
    delete partial['fut-money'];
    const res = validateAnswers(set, { ...partial, 'com-rhythm': 'nope', extra: 'x' });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.deepEqual(res.missing, ['fut-money']);
      assert.ok(res.invalid.includes('com-rhythm') && res.invalid.includes('extra'));
    }
    assert.deepEqual(sanitizeAnswers(set, { 'com-rhythm': 'steady', 'com-raise': 'bogus', other: 'x' }), { 'com-rhythm': 'steady' });
  });
});

describe('compareQuestion', () => {
  it('identical answers are shared with full similarity', () => {
    const c = compareQuestion(q('com-rhythm'), 'steady', 'steady');
    assert.equal(c.relation, 'shared');
    assert.equal(c.similarity, 1);
    assert.equal(c.alignment, 100);
  });

  it('scale neighbours are close; opposite ends are tension', () => {
    const close = compareQuestion(q('com-rhythm'), 'steady', 'checkins');
    assert.equal(close.relation, 'close');
    assert.ok(close.alignment > 70 && close.alignment < 100);
    const far = compareQuestion(q('com-rhythm'), 'steady', 'light');
    assert.equal(far.relation, 'tension');
    assert.equal(far.similarity, 0);
    const mid = compareQuestion(q('fut-children'), 'yes', 'unsure');
    assert.equal(mid.relation, 'different');
    assert.equal(mid.similarity, 0.5);
  });

  it('is symmetric', () => {
    for (const x of set.questions) {
      for (const a of x.options) {
        for (const b of x.options) {
          const ab = compareQuestion(x, a.id, b.id);
          const ba = compareQuestion(x, b.id, a.id);
          assert.equal(ab.relation, ba.relation, `${x.id} ${a.id}/${b.id}`);
          assert.equal(ab.alignment, ba.alignment);
          assert.equal(ab.similarity, ba.similarity);
        }
      }
    }
  });

  it('authored pairs override neutral difference — in both directions', () => {
    assert.equal(compareQuestion(q('con-heat'), 'push', 'quiet').relation, 'tension');
    assert.equal(compareQuestion(q('con-heat'), 'quiet', 'push').relation, 'tension');
    const comp = compareQuestion(q('com-raise'), 'calm', 'now');
    assert.equal(comp.relation, 'complementary');
    assert.ok(comp.pairNote);
  });

  it('does not treat identical answers as automatically ideal (shared blind spots)', () => {
    const c = compareQuestion(q('con-heat'), 'quiet', 'quiet');
    assert.equal(c.relation, 'shared');
    assert.ok(c.blindSpot);
    assert.ok(c.alignment < 100);
    // Different answers that are both avoidant are still flagged.
    const d = compareQuestion(q('com-raise'), 'hint', 'hold');
    assert.equal(d.relation, 'different');
    assert.ok(d.blindSpot);
  });

  it('does not treat differences as automatically negative (needs questions, complements)', () => {
    const needs = compareQuestion(q('com-upset'), 'listen', 'solve');
    const neutral = compareQuestion(q('life-weekend'), 'social', 'own');
    assert.ok(needs.alignment > neutral.alignment);
    const complement = compareQuestion(q('life-weekend'), 'adventure', 'home');
    assert.ok(complement.alignment > 70, 'complementary differences score well');
  });

  it('rejects unknown options', () => {
    assert.throws(() => compareQuestion(q('com-rhythm'), 'steady', 'nope'));
  });
});

describe('score', () => {
  it('is deterministic and versioned', () => {
    const a = uniform(0);
    const b = uniform(2);
    assert.deepEqual(score(set, a, b), score(set, a, b));
    assert.equal(score(set, a, b).scoringVersion, SCORING_VERSION);
    assert.equal(score(set, a, b).questionSetVersion, 'v1');
  });

  it('identical sheets give full similarity; scores stay within 0–100', () => {
    const r = score(set, uniform(1), uniform(1));
    assert.equal(r.overall.similarity, 100);
    assert.equal(r.overall.sameAnswers, 20);
    for (const d of r.dimensions) assert.ok(d.alignment >= 0 && d.alignment <= 100);
  });

  it('opposite sheets score lower than identical ones', () => {
    const same = score(set, uniform(0), uniform(0));
    const opposite = score(set, uniform(0), uniform(4));
    assert.ok(opposite.overall.alignment < same.overall.alignment);
    assert.ok(opposite.overall.similarity < same.overall.similarity);
    assert.ok(opposite.overall.counts.tension > 0);
  });

  it('dimension counts add up to the questions in each dimension', () => {
    const r = score(set, uniform(0), uniform(3));
    for (const d of r.dimensions) assert.equal(Object.values(d.counts).reduce((s, v) => s + v, 0), 4);
  });

  it('is symmetric between participants (except axes)', () => {
    const a = uniform(0);
    const b = uniform(3);
    const ab = score(set, a, b);
    const ba = score(set, b, a);
    assert.equal(ab.overall.alignment, ba.overall.alignment);
    assert.equal(ab.overall.similarity, ba.overall.similarity);
    assert.equal(ab.signature, ba.signature);
    assert.deepEqual(ab.axes.a, ba.axes.b);
  });

  it('requires complete answers from both people', () => {
    const partial = { ...uniform(0) };
    delete partial['con-sorry'];
    assert.throws(() => score(set, uniform(0), partial));
  });

  it('axis positions stay within -1..1', () => {
    const r = score(set, uniform(0), uniform(3));
    for (const role of ['a', 'b'] as const) for (const v of Object.values(r.axes[role])) assert.ok(v === null || (v >= -1 && v <= 1));
  });
});

describe('blueprint', () => {
  const names = { a: 'Maya', b: 'Daniel' };
  const answersA: Answers = {
    'com-rhythm': 'steady', 'com-raise': 'now', 'com-upset': 'comfort', 'com-closest': 'deep',
    'emo-loved': 'words', 'emo-show': 'touch', 'emo-reassure': 'lots', 'emo-open': 'easily',
    'life-recharge': 'together', 'life-weekend': 'adventure', 'life-social': 'mostly', 'life-plans': 'fine',
    'fut-pace': 'steady', 'fut-money': 'mostly', 'fut-children': 'yes', 'fut-family': 'close',
    'con-heat': 'push', 'con-repair': 'talk', 'con-sorry': 'easy', 'con-matters': 'understood',
  };
  const answersB: Answers = {
    'com-rhythm': 'one', 'com-raise': 'hold', 'com-upset': 'space', 'com-closest': 'playful',
    'emo-loved': 'help', 'emo-show': 'help', 'emo-reassure': 'little', 'emo-open': 'slowly',
    'life-recharge': 'solo', 'life-weekend': 'home', 'life-social': 'mostly', 'life-plans': 'prefer',
    'fut-pace': 'steady', 'fut-money': 'split', 'fut-children': 'likely', 'fut-family': 'close',
    'con-heat': 'quiet', 'con-repair': 'move', 'con-sorry': 'show', 'con-matters': 'fair',
  };
  const bp = buildBlueprint({ set, context: 'dating', names, answers: { a: answersA, b: answersB } });

  it('includes all 14 sections', () => {
    assert.ok(bp.overview.summary.length >= 2);
    assert.equal(bp.profiles.a.name, 'Maya');
    assert.equal(bp.profiles.b.name, 'Daniel');
    assert.equal(bp.dimensions.length, 5);
    assert.ok(bp.together.length > 0);
    assert.ok(bp.differ.length > 0);
    for (const s of [bp.emotional, bp.communication, bp.conflict, bp.future]) assert.ok(s.items.length >= 4, s.id);
    assert.ok(bp.strengths.length >= 3);
    assert.ok(bp.blindSpots.length > 0);
    assert.ok(bp.starters.length >= 5);
    assert.ok(bp.actions.length >= 3);
  });

  it('grounds insights in both participants’ actual answers', () => {
    for (const ins of [...bp.together, ...bp.differ]) {
      assert.ok(ins.evidence?.length, ins.id);
      const qq = q(ins.id);
      const ev = ins.evidence![0];
      assert.equal(ev.a, qq.options.find((o) => o.id === answersA[qq.id])!.label);
      assert.equal(ev.b, qq.options.find((o) => o.id === answersB[qq.id])!.label);
    }
    // Every comparison row reflects the stored answers.
    for (const d of bp.dimensions) for (const row of d.rows) assert.equal(row.a, q(row.questionId).options.find((o) => o.id === answersA[row.questionId])!.label);
  });

  it('detects specific patterns from the answers', () => {
    const ids = bp.blindSpots.map((b) => b.id);
    assert.ok(ids.includes('pursue-withdraw'), 'Maya pushes, Daniel withdraws');
    assert.ok(ids.includes('quiet-distance-a'), 'Maya wants reassurance; Daniel prefers light contact');
    assert.ok(ids.includes('depleted-a'), 'Maya wants comfort; Daniel recharges alone');
    const careForMaya = bp.emotional.items.find((i) => i.id === 'care-a')!;
    assert.match(careForMaya.title, /Translating Daniel’s care for Maya/);
    const careForDaniel = bp.emotional.items.find((i) => i.id === 'care-b')!;
    assert.match(careForDaniel.title, /Maya’s care lands|Translating Maya’s care/);
  });

  it('uses both names and never leaks placeholder text', () => {
    const text = JSON.stringify(bp);
    assert.ok(text.includes('Maya') && text.includes('Daniel'));
    assert.ok(!/undefined|\{name\}|NaN/.test(text));
  });

  it('action plan steps say why, using the answers', () => {
    const grounded = bp.actions.filter((a) => a.because);
    assert.ok(grounded.length >= 3);
    for (const a of grounded) assert.match(a.because!, /Maya|Daniel|You both/);
  });

  it('preview is a strict subset that holds back the premium tip', () => {
    const p = buildPreview(bp);
    assert.equal(p.overview.alignment, bp.overview.alignment);
    assert.equal(p.dimensions.length, 5);
    assert.equal(p.differ?.tip, undefined);
    assert.equal(p.counts.differences, bp.differ.length);
    assert.ok(!('starters' in p));
  });

  it('handles identical answer sheets gracefully', () => {
    const same = buildBlueprint({ set, context: 'married', names, answers: { a: answersA, b: answersA } });
    assert.equal(same.differ.length, 0);
    assert.ok(same.starters.length >= 5);
    assert.ok(!JSON.stringify(same).includes('undefined'));
  });

  it('produces a well-formed blueprint for many random pairs', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const randomSheet = (): Answers => Object.fromEntries(set.questions.map((x) => [x.id, x.options[Math.floor(rand() * x.options.length)].id]));
    for (let i = 0; i < 300; i++) {
      const out = buildBlueprint({ set, context: 'talking', names, answers: { a: randomSheet(), b: randomSheet() } });
      const text = JSON.stringify(out);
      assert.ok(!/undefined|NaN/.test(text), `run ${i}`);
      assert.ok(out.strengths.length >= 3 && out.blindSpots.length >= 1 && out.actions.length >= 2 && out.starters.length === 8);
    }
  });
});
