import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LOCALES } from '../i18n';
import { getQuestionSet } from '../questions';
import { buildBlueprint } from '../report';
import { FINDING_REFS, REFERENCES, referenceList } from '../research';
import { SAMPLE_ANSWERS } from '../sample';
import { compareQuestion, score, SCORING_PARAMS, SCORING_VERSION } from '../scoring';
import { UI } from '../ui-strings';

const set = getQuestionSet('v1');
const q = (id: string) => set.questions.find((x) => x.id === id)!;
const { a, b } = SAMPLE_ANSWERS;
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

describe('scoring versions', () => {
  it('scores new tests with the research-informed version', () => {
    assert.equal(SCORING_VERSION, '2.0.0');
    assert.equal(score(set, a, b).scoringVersion, '2.0.0');
  });

  it('keeps version 1.0.0 exactly as it was: question weights from the bank, dimensions equal', () => {
    const r = score(set, a, b, '1.0.0');
    assert.equal(r.scoringVersion, '1.0.0');
    assert.equal(r.overall.alignment, Math.round(mean(r.dimensions.map((d) => d.alignment))));
    assert.equal(compareQuestion(q('con-heat'), 'push', 'pause', '1.0.0').weight, 1.2);
    assert.equal(compareQuestion(q('emo-loved'), 'words', 'help', '1.0.0').alignment, 60);
  });

  it('applies the version 2.0.0 weights and difference scores', () => {
    const r = score(set, a, b, '2.0.0');
    const w = SCORING_PARAMS['2.0.0'].dimensions!;
    const weighted = r.dimensions.reduce((s, d) => s + d.alignment * (w[d.id] ?? 1), 0) / r.dimensions.reduce((s, d) => s + (w[d.id] ?? 1), 0);
    assert.equal(r.overall.alignment, Math.round(weighted));
    assert.equal(compareQuestion(q('con-heat'), 'push', 'pause').weight, 1.5);
    assert.equal(compareQuestion(q('com-rhythm'), 'steady', 'one').weight, 0.75);
    assert.equal(compareQuestion(q('emo-loved'), 'words', 'help').alignment, 70, 'love-language differences are not penalised');
    assert.equal(compareQuestion(q('com-upset'), 'listen', 'solve').alignment, 50, 'support mismatches matter more');
  });

  it('weights every question in version 2.0.0, and counts conflict above lifestyle', () => {
    const p = SCORING_PARAMS['2.0.0'];
    for (const x of set.questions) assert.ok(p.weights![x.id] !== undefined, `${x.id} has a weight`);
    assert.ok(p.dimensions!.conflict! > p.dimensions!.lifestyle!);
  });

  it('falls back to the current version for an unknown one', () => {
    assert.equal(score(set, a, b, '9.9.9').scoringVersion, SCORING_VERSION);
  });

  it('builds the Blueprint with the version the assessment was taken with', () => {
    const input = { set, context: 'dating' as const, names: { a: 'A', b: 'B' }, answers: SAMPLE_ANSWERS };
    assert.equal(buildBlueprint({ ...input, scoringVersion: '1.0.0' }).scoringVersion, '1.0.0');
    assert.equal(buildBlueprint(input).scoringVersion, SCORING_VERSION);
  });
});

describe('research references', () => {
  for (const locale of LOCALES) {
    it(`pairs every written finding with its references (${locale})`, () => {
      assert.equal(UI[locale].science.findings.length, FINDING_REFS.length);
    });
  }

  it('cites only references that exist, each listed once', () => {
    for (const refs of FINDING_REFS) for (const id of refs) assert.ok(REFERENCES[id], id);
    const list = referenceList();
    assert.equal(new Set(list.map((r) => r.full)).size, list.length);
  });
});
