import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LOCALES } from '../i18n';
import { getQuestionSet } from '../questions';
import { FINDING_EVIDENCE, FINDING_REFS, referenceList } from '../research';
import { measureRobustness } from '../robustness';
import { SAMPLE_ANSWERS } from '../sample';
import { score, scoreWith, scoringParams } from '../scoring';
import { UI } from '../ui-strings';

describe('robustness of the scoring weights', () => {
  const small = { couples: 150, variations: 40 };

  it('is repeatable: the same seed gives the same figures', () => {
    assert.deepEqual(measureRobustness(small), measureRobustness(small));
  });

  it('moves results only a little when every weight is varied by ±25%', () => {
    const r = measureRobustness(small);
    assert.ok(r.meanShift <= 1.5, `mean shift ${r.meanShift}`);
    assert.ok(r.p95Shift <= 3, `95th percentile ${r.p95Shift}`);
    assert.ok(r.sameSignature >= 88, `same signature ${r.sameSignature}%`);
  });

  it('moves results more when the weights are varied more', () => {
    assert.ok(measureRobustness({ ...small, spread: 0.5 }).meanShift > measureRobustness({ ...small, spread: 0.1 }).meanShift);
  });

  it('scores identically through score() and scoreWith()', () => {
    const set = getQuestionSet();
    assert.deepEqual(scoreWith(set, SAMPLE_ANSWERS.a, SAMPLE_ANSWERS.b, scoringParams()), score(set, SAMPLE_ANSWERS.a, SAMPLE_ANSWERS.b));
  });
});

describe('claims made in the copy', () => {
  it('counts the publications the FAQ says it draws on', () => {
    assert.equal(referenceList().length, 12);
    for (const locale of LOCALES) assert.ok(UI[locale].landing.faq[0][1].includes('12 '), `${locale} FAQ cites 12 publications`);
  });

  it('labels the kind of evidence behind every finding', () => {
    assert.equal(FINDING_EVIDENCE.length, FINDING_REFS.length);
    for (const locale of LOCALES) for (const kind of FINDING_EVIDENCE) assert.ok(UI[locale].science.evidence[kind]);
  });
});
