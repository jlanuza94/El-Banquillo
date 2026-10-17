// Prepara los archivos del APK de Hood Cleaners (android-hoods/): el juego compilado y three.js
// dentro de la app, para jugar sin conexión. Ejecuta antes `node tools/build.mjs`.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'android-hoods', 'app', 'src', 'main', 'assets');
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

const html = readFileSync(join(ROOT, 'dist', 'hoods', 'index.html'), 'utf8');
if (!html.includes(CDN)) throw new Error('dist/hoods/index.html ya no carga three.js r128 de cdnjs: actualiza CDN en tools/hoods-apk.mjs');
mkdirSync(ASSETS, { recursive: true });
writeFileSync(join(ASSETS, 'index.html'), html.replace(CDN, 'three.min.js'));
copyFileSync(join(ROOT, 'node_modules', 'three', 'build', 'three.min.js'), join(ASSETS, 'three.min.js'));
console.log('android-hoods/app/src/main/assets: index.html y three.min.js listos');
