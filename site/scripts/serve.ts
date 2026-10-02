/**
 * Serve the built site (dist/) the way a plain static host does, for the
 * browser tests and for trying a build locally:
 *   npm run preview                       # http://127.0.0.1:4321
 *   npm run preview -- --port 4399
 * Files are served as they are. A directory's index.html answers at the
 * directory's address with a trailing slash, and the address without one is
 * redirected there. Anything else gets 404.html with status 404. No other
 * headers are set: the pages must work without them (docs/hosting.md lists
 * what a production host should add).
 */
import {createReadStream, realpathSync, statSync} from 'node:fs';
import {createServer, type ServerResponse} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const args = process.argv.slice(2);
const option = (name: string, fallback: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && args[at + 1] ? args[at + 1] : fallback;
};
const root = (() => {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  try {
    return realpathSync.native(dist);
  } catch {
    return dist;
  }
})();
const port = Number(option('port', '4321'));
const host = option('host', '127.0.0.1');

/** What is at a path, matched exactly: a file system that ignores case (macOS, Windows) must not answer /EN/ with /en/. */
function kind(file: string): 'file' | 'directory' | null {
  try {
    const stat = statSync(file);
    if (realpathSync.native(file) !== file) return null;
    return stat.isFile() ? 'file' : stat.isDirectory() ? 'directory' : null;
  } catch {
    return null;
  }
}

function send(response: ServerResponse, status: number, file: string, head: boolean): void {
  response.writeHead(status, {'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream'});
  if (head) response.end();
  else
    createReadStream(file)
      .on('error', () => response.destroy())
      .pipe(response);
}

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const head = request.method === 'HEAD';
  if (request.method !== 'GET' && !head) {
    response.writeHead(405, {allow: 'GET, HEAD'}).end();
    return;
  }
  let pathname = '';
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    // An address that does not decode is not a file.
  }
  const file = path.resolve(root, `.${pathname}`);
  const inside = pathname.startsWith('/') && !pathname.includes('\0') && (file === root || file.startsWith(`${root}${path.sep}`));
  const found = inside ? kind(file) : null;
  if (found === 'file') return send(response, 200, file, head);
  if (found === 'directory' && kind(path.join(file, 'index.html')) === 'file') {
    if (url.pathname.endsWith('/')) return send(response, 200, path.join(file, 'index.html'), head);
    // The directory's own address, so an address like //host/.. cannot redirect to another host.
    const directory = path.relative(root, file).split(path.sep).map(encodeURIComponent).join('/');
    response.writeHead(301, {location: `/${directory}${directory ? '/' : ''}${url.search}`}).end();
    return;
  }
  send(response, 404, path.join(root, '404.html'), head);
}).listen(port, host, () => console.log(`Serving ${path.relative(process.cwd(), root) || '.'} at http://${host}:${port}/`));
