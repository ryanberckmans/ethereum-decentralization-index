import { type ReactNode, type RefObject } from 'react';
import { type Assessment, type DLevel, type Locale, type SubjectKind } from '../core/index.js';
export interface GuideRequest {
    value: Assessment;
    subject?: SubjectKind;
    name?: string;
    evidence?: readonly string[];
    locale?: Locale;
}
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
export declare function DecentralizationProvider({ children, locale, theme, guide, onGuideChange, returnFocusRef, className, inline }: ProviderProps): import("react/jsx-runtime").JSX.Element;
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
export declare function DecentralizationBadge(props: BadgeProps): import("react/jsx-runtime").JSX.Element;
export interface GuideProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request?: GuideRequest;
    locale?: Locale;
    theme?: 'dark' | 'light' | 'system';
    returnFocusRef?: RefObject<HTMLElement | null>;
    openerRef?: RefObject<HTMLElement | null>;
}
export declare function DecentralizationGuide({ open, onOpenChange, request, locale, theme, returnFocusRef, openerRef }: GuideProps): import("react/jsx-runtime").JSX.Element;
export declare function DecentralizationLegend({ locale: override, aside, className }: {
    locale?: Locale;
    aside?: ReactNode;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function DecentralizationSpectrum({ locale: override }: {
    locale?: Locale;
}): import("react/jsx-runtime").JSX.Element;
export declare function DecentralizationCard({ title, value, subject, children, ...props }: BadgeProps & {
    title: string;
    children?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function DecentralizationPath({ items, locale: override }: {
    items: readonly {
        id: string;
        label: string;
        value: Assessment;
        subject?: SubjectKind;
    }[];
    locale?: Locale;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map