/**
 * Stands in for react-style-singleton (aliased in astro.config.ts). Radix's
 * dialog locks page scroll by adding a stylesheet; the original adds a
 * <style> element, which the site's CSP blocks. This version adds the same
 * rules as a constructed stylesheet, which the CSP allows.
 */
import {useEffect} from 'react';

export function stylesheetSingleton() {
  let counter = 0;
  let sheet: CSSStyleSheet | null = null;
  return {
    add(style: string) {
      if (counter === 0 && typeof document !== 'undefined' && 'adoptedStyleSheets' in document) {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(style);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }
      counter++;
    },
    remove() {
      counter--;
      if (!counter && sheet) {
        const done = sheet;
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter(item => item !== done);
        sheet = null;
      }
    },
  };
}

export function styleHookSingleton() {
  const sheet = stylesheetSingleton();
  return (styles: string, isDynamic?: boolean) => {
    useEffect(() => {
      sheet.add(styles);
      return () => sheet.remove();
    }, [styles && isDynamic]);
  };
}

export function styleSingleton() {
  const useStyle = styleHookSingleton();
  return function Sheet({styles, dynamic}: {styles: string; dynamic?: boolean}) {
    useStyle(styles, dynamic);
    return null;
  };
}
