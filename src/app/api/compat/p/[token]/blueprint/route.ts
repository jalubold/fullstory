import { compatRoute, requireParticipant } from '@/lib/compat/server/http';
import { renderBlueprintPdf } from '@/lib/compat/server/pdf';
import { loadBlueprint } from '@/lib/compat/server/view';
import { HttpError } from '@/lib/server/http';

/** The Relationship Blueprint as a PDF — only once both have finished and it has been paid for. */
export const GET = compatRoute<{ token: string }>(async (_req, { token }) => {
  const { view, ctx } = await requireParticipant(token);
  if (view.stage !== 'results') throw new HttpError(409, 'The Blueprint is ready once you have both finished.');
  if (!view.unlocked) throw new HttpError(402, 'Unlock the Relationship Blueprint to download the PDF.');
  const bp = await loadBlueprint(ctx);
  if (!bp) throw new HttpError(409, 'The Blueprint is ready once you have both finished.');
  const generated = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const bytes = await renderBlueprintPdf(bp, generated);
  const file = `Relationship-Blueprint-${bp.names.a}-${bp.names.b}`.replace(/[^\p{L}\p{N}-]+/gu, '-').slice(0, 80);
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.replace(/[^\x20-\x7e]/g, '')}.pdf"; filename*=UTF-8''${encodeURIComponent(file)}.pdf`,
    },
  });
});
