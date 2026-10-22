// Utilidades para las pruebas de Hood Cleaners: construyen el juego, lo abren en Chromium con una partida dada
// y juegan noches por código (sin depender de la velocidad del navegador).
const fs = require('fs'), path = require('path'), os = require('os'), { execSync } = require('child_process');
const RAIZ = path.join(__dirname, '..', '..');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const THREE = path.join(RAIZ, 'node_modules', 'three', 'build', 'three.min.js');
const EXPORTA = 'get M(){return M;}, get Z(){return Z;}, get S(){ return S; }, set S(v){ S = v; }, piezas, terminarTurno, pantallaCamioneta, genOrden, generarOrdenes, irZona, micras, dano, guardar, '
  + 'COCINAS, TIENDA, ETAPAS, lanzarEvento, pintarHud, ' + (process.env.HC_EXTRA || '');
let html = null;
function construir() {
  if (html) return html;
  execSync('node tools/build.mjs', { cwd: RAIZ, stdio: 'ignore' });
  const fuente = fs.readFileSync(path.join(RAIZ, 'dist', 'hoods', 'index.html'), 'utf8');
  if (!fuente.includes('window.claude?.hot?.snapshot')) throw new Error('No encuentro el punto donde exponer el juego a las pruebas');
  const extras = (global.HC_EXPORTA || []).join(', ');
  html = path.join(os.tmpdir(), `hc-prueba-${process.pid}.html`);
  fs.writeFileSync(html, fuente.replace('window.claude?.hot?.snapshot', `window.__hc = { ${EXPORTA}${extras} };\nwindow.claude?.hot?.snapshot`));
  return html;
}
// Una partida de empresa razonable; se puede sobreescribir cualquier campo.
const partida = (mas = {}) => ({ v: 4, fase: 'empresa', etapa: 1, empresa: { nombre: 'Prueba', color: '#2e9e5b' }, abierta: 1, compPref: 'lupe', fijos: ['beto', 'lupe'], jugador: 'Tester', noche: 20,
  dinero: 3000, rep: 40, aprobados: 8, mejor: 200, nivel: 4, xp: 0, perks: {}, eq: { rasqueta: 2, hidro: true, camioneta: 2, flota: 0 }, aj: { asist: true, sonido: false, ahorro: true },
  album: [], clientes: [], cuadrilla: [], candidatos: [], hoy: null, sigId: 50, ...mas });
let navegador = null;
async function abrir(save, { idioma = 'es', continuar = true } = {}) {
  if (!navegador) navegador = await playwright.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await navegador.newPage({ viewport: { width: 412, height: 915 } });
  p.errores = []; p.on('pageerror', e => p.errores.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ path: THREE, contentType: 'application/javascript' }));
  await p.addInitScript(([s, idioma]) => { if (localStorage.getItem('hc-prueba-lista')) return; localStorage.setItem('hc-prueba-lista', '1'); localStorage.setItem('hood-cleaners-idioma', idioma); if (s) localStorage.setItem('hood-cleaners-v2', JSON.stringify(s)); }, [save, idioma]);
  await p.goto('file://' + construir());
  if (continuar) { await p.waitForSelector('#continuar'); await p.click('#continuar'); await p.waitForSelector('#salir'); }
  return p;
}
// Juega la noche elegida: prepara, limpia por código hasta dejarla como se pida y llama al inspector (sin la revisión animada).
async function jugarNoche(p, { cocina = 'burger', limpio = 1, orden = null, preparar = true } = {}) {
  await p.evaluate(([cocina, orden]) => { const H = __hc.S.hoy; if (cocina) { const o = __hc.genOrden(cocina); o.firmado = true; o.pedido = null; o.duelo = false; o.ayud = 0; H.ordenes = [o]; H.sel = 0; } else if (orden !== null) H.sel = orden;
    H.ordenes[H.sel].firmado = true; H.ordenes[H.sel].eventos = []; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); }, [cocina, orden]);
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  if (preparar) await p.evaluate(() => { const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  await p.evaluate(limpio => { const M = __hc.M; M.eventos = []; __hc.piezas.aparatos.forEach(a => { a.quitada = true; }); __hc.piezas.bolsas.forEach(b => { b.bajada = true; }); __hc.piezas.faldas.forEach(f => { f.pelada = true; });
    __hc.Z.forEach(z => z.sfs.forEach(s => { for (let i = 0; i < s.d.length; i++) s.d[i] *= 1 - limpio; s.pol.fill(.8); s.sucio = true; })); M.t = M.dur * .6; __hc.terminarTurno(); }, limpio);
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  return p.evaluate(() => ({ nota: document.querySelector('.nota-grande').textContent, texto: document.querySelector('#pantalla').innerText }));
}
const casos = [];
const caso = (nombre, f) => casos.push({ nombre, f });
const afirmar = (cond, msg) => { if (!cond) throw new Error(msg); };
async function correr(filtro) {
  let mal = 0;
  for (const c of casos.filter(c => !filtro || c.nombre.includes(filtro))) {
    const t0 = Date.now();
    try { await c.f(); console.log(`✓ ${c.nombre} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); }
    catch (e) { mal++; console.log(`✗ ${c.nombre}: ${e.message.split('\n')[0]}`); }
  }
  if (navegador) await navegador.close();
  return mal;
}
module.exports = { abrir, partida, jugarNoche, caso, afirmar, correr, construir };
