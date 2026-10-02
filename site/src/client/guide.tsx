/**
 * EDI's own explanation dialog, loaded only when a reader asks for it, so the
 * eight EDI dictionaries and the dialog code stay off first load. The request
 * (assessment, subject, name, evidence) was computed by the server with EDI.
 */
import {createRoot, type Root} from 'react-dom/client';
import {DecentralizationGuide} from 'ethereum-decentralization-index/react';
import type {Assessment, Locale, SubjectKind} from 'ethereum-decentralization-index';
import 'ethereum-decentralization-index/styles.css';

interface GuideData {
  value: Assessment;
  subject: SubjectKind;
  name: string;
  evidence: string[];
  locale: Locale;
}

let root: Root | null = null;

function theme(): 'light' | 'dark' | 'system' {
  const value = document.documentElement.getAttribute('data-theme');
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function openGuide(button: HTMLButtonElement): void {
  let data: GuideData;
  try {
    data = JSON.parse(button.dataset.guide ?? '') as GuideData;
  } catch {
    return;
  }
  if (!root) {
    const container = document.createElement('div');
    container.id = 'edi-guide-root';
    document.body.append(container);
    root = createRoot(container);
  }
  const opener = {current: button as HTMLElement | null};
  const render = (open: boolean) =>
    root!.render(
      <DecentralizationGuide
        open={open}
        onOpenChange={next => render(next)}
        request={{value: data.value, subject: data.subject, name: data.name, evidence: data.evidence, locale: data.locale}}
        locale={data.locale}
        theme={theme()}
        openerRef={opener}
        returnFocusRef={{current: button}}
      />,
    );
  render(true);
}
