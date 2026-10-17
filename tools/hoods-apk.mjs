// Prepara los archivos del APK de Hood Cleaners (android-hoods/): el juego compilado y three.js
// dentro de la app, para jugar sin conexión. Ejecuta antes `node tools/build.mjs`.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'android-hoods', 'app', 'src', 'main', 'assets');
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

const html = readFileSync(join(ROOT, 'dist', 'hoods', 'index.html'), 'utf8');
if (!html.includes(`<script src="${CDN}"></script>`)) throw new Error('dist/hoods/index.html ya no carga three.js r128 de cdnjs: actualiza CDN en tools/hoods-apk.mjs');
mkdirSync(ASSETS, { recursive: true });
// La versión del APK (el número de compilación de GitHub Actions): el juego la compara con la publicada para avisar de novedades.
const version = Number(process.env.VERSION_CODE) || 0;
writeFileSync(join(ASSETS, 'index.html'), html.replace(`<script src="${CDN}"></script>`, `<script>window.HC_VERSION = ${version};</script><script src="three.min.js"></script>`));
copyFileSync(join(ROOT, 'node_modules', 'three', 'build', 'three.min.js'), join(ASSETS, 'three.min.js'));
console.log('android-hoods/app/src/main/assets: index.html y three.min.js listos');
