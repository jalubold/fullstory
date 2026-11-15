import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BLUEPRINT_PRICES, blueprintCurrency, formatPrice } from '../pricing';

describe('blueprint pricing', () => {
  it('charges $9.99 globally and Rp39.000 in Indonesia', () => {
    assert.equal(formatPrice(BLUEPRINT_PRICES.USD, 'USD'), '$9.99');
    assert.equal(formatPrice(BLUEPRINT_PRICES.IDR, 'IDR'), 'Rp39.000');
  });

  it('uses rupiah only for Indonesia, and only when the provider can charge it', () => {
    assert.equal(blueprintCurrency('ID', null), 'IDR'); // Stripe / test: any currency
    assert.equal(blueprintCurrency('id', ['USD', 'IDR']), 'IDR');
    assert.equal(blueprintCurrency('ID', ['USD', 'EUR']), 'USD'); // Creem: no IDR
    assert.equal(blueprintCurrency('US', null), 'USD');
    assert.equal(blueprintCurrency(null, null), 'USD');
  });
});
