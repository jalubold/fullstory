import 'server-only';
import * as fk from 'fontkit';

/**
 * pdf-lib expects the fontkit 1.x API. The maintained fontkit 2.x subsetter
 * produces correct glyph outlines for our Google Fonts TTFs (the legacy
 * @pdf-lib/fontkit fork drops glyphs), so we adapt v2's `subset.encode()` to
 * the streaming `encodeStream()` interface pdf-lib consumes.
 */
type Handler = (arg?: unknown) => void;

export const fontkitAdapter = {
  create(data: Uint8Array) {
    const font = fk.create(Buffer.from(data)) as unknown as {
      createSubset: () => { encode: () => Uint8Array; encodeStream?: () => unknown };
    };
    const createSubset = font.createSubset.bind(font);
    font.createSubset = () => {
      const subset = createSubset();
      subset.encodeStream = () => {
        const handlers: Record<string, Handler> = {};
        setTimeout(() => {
          try {
            handlers.data?.(subset.encode());
            handlers.end?.();
          } catch (e) {
            handlers.error?.(e);
          }
        }, 0);
        const stream = {
          on(event: string, fn: Handler) {
            handlers[event] = fn;
            return stream;
          },
        };
        return stream;
      };
      return subset;
    };
    return font;
  },
};
