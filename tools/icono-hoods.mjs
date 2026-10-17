// Genera el icono del APK de Hood Cleaners en todas las densidades a partir de hoods/icono.svg.
// Solo hace falta al cambiar el dibujo del icono. Necesita Playwright:  node tools/icono-hoods.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(execSync('npm root -g').toString().trim(), 'playwright')); }
const svg = readFileSync(join(ROOT, 'hoods/icono.svg'), 'utf8');
const browser = await pw.chromium.launch();
for (const [dens, size] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  const dir = join(ROOT, `android-hoods/app/src/main/res/mipmap-${dens}`);
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: join(dir, 'ic_launcher.png'), omitBackground: true });
  await page.close();
}
await browser.close();
console.log('Iconos creados en android-hoods/app/src/main/res/mipmap-*/');
