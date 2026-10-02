/**
 * The reader's UTC date, kept current: checked after first render, at each
 * UTC midnight and whenever the tab becomes visible again, so a page left
 * open or resumed later shows EDI's results for today.
 */
import {useEffect, useState} from 'react';
import {msUntilUtcMidnight, utcToday} from '../model/dates.ts';

/** `initial` is the date the page was built for, so the first render matches the built HTML. */
export function useUtcDate(initial: string): string {
  const [today, setToday] = useState(initial);
  useEffect(() => {
    setToday(utcToday());
    let timer = window.setTimeout(function tick() {
      setToday(utcToday());
      timer = window.setTimeout(tick, msUntilUtcMidnight() + 1000);
    }, msUntilUtcMidnight() + 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') setToday(utcToday());
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, []);
  return today;
}
