'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Dialog, Tooltip } from 'radix-ui';
import { assessment, describeAssessment, displayedLevel, isDLevel, levelColor, levelLabel, locales, normalizeAssessment, rubric, safeEvidenceUrl } from '../core/index.js';
const Context = createContext(null);
const HelpIcon = () => _jsxs("svg", { width: "13", height: "13", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [_jsx("circle", { cx: "10", cy: "10", r: "8", stroke: "currentColor" }), _jsx("path", { d: "M7.5 7a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M10 14h.01", stroke: "currentColor", strokeLinecap: "round" })] });
const tint = (level) => ({ '--edi-grade': levelColor(level) });
export function DecentralizationProvider({ children, locale = 'en', theme = 'system', guide, onGuideChange, returnFocusRef, className = '', inline = false }) {
    const [local, setLocal] = useState(null), origin = useRef(null), controlled = guide !== undefined, current = controlled ? guide : local;
    const set = (next) => {
        if (!controlled)
            setLocal(next);
        onGuideChange?.(next);
    };
    const Root = inline ? 'span' : 'div';
    return _jsx(Context.Provider, { value: { locale, open: (request, element) => { origin.current = element; set(request); } }, children: _jsxs(Tooltip.Provider, { delayDuration: 250, children: [_jsx(Root, { className: `edi-root edi-provider ${className}`, "data-edi-theme": theme, children: children }), _jsx(DecentralizationGuide, { open: !!current, onOpenChange: open => {
                        if (!open)
                            set(null);
                    }, request: current ?? undefined, locale: current?.locale ?? locale, theme: theme, openerRef: origin, returnFocusRef: returnFocusRef })] }) });
}
export function DecentralizationBadge(props) {
    const context = useContext(Context);
    if (!context)
        return _jsx(DecentralizationProvider, { inline: true, locale: props.locale, children: _jsx(Badge, { ...props }) });
    return _jsx(Badge, { ...props });
}
function Badge({ value, subject = 'mechanism', name, evidence, className = '', size = 'comfortable', variant = 'badge', locale: override }) {
    const context = useContext(Context), locale = override ?? context.locale, c = locales[locale], result = typeof value === 'object' && value !== null ? normalizeAssessment(value) : assessment(isDLevel(value) ? value : null), description = describeAssessment(result, locale, subject), level = displayedLevel(result);
    return _jsxs(Tooltip.Root, { children: [_jsx(Tooltip.Trigger, { asChild: true, children: _jsxs("button", { type: "button", className: `edi-badge ${level === 0 ? 'edi-zero' : ''} ${className}`, "data-size": size, "data-variant": variant, style: tint(level), "aria-label": `${description.label}: ${c.explain}`, onClick: e => context.open({ value: result, subject, name, evidence, locale }, e.currentTarget), children: [_jsx("span", { children: description.label }), variant === 'swatch' && _jsxs(_Fragment, { children: [_jsx("span", { className: "edi-equals", "aria-hidden": "true", children: "=" }), _jsx("span", { className: "edi-swatch", "aria-hidden": "true" })] }), _jsx(HelpIcon, {})] }) }), _jsx(Tooltip.Portal, { children: _jsxs(Tooltip.Content, { className: "edi-tooltip", sideOffset: 8, children: [_jsx("strong", { children: description.short }), _jsx("span", { children: description.definition }), description.uncertainty && _jsx("span", { children: description.uncertainty }), _jsx("em", { children: c.guideAction }), _jsx(Tooltip.Arrow, {})] }) })] });
}
export function DecentralizationGuide({ open, onOpenChange, request, locale = 'en', theme = 'system', returnFocusRef, openerRef }) {
    const c = locales[locale], level = request ? displayedLevel(request.value) : null, links = [...new Set(request?.evidence?.map(safeEvidenceUrl).filter((v) => !!v) ?? [])];
    return _jsx(Dialog.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Overlay, { className: "edi-overlay" }), _jsxs(Dialog.Content, { className: "edi-root edi-guide", "data-edi-theme": theme, onCloseAutoFocus: e => {
                        const target = openerRef?.current?.isConnected ? openerRef.current : returnFocusRef?.current;
                        if (target?.isConnected) {
                            e.preventDefault();
                            target.focus({ preventScroll: true });
                        }
                        if (openerRef)
                            openerRef.current = null;
                    }, children: [_jsx(Dialog.Close, { className: "edi-close", "aria-label": c.close, children: "\u00D7" }), _jsx("div", { className: "edi-eyebrow", children: "ETHEREUM DECENTRALIZATION INDEX \u00B7 D0\u2013D9" }), _jsx(Dialog.Title, { children: c.guideTitle }), _jsx(Dialog.Description, { children: c.guideQuestion }), request?.name && _jsxs("div", { className: "edi-subject", style: tint(level), children: [_jsx("strong", { children: request.name }), _jsx("span", { children: levelLabel(request.value) })] }), _jsx("p", { className: "edi-intro", children: c.guideIntro }), _jsx("div", { className: "edi-primer", children: ['foundation', 'dependency', 'unknown', 'judgment'].map((key, i) => _jsxs("section", { children: [_jsx("span", { className: "edi-primer-mark", "aria-hidden": "true", children: ['D0', '≥ D5', 'D?', '↗'][i] }), _jsx("h3", { children: c[`${key}Title`] }), _jsx("p", { children: c[`${key}Body`] })] }, key)) }), _jsx("h3", { children: c.spectrum }), _jsx("div", { className: "edi-grade-list", children: c.tiers.map((g, i) => _jsxs("section", { className: level === i ? 'edi-selected' : '', style: tint(i), children: [_jsxs("span", { className: `edi-grade-mark ${i === 0 ? 'edi-zero' : ''}`, children: ["D", i] }), _jsxs("div", { children: [_jsx("h4", { children: g.label }), _jsx("p", { children: i === 0 && request?.subject === 'ethereum-l1' ? c.l1 : g.definition })] })] }, i)) }), links.length > 0 && _jsxs("section", { className: "edi-evidence", children: [_jsx("h3", { children: c.evidence }), _jsx("ul", { children: links.map(url => _jsx("li", { children: _jsxs("a", { href: url, target: "_blank", rel: "noreferrer", children: [new URL(url).hostname, " \u2197"] }) }, url)) })] })] })] }) });
}
export function DecentralizationLegend({ locale: override, aside, className = '' }) {
    const context = useContext(Context), locale = override ?? context?.locale ?? 'en';
    const list = useRef(null), [separators, setSeparators] = useState([]);
    useEffect(() => {
        const element = list.current;
        if (!element)
            return;
        const measure = () => { const rows = [...new Set(Array.from(element.children, e => e.offsetTop + e.offsetHeight))].sort((a, b) => a - b); const next = rows.slice(0, -1).map(y => y + 3); setSeparators(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next); };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, [locale]);
    if (!context)
        return _jsx(DecentralizationProvider, { locale: locale, children: _jsx(DecentralizationLegend, { locale: locale, aside: aside, className: className }) });
    return _jsxs("div", { className: `edi-legend ${className}`, children: [_jsxs("div", { className: "edi-legend-main", children: [_jsx("ul", { ref: list, "aria-label": locales[locale].spectrum, children: locales[locale].tiers.map((g, i) => _jsxs("li", { children: [_jsx(DecentralizationBadge, { value: i, locale: locale, variant: "swatch" }), _jsx("span", { className: "edi-equals", "aria-hidden": "true", children: "=" }), _jsx("span", { children: g.legend })] }, i)) }), separators.map(top => _jsx("i", { className: "edi-row-divider", "aria-hidden": "true", style: { top } }, top))] }), aside && _jsx("div", { className: "edi-legend-aside", children: aside })] });
}
export function DecentralizationSpectrum({ locale: override }) {
    const context = useContext(Context), locale = override ?? context?.locale ?? 'en';
    if (!context)
        return _jsx(DecentralizationProvider, { locale: locale, children: _jsx(DecentralizationSpectrum, { locale: locale }) });
    return _jsx("div", { className: "edi-spectrum", role: "group", "aria-label": locales[locale].spectrum, children: rubric.grades.map(g => _jsx(DecentralizationBadge, { value: g.tier, locale: locale }, g.tier)) });
}
export function DecentralizationCard({ title, value, subject = 'position', children, ...props }) {
    const context = useContext(Context), locale = props.locale ?? context?.locale ?? 'en', result = typeof value === 'object' && value !== null ? normalizeAssessment(value) : assessment(isDLevel(value) ? value : null), description = describeAssessment(result, locale, subject);
    if (!context)
        return _jsx(DecentralizationProvider, { locale: locale, children: _jsx(DecentralizationCard, { ...props, title: title, value: result, subject: subject, children: children }) });
    return _jsxs("section", { className: "edi-card", style: tint(displayedLevel(result)), children: [_jsxs("header", { children: [_jsx("h3", { children: title }), _jsx(DecentralizationBadge, { ...props, value: result, subject: subject, name: title })] }), _jsx("p", { children: description.definition }), description.uncertainty && _jsx("p", { className: "edi-uncertainty", children: description.uncertainty }), children] });
}
export function DecentralizationPath({ items, locale: override }) {
    const context = useContext(Context), locale = override ?? context?.locale ?? 'en';
    if (!context)
        return _jsx(DecentralizationProvider, { locale: locale, children: _jsx(DecentralizationPath, { locale: locale, items: items }) });
    return _jsx("ol", { className: "edi-path", children: items.map(item => _jsxs("li", { children: [_jsx(DecentralizationBadge, { value: item.value, name: item.label, subject: item.subject, locale: locale }), _jsx("span", { children: item.label })] }, item.id)) });
}
//# sourceMappingURL=index.js.map