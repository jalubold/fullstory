import { useEffect, useState } from 'react';
import { isMobileDevice } from './device';

/**
 * Whether the photo picker may select many photos at once. Phones and tablets
 * pick one at a time: their pickers prepare (and often convert) every selected
 * photo before handing any over, which feels stuck with big selections.
 * Desktops pick as many as they like.
 */
export function useMultiPick(): boolean {
  const [multi, setMulti] = useState(true);
  useEffect(() => {
    // Device details are only known in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isMobileDevice()) setMulti(false);
  }, []);
  return multi;
}
