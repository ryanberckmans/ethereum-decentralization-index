/** Small inline icons. Decorative unless given a title; text always carries the meaning. */
import type {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  className: 'icon',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...props,
});

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const FilterIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ExternalIcon = (props: IconProps) => (
  <svg {...base({width: 14, height: 14, ...props})}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

export const CopyIcon = (props: IconProps) => (
  <svg {...base({width: 14, height: 14, ...props})}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a1 1 0 0 1 1-1h10" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base({width: 14, height: 14, ...props})}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base({width: 14, height: 14, ...props})}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const InfoIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" />
  </svg>
);

export const StoryIcon = (props: IconProps) => (
  <svg {...base({width: 13, height: 13, ...props})}>
    <path d="M5 4h10l4 4v12H5z" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

/** The wordmark glyph: an index card standing on a ruled foundation (the shared L1). */
export const Glyph = () => (
  <svg className="wordmark-glyph" viewBox="0 0 22 28" aria-hidden="true" focusable="false">
    <path d="M11 1 2 14.5 11 19l9-4.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M2 17.2 11 21.7l9-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path className="glyph-base" d="M1 26.5h20" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);
