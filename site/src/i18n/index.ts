/**
 * Interface dictionaries. The server imports every locale; a page sends the
 * browser only the strings its island needs, never all eight dictionaries.
 */
import type {Locale} from '../config.ts';
import {en, type Messages} from './en.ts';

const dictionaries: Partial<Record<Locale, Messages>> = {en};

export function messages(locale: Locale): Messages {
  return dictionaries[locale] ?? en;
}

/** Whether the interface is translated for this locale (editorial content is English in this edition). */
export function isTranslated(locale: Locale): boolean {
  return dictionaries[locale] !== undefined;
}

export type {Messages};
