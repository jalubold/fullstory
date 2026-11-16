import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LOCALES } from '../i18n';
import { getQuestionSet } from '../questions';
import { parseRevealed } from '../reveal';
import { compareQuestion } from '../scoring';
import { TRY_QUESTION_ID, tryQuestion } from '../tryit';

describe('landing "try one question"', () => {
  it('has an engine-backed outcome for every pair of answers, in every language', () => {
    for (const locale of LOCALES) {
      const q = tryQuestion(locale);
      const real = getQuestionSet(undefined, locale).questions.find((x) => x.id === TRY_QUESTION_ID)!;
      assert.equal(q.prompt, real.prompt);
      assert.equal(Object.keys(q.outcomes).length, real.options.length ** 2);
      for (const a of real.options) {
        for (const b of real.options) {
          const o = q.outcomes[`${a.id}|${b.id}`];
          assert.ok(o, `${locale} ${a.id}|${b.id}`);
          // The taste shows exactly what the test would conclude for that pair.
          assert.equal(o.relation, compareQuestion(real, a.id, b.id).relation);
          assert.ok(o.note.length > 20 && o.label.length > 2);
          assert.ok(o.overlap >= 0 && o.overlap <= 100);
        }
      }
    }
  });

  it('is symmetric: swapping who answered what gives the same reading', () => {
    const q = tryQuestion('en');
    for (const key of Object.keys(q.outcomes)) {
      const [a, b] = key.split('|');
      assert.deepEqual(q.outcomes[`${b}|${a}`], q.outcomes[key]);
    }
  });

  it('draws identical answers closest together and likely misunderstandings furthest apart', () => {
    const q = tryQuestion('en');
    assert.ok(q.outcomes['now|now'].overlap > q.outcomes['now|calm'].overlap);
    assert.ok(q.outcomes['now|calm'].overlap > q.outcomes['now|hold'].overlap);
    assert.equal(q.outcomes['hint|hold'].blindSpot, true);
  });
});

describe('reveal cookie', () => {
  it('keeps only well-formed keys', () => {
    assert.deepEqual(parseRevealed('0123456789.abcdef0123'), ['0123456789', 'abcdef0123']);
    assert.deepEqual(parseRevealed('nope.<script>.0123456789'), ['0123456789']);
    assert.deepEqual(parseRevealed(undefined), []);
    assert.equal(parseRevealed(Array(20).fill('0123456789').join('.')).length, 8);
  });
});
