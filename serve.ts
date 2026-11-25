// Simmer & Serve — a tiny static server for local play-testing only.
// Serves game/ at http://localhost:8080 with the right content types.
// Run: node serve.ts   (then open the address in desktop Chrome)

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'game');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = join(root, path === '/' ? 'index.html' : path);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('not found\n');
    return;
  }
  response.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  response.end(readFileSync(file));
});

server.listen(8080, () => {
  console.log('Simmer & Serve at http://localhost:8080');
});
