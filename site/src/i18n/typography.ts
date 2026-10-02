/**
 * Typographic rules applied to whole dictionaries, so translators write plain
 * text and the rules hold everywhere.
 */

/** Applies a transform to every string in a dictionary, keeping its shape. */
export function mapStrings<T>(value: T, transform: (text: string) => string): T {
  if (typeof value === 'string') return transform(value) as T;
  if (Array.isArray(value)) return value.map(item => mapStrings(item, transform)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapStrings(item, transform)])) as T;
  }
  return value;
}

/** French spacing: a no-break space before : ; ! ? and inside « », so the mark never starts a line. */
export function frenchSpacing(text: string): string {
  return text.replace(/ ([:;!?»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
}
