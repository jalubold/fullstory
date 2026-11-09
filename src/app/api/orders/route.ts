import { authed, json, readJson } from '@/lib/server/http';
import { countryFromHeaders } from '@/lib/commerce/region';
import { createCheckout, orderRequestSchema } from '@/lib/server/orders';

export const POST = authed(async (req, { user }) => {
  const body = orderRequestSchema.parse(await readJson(req));
  const { orderId, url } = await createCheckout(user, body, { country: countryFromHeaders(req.headers) });
  return json({ orderId, url }, 201);
});
