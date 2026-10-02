/// <reference types="astro/client" />

declare module 'virtual:edi-edition' {
  const bundle: import('./model/edition-types.ts').EditionBundle;
  export default bundle;
}
