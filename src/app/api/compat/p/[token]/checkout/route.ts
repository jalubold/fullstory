import { countryFromHeaders } from '@/lib/commerce/region';
import { compatRoute, requireParticipant } from '@/lib/compat/server/http';
import { startCheckout } from '@/lib/compat/server/payments';
import { json } from '@/lib/server/http';

/** Opens a one-time checkout for the Relationship Blueprint (unlocks it for both participants). */
export const POST = compatRoute<{ token: string }>(async (req, { token }, locale) => {
  const { view } = await requireParticipant(token, locale);
  return json(await startCheckout(view, countryFromHeaders(req.headers), locale));
});
