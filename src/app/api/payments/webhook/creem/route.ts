import { handlePaymentWebhook } from '@/lib/server/payments/webhook';

/** Creem webhook endpoint: https://<site>/api/payments/webhook/creem */
export async function POST(req: Request) {
  return handlePaymentWebhook('creem', req);
}
