/**
 * Date-dependent markup. The first segment is what EDI returns on the page's
 * evaluation date; each later segment is EDI's result from its due date on,
 * kept in an inert <template>. A small script swaps in the segment for the
 * reader's UTC date, so a cached page or a tab resumed after a deadline shows
 * EDI's result for today without evaluating anything in the browser.
 */
import type {ReactNode} from 'react';
import type {Segment} from '../model/view-types.ts';

export function Dated<T>({segments, render, block = false}: {segments: readonly Segment<T>[]; render: (value: T) => ReactNode; block?: boolean}) {
  const Tag = block ? 'div' : 'span';
  if (segments.length === 1) return <>{render(segments[0].value)}</>;
  return (
    <Tag className="dated" data-dated={segments[0].from}>
      {render(segments[0].value)}
      {segments.slice(1).map(segment => (
        <template key={segment.from} data-from={segment.from}>
          {render(segment.value)}
        </template>
      ))}
    </Tag>
  );
}
