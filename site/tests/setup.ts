/**
 * Lets Node's test runner import server modules: `virtual:edi-edition`, which
 * Vite provides in the site build, resolves to the edition built from the
 * same content by the same importer.
 */
import {register} from 'node:module';

register('./edition-hooks.ts', import.meta.url);
