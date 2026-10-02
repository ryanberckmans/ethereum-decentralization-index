/// <reference types="astro/client" />

declare module 'virtual:edi-edition' {
  const bundle: import('./model/edition-types.ts').EditionBundle;
  export default bundle;
}

/** The pre-paint theme script, defined in astro.config.ts so its CSP hash matches exactly. */
declare const __THEME_INIT__: string;
