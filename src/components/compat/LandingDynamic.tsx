import Link from 'next/link';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { ArrowRight } from 'lucide-react';
import { countryFromHeaders } from '@/lib/commerce/region';
import type { Locale } from '@/lib/compat/i18n';
import { blueprintPrice } from '@/lib/compat/server/payments';
import { findByToken } from '@/lib/compat/server/repo';
import { rememberedTokens, toView } from '@/lib/compat/server/view';
import { UI } from '@/lib/compat/ui-strings';
import { dbMode } from '@/lib/server/env';

/** The Blueprint price for this visitor's country (USD, or IDR in Indonesia when the provider supports it). */
export async function PriceTag({ className = '' }: { className?: string }) {
  const { label } = blueprintPrice(countryFromHeaders(await headers()));
  return <span className={className}>{label}</span>;
}

/** "Continue where you left off" for tests started in this browser. */
export async function ContinueBanner({ locale }: { locale: Locale }) {
  const t = UI[locale].landing;
  await connection();
  if (dbMode === 'none') return null;
  const tokens = await rememberedTokens();
  if (!tokens.length) return null;
  const views = (await Promise.all(tokens.map(async (tok) => {
    try {
      const ctx = await findByToken(tok);
      return ctx ? toView(tok, ctx, locale) : null;
    } catch {
      return null;
    }
  }))).filter((v) => v !== null);
  if (!views.length) return null;
  const status = (v: (typeof views)[number]) =>
    v.stage === 'answering' ? t.status.answering : v.stage === 'waiting' ? (v.partnerJoined ? t.status.waiting(v.partnerName ?? '') : t.status.invite) : v.unlocked ? t.status.blueprint : t.status.results;
  return (
    <div className="awc-container pt-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-awc-blush bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-3.5">
        <span className="px-1 text-sm font-semibold text-awc-ink">{t.welcomeBack}</span>
        {views.map((v) => (
          <Link key={v.token} href={`/compatible/s/${v.token}`} className="group inline-flex items-center justify-between gap-2 rounded-xl bg-awc-cream px-3.5 py-2.5 text-sm text-awc-ink-soft hover:bg-awc-blush-soft">
            <span>
              <span className="font-semibold text-awc-ink">{v.partnerName ? `${v.name} & ${v.partnerName}` : v.name}</span> · {status(v)}
            </span>
            <ArrowRight size={15} className="text-awc-wine transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
