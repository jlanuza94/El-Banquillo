// Compila El Banquillo en dist/.
//
//   node tools/build.mjs           compila el juego (dist/)
//   node tools/build.mjs --watch   recompila al guardar cambios
//   node tools/build.mjs --test    compila además la prueba automática (dist-test/test.cjs)
//
// Resultado en dist/:
//   index.html      página completa (GitHub Pages o cualquier hosting): app instalable
//   artifact.html   la misma página como fragmento, para publicarla en claude.ai
//   app.js          el juego (pantalla)
//   worker.js       la simulación en segundo plano
//   app.css, manifest.webmanifest, sw.js, icons/
import * as esbuild from 'esbuild';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const args = new Set(process.argv.slice(2));
const read = f => readFileSync(join(ROOT, f), 'utf8');

const FONTS = 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap';
const CSS_FILES = ['base.css', 'game.css', 'layout.css', 'polish.css'];

const common = { bundle: true, charset: 'utf8', target: 'es2020', logLevel: 'warning', legalComments: 'none' };

async function buildApp() {
  // Los dos bundles se compilan sin versión para calcularla a partir de su contenido.
  const out = await Promise.all(['main', 'worker'].map(name => esbuild.build({
    ...common, entryPoints: [join(ROOT, 'src', name + '.ts')], format: 'iife', minify: true,
    write: false, define: { __BUILD__: '"__EBV__"' },
  })));
  const css = '@charset "utf-8";\n' + CSS_FILES.map(f => read('src/css/' + f).replace(/^@charset "utf-8";\n/, '')).join('\n');
  const hash = createHash('sha256');
  out.forEach(r => hash.update(r.outputFiles[0].contents));
  hash.update(css);
  const v = hash.digest('hex').slice(0, 10);
  const [appJs, workerJs] = out.map(r => r.outputFiles[0].text.replaceAll('__EBV__', v));

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, 'icons'), { recursive: true });
  writeFileSync(join(DIST, 'app.js'), appJs);
  writeFileSync(join(DIST, 'worker.js'), workerJs);
  writeFileSync(join(DIST, 'app.css'), css);
  cpSync(join(ROOT, 'public', 'icons'), join(DIST, 'icons'), { recursive: true });
  cpSync(join(ROOT, 'public', 'manifest.webmanifest'), join(DIST, 'manifest.webmanifest'));
  writeFileSync(join(DIST, 'sw.js'), read('public/sw.js').replace('__BUILD__', v));

  const head = [
    '<title>El Banquillo</title>',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link rel="stylesheet" href="${FONTS}">`,
    `<link rel="stylesheet" href="app.css?v=${v}">`,
  ].join('\n');
  const body = `<div id="app"></div>\n<div class="rotate" aria-hidden="true"><div><svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="20" y="6" width="24" height="40" rx="4"/><path d="M8 52a24 24 0 0 0 40 4"/><path d="M48 50v6h-6"/></svg><b>Gira el móvil</b><span>El Banquillo se juega en horizontal</span></div></div>\n<script src="app.js?v=${v}" charset="utf-8"></script>`;
  writeFileSync(join(DIST, 'index.html'), read('public/index.html').replace('<!--HEAD-->', head).replace('<!--BODY-->', body));
  writeFileSync(join(DIST, 'artifact.html'), head + '\n\n' + body + '\n');

  const kb = f => Math.round(readFileSync(join(DIST, f)).length / 1024);
  console.log(`dist/ versión ${v}: app.js ${kb('app.js')} KB, worker.js ${kb('worker.js')} KB, app.css ${kb('app.css')} KB`);
  const missing = ['icon-192.png', 'icon-512.png'].filter(f => !readdirSync(join(DIST, 'icons')).includes(f));
  if (missing.length) console.warn('Faltan iconos (ejecuta node tools/icons.mjs):', missing.join(', '));
}

async function buildTest() {
  await esbuild.build({
    ...common, entryPoints: [join(ROOT, 'tests', 'run.ts')], platform: 'node', format: 'cjs',
    outfile: join(ROOT, 'dist-test', 'test.cjs'), define: { __BUILD__: '"test"' }, sourcemap: 'inline',
    external: ['jsdom'],
  });
  await esbuild.build({
    ...common, entryPoints: [join(ROOT, 'tests', 'bench.ts')], platform: 'node', format: 'cjs',
    outfile: join(ROOT, 'dist-test', 'bench.cjs'), define: { __BUILD__: '"bench"' }, external: ['jsdom'],
  });
}

await buildApp();
if (args.has('--test')) await buildTest();
if (args.has('--watch')) {
  const { watch } = await import('node:fs');
  let t = null;
  console.log('Esperando cambios en src/ y public/ …');
  for (const dir of ['src', 'public']) {
    watch(join(ROOT, dir), { recursive: true }, () => {
      clearTimeout(t);
      t = setTimeout(() => buildApp().catch(e => console.error(e.message)), 150);
    });
  }
}
