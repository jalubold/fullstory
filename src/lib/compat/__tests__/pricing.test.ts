import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BLUEPRINT_INDONESIA_USD, BLUEPRINT_PRICES, blueprintCurrency, blueprintQuote, formatPrice, formatUsdCharge } from '../pricing';

describe('Blueprint pricing', () => {
  it('prices the Blueprint at $9.99 globally and Rp49.000 in Indonesia', () => {
    assert.equal(formatPrice(BLUEPRINT_PRICES.USD, 'USD'), '$9.99');
    assert.equal(formatPrice(BLUEPRINT_PRICES.IDR, 'IDR'), 'Rp49.000');
  });

  it('charges rupiah in Indonesia only when the provider can', () => {
    assert.equal(blueprintCurrency('ID', null), 'IDR'); // Stripe / test: any currency
    assert.equal(blueprintCurrency('id', ['USD', 'IDR']), 'IDR');
    assert.equal(blueprintCurrency('ID', ['USD', 'EUR']), 'USD'); // Creem: no IDR
    assert.equal(blueprintCurrency('US', null), 'USD');
    assert.equal(blueprintCurrency(null, null), 'USD');
  });

  it('shows rupiah in Indonesia and charges it directly when the provider can', () => {
    assert.deepEqual(blueprintQuote('ID', null), { currency: 'IDR', amount: 4_900_000, label: 'Rp49.000', chargedAs: null });
  });

  it('still shows rupiah in Indonesia with a dollar-only provider, charging the dollar equivalent and saying so', () => {
    const q = blueprintQuote('ID', ['USD', 'EUR']);
    assert.equal(q.label, 'Rp49.000');
    assert.equal(q.currency, 'USD');
    assert.equal(q.amount, BLUEPRINT_INDONESIA_USD);
    assert.deepEqual(q.chargedAs, { amount: 299, currency: 'USD' });
    assert.equal(formatUsdCharge(q.chargedAs!.amount, 'en-US'), 'US$2.99');
    assert.equal(formatUsdCharge(q.chargedAs!.amount, 'id-ID'), 'US$2,99');
  });

  it('charges everyone else $9.99, shown as charged', () => {
    for (const country of ['US', 'SG', null]) {
      assert.deepEqual(blueprintQuote(country, ['USD', 'EUR']), { currency: 'USD', amount: 999, label: '$9.99', chargedAs: null });
    }
  });
});
