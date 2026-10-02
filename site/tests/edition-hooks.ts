/** Module hooks for tests/setup.ts. */
const URL_ID = 'edi-test:edition';

export async function resolve(specifier: string, context: unknown, next: (specifier: string, context: unknown) => unknown) {
  if (specifier === 'virtual:edi-edition') return {url: URL_ID, shortCircuit: true};
  return next(specifier, context);
}

export async function load(url: string, context: unknown, next: (url: string, context: unknown) => unknown) {
  if (url !== URL_ID) return next(url, context);
  const {buildEdition} = await import('../src/build/edition.ts');
  const {bundle} = buildEdition();
  return {format: 'module', source: `export default ${JSON.stringify(bundle)};`, shortCircuit: true};
}
