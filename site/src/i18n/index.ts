/**
 * Interface dictionaries. The server imports every locale; a page sends the
 * browser only the strings its island needs, never all eight dictionaries.
 * Editorial content (stories, profiles, sources) is English in this edition
 * and is marked lang="en" on pages in other languages.
 */
import type {Locale} from '../config.ts';
import {de} from './de.ts';
import {en, type Messages} from './en.ts';
import {es} from './es.ts';
import {fr} from './fr.ts';
import {ja} from './ja.ts';
import {ko} from './ko.ts';
import {ptBR} from './pt-BR.ts';
import {zhCN} from './zh-CN.ts';

const dictionaries: Record<Locale, Messages> = {en, es, 'pt-BR': ptBR, fr, de, 'zh-CN': zhCN, ja, ko};

export function messages(locale: Locale): Messages {
  return dictionaries[locale];
}

export type {Messages};
