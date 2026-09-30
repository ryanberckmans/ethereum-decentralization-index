'use client';
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Dialog, Tooltip } from 'radix-ui';
import { assessment, describeAssessment, displayedLevel, isDLevel, levelColor, levelLabel, locales, normalizeAssessment, rubric, safeEvidenceUrl, type Assessment, type DLevel, type Locale, type SubjectKind } from '../core/index.js';
export interface GuideRequest {
    value: Assessment;
    subject?: SubjectKind;
    name?: string;
    evidence?: readonly string[];
    locale?: Locale;
}
interface Context {
    locale: Locale;
    open: (request: GuideRequest, origin: HTMLElement) => void;
}
const Context = createContext<Context | null>(null);
export interface ProviderProps {
    children: ReactNode;
    locale?: Locale;
    theme?: 'dark' | 'light' | 'system';
    /** Optional controlled state: connect this to the host app's URL/history. */
    guide?: GuideRequest | null;
    onGuideChange?: (request: GuideRequest | null) => void;
    returnFocusRef?: RefObject<HTMLElement | null>;
    className?: string;
    /** Use a phrasing-content wrapper when embedding badges within a sentence. */
    inline?: boolean;
}
const HelpIcon = () => <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="currentColor"/><path d="M7.5 7a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M10 14h.01" stroke="currentColor" strokeLinecap="round"/></svg>;
const tint = (level: unknown) => ({ '--edi-grade': levelColor(level) } as CSSProperties);
export function DecentralizationProvider({ children, locale = 'en', theme = 'system', guide, onGuideChange, returnFocusRef, className = '', inline = false }: ProviderProps) {
    const [local, setLocal] = useState<GuideRequest | null>(null), origin = useRef<HTMLElement | null>(null), controlled = guide !== undefined, current = controlled ? guide : local;
    const set = (next: GuideRequest | null) => { if (!controlled)
        setLocal(next); onGuideChange?.(next); };
    const Root = inline ? 'span' : 'div';
    return <Context.Provider value={{ locale, open: (request, element) => { origin.current = element; set(request); } }}><Tooltip.Provider delayDuration={250}><Root className={`edi-root edi-provider ${className}`} data-edi-theme={theme}>{children}</Root><DecentralizationGuide open={!!current} onOpenChange={open => { if (!open)
        set(null); }} request={current ?? undefined} locale={current?.locale ?? locale} theme={theme} openerRef={origin} returnFocusRef={returnFocusRef}/></Tooltip.Provider></Context.Provider>;
}
export interface BadgeProps {
    value: Assessment | DLevel | null;
    subject?: SubjectKind;
    name?: string;
    evidence?: readonly string[];
    locale?: Locale;
    className?: string;
    size?: 'compact' | 'comfortable';
    variant?: 'badge' | 'swatch';
}
export function DecentralizationBadge(props: BadgeProps) {
    const context = useContext(Context);
    if (!context)
        return <DecentralizationProvider inline locale={props.locale}><Badge {...props}/></DecentralizationProvider>;
    return <Badge {...props}/>;
}
function Badge({ value, subject = 'mechanism', name, evidence, className = '', size = 'comfortable', variant = 'badge', locale: override }: BadgeProps) {
    const context = useContext(Context)!, locale = override ?? context.locale, c = locales[locale], result = typeof value === 'object' && value !== null ? normalizeAssessment(value) : assessment(isDLevel(value) ? value : null), description = describeAssessment(result, locale, subject), level = displayedLevel(result);
    return <Tooltip.Root><Tooltip.Trigger asChild><button type="button" className={`edi-badge ${level === 0 ? 'edi-zero' : ''} ${className}`} data-size={size} data-variant={variant} style={tint(level)} aria-label={`${description.label}: ${c.explain}`} onClick={e => context.open({ value: result, subject, name, evidence, locale }, e.currentTarget)}><span>{description.label}</span>{variant === 'swatch' && <><span className="edi-equals" aria-hidden="true">=</span><span className="edi-swatch" aria-hidden="true"/></>}<HelpIcon /></button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="edi-tooltip" sideOffset={8}><strong>{description.short}</strong><span>{description.definition}</span>{description.uncertainty && <span>{description.uncertainty}</span>}<em>{c.guideAction}</em><Tooltip.Arrow /></Tooltip.Content></Tooltip.Portal></Tooltip.Root>;
}
export interface GuideProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request?: GuideRequest;
    locale?: Locale;
    theme?: 'dark' | 'light' | 'system';
    returnFocusRef?: RefObject<HTMLElement | null>;
    openerRef?: RefObject<HTMLElement | null>;
}
export function DecentralizationGuide({ open, onOpenChange, request, locale = 'en', theme = 'system', returnFocusRef, openerRef }: GuideProps) {
    const c = locales[locale], level = request ? displayedLevel(request.value) : null, links = [...new Set(request?.evidence?.map(safeEvidenceUrl).filter((v): v is string => !!v) ?? [])];
    return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="edi-overlay"/><Dialog.Content className="edi-root edi-guide" data-edi-theme={theme} onCloseAutoFocus={e => { const target = openerRef?.current?.isConnected ? openerRef.current : returnFocusRef?.current; if (target?.isConnected) {
        e.preventDefault();
        target.focus({ preventScroll: true });
    } if (openerRef)
        openerRef.current = null; }}>
  <Dialog.Close className="edi-close" aria-label={c.close}>×</Dialog.Close><div className="edi-eyebrow">ETHEREUM DECENTRALIZATION INDEX · D0–D9</div><Dialog.Title>{c.guideTitle}</Dialog.Title><Dialog.Description>{c.guideQuestion}</Dialog.Description>
  {request?.name && <div className="edi-subject" style={tint(level)}><strong>{request.name}</strong><span>{levelLabel(request.value)}</span></div>}
  <p className="edi-intro">{c.guideIntro}</p><div className="edi-primer">{(['foundation', 'dependency', 'unknown', 'judgment'] as const).map((key, i) => <section key={key}><span className="edi-primer-mark" aria-hidden="true">{['D0', '≥ D5', 'D?', '↗'][i]}</span><h3>{c[`${key}Title`]}</h3><p>{c[`${key}Body`]}</p></section>)}</div>
  <h3>{c.spectrum}</h3><div className="edi-grade-list">{c.tiers.map((g, i) => <section key={i} className={level === i ? 'edi-selected' : ''} style={tint(i)}><span className={`edi-grade-mark ${i === 0 ? 'edi-zero' : ''}`}>D{i}</span><div><h4>{g.label}</h4><p>{i === 0 && request?.subject === 'ethereum-l1' ? c.l1 : g.definition}</p></div></section>)}</div>
  {links.length > 0 && <section className="edi-evidence"><h3>{c.evidence}</h3><ul>{links.map(url => <li key={url}><a href={url} target="_blank" rel="noreferrer">{new URL(url).hostname} ↗</a></li>)}</ul></section>}
 </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
export function DecentralizationLegend({ locale: override, aside, className = '' }: {
    locale?: Locale;
    aside?: ReactNode;
    className?: string;
}) {
    const context = useContext(Context), locale = override ?? context?.locale ?? 'en';
    const list = useRef<HTMLUListElement>(null), [separators,setSeparators] = useState<number[]>([]);
    useEffect(()=>{
        const element=list.current;if(!element)return;
        const measure=()=>{const rows=[...new Set(Array.from(element.children,e=>(e as HTMLElement).offsetTop+(e as HTMLElement).offsetHeight))].sort((a,b)=>a-b);const next=rows.slice(0,-1).map(y=>y+3);setSeparators(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);};
        measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();
    },[locale]);
    if (!context)
        return <DecentralizationProvider locale={locale}><DecentralizationLegend locale={locale} aside={aside} className={className}/></DecentralizationProvider>;
    return <div className={`edi-legend ${className}`}><div className="edi-legend-main"><ul ref={list} aria-label={locales[locale].spectrum}>{locales[locale].tiers.map((g, i) => <li key={i}><DecentralizationBadge value={i as DLevel} locale={locale} variant="swatch"/><span className="edi-equals" aria-hidden="true">=</span><span>{g.legend}</span></li>)}</ul>{separators.map(top=><i key={top} className="edi-row-divider" aria-hidden="true" style={{top}}/>)}</div>{aside && <div className="edi-legend-aside">{aside}</div>}</div>;
}
export function DecentralizationSpectrum({ locale: override }: {
    locale?: Locale;
}) {
    const context = useContext(Context), locale = override ?? context?.locale ?? 'en';
    if (!context)
        return <DecentralizationProvider locale={locale}><DecentralizationSpectrum locale={locale}/></DecentralizationProvider>;
    return <div className="edi-spectrum" role="group" aria-label={locales[locale].spectrum}>{rubric.grades.map(g => <DecentralizationBadge key={g.tier} value={g.tier} locale={locale}/>)}</div>;
}
export function DecentralizationCard({ title, value, subject = 'position', children, ...props }: BadgeProps & {
    title: string;
    children?: ReactNode;
}) {
    const context = useContext(Context), locale = props.locale ?? context?.locale ?? 'en', result = typeof value === 'object' && value !== null ? normalizeAssessment(value) : assessment(isDLevel(value) ? value : null), description = describeAssessment(result, locale, subject);
    if (!context)
        return <DecentralizationProvider locale={locale}><DecentralizationCard {...props} title={title} value={result} subject={subject}>{children}</DecentralizationCard></DecentralizationProvider>;
    return <section className="edi-card" style={tint(displayedLevel(result))}><header><h3>{title}</h3><DecentralizationBadge {...props} value={result} subject={subject} name={title}/></header><p>{description.definition}</p>{description.uncertainty && <p className="edi-uncertainty">{description.uncertainty}</p>}{children}</section>;
}
export function DecentralizationPath({ items, locale: override }: {
    items: readonly {
        id: string;
        label: string;
        value: Assessment;
        subject?: SubjectKind;
    }[];
    locale?: Locale;
}) {
    const context = useContext(Context), locale = override ?? context?.locale ?? 'en';
    if (!context)
        return <DecentralizationProvider locale={locale}><DecentralizationPath locale={locale} items={items}/></DecentralizationProvider>;
    return <ol className="edi-path">{items.map(item => <li key={item.id}><DecentralizationBadge value={item.value} name={item.label} subject={item.subject} locale={locale}/><span>{item.label}</span></li>)}</ol>;
}
