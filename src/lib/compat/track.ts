import { track as vercelTrack } from '@vercel/analytics';

/**
 * Funnel analytics for Are We Compatible? (Vercel Web Analytics custom events).
 * Events never carry names, answers, tokens or any other personal data.
 */
export type CompatEvent =
  | 'compat_start'
  | 'compat_quiz_begin'
  | 'compat_submit'
  | 'compat_invite_copy'
  | 'compat_invite_whatsapp'
  | 'compat_invite_share'
  | 'compat_join'
  | 'compat_results_view'
  | 'compat_checkout_click'
  | 'compat_blueprint_view'
  | 'compat_pdf_download'
  | 'compat_result_share'
  | 'compat_delete';

export function track(event: CompatEvent, props?: Record<string, string | number | boolean>) {
  try {
    vercelTrack(event, props);
  } catch {
    // Analytics must never break the experience.
  }
}
