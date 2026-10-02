/**
 * Locale formatting that never changes what was reported: dates stay in UTC,
 * currencies stay in the reported currency, and decimal values are formatted
 * from their exact strings rather than through floating point.
 */
import type {Locale} from '../config.ts';

/** Placeholder substitution: fmt('{count} objects', {count: 3}). Unknown keys stay visible. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function dateFormatter(locale: Locale, style: 'long' | 'medium' | 'month'): Intl.DateTimeFormat {
  const key = `${locale}|${style}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    const tag = locale === 'en' ? 'en-GB' : locale;
    formatter = new Intl.DateTimeFormat(
      tag,
      style === 'month' ? {year: 'numeric', month: 'long', timeZone: 'UTC'} : {dateStyle: style, timeZone: 'UTC'},
    );
    dateFormatters.set(key, formatter);
  }
  return formatter;
}

/** A calendar date (YYYY-MM-DD) as a UTC date in the reader's language. */
export function formatDate(iso: string, locale: Locale, style: 'long' | 'medium' | 'month' = 'medium'): string {
  const time = Date.parse(`${iso}T00:00:00Z`);
  return Number.isFinite(time) ? dateFormatter(locale, style).format(new Date(time)) : iso;
}

export function formatDateRange(start: string, end: string, locale: Locale): string {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return `${start} – ${end}`;
  const tag = locale === 'en' ? 'en-GB' : locale;
  const formatter = new Intl.DateTimeFormat(tag, {dateStyle: 'medium', timeZone: 'UTC'});
  return formatter.formatRange(new Date(a), new Date(b));
}

const ISO_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CNY', 'KRW', 'BRL', 'CAD', 'AUD', 'SGD', 'HKD']);

export function isCurrency(unit: string): boolean {
  return ISO_CURRENCIES.has(unit);
}

/**
 * An exact decimal string in the reader's language. Large values use the
 * locale's long compact form ("4.8 billion"), with the exact value kept for
 * the accessible description and exports.
 */
export function formatQuantity(value: string, unit: string, locale: Locale, options: {compact?: boolean} = {}): string {
  const compact = options.compact ?? true;
  const magnitude = Math.abs(Number(value));
  const useCompact = compact && magnitude >= 1_000_000;
  // Intl formats decimal strings exactly (no float rounding) when given a string.
  const input = value as unknown as number;
  if (isCurrency(unit)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: unit,
      currencyDisplay: 'narrowSymbol',
      ...(useCompact ? {notation: 'compact', compactDisplay: 'long', maximumFractionDigits: 2} : {maximumFractionDigits: 2}),
    }).format(input);
  }
  const number = new Intl.NumberFormat(locale, useCompact ? {notation: 'compact', compactDisplay: 'long', maximumFractionDigits: 2} : {maximumFractionDigits: 6}).format(input);
  return unit ? `${number} ${unit}` : number;
}

/** The exact value with grouping, for accessible descriptions and tooltips. */
export function formatExact(value: string, unit: string, locale: Locale): string {
  const number = new Intl.NumberFormat(locale, {maximumFractionDigits: 18}).format(value as unknown as number);
  return `${number} ${unit}`.trim();
}

export function formatCount(count: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(count);
}

/** Pick a plural form: forms has `one` and `other` (and optionally `zero`). */
export function plural(count: number, locale: Locale, forms: {zero?: string; one: string; other: string}): string {
  if (count === 0 && forms.zero) return fmt(forms.zero, {count: formatCount(count, locale)});
  const rule = new Intl.PluralRules(locale).select(count);
  return fmt(rule === 'one' ? forms.one : forms.other, {count: formatCount(count, locale)});
}
