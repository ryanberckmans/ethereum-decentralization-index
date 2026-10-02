/**
 * A translated template whose placeholders are elements rather than strings,
 * for when an inserted value needs its own markup, such as English editorial
 * text marked with its language inside a translated sentence.
 */
import {Fragment, type ReactNode} from 'react';

export function Template({text, values}: {text: string; values: Readonly<Record<string, ReactNode>>}) {
  const parts = text.split(/\{(\w+)\}/);
  return <>{parts.map((part, index) => (index % 2 ? <Fragment key={index}>{part in values ? values[part] : `{${part}}`}</Fragment> : part))}</>;
}
