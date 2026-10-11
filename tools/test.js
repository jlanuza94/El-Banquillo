// Prueba automática de El Banquillo.
// Carga todos los archivos de js/ en el mismo orden que index.html, sin navegador,
// juega partidos, simula una temporada completa y comprueba el guardado.
// Uso:  node tools/test.js            (una temporada)
//       node tools/test.js 3          (tres temporadas)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const order = JSON.parse(fs.readFileSync(path.join(__dirname, 'load-order.json'), 'utf8'));
const seasons = +(process.argv[2] || 1);

const el = () => ({ innerHTML: '', addEventListener() {}, appendChild() {}, setAttribute() {}, replaceWith() {} });
const app = el();
const ctx = vm.createContext({
  console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Date, Promise,
  document: { getElementById: id => (id === 'app' ? app : null), addEventListener() {}, createElement: el, body: el(), querySelector: () => null, visibilityState: 'visible' },
  window: { scrollTo() {}, addEventListener() {}, matchMedia: () => ({ matches: false }), devicePixelRatio: 1 },
  navigator: {},
});
for (const f of order) {
  const file = path.join(ROOT, 'js', f + '.js');
  // El arranque normal espera a IndexedDB; en la prueba lo hacemos a mano.
  const code = fs.readFileSync(file, 'utf8').replace(/^window\.claude\?\.hot\?\.ready.*$/m, '');
  vm.runInContext(code, ctx, { filename: file });
}
const run = code => vm.runInContext(code, ctx);
const ok = (cond, msg) => { if (!cond) { console.error('FALLO:', msg); process.exitCode = 1; } else console.log('ok  ', msg); };

(async () => {
  const t0 = Date.now();
  run('S=null;dirty();render();');
  ok(run('S.teams.length') === 860, 'se crean 860 clubes');
  const team = run("S.teams.filter(t=>S.leagues[t.lg].c===0&&S.leagues[t.lg].lv===4).sort((a,b)=>b.rep-a.rep)[0].id");
  run(`pickTeam(${team})`);
  ok(run('S.user') === team, 'se elige club');

  // Pretemporada: un amistoso en directo
  run('playFriendly(friendlyOpts()[0]);simToEnd();matchView();finishRound();');
  ok(run('S.pre.left') === 2, 'amistoso de pretemporada');
  run('S.pre.left=0;S.sponsor=S.spOffers[0];');

  // Tres partidos minuto a minuto, con todas las pantallas
  for (let i = 0; i < 3; i++) {
    run('playMatch();matchView();simToEnd();finishRound();modalView();if(S.press)answerPress(0);');
  }
  const views = ['inicio', 'plantilla', 'tacticas', 'entreno', 'cantera', 'calendario', 'liga', 'copas', 'mercado', 'club', 'historia'];
  for (const v of views) run(`S.view='${v}';shell();`);
  ok(true, 'todas las pantallas se pintan sin errores');

  for (let s = 0; s < seasons; s++) {
    run("simRun('season',false)");
    await new Promise(r => { const iv = setInterval(() => { if (!run('simState')) { clearInterval(iv); r(); } }, 10); });
    if (run('!!S.jobless')) { console.log('     (despedido: se acepta la primera oferta)'); run('takeJob(S.jobless.offers[0])'); }
    const pos = run('table(uLg()).findIndex(r=>r.id===S.user)+1');
    const fx = run('S.fixtures.flat(2).filter(f=>f.played)');
    const gpm = fx.reduce((a, f) => a + f.hg + f.ag, 0) / fx.length;
    console.log(`     temporada ${run('seasonLabel()')}: puesto ${pos}, presupuesto ${run('money(S.budget)')}, ${gpm.toFixed(2)} goles por partido`);
    ok(gpm > 2 && gpm < 4, 'goles por partido razonables');
    run("S.view='inicio';shell();newSeason();");
    ok(run('S.week') === 0, 'empieza la temporada siguiente');
  }

  const code = run('exportCode()');
  ok(run(`importCode(${JSON.stringify(code)})`) === true, 'copia de seguridad: exportar e importar');
  const kb = Math.round(run('pack()').length / 1024);
  ok(kb < 6000, `tamaño del guardado: ${kb} KB`);
  console.log(`Terminado en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
})().catch(e => { console.error(e); process.exitCode = 1; });
