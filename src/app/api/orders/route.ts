import { authed, json, readJson } from '@/lib/server/http';
import { createCheckout, orderRequestSchema } from '@/lib/server/orders';

export const POST = authed(async (req, { user }) => {
  const body = orderRequestSchema.parse(await readJson(req));
  const { orderId, url } = await createCheckout(user, body);
  return json({ orderId, url }, 201);
});
