// Genera los iconos de Hood Cleaners a partir de hoods/icono.svg: los del APK en todas las densidades
// y los de la versión web (iPhone: pantalla de inicio). Solo hace falta al cambiar el dibujo del icono.
// Necesita Playwright:  node tools/icono-hoods.mjs
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
async function png(size, file, fondo) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;background:${fondo || 'transparent'}}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: file, omitBackground: !fondo });
  await page.close();
}
for (const [dens, size] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  const dir = join(ROOT, `android-hoods/app/src/main/res/mipmap-${dens}`);
  mkdirSync(dir, { recursive: true });
  await png(size, join(dir, 'ic_launcher.png'));
}
// iOS no acepta transparencia en el icono de inicio: va con el fondo de la noche.
mkdirSync(join(ROOT, 'hoods/web'), { recursive: true });
for (const size of [180, 192, 512]) await png(size, join(ROOT, `hoods/web/icono-${size}.png`), '#131d26');
await browser.close();
console.log('Iconos creados en android-hoods/app/src/main/res/mipmap-*/ y hoods/web/');
