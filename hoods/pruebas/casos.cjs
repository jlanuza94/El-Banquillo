// Pruebas de Hood Cleaners. Uso: node hoods/pruebas/casos.cjs [parte-del-nombre]
// Abren el juego construido en Chromium y comprueban que lo importante sigue funcionando y que no hay errores.
const { abrir, partida, jugarNoche, caso, afirmar, correr } = require('./lib.cjs');

caso('arranque y menú en español e inglés', async () => {
  for (const idioma of ['es', 'en']) {
    const p = await abrir(partida(), { idioma });
    for (const t of ['clientes', 'cuadrilla', 'taller', 'logros', 'noche']) await p.click(`[data-tab="${t}"]`);
    afirmar(!p.errores.length, `errores (${idioma}): ${p.errores[0]}`);
    await p.close();
  }
});

caso('noche completa: cobra, guarda y avanza', async () => {
  const p = await abrir(partida());
  const antes = await p.evaluate(() => [__hc.S.noche, __hc.S.dinero]);
  const r = await jugarNoche(p, { cocina: 'burger' });
  const despues = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('hood-cleaners-v2')); return [s.noche, s.dinero]; });
  afirmar(/A/.test(r.nota), 'una cocina limpia del todo debería dar A: ' + r.nota);
  afirmar(despues[0] === antes[0] + 1, 'la noche no avanzó en el guardado');
  afirmar(despues[1] !== antes[1], 'el dinero no cambió');
  afirmar(/Técnica/.test(r.texto), 'el parte no explica la técnica');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('noche suspendida', async () => {
  const p = await abrir(partida());
  const r = await jugarNoche(p, { cocina: 'pizza', limpio: .2 });
  afirmar(/[DF]/.test(r.nota), 'una cocina sucia debería suspender: ' + r.nota);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('partida vieja sin campos nuevos', async () => {
  const vieja = { v: 4, fase: 'empresa', etapa: 1, empresa: { nombre: 'Viejita SA', color: '#d7382b' }, abierta: 5, compPref: 'beto', jugador: 'Jorge', noche: 9, dinero: 2000, rep: 30, aprobados: 8, mejor: 200, nivel: 5, xp: 10, perks: {},
    eq: { rasqueta: 2, hidro: true, camioneta: 2 }, aj: { asist: true, sonido: false }, album: [],
    clientes: [{ id: 5, nombre: 'Tacos El Güero', cocina: 'asador', proxima: 12, visitas: 2, pagoBase: 800, diseno: { filtros: 3, campanas: 1, ayud: 0, hood: { tipo: 'caja', ancho: 2, fondo: 1.1, alto: .7 }, ducto: { forma: 'cuadrado', largo: 2 }, eventos: [] } }],
    cuadrilla: [{ id: 7, n: 'Nacho', rasgo: 'Llega tarde con tacos.', frase: '¿Tacos?', fuerza: 1, sueldo: 130, color: '#ffb36b', noches: 4 }], candidatos: [], hoy: null, sigId: 20 };
  const p = await abrir(vieja);
  for (const t of ['cuadrilla', 'taller', 'logros', 'noche']) await p.click(`[data-tab="${t}"]`);
  await jugarNoche(p, { cocina: 'cafe' });
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('turno a medias: se guarda y se retoma', async () => {
  const p = await abrir(partida());
  await p.evaluate(() => { const o = __hc.genOrden('burger'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; const H = __hc.S.hoy; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.guardar(); __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  await p.evaluate(() => { __hc.M.eventos = []; Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });   // la app se va al fondo
  afirmar(await p.evaluate(() => !!localStorage.getItem('hood-cleaners-turno')), 'no se guardó el turno a medias');
  await p.reload(); await p.waitForSelector('#continuar'); await p.click('#continuar'); await p.waitForSelector('#retomar', { timeout: 60000 }).catch(async () => { throw new Error('no aparece la tarjeta para retomar: ' + (await p.evaluate(() => [localStorage.getItem('hood-cleaners-turno') ? 'turno guardado' : 'sin turno', document.querySelector('#pantalla').innerText.slice(0, 80)].join(' · ')))); });
  await p.click('#retomar'); await p.waitForFunction(() => __hc.M && __hc.M.fase === 'turno', null, { timeout: 90000 });
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('revisión del inspector y parte', async () => {
  const p = await abrir(partida());
  await p.evaluate(() => { const o = __hc.genOrden('cafe'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; const H = __hc.S.hoy; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  await p.evaluate(() => { const M = __hc.M; M.eventos = []; __hc.Z.forEach(z => z.sfs.forEach(s => { s.d.fill(0); s.sucio = true; })); M.etapa = 'migdalear'; __hc.pintarHud(true); document.querySelector('#siguiente').click(); });
  await p.waitForSelector('#revision:not([hidden])');
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  afirmar(await p.evaluate(() => document.querySelector('#revision').hidden), 'la revisión se quedó abierta');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('la Gran Licitación se gana y se llega al final', async () => {
  const p = await abrir(partida({ etapa: 4, rep: 90, dinero: 45000, eq: { rasqueta: 2, hidro: true, camioneta: 3, flota: 3 }, fijos: ['beto', 'lupe', 'chuy'] }));
  await p.click('#licitSi');
  for (let n = 0; n < 3 && await p.evaluate(() => !!__hc.S.licit); n++) { await jugarNoche(p, { cocina: null, orden: 0 }); await p.evaluate(() => __hc.pantallaCamioneta()); }
  afirmar(await p.evaluate(() => !!__hc.S.licitGanada), 'no se ganó la licitación con notas A');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('trabajos jefe de principio a fin', async () => {
  for (const id of ['tele', 'embrujada', 'hospital', 'inspector']) {
    const p = await abrir(partida({ etapa: 2, rep: 50 }));
    await p.evaluate(id => { let o; for (let i = 0; i < 400 && !o; i++) { __hc.S.jefeNoche = 0; o = __hc.generarOrdenes().find(x => x.jefe === id); } __hc.S.hoy.ordenes = [o]; __hc.S.hoy.sel = 0; }, id);
    const r = await jugarNoche(p, { cocina: null, orden: 0 });
    afirmar(/trabajo jefe|superado|beaten/i.test(r.texto), `${id}: el parte no muestra el resultado del jefe`);
    afirmar(!p.errores.length, `${id}: ${p.errores[0]}`); await p.close();
  }
});

caso('ciudades: ida y vuelta sin perder ni duplicar nada', async () => {
  const p = await abrir(partida({ medallas: { primera: 3 }, cuadrilla: [{ id: 7, n: 'Nacho', rasgo: 'x', frase: 'y', fuerza: 1, base: 1, sueldo: 130, color: '#ffb36b', noches: 12, cuidado: 3, puntual: 3, animo: 3 }], sede: { almacen: 2 } }));
  const foto = () => p.evaluate(() => { const S = __hc.S; return JSON.stringify({ c: __hc.ciudad(), d: S.dinero, r: S.rep, e: S.etapa, cu: S.cuadrilla.map(c => c.n), se: S.sede, eq: S.eq, emp: S.empresa.nombre }); });
  const c1 = await foto();
  afirmar(await p.evaluate(() => __hc.viajar(2)), 'no se pudo viajar a la ciudad 2');
  await p.evaluate(() => { const S = __hc.S; S.dinero = 777; S.rep = 12; S.medallas.notaA = 99; S.empresa.nombre = 'Sucursal'; });
  const c2 = await foto();
  afirmar(JSON.parse(c2).cu.length === 0 && !JSON.parse(c2).se, 'la ciudad 2 no empezó sin cuadrilla ni sede');
  afirmar(JSON.parse(c2).eq.rasqueta === 2 && JSON.parse(c2).eq.hidro, 'las herramientas personales no viajaron');
  for (let i = 0; i < 5; i++) { await p.evaluate(() => __hc.viajar(1)); await p.evaluate(() => __hc.viajar(2)); }
  afirmar(await foto() === c2, 'la ciudad 2 cambió tras ir y volver');
  await p.evaluate(() => __hc.viajar(1));
  afirmar(await foto() === c1, 'la ciudad 1 no quedó igual: ' + c1 + ' / ' + await foto());
  afirmar(await p.evaluate(() => __hc.S.medallas.notaA === 99 && __hc.S.medallas.primera === 3), 'las medallas no son del jugador');
  afirmar(await p.evaluate(() => !!localStorage.getItem('hood-cleaners-respaldo')), 'no se hizo la copia de seguridad');
  await p.reload(); await p.waitForSelector('#continuar'); await p.click('#continuar'); await p.waitForSelector('#salir');
  afirmar(await foto() === c1, 'tras recargar, la ciudad 1 no es la misma');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('la Residencia Oficial: seguridad, éxito y contratos de gobierno', async () => {
  const base = partida({ etapa: 4, rep: 90, dinero: 20000, licitGanada: 10, eq: { rasqueta: 2, hidro: true, camioneta: 3, flota: 2 }, fijos: ['beto', 'lupe', 'chuy'] });
  for (const [idioma, limpio] of [['es', 1], ['en', .3]]) {
    const p = await abrir(base, { idioma });
    afirmar(await p.evaluate(() => !!__hc.S.hoy.ordenes[0].residencia), 'no apareció la misión tras la licitación');
    await p.evaluate(() => { const H = __hc.S.hoy; H.sel = 0; H.dia = null; H.historia = null; __hc.guardar(); __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
    await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
    await p.evaluate(() => { const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
    for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
    await p.evaluate(() => { __hc.M.eventos = []; __hc.M.t = 4; });
    await p.waitForFunction(() => /seguridad|Security/i.test((document.querySelector('#evento:not([hidden])') || {}).innerText || ''), null, { timeout: 60000 });
    await p.evaluate(() => [...document.querySelectorAll('#evento .opciones button')][1].click());
    afirmar(await p.evaluate(() => !__hc.herramientas().includes('hidro')), 'la hidro no quedó confiscada');
    await p.evaluate(() => { const b = document.querySelector('#evento .btn.prim'); b && b.click(); });
    await p.evaluate(limpio => { const M = __hc.M; M.eventos = []; M.danos = []; __hc.piezas.aparatos.forEach(a => { a.quitada = true; }); __hc.piezas.bolsas.forEach(b => { b.bajada = true; }); __hc.piezas.faldas.forEach(f => { f.pelada = true; });
      __hc.Z.forEach(z => z.sfs.forEach(s => { for (let i = 0; i < s.d.length; i++) s.d[i] *= 1 - limpio; s.pol.fill(.9); })); M.t = M.dur * .6; __hc.terminarTurno(); }, limpio);
    await p.waitForSelector('.nota-grande', { timeout: 60000 });
    const r = await p.evaluate(() => ({ res: __hc.S.residencia, gob: !!__hc.S.gobierno, med: !!__hc.S.medallas.estado, txt: document.querySelector('#pantalla').innerText }));
    if (limpio === 1) {
      afirmar(r.res.exito && r.gob && r.med, 'con A no se dieron premio, medalla o contratos: ' + JSON.stringify(r.res));
      afirmar(/Presidencia|Presidential/.test(r.txt), 'el parte no muestra el premio');
      const gob = await p.evaluate(() => { let n = 0; for (let i = 0; i < 30; i++) if (__hc.generarOrdenes().some(o => o.gobierno)) n++; return n; });
      afirmar(gob > 3, 'casi no salen contratos de gobierno: ' + gob + '/30');
      await p.evaluate(() => __hc.pantallaCamioneta());
      afirmar(await p.evaluate(() => !__hc.S.hoy.ordenes.some(o => o.residencia)), 'la misión volvió a aparecer tras hacerla');
    } else {
      afirmar(!r.res.hecha && r.res.reintento === r.res.noche + 7 && !r.gob, 'el suspenso no programó la segunda oportunidad: ' + JSON.stringify(r.res));
    }
    afirmar(!p.errores.length, p.errores[0]); await p.close();
  }
});

caso('tu vida: estilo, gastos en el parte y renta semanal', async () => {
  const p = await abrir(partida({ noche: 20 }));
  await p.click('[data-tab="cuadrilla"]'); await p.click('[data-vida="lujo"]'); await p.click('[data-tab="noche"]');
  afirmar(await p.evaluate(() => __hc.S.vida === 'lujo'), 'no se guardó el estilo de vida');
  let r = await jugarNoche(p, { cocina: 'cafe' });
  afirmar(/Tu vida \(de lujo\)[^\n]*\s+−\$200/.test(r.texto), 'falta el gasto diario de lujo en el parte');
  afirmar(!/semanal/.test(r.texto), 'la renta semanal salió una noche que no tocaba');
  await p.evaluate(() => { __hc.S.noche = 28; __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  r = await jugarNoche(p, { cocina: 'cafe' });
  afirmar(/semanal\)?\s+−\$700/.test(r.texto), 'falta la renta semanal en la noche 28');
  // dolor de muela: la noche rinde menos
  await p.evaluate(() => { __hc.pantallaCamioneta(); const H = __hc.S.hoy; H.dia = { id: 'muela', res: '' }; __hc.pantallaCamioneta(); });
  await p.click('[data-tab="noche"]'); await p.evaluate(() => document.querySelector('[data-dia="1"]').click());
  afirmar(await p.evaluate(() => __hc.S.hoy.muela === true), 'aguantar la muela no quedó marcado');
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('cafe'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  afirmar(await p.evaluate(() => Math.abs(__hc.M.vida - 1.09 * .9) < .001), 'la muela y el estilo no afectan la fuerza: ' + await p.evaluate(() => __hc.M.vida));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

if (require.main === module) correr(process.argv[2]).then(mal => process.exit(mal ? 1 : 0));
module.exports = { correr };
