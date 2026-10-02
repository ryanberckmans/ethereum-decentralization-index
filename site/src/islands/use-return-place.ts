/**
 * Where the reader was on a page whose content an island draws only after
 * it loads data. Coming Back to such a page loads it afresh unless the
 * browser kept it whole (the back/forward cache), and the browser restores
 * the scroll position before the island's content exists, so it lands too
 * high. The position is saved when the page is left, and restored once the
 * content is ready, unless the reader has already moved.
 */
import {useEffect, useRef} from 'react';

const KEY = 'edi-scroll';
/** Positions kept, most recent last; older addresses are forgotten. */
const KEPT = 20;

const here = () => `${location.pathname}${location.search}`;

function saved(): Record<string, number> {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
    return value && typeof value === 'object' ? (value as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** Remembers the scroll position of the address being left. */
export function saveReturnPlace(): void {
  try {
    const positions = new Map(Object.entries(saved()));
    positions.delete(here());
    positions.set(here(), Math.round(window.scrollY));
    sessionStorage.setItem(KEY, JSON.stringify(Object.fromEntries([...positions].slice(-KEPT))));
  } catch {
    // Storage can be unavailable; the browser's own restoration still applies.
  }
}

/**
 * Restores the saved position, then calls `restored`, once `ready` is true
 * on a page reached with Back or Forward.
 */
export function useReturnPlace(ready: boolean, restored?: () => void): void {
  const pending = useRef<boolean | null>(null);
  const moved = useRef(false);
  const restoredRef = useRef(restored);
  restoredRef.current = restored;

  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    pending.current = navigation?.type === 'back_forward';
    // Scroll events also come from the browser's own restoration; these only come from the reader.
    const move = () => {
      moved.current = true;
    };
    const events = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const;
    for (const type of events) window.addEventListener(type, move, {passive: true, once: true});
    window.addEventListener('pagehide', saveReturnPlace);
    return () => {
      for (const type of events) window.removeEventListener(type, move);
      window.removeEventListener('pagehide', saveReturnPlace);
    };
  }, []);

  useEffect(() => {
    if (!ready || !pending.current) return;
    pending.current = false;
    if (moved.current) return;
    const top = saved()[here()];
    if (typeof top === 'number' && top > 0) window.scrollTo({top});
    restoredRef.current?.();
  }, [ready]);
}
