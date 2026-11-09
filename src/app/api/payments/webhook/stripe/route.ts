import { handlePaymentWebhook } from '@/lib/server/payments/webhook';

export async function POST(req: Request) {
  return handlePaymentWebhook('stripe', req);
}
