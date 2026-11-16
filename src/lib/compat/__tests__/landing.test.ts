import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LOCALES } from '../i18n';
import { dimensionSheets, firstSentence, RELATION_SCALE, scoreExamples } from '../landing';
import { ALIGNMENT } from '../scoring';

describe('landing examples', () => {
  for (const locale of LOCALES) {
    it(`gives one real pair per dimension, each read differently (${locale})`, () => {
      const sheets = dimensionSheets(locale);
      assert.equal(sheets.length, 5);
      for (const s of sheets) {
        const ids = s.options.map((o) => o.id);
        assert.ok(ids.includes(s.a) && ids.includes(s.b), `${s.id}: example answers must be real options`);
        assert.equal(s.also.length, s.count - 1);
        assert.ok(s.reading.note.length > 20);
      }
      assert.equal(new Set(sheets.map((s) => s.reading.label)).size, 5, 'five different readings');
    });

    it(`shows the same answer scoring below two different ones (${locale})`, () => {
      const { same, different } = scoreExamples(locale);
      assert.equal(same.a, same.b);
      assert.notEqual(different.a, different.b);
      assert.equal(same.reading.score, ALIGNMENT.sharedBlindSpot);
      assert.equal(different.reading.score, ALIGNMENT.complementary);
      assert.ok(same.reading.score < different.reading.score);
    });
  }

  it('places every relation on the scale at its real score', () => {
    assert.deepEqual(RELATION_SCALE, [100, 80, 45, 15, 70]);
  });

  it('trims a note to its first sentence', () => {
    assert.equal(firstSentence('One. Two.'), 'One.');
    assert.equal(firstSentence('No full stop'), 'No full stop');
  });
});
