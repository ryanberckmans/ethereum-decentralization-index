/**
 * Exposes the validated edition to server code as `virtual:edi-edition`.
 * The module is built in Node by the importer and refused in browser bundles,
 * so the full editorial dataset can never ship to visitors by accident.
 */
import type {Plugin} from 'vite';
import {buildEdition, DEFAULT_CONTENT_DIR, EditionError} from './edition.ts';

const ID = 'virtual:edi-edition';
const RESOLVED = `\0${ID}`;

export function editionPlugin(): Plugin {
  let contentDir = process.env.EDI_CONTENT_DIR ?? DEFAULT_CONTENT_DIR;
  return {
    name: 'edi-edition',
    enforce: 'pre',
    configResolved(config) {
      contentDir = config.env.EDI_CONTENT_DIR ?? contentDir;
    },
    resolveId(source) {
      return source === ID ? RESOLVED : undefined;
    },
    load(id) {
      if (id !== RESOLVED) return undefined;
      const environment = (this as {environment?: {name?: string; config?: {consumer?: string}}}).environment;
      if (environment?.config?.consumer === 'client' || environment?.name === 'client')
        throw new Error(`${ID} is server-only; pass the browser only the data a page needs`);
      try {
        const {bundle, warnings, files} = buildEdition({contentDir});
        for (const file of files) this.addWatchFile(file);
        for (const warning of warnings) this.warn(`${warning.file}: ${warning.message}`);
        return `export default ${JSON.stringify(bundle)};`;
      } catch (error) {
        if (error instanceof EditionError) this.error(error.message);
        throw error;
      }
    },
    configureServer(server) {
      // Re-import the edition when editorial content changes during development.
      server.watcher.add(contentDir);
      const reload = (file: string) => {
        if (!file.startsWith(contentDir)) return;
        for (const environment of Object.values(server.environments)) {
          const module = environment.moduleGraph.getModuleById(RESOLVED);
          if (module) environment.moduleGraph.invalidateModule(module);
        }
        server.ws.send({type: 'full-reload'});
      };
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
  };
}
