// Genera los iconos PNG de la app (192 y 512 px) a partir de public/icons/icon.svg.
// Solo hace falta al cambiar el dibujo del icono. Necesita Playwright:  node tools/icons.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(execSync('npm root -g').toString().trim(), 'playwright')); }
const svg = readFileSync(join(ROOT, 'public/icons/icon.svg'), 'utf8');
const browser = await pw.chromium.launch();
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: join(ROOT, `public/icons/icon-${size}.png`) });
  await page.close();
}
await browser.close();
console.log('Iconos creados en public/icons/');
