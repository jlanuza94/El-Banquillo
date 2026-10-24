// Pruebas de Hood Cleaners. Uso: node hoods/pruebas/casos.cjs [parte-del-nombre]
// Abren el juego construido en Chromium y comprueban que lo importante sigue funcionando y que no hay errores.
const { abrir, partida, jugarNoche, caso, afirmar, correr } = require('./lib.cjs');
// El Buzón: los mensajes y las decisiones de la historia ya no están en la pestaña Noche.
const alBuzon = p => p.evaluate(() => { document.querySelector('.tabs [data-tab="buzon"]').click(); document.querySelectorAll('.buzon-item').forEach(d => { d.open = true; }); });
global.HC_EXPORTA = ['COMPANEROS', 'compradorListo', 'tasacion', 'escurrirDucto', 'sonidoRaspa', 'TIPO_Q', 'LIMITE', 'A', 'camT', 'raspar', 'multEspuma', 'herramientas', 'pantallaNombre', 'resolverB', 'sumarNoche', 'conSeguro', 'sueldosOficina', 'estadioHoy', 'etapaLista', 'ETAPAS', 'oficinaDice', 'pantallaEvaluar', 'hablarRadio', 'VOZ', 'VOZ_RADIO', 'COMERCIALES', 'anotarLibro', 'trabajosLibres', 'lucesCampana'];

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
  await p.evaluate(() => { const o = __hc.genOrden('burger'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; const H = __hc.S.hoy; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.guardar(); __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
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
  await p.evaluate(() => { const o = __hc.genOrden('cafe'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; const H = __hc.S.hoy; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  await p.evaluate(() => { const M = __hc.M; M.eventos = []; __hc.Z.forEach(z => z.sfs.forEach(s => { s.d.fill(0); s.sucio = true; })); M.etapa = 'migdalear'; __hc.pintarHud(true); document.querySelector('#siguiente').click(); });
  await p.waitForSelector('#revision:not([hidden])');
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  afirmar(await p.evaluate(() => document.querySelector('#revision').hidden), 'la revisión se quedó abierta');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('la Gran Licitación se gana y se llega al final', async () => {
  // sin 8 camionetas ni Doña Elsy, todavía no deja inscribirse
  let p = await abrir(partida({ etapa: 4, rep: 90, dinero: 45000, eq: { rasqueta: 2, hidro: true, camioneta: 3, flota: 3 }, fijos: ['beto', 'lupe', 'chuy'] }));
  afirmar(await p.evaluate(() => !document.querySelector('#licitSi') && /8 camionetas/.test(document.querySelector('.licit').textContent)), 'la licitación no pide los requisitos');
  await p.close();
  p = await abrir(partida({ etapa: 4, rep: 90, dinero: 45000, eq: { rasqueta: 2, hidro: true, camioneta: 3, flota: 7 }, sede: { planificacion: 1 }, fijos: ['beto', 'lupe', 'chuy'] }));
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
    await p.evaluate(() => { const H = __hc.S.hoy; H.sel = 0; H.dia = null; H.historia = null; __hc.guardar(); __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
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
  await p.click('.tabs [data-tab="cuadrilla"]'); await p.click('[data-vida="lujo"]'); await p.click('.tabs [data-tab="noche"]');
  afirmar(await p.evaluate(() => __hc.S.vida === 'lujo'), 'no se guardó el estilo de vida');
  let r = await jugarNoche(p, { cocina: 'cafe' });
  afirmar(/Tu vida \(de lujo\)[^\n]*\s+−\$200/.test(r.texto), 'falta el gasto diario de lujo en el parte');
  afirmar(!/semanal/.test(r.texto), 'la renta semanal salió una noche que no tocaba');
  await p.evaluate(() => { __hc.S.noche = 28; __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  r = await jugarNoche(p, { cocina: 'cafe' });
  afirmar(/semanal\)?\s+−\$700/.test(r.texto), 'falta la renta semanal en la noche 28');
  // dolor de muela: la noche rinde menos
  await p.evaluate(() => { __hc.pantallaCamioneta(); const H = __hc.S.hoy; H.dia = { id: 'muela', res: '' }; __hc.pantallaCamioneta(); });
  await p.click('.tabs [data-tab="noche"]'); await p.evaluate(() => document.querySelector('[data-dia="1"]').click());
  afirmar(await p.evaluate(() => __hc.S.hoy.muela === true), 'aguantar la muela no quedó marcado');
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('cafe'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.historia = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  afirmar(await p.evaluate(() => Math.abs(__hc.M.vida - 1.09 * .9) < .001), 'la muela y el estilo no afectan la fuerza: ' + await p.evaluate(() => __hc.M.vida));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

// Fin de la campaña de Ciudad Comal: llega Lustre, eliges vender o no, director y mano derecha, y te vas a Puerto Fritanga.
const NACHO = { id: 7, n: 'Nacho', rasgo: 'x', frase: 'y', fuerza: 1, base: 1, sueldo: 130, color: '#ffb36b', noches: 12, cuidado: 3, puntual: 3, animo: 3, tipo: 'serio' };
const finCampana = (mas = {}) => partida({ etapa: 4, rep: 90, noche: 40, dinero: 40000, licitGanada: 30, residencia: { hecha: true, exito: true, nota: 'A', noche: 33 }, fijos: ['beto', 'lupe', 'chuy'],
  cuadrilla: [{ ...NACHO }], clientes: [], cunado: { gane: 2 }, perro: true, sueldos2: true, buho: { revelado: 35 }, eq: { rasqueta: 2, hidro: true, camioneta: 3, flota: 2 }, medallas: {}, ...mas });
caso('el comprador: pensarlo, camino B (no vender) y volver a Ciudad Comal', async () => {
  const p = await abrir(finCampana({ residencia: null, licitGanada: 36 }));
  afirmar(await p.evaluate(() => !document.querySelector('#comprador') && !__hc.compradorListo()), 'Lustre llegó antes de la Residencia');
  await p.evaluate(() => { __hc.S.residencia = { hecha: true, exito: true, nota: 'A', noche: 33 }; __hc.pantallaCamioneta(); });
  await p.click('#comprador'); await p.click('#pensarlo');
  afirmar(await p.evaluate(() => __hc.S.comprador.vuelve === 43 && !document.querySelector('#comprador')), 'pensarlo no aplazó la visita');
  await p.evaluate(() => { __hc.S.noche = 43; __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  await p.click('#comprador'); await p.click('[data-camino="B"]');
  await p.click('[data-g="c:lupe"]');
  afirmar(await p.evaluate(() => !document.querySelector('[data-g="c:lupe"]')), 'el director aparece también como mano derecha');
  await p.click('[data-g="a:7"]');
  // mudanza: una camioneta más grande (se paga con la caja de Ciudad Comal)
  await p.click('[data-mud="camioneta"]'); await p.click('#sigMud');
  const epi = await p.evaluate(() => document.querySelector('#pantalla').innerText);
  afirmar(/Lupe se queda al mando/.test(epi) && /Nacho ya tiene la maleta/.test(epi) && /Grasita/.test(epi) && /2 duelos/.test(epi), 'el epílogo no refleja las decisiones');
  await p.click('#rumbo'); await p.click('#empezarPuerto');
  const r = await p.evaluate(() => { const S = __hc.S; return { c: __hc.ciudad(), d: S.dinero, cu: S.cuadrilla.map(c => [c.n, c.sueldo]), f: S.fijos, lupe: __hc.COMPANEROS.lupe.sueldo, beto: __hc.COMPANEROS.beto.sueldo,
    c1: S.ciudades[1].dinero, c1f: S.ciudades[1].fijos, c1cu: S.ciudades[1].cuadrilla.length, fin: S.medallas.final, eq: S.eq, lg: S.legado.camino }; });
  afirmar(r.c === 2 && Math.abs(r.d - 8500) <= 300 && Math.abs(r.c1 - 25500) <= 300, 'el dinero no se repartió bien: ' + JSON.stringify(r));
  afirmar(JSON.stringify(r.cu) === '[["Nacho",125]]' && r.f.length === 0 && r.c1cu === 0, 'la mano derecha no se mudó con su aumento: ' + JSON.stringify(r));
  afirmar(r.lupe === 165 && r.beto === 100 && r.c1f.includes('lupe'), 'el director no tiene su aumento: ' + JSON.stringify(r));
  afirmar(r.fin && r.eq.camioneta === 3 && !r.eq.flota && r.eq.hidro && r.lg === 'B', 'la llegada al puerto no es la esperada: ' + JSON.stringify(r));
  afirmar(await p.evaluate(() => /Puerto Fritanga/.test(document.querySelector('.meta-final').innerText)), 'la cabecera no habla de Puerto Fritanga');
  const t = await jugarNoche(p, { cocina: 'cafe' });
  afirmar(/Dividendos de Ciudad Comal \(dirige Lupe\)/.test(t.texto), 'no llegaron los dividendos al parte');
  await p.evaluate(() => __hc.pantallaCamioneta()); await p.click('.tabs [data-tab="noche"]');
  await p.click('#viajar'); await p.click('#siViajar');
  const v = await p.evaluate(() => ({ c: __hc.ciudad(), d: __hc.S.dinero, f: __hc.S.fijos, carta: !!document.querySelector('#comprador') }));
  afirmar(v.c === 1 && Math.abs(v.d - 25500) <= 300 && v.f.includes('lupe') && !v.carta, 'volver a Ciudad Comal no funcionó: ' + JSON.stringify(v));
  const almacen = await p.evaluate(() => Object.keys(localStorage).map(k => k + ':' + localStorage.getItem(k).length).join(' '));
  await p.reload(); await p.waitForSelector('#continuar'); await p.click('#continuar'); await p.waitForSelector('#salir');
  afirmar(await p.evaluate(() => __hc.ciudad() === 1 && __hc.COMPANEROS.lupe.sueldo === 165), 'tras recargar se perdió la ciudad o el aumento: ' + await p.evaluate(() => JSON.stringify([__hc.ciudad(), __hc.COMPANEROS.lupe.sueldo, __hc.S.aumentos, __hc.S.noche])) + ' · antes: ' + almacen + ' · después: ' + await p.evaluate(() => Object.keys(localStorage).map(k => k + ':' + localStorage.getItem(k).length).join(' ')));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});
caso('el comprador: camino A (vender) con pagos y sin vuelta', async () => {
  const p = await abrir(finCampana());
  const valor = await p.evaluate(() => __hc.tasacion());
  await p.click('#comprador'); await p.click('[data-camino="A"]');
  await p.click('[data-g="c:chuy"]');
  await p.fill('#nombreNueva', 'Brillo Ninguno'); await p.click('[data-g="c:beto"]');
  await p.click('[data-mud="local"]'); await p.click('#sigMud');
  await p.click('#rumbo'); await p.click('#empezarPuerto');
  const r = await p.evaluate(() => { const S = __hc.S; return { c: __hc.ciudad(), d: S.dinero, n: S.empresa.nombre, f: S.fijos, pref: S.compPref, c1f: S.ciudades[1].fijos, vend: S.ciudades[1].vendida, c1d: S.ciudades[1].dinero,
    beto: __hc.COMPANEROS.beto.sueldo, chuy: __hc.COMPANEROS.chuy.sueldo, v: S.legado.venta, et: S.etapa, viaje: !!document.querySelector('#viajar') }; });
  afirmar(r.c === 2 && Math.abs(r.d - 6000) <= 300 && r.n === 'Brillo Ninguno' && r.c1d === 0 && r.et === 2 && r.v.caja >= 25000, 'la venta no fundó la nueva empresa: ' + JSON.stringify(r));
  afirmar(JSON.stringify(r.f) === '["beto"]' && r.pref === 'beto' && !r.c1f.includes('beto') && r.vend, 'Beto no se mudó: ' + JSON.stringify(r));
  afirmar(r.beto === 125 && r.chuy > 0 && r.v.restan === 30 && r.v.total === valor && r.v.porNoche === Math.round((valor * .4 + r.v.caja) / 300) * 10 && !r.viaje, 'aumentos o pagos mal: ' + JSON.stringify(r));
  const t = await jugarNoche(p, { cocina: 'cafe' });
  afirmar(/Pago de Grupo Brillo por la venta \(1 de 30\)/.test(t.texto) && !/Dividendos/.test(t.texto), 'el parte no trae el pago de la venta');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});
caso('partidas antiguas que ya habían comprado a El Cuñado', async () => {
  const p = await abrir(finCampana({ final: 38 }));
  afirmar(await p.evaluate(() => !!document.querySelector('#comprador')), 'Lustre no aparece en partidas que ya habían terminado');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('el Búho de la radio: pistas y la revelación de Don Rigo', async () => {
  const p = await abrir(partida({ noche: 24, rep: 45, etapa: 2 }));
  const pista = await p.evaluate(() => __hc.S.hoy.avisos.join(' '));
  afirmar(/El Búho de la Madrugada dijo/.test(pista) && !/\{jugador\}|\{empresa\}/.test(pista), 'no salió la pista en las noticias de la noche 24: ' + pista);
  afirmar(await p.evaluate(() => !document.querySelector('#buhoOk')), 'la revelación salió antes de la Licitación');
  await p.evaluate(() => { __hc.S.etapa = 4; __hc.S.licitGanada = 22; __hc.pantallaCamioneta(); });
  afirmar(await p.evaluate(() => /soy yo\. Rigo/.test(document.querySelector('.buho').innerText) && /Tester/.test(document.querySelector('.buho').innerText)), 'la tarjeta de la revelación no está o no usa el nombre del jugador');
  await p.click('#buhoOk');
  await p.click('.tabs [data-tab="buzon"]');
  const r = await p.evaluate(() => ({ b: __hc.S.buho, chip: document.querySelector('#jefeCorto').innerText, carta: !!document.querySelector('#buhoOk'), album: __hc.S.album }));
  afirmar(r.b && r.b.revelado === 24 && /cabina de Radio Grasa FM/i.test(r.chip) && !/desde el lago:/i.test(r.chip) && !r.carta && r.album.some(a => /Búho/.test(a)), 'la revelación no se guardó: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});
caso('la huella de Beto: en la campana, en el parte del inspector y en la pared del taller', async () => {
  const p = await abrir(partida({ compPref: 'beto' }));
  await p.evaluate(() => { __hc.S.hoy.comp = 'beto'; });
  let vista = null;
  const r = await jugarNoche(p, { cocina: 'burger', durante: () => {
    const z = __hc.Z.find(z => z.id === 'campana'); z.sfs.forEach(s => s.d.fill(0)); __hc.pintarHud();
    window.__huella = { M: __hc.M.huella, vis: z.huella.visible, comp: __hc.M.orden.comp };
  } });
  vista = await p.evaluate(() => window.__huella);
  afirmar(vista.comp === 'beto' && vista.M === 20 && vista.vis, 'Beto no dejó la huella al quedar limpia la campana: ' + JSON.stringify(vista));
  afirmar(await p.evaluate(() => (__hc.S.huellas || []).length === 1 && __hc.S.huellas[0].n === 20), 'la huella no se apuntó: ' + await p.evaluate(() => JSON.stringify([__hc.S.huellas, __hc.S.noche, __hc.M && __hc.M.huella])));
  await p.evaluate(() => __hc.pantallaCamioneta()); await p.click('.tabs [data-tab="taller"]');
  afirmar(await p.evaluate(() => document.querySelectorAll('.pared-beto span').length === 1), 'la pared del taller no muestra la huella');
  // sin Beto no hay huella
  await p.click('.tabs [data-tab="noche"]'); await p.evaluate(() => { __hc.S.hoy.comp = 'lupe'; });
  await jugarNoche(p, { cocina: 'cafe', durante: () => { const z = __hc.Z.find(z => z.id === 'campana'); z.sfs.forEach(s => s.d.fill(0)); __hc.pintarHud(); } });
  afirmar(await p.evaluate(() => __hc.S.huellas.length === 1), 'apareció una huella sin Beto');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('objetos con historia: se tocan en la preparación y cambian en la siguiente visita', async () => {
  const p = await abrir(partida());
  const visita = async () => {
    await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('cafe'); o.nombre = 'Café La Esquina'; o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
    await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
    return p.evaluate(() => ({ n: document.querySelectorAll('.marca.recuerdo').length, rot: __hc.piezas.recuerdos.map(r => +r.mesh.rotation.z.toFixed(2)) }));
  };
  let v = await visita();
  afirmar(v.n === 3 && v.rot[0] !== 0, 'no aparecen los 3 objetos torcidos: ' + JSON.stringify(v));
  await p.evaluate(() => document.querySelector('.marca.recuerdo').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await p.waitForFunction(() => __hc.S.recuerdos && __hc.S.recuerdos['Café La Esquina'], null, { timeout: 20000 }).catch(() => {});
  afirmar(await p.evaluate(() => __hc.M.escena === 0 && __hc.M.recVistos.has(0) && __hc.S.recuerdos['Café La Esquina'].v[0] === 1), 'tocar la foto no la apuntó o hizo pasar de pantalla');
  afirmar(await p.evaluate(() => /1978/.test(document.body.innerText)), 'no se ve la historia de la foto');
  await p.evaluate(() => document.querySelector('.carta button').click());
  for (let i = 0; i < 2; i++) await p.evaluate(() => document.querySelector('.marca.recuerdo:not(.hecha)').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await p.waitForTimeout(1200);
  afirmar(await p.evaluate(() => __hc.S.recuerdos['Café La Esquina'].todo === 20), 'no se guardó que conoces las tres historias: ' + await p.evaluate(() => JSON.stringify([__hc.S.recuerdos, __hc.M.escena, [...__hc.M.recVistos]])));
  await p.evaluate(() => { __hc.M = null; __hc.S.noche = 23; __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  v = await visita();
  afirmar(v.n === 3 && v.rot.every(r => r === 0), 'en la siguiente visita los objetos no cambiaron: ' + JSON.stringify(v));
  for (let i = 0; i < 3; i++) await p.evaluate(() => document.querySelector('.marca.recuerdo:not(.hecha)').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  afirmar(await p.evaluate(() => /marco dorado/.test(document.body.innerText) || __hc.S.album.includes('Las historias de Café La Esquina')), 'las historias nuevas no salieron');
  afirmar(await p.evaluate(() => __hc.S.album.includes('Las historias de Café La Esquina')), 'no se añadió al álbum');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

// Duelo 2.0: apuesta, hitos (2 de 3) y El Cuñado que reacciona a tu ritmo.
async function empezarDuelo(p, apostar) {
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('burger'); o.firmado = true; o.pedido = null; o.duelo = true; o.eventos = []; o.ayud = 0; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0 && document.querySelector('.carta[role=dialog] [data-i]'), null, { timeout: 90000 });
  const txt = await p.evaluate(() => document.querySelector('.carta[role=dialog]').innerText);
  await p.evaluate(i => document.querySelector(`.carta[role=dialog] [data-i="${i}"]`).click(), apostar ? 0 : 1);
  await p.evaluate(() => { const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  await p.evaluate(() => { __hc.M.eventos = []; __hc.M.duelo.sab = 2; __hc.M.duelo.tropiezo = null; });
  return txt;
}
const terminarDuelo = p => p.evaluate(() => { const M = __hc.M; __hc.piezas.aparatos.forEach(a => { a.quitada = true; }); __hc.piezas.bolsas.forEach(b => { b.bajada = true; }); __hc.piezas.faldas.forEach(f => { f.pelada = true; });
  __hc.Z.forEach(z => z.sfs.forEach(s => { s.d.fill(0); s.pol.fill(.8); s.sucio = true; })); M.t = M.dur * .6; __hc.terminarTurno(); });
caso('duelo 2.0: apuesta aceptada, hitos 2 de 3 y El Cuñado nervioso', async () => {
  const p = await abrir(partida({ dinero: 5000, compPref: 'solo' }));
  const txt = await empezarDuelo(p, true);
  afirmar(/Te apuesto \$[\d,]+ a que te gano/.test(txt) && /Tester/.test(txt), 'no salió la propuesta de apuesta: ' + txt);
  const x = await p.evaluate(() => __hc.M.duelo.apuesta);
  afirmar(x > 0, 'la apuesta aceptada no se guardó');
  // filtros limpios antes que él: punto para ti, y él se pone nervioso
  await p.evaluate(() => { __hc.Z.filter(z => z.id === 'filtros').forEach(z => z.sfs.forEach(s => s.d.fill(0))); });
  await p.waitForFunction(() => __hc.M.duelo.hitos && __hc.M.duelo.hitos.filtros, null, { timeout: 20000 });
  let r = await p.evaluate(() => ({ h: __hc.M.duelo.hitos, hud: document.querySelector('#dHitos i.tu') !== null }));
  afirmar(r.h.filtros === 'tu' && r.hud, 'el hito de filtros no fue tuyo o no se ve: ' + JSON.stringify(r));
  await p.evaluate(() => { __hc.M.duelo.prog = .05; });
  await p.waitForFunction(() => __hc.M.duelo.animo === 'nervioso', null, { timeout: 20000 });
  await p.evaluate(() => { __hc.Z.filter(z => z.id !== 'filtros').forEach(z => z.sfs.forEach(s => s.d.fill(0))); });
  await p.waitForFunction(() => __hc.M.duelo.ganador, null, { timeout: 20000 });
  r = await p.evaluate(() => ({ g: __hc.M.duelo.ganador, h: __hc.M.duelo.hitos, a: __hc.M.duelo.animo }));
  afirmar(r.g === 'tu' && r.h.campana === 'tu', 'no ganaste el duelo 2–0: ' + JSON.stringify(r));
  const antes = await p.evaluate(() => __hc.S.dinero);
  await terminarDuelo(p); await p.waitForSelector('.nota-grande', { timeout: 60000 });
  const t = await p.evaluate(() => document.querySelector('#pantalla').innerText);
  afirmar(/Apuesta ganada a El Cuñado/.test(t) && /Duelo ganado · 3–0/i.test(t), 'el parte no refleja la apuesta o el marcador');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});
caso('duelo 2.0: sin apuesta, El Cuñado se confía y gana', async () => {
  const p = await abrir(partida({ dinero: 5000, compPref: 'solo' }));
  await empezarDuelo(p, false);
  afirmar(await p.evaluate(() => __hc.M.duelo.apuesta === 0), 'rechazar la apuesta no quedó registrado');
  await p.evaluate(() => { __hc.M.duelo.prog = .5; });
  await p.waitForFunction(() => __hc.M.duelo.animo === 'confiado', null, { timeout: 150000 });
  await p.evaluate(() => { __hc.M.duelo.prog = .99; });
  await p.waitForFunction(() => __hc.M.duelo.ganador === 'el', null, { timeout: 150000 });
  await terminarDuelo(p); await p.waitForSelector('.nota-grande', { timeout: 60000 });
  const t = await p.evaluate(() => document.querySelector('#pantalla').innerText);
  afirmar(/Duelo perdido · \d–2/i.test(t) && !/Apuesta/.test(t) && /la mitad/.test(t), 'el parte del duelo perdido no es correcto: ' + (t.match(/Duelo[^\n]*\n?[^\n]*/) || [t.slice(0, 200)])[0]);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('de arriba abajo: el ducto escurre sobre la campana (jabón si está sucia, grasa si ya estaba limpia), y cada suciedad suena distinto', async () => {
  const p = await abrir(partida({ compPref: 'solo', aj: { asist: true, sonido: true, ahorro: true } }));
  await jugarNoche(p, { cocina: 'burger', durante: () => {
    const Z = __hc.Z, M = __hc.M, ic = Z.findIndex(z => z.id === 'campana'), id = Z.findIndex(z => z.id === 'ducto'), c = Z[ic];
    const r = {};
    // campana sucia: el agua con jabón del ducto la moja y le empieza a ablandar la grasa
    __hc.irZona(id); const empapadas = () => c.sfs.reduce((a, s) => a + s.soak.filter(x => x >= 0 && x <= 20).length, 0), e0 = empapadas();
    for (let i = 0; i < 5; i++) __hc.escurrirDucto(1.3); r.sucia = empapadas() > e0 && c.sfs.some(s => s.mojado) && !!M.avisoJabon;
    // campana limpia: se vuelve a manchar, con aviso, y con tope
    c.sfs.forEach(s => s.d.fill(0)); for (let i = 0; i < 5; i++) __hc.escurrirDucto(1.3); r.mancha = __hc.micras(c); r.aviso = !!M.avisoEscurre;
    for (let i = 0; i < 40; i++) { if (__hc.micras(c) > __hc.LIMITE) c.sfs.forEach(s => s.d.fill(0)); __hc.escurrirDucto(1.3); } r.tope = c.reens;
    // trabajando la campana no escurre nada
    c.sfs.forEach(s => s.d.fill(0)); __hc.irZona(ic); __hc.escurrirDucto(5); r.enCampana = __hc.micras(c);
    // sonidos: cada tipo pasa por su rama y el contador se vacía
    for (const k of [0, 1, 2, 3]) { __hc.TIPO_Q[k] = 1; __hc.sonidoRaspa(); } r.vacio = __hc.TIPO_Q.every(x => x === 0); r.audio = !!__hc.A.ctx;
    window.__ducto = r;
  } });
  const r = await p.evaluate(() => window.__ducto);
  afirmar(r.sucia && r.mancha > 0 && r.aviso && r.tope === 12 && r.enCampana === 0 && r.vacio && r.audio, 'el escurrido o los sonidos no funcionan: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('El Cuñado desde el principio y el menú con caras e iconos', async () => {
  // de aprendiz: la camioneta roja y el aviso de Don Rigo
  let p = await abrir(partida({ fase: 'aprendiz', etapa: 0, empresa: null, noche: 2, compPref: 'beto', fijos: [], hoy: null }));
  let r = await p.evaluate(() => ({ roja: !!document.querySelector('.calle-aprendiz .roja'), aviso: __hc.S.hoy.avisos.join(' '), caras: document.querySelectorAll('.cara svg').length }));
  afirmar(r.roja && /camioneta roja/.test(r.aviso) && r.caras >= 1, 'falta la camioneta roja o el aviso de Don Rigo: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
  // primeras noches de la empresa: reseñas falsas, cartel en la camioneta y primer duelo escrito
  p = await abrir(partida({ noche: 21, abierta: 20, hoy: null, cunado: null }));
  r = await p.evaluate(() => { const out = { resenas: 0, cartel: false, primer: 0 }; for (let i = 0; i < 30; i++) { __hc.S.hoy = null; __hc.S.cartel = null; delete __hc.S.primerDuelo; __hc.pantallaCamioneta(); const H = __hc.S.hoy; if (/Reseña|oyente|En redes/.test(H.avisos.join(' '))) out.resenas++; if (__hc.S.cartel) out.cartel = true; if (H.ordenes.some(o => o.primerDuelo)) out.primer++; } return out; });
  afirmar(r.resenas >= 1 && r.cartel && r.primer === 30, 'no salen las reseñas, el cartel o el primer duelo: ' + JSON.stringify(r));
  await p.evaluate(() => { __hc.S.cartel = 21; __hc.pantallaCamioneta(); });
  await p.click('#quitarCartel');
  afirmar(await p.evaluate(() => !__hc.S.cartel && !document.querySelector('#quitarCartel')), 'no se pudo quitar el cartel');
  r = await p.evaluate(() => ({ ico: document.querySelectorAll('.ico-cocina').length, caras: document.querySelectorAll('.cara svg').length, primer: /El Cuñado lo quiere/.test(document.body.innerText) }));
  afirmar(r.ico >= 2 && r.caras >= 3, 'faltan iconos de cocina o caras: ' + JSON.stringify(r));
  // el primer duelo empieza con su escena, sin apuesta
  await p.evaluate(() => { const H = __hc.S.hoy; const i = H.ordenes.findIndex(o => o.primerDuelo); H.sel = i; H.ordenes[i].firmado = true; H.ordenes[i].eventos = []; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => document.querySelector('.carta[role=dialog]'), null, { timeout: 90000 });
  const t = await p.evaluate(() => document.querySelector('.carta[role=dialog]').innerText);
  afirmar(/camioneta roja ya está estacionada/.test(t) && !/apuesto/.test(t), 'el primer duelo no tiene su escena: ' + t);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('tutorial compacto y barras de progreso de las zonas', async () => {
  const p = await abrir(partida({ fase: 'aprendiz', etapa: 0, empresa: null, noche: 1, compPref: 'beto', fijos: [], hoy: null }));
  await p.evaluate(() => { const H = __hc.S.hoy; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  await p.evaluate(() => { const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  await p.waitForSelector('#tuto:not([hidden])');
  afirmar(await p.evaluate(() => !document.querySelector('#tuto').classList.contains('mini')), 'el cartel del tutorial empezó encogido');
  await p.waitForFunction(() => document.querySelector('#tuto').classList.contains('mini'), null, { timeout: 9000 });
  await p.click('#tuto');
  afirmar(await p.evaluate(() => !document.querySelector('#tuto').classList.contains('mini')), 'tocar el cartel no lo volvió a abrir');
  const w0 = await p.evaluate(() => [...document.querySelectorAll('#zonas .prog s')].map(s => s.style.width));
  afirmar(w0.length >= 3 && w0.filter(w => parseFloat(w) > 90).length >= 2, 'las barras no empiezan llenas: ' + w0);   // el compañero pudo adelantar alguna zona
  await p.evaluate(() => { const z = __hc.Z.find(z => z.id === 'filtros'); z.sfs.forEach(s => s.d.fill(0)); __hc.pintarHud(); });
  // la campana en vertical: las paredes laterales se alcanzan deslizando la vista
  await p.evaluate(() => { const i = __hc.Z.findIndex(z => z.id === 'campana'); __hc.irZona(i); });
  await p.waitForTimeout(1500);
  const lados = await p.evaluate(() => ({ pan: __hc.camT.a.maxPan, tabs: !document.querySelector('#faltaD').hidden || !document.querySelector('#faltaI').hidden }));
  afirmar(lados.pan < .1 || lados.tabs, 'los lados de la campana no se pueden alcanzar: ' + JSON.stringify(lados));
  const ok = await p.evaluate(() => { const i = __hc.Z.findIndex(z => z.id === 'filtros'); return document.querySelectorAll('#zonas .prog s')[i].style.background; });
  afirmar(/--ok/.test(ok), 'la barra de la zona limpia no se puso verde: ' + ok);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('en qué gastar: caprichos con historia e inversiones en Ciudad Comal', async () => {
  const p = await abrir(partida({ etapa: 3, dinero: 80000, noche: 21, sueldos2: true }));
  await p.click('.tabs [data-tab="taller"]');
  afirmar(await p.evaluate(() => document.querySelectorAll('[data-capricho]').length === 4), 'no salen los caprichos en el taller');
  for (const id of ['casa', 'tigres', 'radio', 'taqueria']) { await p.click('.tabs [data-tab="taller"]'); await p.click(`[data-capricho="${id}"]`); await p.click('#volverCap'); }
  let r = await p.evaluate(() => ({ d: __hc.S.dinero, c: Object.keys(__hc.S.compras), rep: __hc.S.rep, album: __hc.S.album.length }));
  afirmar(r.d === 80000 - 77000 && r.c.length === 4 && r.rep >= 43 && r.album >= 4, 'los caprichos no se cobraron o no hicieron efecto: ' + JSON.stringify(r));
  await p.evaluate(() => { __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  afirmar(await p.evaluate(() => __hc.S.hoy.ordenes.some(o => o.origen === 'Radio')), 'el programa de Don Rigo no trae un trabajo más');
  await p.evaluate(() => { __hc.S.noche = 28; }); await p.click('.tabs [data-tab="noche"]');
  const t = await jugarNoche(p, { cocina: 'cafe' });
  afirmar(/cenas en la taquería de Beto/.test(t.texto) && /de tu casa \(semanal\)/.test(t.texto), 'el parte no refleja la casa o la taquería');
  // inversiones (camino B, ya en el puerto): se pagan con la caja de Ciudad Comal y suben los dividendos
  await p.evaluate(() => { const S = __hc.S; S.legado = { camino: 'B', noche: 20, director: { n: 'Lupe', comp: 'lupe' }, mano: { n: 'Beto', comp: 'beto' } }; __hc.viajar(2, { empresa: { nombre: 'Puerto', color: '#2e9e5b' }, etapa: 1, rep: 10, dinero: 3000, clientes: [], perdidos: [], cuadrilla: [], candidatos: [], fijos: ['beto'], compPref: 'beto', abierta: S.noche, hoy: null, eq: { camioneta: 2 } }); S.ciudades[1].dinero = 20000; __hc.pantallaCamioneta(); });
  await p.click('.tabs [data-tab="taller"]'); await p.click('[data-invertir="flota"]');
  r = await p.evaluate(() => ({ c1: __hc.S.ciudades[1].dinero, d: __hc.S.dinero, inv: __hc.S.legado.inversiones }));
  afirmar(r.c1 === 10000 && r.d === 3000 && r.inv.flota, 'la inversión no se pagó con la caja de Ciudad Comal: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('duelo que termina antes de arrancar el marcador', async () => {
  const p = await abrir(partida({ compPref: 'solo' }));
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('burger'); o.firmado = true; o.pedido = null; o.duelo = true; o.eventos = []; o.ayud = 0; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  await p.evaluate(() => { const M = __hc.M; __hc.Z.forEach(z => z.sfs.forEach(s => s.d.fill(0))); M.t = M.dur * .5; M.fase = 'turno'; __hc.terminarTurno(); });
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('soplete y gel: cada uno con su ventaja y su punto débil', async () => {
  const p = await abrir(partida({ etapa: 2, compPref: 'solo', eq: { rasqueta: 2, hidro: true, camioneta: 2, flota: 0, soplete: true, gel: true } }));
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('asador'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  await p.evaluate(() => { const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  afirmar(await p.evaluate(() => __hc.herramientas().includes('soplete') && !!document.querySelector('[data-hb="soplete"]')), 'el soplete no aparece entre las herramientas');
  // soplete sobre grasa quemada: la derrite; mantenerlo apretado más de 3 s requema el metal
  const r = await p.evaluate(async () => {
    const M = __hc.M, ic = __hc.Z.findIndex(z => z.id === 'campana'); __hc.irZona(ic); M.eventos = [];
    const sf = __hc.Z[ic].sfs[0]; sf.tipo = sf.tipo || new Uint8Array(sf.d.length); sf.tipo.fill(1); sf.d.fill(1); sf.soak.fill(-1);
    const gx = sf.nx / 2, gy = sf.ny / 2, i0 = Math.floor(gy) * sf.nx + Math.floor(gx);
    M.herr = 'soplete'; M.apuntado = { sf, gx, gy, punto: sf.mesh.position.clone(), normal: sf.normal }; M.presionado = true; M.trazo = { x: 100, y: 100 };
    const t0 = M.t; for (let k = 0; k < 40 && M.t - t0 < 1.2; k++) await new Promise(ok => setTimeout(ok, 100)); const tras1 = sf.d[i0], req1 = M.requemado || 0;
    for (let k = 0; k < 60 && !(M.requemado >= 1); k++) await new Promise(ok => setTimeout(ok, 300));
    M.presionado = false;
    return { tras1, req1, req: M.requemado || 0 };
  });
  afirmar(r.tras1 < .2 && r.req1 === 0 && r.req >= 1, 'el soplete no derrite la costra o no requema al mantenerlo: ' + JSON.stringify(r));
  // gel: tarda más en actuar que la espuma y escurre hacia abajo por las paredes
  const g = await p.evaluate(async () => {
    const M = __hc.M, ic = __hc.Z.findIndex(z => z.id === 'campana'), z = __hc.Z[ic];
    const sf = z.sfs.find(s => s.normal && Math.abs(s.normal.y) < .5); sf.d.fill(1); sf.soak.fill(-1); if (sf.tipo) sf.tipo.fill(0);
    M.modo = { espuma: 'gel' }; const gx = sf.nx / 2, gy = sf.ny - 3, i0 = Math.floor(gy) * sf.nx + Math.floor(gx);
    __hc.raspar(sf, gx, gy, 1.2, 0, 'espuma');
    const espuma2 = __hc.multEspuma(2.5, false), gel2 = __hc.multEspuma(2.5, true), gel6 = __hc.multEspuma(5.5, true);
    const t0 = M.t; for (let k = 0; k < 80 && M.t - t0 < 4; k++) await new Promise(ok => setTimeout(ok, 250));
    let abajo = 0; for (let k = 1; k <= 5; k++) if (sf.soak[i0 - k * sf.nx] >= 0) abajo++;
    return { marcado: sf.gel && sf.gel[i0] > 0, espuma2, gel2, gel6, abajo };
  });
  afirmar(g.marcado && g.espuma2 > 1 && g.gel2 === 1 && g.gel6 > 1 && g.abajo >= 2, 'el gel no se comporta como debe: ' + JSON.stringify(g));
  await p.evaluate(() => { const M = __hc.M; M.presionado = false; __hc.Z.forEach(z => z.sfs.forEach(s => { s.d.fill(0); s.pol.fill(.8); })); M.t = M.dur * .6; __hc.terminarTurno(); });
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  afirmar(await p.evaluate(() => /Metal requemado/.test(document.querySelector('#pantalla').innerText)), 'el parte no descuenta el metal requemado');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('la saga de El Cuñado: siete capítulos con decisiones y consecuencias', async () => {
  const p = await abrir(partida({ fase: 'aprendiz', etapa: 0, empresa: null, noche: 3, compPref: 'beto', fijos: [], hoy: null, cunado: null }));
  const capitulo = async (prep, op) => {
    await p.evaluate(prep);
    await p.evaluate(() => { __hc.S.hoy = null; __hc.pantallaCamioneta(); });
    await alBuzon(p);
    const t = await p.evaluate(() => { const c = document.querySelector('.saga'); return c ? c.innerText : null; });
    if (t === null) throw new Error('no apareció el capítulo: ' + await p.evaluate(() => JSON.stringify(__hc.S.saga)));
    await p.click(`[data-saga="${op}"]`);
    return t;
  };
  let t = await capitulo(() => {}, 1);
  afirmar(/Rigo y Toño, 2005/.test(t) && await p.evaluate(() => __hc.S.album.some(a => /Rigo y Toño/.test(a))), 'capítulo 1 (la foto) mal');
  t = await capitulo(() => { const S = __hc.S; S.fase = 'empresa'; S.etapa = 1; S.empresa = { nombre: 'Prueba', color: '#2e9e5b' }; S.noche = 10; S.abierta = 9; S.dinero = 3000; }, 1);
  afirmar(/pastel de tres leches/.test(t) && await p.evaluate(() => __hc.S.saga.respeto === 1 && __hc.S.dinero === 2960), 'capítulo 2 (el pastel) mal');
  t = await capitulo(() => { const S = __hc.S; S.noche = 14; S.cunado = { gane: 1, perdi: 0, ultimo: { gano: 'tu', donde: 'X' } }; }, 0);
  afirmar(/Ganaste una/.test(t) && await p.evaluate(() => __hc.S.saga.respeto === 2), 'capítulo 3 (la nota) mal');
  t = await capitulo(() => { const S = __hc.S; S.noche = 18; S.etapa = 2; }, 0);
  afirmar(/llanta ponchada/.test(t) && await p.evaluate(() => __hc.S.saga.respeto === 4 && __hc.S.saga.favor), 'capítulo 4 (la carretera) mal');
  t = await capitulo(() => { const S = __hc.S; S.noche = 22; S.etapa = 3; }, 0);
  afirmar(/Lustre/.test(t) && !/la de las campanas/.test(t), 'capítulo 5 (el hijo) mal');
  t = await capitulo(() => { const S = __hc.S; S.noche = 26; S.etapa = 4; S.licit = { paso: 1, res: [], noche: 26, ultima: 25 }; }, 0);
  afirmar(/hace veinte años|Palacio Municipal/.test(t) && /Toño cargó con la culpa/.test(t), 'capítulo 6 (la confesión) mal');
  t = await capitulo(() => { const S = __hc.S; S.licit = null; S.noche = 30; S.legado = { camino: 'B', noche: 29, director: { n: 'Lupe', comp: 'lupe' }, mano: { n: 'Beto', comp: 'beto' } }; S.fijos = ['beto']; __hc.viajar(2, { empresa: { nombre: 'Puerto', color: '#2e9e5b' }, etapa: 1, rep: 10, dinero: 3000, clientes: [], perdidos: [], cuadrilla: [], candidatos: [], fijos: ['beto'], compPref: 'beto', abierta: S.noche, hoy: null, eq: { camioneta: 2 } }); }, 0);
  const r = await p.evaluate(() => ({ aliado: __hc.S.saga.aliado, clientes: __hc.S.clientes.length, cap: __hc.S.saga.cap }));
  afirmar(/sobre/.test(t) && r.aliado && r.clientes === 2 && r.cap === 7, 'capítulo 7 (el puerto) mal: ' + JSON.stringify(r));
  await p.evaluate(() => { __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  afirmar(await p.evaluate(() => !document.querySelector('.saga')), 'la saga siguió después del final');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});
caso('la saga: el favor de la carretera regala los filtros en el siguiente duelo', async () => {
  const p = await abrir(partida({ compPref: 'solo', saga: { cap: 4, next: 99, respeto: 3, favor: true } }));
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('burger'); o.firmado = true; o.pedido = null; o.duelo = true; o.eventos = []; o.ayud = 0; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; H.saga = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  await p.evaluate(() => { const c = document.querySelector('.carta[role=dialog] [data-i="1"]'); c && c.click(); const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
  await p.waitForTimeout(1500); await p.evaluate(() => { const c = document.querySelector('.carta[role=dialog] [data-i="1"]'); c && c.click(); });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); const c = document.querySelector('.carta[role=dialog] [data-i="1"]'); c && c.click(); }); await p.waitForTimeout(400); }
  await p.waitForFunction(() => __hc.M.duelo.hitos && __hc.M.duelo.hitos.filtros, null, { timeout: 20000 });
  const r = await p.evaluate(() => ({ h: __hc.M.duelo.hitos.filtros, favor: __hc.S.saga.favor }));
  afirmar(r.h === 'tu' && r.favor === false, 'el favor no regaló los filtros: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('tu vida jugable: desgaste, qué haces al salir, efectos, gripa y muebles', async () => {
  const p = await abrir(partida({ dinero: 5000, compPref: 'solo', vida: 'normal', yo: { descanso: 80, animo: 70, salud: 90, muebles: {} } }));
  await jugarNoche(p, { cocina: 'cafe' });
  let r = await p.evaluate(() => ({ ...__hc.S.yo }));
  afirmar(r.descanso === 62 && r.pendiente, 'la noche no cansó o no quedó pendiente la decisión: ' + JSON.stringify(r));
  await p.evaluate(() => __hc.pantallaCamioneta());
  await alBuzon(p);
  afirmar(await p.evaluate(() => document.querySelectorAll('[data-despues]').length === 5), 'no salen las opciones de después del turno');
  await p.click('[data-despues="mama"]');
  r = await p.evaluate(() => { const card = !!document.querySelector('[data-despues]'); document.querySelector('.tabs [data-tab="noche"]').click(); return { ...__hc.S.yo, d: __hc.S.dinero, card, linea: !!document.querySelector('.yo-linea') }; });
  afirmar(!r.pendiente && r.descanso === 90 && !r.card && r.linea, 'visitar a mamá no hizo efecto: ' + JSON.stringify(r));
  // cansado: menos fuerza en el turno
  await p.evaluate(() => { __hc.S.yo.descanso = 10; });
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('cafe'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; H.saga = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  afirmar(await p.evaluate(() => Math.abs(__hc.M.vida - 1.03 * .8) < .001), 'el cansancio no baja la fuerza: ' + await p.evaluate(() => __hc.M.vida));
  await p.evaluate(() => { const M = __hc.M; __hc.Z.forEach(z => z.sfs.forEach(s => { s.d.fill(0); s.pol.fill(.8); })); M.t = M.dur * .6; M.fase = 'turno'; __hc.terminarTurno(); });
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  // si sales sin decidir, duermes
  await p.evaluate(() => { __hc.S.yo.salud = 10; __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  const pend = await p.evaluate(() => !!__hc.S.yo.pendiente);
  await p.evaluate(() => { const H = __hc.S.hoy; H.gripa = null; const o = __hc.genOrden('cafe'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; H.saga = null; __hc.pantallaCamioneta(); });
  await alBuzon(p);
  afirmar(await p.evaluate(() => !!document.querySelector('[data-gripa="doctor"]')), 'no sale la tarjeta de la gripa');
  await p.evaluate(() => (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click());
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  r = await p.evaluate(() => ({ pend: __hc.S.yo.pendiente, ult: __hc.S.yo.ultimo.id, gripa: __hc.S.hoy.gripa }));
  afirmar(pend && !r.pend && r.ult === 'dormir' && r.gripa === 'trabajar', 'salir sin decidir no te mandó a dormir: ' + JSON.stringify(r));
  await p.evaluate(() => { const M = __hc.M; __hc.Z.forEach(z => z.sfs.forEach(s => { s.d.fill(0); s.pol.fill(.8); })); M.t = M.dur * .6; M.fase = 'turno'; __hc.terminarTurno(); });
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  // muebles: la cama recupera más
  await p.evaluate(() => { __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  await p.click('.tabs [data-tab="cuadrilla"]'); await p.click('[data-mueble="cama"]');
  const antes = await p.evaluate(() => __hc.S.yo.descanso);
  await p.click('.tabs [data-tab="buzon"]'); await p.click('[data-despues="dormir"]');
  const desp = await p.evaluate(() => __hc.S.yo.descanso);
  afirmar(await p.evaluate(() => !!__hc.S.yo.muebles.cama) && desp - antes >= 42 + 15 - 1 || desp === 100, 'la cama no ayuda a descansar: ' + antes + ' → ' + desp);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('arreglos: el turno de un trabajo gigante se guarda y se retoma, y el cálculo incluye los bonos', async () => {
  const p = await abrir(partida({ compPref: 'solo', racha: 3 }));
  // el cálculo de «Te quedas unos…» menciona el contrato y la racha
  const est = await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('burger'); o.contrato = { conds: ['espejo'], quien: 'protocolo' }; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; H.saga = null; __hc.pantallaCamioneta(); return document.querySelector('.estimado').innerText; });
  afirmar(/si cumples el contrato/.test(est) && /bono de racha/.test(est), 'el cálculo no menciona los bonos: ' + est);
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('plaza'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; o.ayud = 0; H.ordenes = [o]; H.sel = 0; H.ayud = []; H.equipos = []; __hc.guardar(); __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  await p.evaluate(() => { const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
  for (let i = 0; i < 20 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  const antes = await p.evaluate(() => { const M = __hc.M; M.eventos = []; const z = __hc.Z[0]; z.sfs.forEach(s => { for (let i = 0; i < s.d.length; i++) s.d[i] *= .3; }); Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); return { gig: !!M.orden.gigante, m: __hc.micras(z) }; });
  afirmar(antes.gig && await p.evaluate(() => !!localStorage.getItem('hood-cleaners-turno')), 'no se guardó el turno del trabajo gigante');
  await p.reload(); await p.waitForSelector('#continuar'); await p.click('#continuar'); await p.waitForSelector('#retomar', { timeout: 60000 });
  await p.click('#retomar'); await p.waitForFunction(() => __hc.M && __hc.M.fase === 'turno', null, { timeout: 90000 });
  const desp = await p.evaluate(() => ({ gig: !!__hc.M.orden.gigante, m: __hc.micras(__hc.Z[0]) }));
  afirmar(desp.gig && Math.abs(desp.m - antes.m) <= antes.m * .05 + 10, 'el gigante no se retomó igual: ' + JSON.stringify([antes, desp]));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('el manual de Don Rigo: páginas según el progreso, avisos e insignia', async () => {
  const p = await abrir(partida({ fase: 'aprendiz', etapa: 0, empresa: null, noche: 1, compPref: 'beto', fijos: [], hoy: null }));
  let r = await p.evaluate(() => ({ n: __hc.S.manual && Object.keys(__hc.S.manual.avisado).length, badge: (document.querySelector('.tabs [data-tab="logros"] .cuenta') || {}).textContent }));
  afirmar(r.n === 2 && r.badge === '2', 'de aprendiz deberían verse 2 páginas nuevas: ' + JSON.stringify(r));
  await p.evaluate(() => { const S = __hc.S; S.fase = 'empresa'; S.etapa = 3; S.empresa = { nombre: 'Prueba', color: '#2e9e5b' }; S.noche = 20; S.abierta = 10; S.hoy = null; __hc.pantallaCamioneta(); });
  r = await p.evaluate(() => ({ avisos: __hc.S.hoy.avisos.filter(a => /manual/.test(a)).length, badge: +(document.querySelector('.tabs [data-tab="logros"] .cuenta') || {}).textContent }));
  afirmar(r.avisos === 1 && r.badge >= 6, 'no se añadieron páginas al avanzar: ' + JSON.stringify(r));
  await p.click('.tabs [data-tab="logros"]');
  const antes = r.badge;
  await p.evaluate(() => { const d = document.querySelector('[data-pl="man-vida"]'); d.open = true; });
  await p.waitForTimeout(300);
  r = await p.evaluate(() => ({ visto: !!__hc.S.manual.visto.vida, badge: +(document.querySelector('.tabs [data-tab="logros"] .cuenta') || {}).textContent, txt: document.querySelector('[data-pl="man-vida"] .manual-txt').innerText }));
  afirmar(r.visto && r.badge === antes - 1 && /Descanso/.test(r.txt), 'abrir una página no la marcó como leída: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('historias de los ayudantes y la freidora', async () => {
  const ay = (id, n, tipo) => ({ id, n, rasgo: 'x', frase: 'y', fuerza: 1, base: 1, sueldo: 130, color: '#ffb36b', noches: 12, cuidado: 3, puntual: 3, animo: 3, tipo, esp: 'filtros' });
  const p = await abrir(partida({ dinero: 3000, compPref: 'solo', fijos: [], cuadrilla: [ay(7, 'Nacho', 'normal')], saga: { cap: 7 }, clientes: [] }));
  // capítulo 1 y 2 de la historia de Nacho (carácter normal: la abuela)
  const cap = async (noche, op) => { await p.evaluate(n => { __hc.S.noche = n; __hc.S.hoy = null; for (let k = 0; k < 20 && !__hc.S.hoy?.ayudHist; k++) { __hc.S.hoy = null; __hc.pantallaCamioneta(); } }, noche);
    await alBuzon(p);
    const t = await p.evaluate(() => (document.querySelector('[data-ayh]') || {}).closest ? document.querySelector('[data-ayh]').closest('.orden').innerText : null);
    if (!t) throw new Error('no apareció la historia del ayudante (noche ' + noche + ')'); await p.click(`[data-ayh="${op}"]`); return t; };
  let t = await cap(21, 1);
  afirmar(/abuela/.test(t) && /Nacho/.test(t), 'capítulo 1 mal: ' + t);
  t = await cap(26, 0);
  const r = await p.evaluate(() => ({ cap: __hc.S.cuadrilla[0].hist.cap, clientes: __hc.S.clientes.length, album: __hc.S.album.some(a => /historia de Nacho/.test(a)) }));
  afirmar(/zumba/.test(t) && r.cap === 2 && r.clientes === 1 && r.album, 'capítulo 2 mal: ' + JSON.stringify(r));
  // la freidora: zona nueva en la hamburguesería, se limpia y cuenta en la inspección
  const z = await p.evaluate(() => { const o = __hc.genOrden('burger'); const c = __hc.genOrden('cafe'); return [o.freidora, c.freidora]; });
  afirmar(z[0] === true && z[1] === false, 'la freidora no sale donde toca: ' + z);
  const res = await jugarNoche(p, { cocina: 'burger' });
  afirmar(/Freidora/.test(res.texto), 'la freidora no aparece en el parte');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('el menú no salta arriba al tocar algo', async () => {
  const p = await abrir(partida({ dinero: 5000 }));
  await p.click('.tabs [data-tab="cuadrilla"]');
  const y0 = await p.evaluate(() => { const P = document.querySelector('#pantalla'); P.scrollTop = 600; return P.scrollTop; });
  await p.evaluate(() => document.querySelector('[data-vida="comodo"]').click());   // sin el scroll automático de Playwright
  const y1 = await p.evaluate(() => document.querySelector('#pantalla').scrollTop);
  afirmar(y0 > 300 && Math.abs(y1 - y0) < 5, 'el menú saltó al tocar: ' + y0 + ' → ' + y1);
  await p.click('.tabs [data-tab="taller"]');
  const y2 = await p.evaluate(() => { const P = document.querySelector('#pantalla'), nav = P.querySelector('.tabs'); return [P.scrollTop, nav.offsetTop]; });
  afirmar(y2[0] <= y2[1], 'al cambiar de pestaña no se fue al principio de la pestaña: ' + y2);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('Don Rigo «el Muchachón» ya no habla desde el lago (también en partidas viejas)', async () => {
  const p = await abrir(partida({ hoy: null }));
  await p.evaluate(() => { __hc.S.hoy.frase = 'Desde el lago: pesqué una bota. Igual que mi primer cliente. ¿Cómo va la empresa?'; __hc.pantallaCamioneta(); });
  await p.click('.tabs [data-tab="buzon"]');
  const t = await p.evaluate(() => document.querySelector('#jefeCorto').textContent);
  afirmar(/Muchachón/.test(t) && !/lago/i.test(t), 'el aviso de Don Rigo sigue con el lago: ' + t);
  afirmar(!/lago/i.test(await p.evaluate(() => document.body.innerText)), 'queda un lago en el menú');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('voz del locutor: suena si hay mp3 y, si no, todo sigue en texto', async () => {
  const pend = { noche: 24, rep: 45, etapa: 4, licitGanada: 22 };
  // sin archivos de voz (como en claude.ai): no aparece «Escuchar» y no hay errores
  let p = await abrir(partida(pend));
  await p.evaluate(() => { __hc.S.aj.sonido = true; __hc.pantallaCamioneta(); });
  await p.waitForTimeout(1500);
  afirmar(await p.evaluate(() => !!document.querySelector('#buhoOk') && document.querySelector('#buhoVoz').hidden), 'apareció «Escuchar» sin archivo de voz');
  afirmar(await p.evaluate(() => __hc.COMERCIALES[0] === __hc.VOZ_RADIO.find(v => v.id === 'com-tigre').es), 'el comercial grabado no coincide con el de la radio');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
  // con el mp3: aparece «Escuchar», suena, y el ajuste «Voz del locutor» la apaga
  p = await abrir(partida(pend));
  await p.route('**/voz/es/*.mp3', r => r.fulfill({ path: require('path').join(__dirname, 'voz-prueba.mp3'), contentType: 'audio/mpeg' }));
  await p.evaluate(() => { __hc.VOZ.cache.clear(); __hc.S.aj.sonido = true; __hc.pantallaCamioneta(); });   // la primera carga fue antes de tener el mp3
  await p.waitForFunction(() => !document.querySelector('#buhoVoz').hidden, null, { timeout: 10000 });
  await p.click('#buhoVoz'); await p.waitForTimeout(300);
  const r = await p.evaluate(() => ({ src: __hc.VOZ.actual && __hc.VOZ.actual.src, pausa: __hc.VOZ.actual && __hc.VOZ.actual.paused }));
  afirmar(/voz\/es\/buho-revelacion\.mp3$/.test(r.src || '') && r.pausa === false, 'la revelación no suena: ' + JSON.stringify(r));
  await p.evaluate(() => { __hc.VOZ.actual.pause(); __hc.VOZ.actual = null; __hc.S.aj.voz = false; __hc.hablarRadio('com-tigre'); });
  afirmar(await p.evaluate(() => __hc.VOZ.actual === null), 'sonó la voz con el ajuste apagado');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('ducto por tramos, Buzón e imprevistos que cuestan tiempo y dinero', async () => {
  const p = await abrir(partida({ dinero: 3000, noche: 20, hoy: null, cuadrilla: [{ id: 7, n: 'Nacho', rasgo: 'x', frase: 'y', fuerza: 1, base: 1, sueldo: 130, color: '#ffb36b', noches: 12, tipo: 'normal' }] }));
  // Buzón: los mensajes de Don Rigo y del barrio ya no están en Noche
  let r = await p.evaluate(() => ({ jefe: !!document.querySelector('#jefeCorto'), cuenta: (document.querySelector('.tabs [data-tab="buzon"] .cuenta') || {}).textContent }));
  afirmar(!r.jefe && +r.cuenta >= 1, 'el Buzón no avisa o los mensajes siguen en Noche: ' + JSON.stringify(r));
  await p.click('.tabs [data-tab="buzon"]');
  r = await p.evaluate(() => ({ jefe: !!document.querySelector('#jefeCorto'), visto: __hc.S.hoy.buzonVisto, msgs: document.querySelectorAll('.bandeja .msg').length }));
  afirmar(r.jefe && r.visto && r.msgs >= 1, 'el Buzón no muestra los mensajes: ' + JSON.stringify(r));
  // imprevisto de la cuadrilla: batería muerta → 20 min tarde y $20
  await p.evaluate(() => { const H = __hc.S.hoy; H.dia = { id: 'bateria', res: '' }; document.querySelector('.tabs [data-tab="noche"]').click(); });
  const txt = await p.evaluate(() => document.querySelector('.orden.dia').textContent);
  afirmar(/(Nacho|Lupe|Beto|Chuy) dejó la radio/.test(txt), 'el imprevisto no dice quién fue: ' + txt);
  const d0 = await p.evaluate(() => __hc.S.dinero);
  await p.click('[data-dia="0"]');
  r = await p.evaluate(() => ({ dia: __hc.S.hoy.dia, retraso: __hc.S.hoy.retraso, costo: (document.querySelector('.costo-dia') || {}).textContent }));
  afirmar(r.dia.gasto === 20 && r.dia.min === 20 && r.retraso === 20 && /20 min/.test(r.costo || ''), 'el imprevisto no cobró tiempo y dinero: ' + JSON.stringify(r));
  afirmar(await p.evaluate(() => __hc.S.dinero) === d0 - 20, 'no se descontó el dinero');
  // ducto largo: 3 tramos y se avanza con el botón
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('cafe'); o.ducto = { forma: 'cuadrado', largo: 2.3 }; o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  afirmar(await p.evaluate(() => __hc.M.prepMin === 20), 'el turno no empezó 20 minutos tarde');
  await p.evaluate(() => { const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  await p.evaluate(() => { __hc.M.eventos = []; __hc.M.ev = null; [...document.querySelectorAll('#zonas button')].find(x => /ducto/i.test(x.textContent)).click(); });
  r = await p.evaluate(() => { const z = __hc.Z[__hc.M.zona]; return { n: z.tramos.length, k: z.vista.tramo, visible: !document.querySelector('#trAvanza').hidden }; });
  afirmar(r.n === 3 && r.k === 0 && r.visible, 'el ducto no está por tramos: ' + JSON.stringify(r));
  await p.click('#trAvanza'); await p.click('#trAvanza');
  r = await p.evaluate(() => ({ k: __hc.Z[__hc.M.zona].vista.tramo, fin: document.querySelector('#trAvanza').disabled }));
  afirmar(r.k === 2 && r.fin, 'no se avanza por los tramos: ' + JSON.stringify(r));
  await p.evaluate(() => { const M = __hc.M; __hc.Z.forEach(z => z.sfs.forEach(s => { s.d.fill(0); s.pol.fill(.8); })); M.t = M.dur * .6; __hc.terminarTurno(); });
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  afirmar(await p.evaluate(() => /Imprevisto antes de salir: Batería muerta \(20 min tarde, \$20 ya pagados\)/.test(document.querySelector('#pantalla').innerText)), 'el parte no cuenta el imprevisto');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('tu personaje: editor de avatar, piezas con logros y partidas viejas', async () => {
  // partida vieja sin avatar: sale uno automático en la cabecera
  let p = await abrir(partida({ noche: 12, medallas: {} }));
  afirmar(await p.evaluate(() => !__hc.S.avatar && !!document.querySelector('#miAvatar svg')), 'la partida vieja no tiene cara en la cabecera');
  await p.click('#miAvatar');
  const tabAv = async t => p.click(`[data-avt="${t}"]`);
  await tabAv('extras'); const sol = await p.evaluate(() => document.querySelector('[data-av="lentes:3"]').disabled);
  await tabAv('ropa'); const oro = await p.evaluate(() => document.querySelector('[data-av="casco:7"]').disabled);
  await tabAv('pelo'); const rizado = await p.evaluate(() => document.querySelector('[data-av="pelo:3"]').disabled);
  let r = { sol, oro, rizado };
  afirmar(r.sol && r.oro && !r.rizado, 'las piezas de logros no están bloqueadas: ' + JSON.stringify(r));
  await p.click('[data-av="pelo:3"]'); await tabAv('piel'); await p.click('[data-av="piel:5"]'); await tabAv('ropa'); await p.click('[data-av="uniforme:2"]'); await p.click('[data-av="casco:8"]');   // sin casco: se ve el pelo
  // color libre para el pelo y deshacer
  await tabAv('pelo'); await p.evaluate(() => { const i = document.querySelector('[data-avc="colorPelo"]'); i.value = '#8e44ad'; i.dispatchEvent(new Event('input')); });
  afirmar(await p.evaluate(() => document.querySelector('.av-prev').innerHTML.includes('#8e44ad')), 'el color libre no se ve en la vista previa');
  await p.click('#avListo');
  r = await p.evaluate(() => ({ a: __hc.S.avatar, menu: !!document.querySelector('.tabs') }));
  afirmar(r.a && r.a.pelo === 3 && r.a.piel === 5 && r.a.uniforme === 2 && r.a.colorPelo === '#8e44ad' && r.menu, 'el avatar no se guardó: ' + JSON.stringify(r));
  await p.click('.tabs [data-tab="taller"]');
  afirmar(await p.evaluate(() => !!document.querySelector('#editarAv')), 'no se puede cambiar desde el Taller');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
  // partida nueva: después del nombre viene el editor
  p = await abrir(partida({ noche: 3 }));
  await p.evaluate(() => __hc.pantallaNombre(true));
  await p.fill('#nombreJug', 'Sam'); await p.click('#empezarJ');
  afirmar(await p.evaluate(() => !!document.querySelector('.av-prev') && !!document.querySelector('#avListo')), 'la partida nueva no pasa por el editor');
  await p.click('#avListo');
  afirmar(await p.evaluate(() => __hc.S.jugador === 'Sam' && !!__hc.S.avatar && !!document.querySelector('.tabs')), 'no se empezó la partida después del editor');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('la gente de la sede: escritorios, administración, intercomunicador y renuncias', async () => {
  const p = await abrir(partida({ noche: 40, etapa: 3, dinero: 20000, eq: { rasqueta: 2, hidro: true, camioneta: 2, flota: 7 }, sede: { mantenimiento: 1, planificacion: 1, formacion: 1 }, cuadrilla: [{ id: 7, n: 'Nacho', rasgo: 'x', frase: 'y', fuerza: 1, base: 1, sueldo: 130, color: '#ffb36b', noches: 12, tipo: 'normal', animo: 1, cuidado: 3 }] }));
  await p.click('.tabs [data-tab="taller"]');
  let r = await p.evaluate(() => ({ ocupados: document.querySelectorAll('.escritorio.ocupado').length, vacantes: document.querySelectorAll('.escritorio .vacante').length }));
  afirmar(r.ocupados === 3 && r.vacantes === 4, 'la oficina no muestra quién está: ' + JSON.stringify(r));
  // administración: daños un 25 % más baratos y sueldo en los gastos fijos
  const antes = await p.evaluate(() => __hc.conSeguro(200));
  await p.click('[data-esc="admin"]'); await p.click('[data-personal="admin"]');
  r = await p.evaluate(() => ({ admin: !!__hc.S.admin, d: __hc.S.dinero, dano: __hc.conSeguro(200) }));
  afirmar(r.admin && r.d === 8000 && r.dano === Math.round(antes * .75 / 10) * 10, 'la administración no abarata los daños: ' + JSON.stringify({ antes, ...r }));
  // sueldos de la oficina en los gastos fijos: 250 + 350 + 400 + 350
  afirmar(await p.evaluate(() => __hc.sueldosOficina() === 1350), 'los sueldos de la oficina no cuadran: ' + await p.evaluate(() => __hc.sueldosOficina()));
  // con pocas camionetas, Ventas está bloqueado y no se puede contratar
  await p.evaluate(() => { __hc.S.eq.flota = 1; document.querySelector('.tabs [data-tab="taller"]').click(); });
  await p.click('[data-esc="oficina"]');
  r = await p.evaluate(() => ({ boton: !!document.querySelector('[data-sede="oficina"]'), candado: /🔒 5/.test(document.querySelector('.esc-det').textContent) }));
  afirmar(!r.boton && r.candado, 'Ventas se puede contratar sin las 5 camionetas: ' + JSON.stringify(r));
  // mensaje de la oficina en el Buzón de la noche siguiente
  await p.evaluate(() => { __hc.S.oficinaMsg = { id: 'planificacion', txt: ['Prueba de Doña Elsy.', 'Test.'] }; __hc.S.hoy = null; __hc.pantallaCamioneta(); document.querySelector('.tabs [data-tab="buzon"]').click(); });
  afirmar(await p.evaluate(() => /Doña Elsy/.test(document.querySelector('.bandeja').textContent) && /Prueba de Doña Elsy/.test(document.querySelector('.bandeja').textContent) && !__hc.S.oficinaMsg), 'el mensaje de la oficina no llegó al Buzón');
  // renuncia evitada por el jefe de personal (azar a favor)
  await p.evaluate(() => { Math.random = () => .1; __hc.pantallaEvaluar([{ t: 'Equipo 2', nota: 'D', bien: false, gente: [{ id: 7, n: 'Nacho', animo: 1 }], txt: 'x' }]); });
  await p.click('[data-ev="0|reg"]');
  r = await p.evaluate(() => ({ sigue: __hc.S.cuadrilla.some(c => c.id === 7), txt: document.querySelector('.respuesta-ev').textContent, msg: __hc.S.oficinaMsg && __hc.S.oficinaMsg.id }));
  afirmar(r.sigue && /Fausto Sereno/.test(r.txt) && r.msg === 'formacion', 'el jefe de personal no evitó la renuncia: ' + JSON.stringify(r));
  // intercomunicador en el turno: un solo mensaje por noche
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('cafe'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); (document.querySelector('#salir') || (document.querySelector('.tabs [data-tab="noche"]').click(), document.querySelector('#salir'))).click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  await p.evaluate(() => { const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  await p.evaluate(() => { __hc.M.eventos = []; __hc.M.ev = null; __hc.M.oficinaHablo = false; __hc.oficinaDice('averia', 1); __hc.oficinaDice('calidad', 1); });
  await p.waitForFunction(() => /Claunoche/.test(document.body.textContent), null, { timeout: 10000 }).catch(() => {});
  r = await p.evaluate(() => ({ tona: /Claunoche/.test(document.body.textContent), perfecta: /📟 Doña Elsy/.test(document.body.textContent) }));
  afirmar(r.tona && !r.perfecta, 'el intercomunicador no habló una sola vez: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('crecer de etapa pide camionetas', async () => {
  const p = await abrir(partida({ noche: 30, etapa: 1, rep: 50, dinero: 20000, eq: { rasqueta: 2, hidro: true, camioneta: 2, flota: 0 } }));
  let r = await p.evaluate(() => ({ lista: __hc.etapaLista(__hc.ETAPAS[2]), saltar: !!document.querySelector('#saltar'), meta: document.querySelector('.meta-final, .cab').textContent }));
  afirmar(!r.lista && !r.saltar, 'se puede subir a «Oficina con fax» con una sola camioneta: ' + JSON.stringify(r));
  await p.evaluate(() => { __hc.S.eq.flota = 1; __hc.pantallaCamioneta(); });
  r = await p.evaluate(() => ({ lista: __hc.etapaLista(__hc.ETAPAS[2]), saltar: !!document.querySelector('#saltar') }));
  afirmar(r.lista && r.saltar, 'con 2 camionetas no deja subir de etapa: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('el estadio de Charlienaro, Angélica en la oficina y la nómina', async () => {
  const p = await abrir(partida({ noche: 50, etapa: 3, rep: 70, dinero: 30000, hoy: null, eq: { rasqueta: 2, hidro: true, camioneta: 3, flota: 5 }, sede: { oficina: 1 }, fijos: ['beto', 'lupe'], cuadrilla: [{ id: 7, n: 'Nacho', rasgo: 'x', frase: 'y', fuerza: 1, base: 1, sueldo: 130, color: '#ffb36b', noches: 12, tipo: 'normal' }] }));
  // Charlienaro consigue el estadio: aviso y tarjeta para aceptar
  let r = await p.evaluate(() => ({ e: __hc.S.estadio, boton: !!document.querySelector('#estadioSi'), aviso: __hc.S.hoy.avisos.join(' ') }));
  afirmar(r.e && r.boton && /Estadio Monumental/.test(r.aviso) && /\$60,000/.test(r.aviso) && /treinta campanas/.test(r.aviso), 'Charlienaro no consiguió el estadio: ' + JSON.stringify(r));
  // al aceptar: solo hay un trabajo, gigante, de 4 campanas (más 2 de la brigada) y $12,000
  await p.click('#estadioSi');
  r = await p.evaluate(() => { const H = __hc.S.hoy; return { n: H.ordenes.length, o: H.ordenes[0] && { est: H.ordenes[0].estadio, gig: H.ordenes[0].gigante, c: H.ordenes[0].campanas, pago: H.ordenes[0].pago, nombre: H.ordenes[0].nombre } }; });
  afirmar(r.n === 1 && r.o.est && r.o.gig && r.o.c === 4 && r.o.pago === 12000 && /Tribuna Norte/.test(r.o.nombre), 'la primera noche del estadio no es correcta: ' + JSON.stringify(r));
  // cinco noches seguidas; la última paga el bono del club
  let parte = '';
  for (let k = 0; k < 5; k++) { const x = await jugarNoche(p, { cocina: null, orden: 0 }); parte = x.texto; await p.evaluate(() => { __hc.S.hoy = null; __hc.pantallaCamioneta(); }); }
  r = await p.evaluate(() => ({ e: __hc.S.estadio, otros: __hc.S.hoy.ordenes.some(o => o.estadio) }));
  afirmar(r.e.hecho && r.e.res.length === 5 && !r.otros, 'el estadio no terminó en 5 noches: ' + JSON.stringify(r.e));
  afirmar(/Bono del club/.test(parte), 'no se pagó el bono del club');
  afirmar(/Brigada del estadio \(\d+ personas?/.test(parte) && /Brigada del estadio: sueldos y gasolina/.test(parte), 'la brigada no salió en el parte: ' + parte.slice(0, 600));
  r = await p.evaluate(() => __hc.S.estadio.res.map(x => x.extra));
  afirmar(r.length === 5 && r.every(x => x >= 0 && x <= 2), 'la brigada no anotó sus campanas: ' + JSON.stringify(r));
  // Angélica se contrata en la oficina y cobra sueldo de oficina
  await p.click('.tabs [data-tab="taller"]'); await p.click('[data-esc="angelica"]');
  const d0 = await p.evaluate(() => __hc.S.dinero);
  await p.click('[data-personal="angelica"]');
  r = await p.evaluate(() => ({ a: __hc.S.angelica, s: __hc.sueldosOficina(), d: __hc.S.dinero }));
  afirmar(r.a && r.s === 350 + 300 && r.d === d0 - 3000, 'Angélica no entró a la oficina: ' + JSON.stringify(r));
  // nómina en Cuadrilla
  await p.click('.tabs [data-tab="cuadrilla"]');
  const t = await p.evaluate(() => document.querySelector('[data-pl="nomina"]').textContent);
  afirmar(/Técnicos/.test(t) && /Oficina/.test(t) && /\$650/.test(t), 'la nómina no está completa: ' + t.slice(0, 200));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('Leads de campo: requisitos, ascenso, sueldo y equipo que rinde más', async () => {
  const tec = (id, n, cursos, noches) => ({ id, n, rasgo: 'x', frase: 'y', fuerza: 1, base: 1, sueldo: 130, color: '#ffb36b', noches, tipo: 'normal', cuidado: 3, puntual: 3, animo: 3, cursos });
  const p = await abrir(partida({ noche: 60, etapa: 3, rep: 70, dinero: 5000, eq: { rasqueta: 2, hidro: true, camioneta: 3, flota: 4 }, fijos: ['beto'], cuadrilla: [tec(7, 'Nacho', ['acabado', 'coordina'], 12), tec(8, 'Rosa', ['seguridad'], 20)] }));
  await p.click('.tabs [data-tab="cuadrilla"]');
  let r = await p.evaluate(() => ({ nacho: !!document.querySelector('[data-lead="7"]'), rosa: !!document.querySelector('[data-lead="8"]'), rosaFalta: [...document.querySelectorAll('button[disabled]')].some(b => /Lead · falta sus 2 cursos/.test(b.textContent)) }));
  afirmar(r.nacho && !r.rosa && r.rosaFalta, 'los requisitos de Lead no se aplican: ' + JSON.stringify(r));
  const s0 = await p.evaluate(() => __hc.S.cuadrilla.find(x => x.id === 7).sueldo);
  await p.click('[data-lead="7"]');
  r = await p.evaluate(() => { const c = __hc.S.cuadrilla.find(x => x.id === 7); return { lead: !!c.lead, sueldo: c.sueldo, d: __hc.S.dinero, chip: /⭐ Lead/.test(document.querySelector('.tab-cont').textContent) }; });
  afirmar(r.lead && r.sueldo === s0 + 30 && r.d === 4000 && r.chip, 'el ascenso no funcionó: ' + JSON.stringify(r));
  // su equipo rinde más: con la suerte fija, el mismo trabajo pasa con Lead y no sin él
  r = await p.evaluate(() => {
    const o = __hc.genOrden('cafe'); o.micras = 2600; o.pedido = null; o.garantia = false;
    Math.random = () => .55;
    const con = __hc.resolverB({ orden: o, comp: null, ayud: [7], k: 2 }), sin = __hc.resolverB({ orden: o, comp: null, ayud: [8], k: 2 });
    return { con: con.aprobado, sin: sin.aprobado, txt: con.cosas.join(' ') };
  });
  afirmar(/Lead/.test(r.txt) && (r.con || !r.sin), 'el Lead no ayuda a su equipo: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('sueldos de técnicos con escala real y partidas viejas ajustadas', async () => {
  const p = await abrir(partida({ noche: 40, etapa: 2, cuadrilla: [{ id: 7, n: 'Nacho', rasgo: 'x', frase: 'y', fuerza: 1.2, base: 1, sueldo: 210, color: '#ffb36b', noches: 25, tipo: 'normal', cuidado: 4, puntual: 3 }, { id: 8, n: 'Rosa', rasgo: 'x', frase: 'y', fuerza: .7, base: .7, sueldo: 140, color: '#ffb36b', noches: 2, tipo: 'normal', cuidado: 2, puntual: 2 }] }));
  const r = await p.evaluate(() => ({ nacho: __hc.S.cuadrilla[0].sueldo, rosa: __hc.S.cuadrilla[1].sueldo, cand: (__hc.S.candidatos || []).map(c => c.sueldo) }));
  afirmar(r.nacho === 110 && r.rosa === 90, 'la partida vieja no se ajustó a la escala nueva: ' + JSON.stringify(r));
  afirmar(r.cand.every(x => x >= 90 && x <= 100), 'los candidatos no piden entre $90 y $100: ' + JSON.stringify(r.cand));
  // la experiencia sube $10 cada 10 noches
  const s2 = await p.evaluate(() => { const c = __hc.S.cuadrilla[1]; c.noches = 9; __hc.sumarNoche(c); return c.sueldo; });
  afirmar(s2 === 100, 'a las 10 noches no subió el sueldo: ' + s2);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('historias de la oficina: el Guapo, Doña Elsy, la posada y los clientes raros', async () => {
  const tec = (id, n) => ({ id, n, rasgo: 'x', frase: 'y', fuerza: 1, base: 1, sueldo: 100, color: '#ffb36b', noches: 12, tipo: 'normal', cuidado: 3, puntual: 3, animo: 3 });
  const p = await abrir(partida({ noche: 60, etapa: 3, rep: 60, dinero: 9000, eq: { rasqueta: 2, hidro: true, camioneta: 3, flota: 6 }, sede: { almacen: 1, planificacion: 1, formacion: 1, oficina: 1 }, cuadrilla: [tec(7, 'Nacho'), tec(8, 'Rosa')], saga: { cap: 7, respeto: 0 } }));
  const capitulo = async (k, op) => {
    await p.evaluate(k => { const S = __hc.S; S.ofi = S.ofi || {}; S.hoy.historia = null; S.hoy.ayudHist = null; S.hoy.saga = null; S.hoy.ofiRes = null; S.hoy.ofi = { k, cap: k === 'guapo' ? S.ofi.guapo || 0 : k === 'elsy' ? S.ofi.elsy || 0 : 0, c: 7 }; __hc.pantallaCamioneta(); }, k);
    await alBuzon(p);
    const t = await p.evaluate(() => (document.querySelector('[data-ofi]') || {}).closest ? document.querySelector('[data-ofi]').closest('.orden').innerText : null);
    if (!t) throw new Error('no apareció la historia de la oficina ' + k);
    await p.click(`[data-ofi="${op}"]`); return t;
  };
  let t = '';
  for (let i = 0; i < 4; i++) t = await capitulo('guapo', 0);
  let r = await p.evaluate(() => ({ g: __hc.S.ofi.guapo, med: !!__hc.S.medallas.guapo, res: __hc.S.hoy.ofiRes }));
  afirmar(/pastel|cake/i.test(t) && r.g === 4 && r.med && /EUSTAQUIO/.test(r.res), 'el misterio del Guapo no se resolvió: ' + JSON.stringify(r));
  await capitulo('elsy', 0); await capitulo('elsy', 1);
  r = await p.evaluate(() => ({ e: __hc.S.ofi.elsy, resp: __hc.S.saga.respeto }));
  afirmar(r.e === 2 && r.resp === -1, 'la historia de Doña Elsy no avanzó o no movió el respeto del Cuñado: ' + JSON.stringify(r));
  const d0 = await p.evaluate(() => __hc.S.dinero);
  await capitulo('posada', 0);
  r = await p.evaluate(() => ({ d: __hc.S.dinero, a: __hc.S.cuadrilla.map(c => c.animo), n: __hc.S.cuadrilla.length + __hc.S.fijos.length }));
  afirmar(d0 - r.d === 150 * r.n && r.a.every(a => a === 5), 'la posada no cobró o no animó: ' + JSON.stringify({ d0, ...r }));
  // clientes raros de Charlienaro: contrato con condición y paga más
  r = await p.evaluate(() => { for (let i = 0; i < 40; i++) { __hc.S.hoy = null; __hc.pantallaCamioneta(); const o = __hc.S.hoy.ordenes.find(o => o.raroCh); if (o) return { quien: o.contrato.quien, conds: o.contrato.conds }; } return null; });
  afirmar(r && r.quien === 'raro' && r.conds.length === 1, 'Charlienaro no trajo clientes raros: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('Angélica reparte los trabajos y el reporte de la semana', async () => {
  const tec = (id, n, lead) => ({ id, n, rasgo: 'x', frase: 'y', fuerza: 1, base: 1, sueldo: 100, color: '#ffb36b', noches: 30, tipo: 'normal', cuidado: 3, puntual: 3, animo: 3, lead });
  const p = await abrir(partida({ noche: 50, etapa: 3, rep: 60, dinero: 9000, angelica: true, eq: { rasqueta: 2, hidro: true, camioneta: 3, flota: 2 }, fijos: ['beto', 'lupe'], cuadrilla: [tec(7, 'Nacho', true), tec(8, 'Rosa', true), tec(9, 'Toño'), tec(10, 'Pili'), tec(11, 'Memo'), tec(12, 'Lalo')] }));
  // tú eliges el tuyo; los demás firmados quedan libres
  await p.evaluate(() => { const H = __hc.S.hoy; H.ayud = []; H.comp = 'solo'; H.ordenes.forEach(o => { o.firmado = true; o.duelo = false; o.gigante = false; o.contrato = null; o.jefe = false; o.diario = false; }); while (H.ordenes.length < 4) { const o = __hc.genOrden('cafe'); o.firmado = true; H.ordenes.push(o); } H.sel = 0; __hc.pantallaCamioneta(); });
  let r = await p.evaluate(() => ({ boton: !!document.querySelector('#repartir'), abierto: !!document.querySelector('[data-pl="equipos"][open]'), yo: document.querySelectorAll('.carr-item .lleva.yo').length, libres: __hc.trabajosLibres() }));
  afirmar(r.boton && r.abierto && r.yo === 1 && r.libres >= 2, 'no sale el botón de Angélica o los equipos vacíos no se abren: ' + JSON.stringify(r));
  await p.evaluate(() => document.querySelector('#repartir').click());
  r = await p.evaluate(() => { const S = __hc.S; return { eqs: S.hoy.equipos.map(e => ({ o: e.o, leads: e.ayud.filter(id => S.cuadrilla.find(c => c.id === id).lead).length })), badges: [...document.querySelectorAll('.carr-item .lleva')].map(b => b.textContent.trim()) }; });
  afirmar(r.eqs.every(e => e.o !== null && e.o !== 0 && e.leads === 1), 'Angélica no repartió un Lead por equipo o se metió en tu trabajo: ' + JSON.stringify(r));
  afirmar(r.badges.some(b => /Equipo 2/.test(b)) && r.badges.some(b => /Equipo 3/.test(b)), 'el carrusel no dice quién lleva cada trabajo: ' + JSON.stringify(r.badges));
  // el libro de cuentas clasifica las líneas, también las de los otros equipos
  r = await p.evaluate(() => {
    __hc.S.libro = [];
    const B = { lineas: [['Equipo B en X', 900], ['Equipo B: sueldos', -200], ['Equipo B: gasolina', -60]] };
    const lineas = [['Pago del trabajo', 1200], ['Sueldos de la cuadrilla', -300], ['Sueldos de la oficina', -350], ['Gasolina', -60], ['Materiales (desengrasante, plástico y cinta)', -45], ['Renta del local (taller)', -120], ['Mantenimiento de camionetas (2)', -140], ['Tu vida (normal): comida y transporte', -40], ['Lámpara rota', -80], Object.assign(['Equipo 2 en X · aprobado', 640], { eqB: B })];
    const neto = lineas.reduce((a, l) => a + l[1], 0) - 100;   // 100 de un abono sin línea
    __hc.anotarLibro(lineas, neto);
    return { c: __hc.S.libro[0].c, neto };
  });
  const c = r.c;
  afirmar(c.ingresos === 2100 && c.sueldos === -500 && c.oficina === -350 && c.gasolina === -120 && c.materiales === -45 && c.renta === -120 && c.camionetas === -140 && c.vida === -40 && c.otros === -180, 'el libro no clasificó bien: ' + JSON.stringify(r));
  // a la mañana siguiente de la noche 56, el reporte en el Buzón con su gráfica de 7 barras
  await p.evaluate(() => { const S = __hc.S; S.libro = []; for (let n = 50; n <= 56; n++) S.libro.push({ n, c: { ingresos: 1000 + n * 10, sueldos: -400 }, neto: 600 + n * 10 - (n === 53 ? 1500 : 0) }); S.noche = 57; S.hoy = null; __hc.pantallaCamioneta(); });
  await alBuzon(p);
  r = await p.evaluate(() => ({ barras: document.querySelectorAll('.graf-sem rect').length, txt: (document.querySelector('.reporte') || {}).textContent || '' }));
  afirmar(r.barras === 7 && /Peor: la 53/.test(r.txt) && /Mejor noche: la 56/.test(r.txt), 'no salió el reporte semanal: ' + JSON.stringify(r));
  await p.evaluate(() => document.querySelector('#reporteOk').click());
  r = await p.evaluate(() => __hc.S.hoy.reporteVisto);
  afirmar(r === true, 'el reporte no se marcó como leído');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('campana de verdad: lámparas que se ensucian, bajantes y filtros moteados', async () => {
  const p = await abrir(partida({ noche: 30, etapa: 2 }));
  await p.evaluate(() => { const H = __hc.S.hoy, o = __hc.genOrden('burger'); o.firmado = true; o.pedido = null; o.duelo = false; o.ayud = 0; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  await p.evaluate(() => { const P = __hc.piezas; P.pilotos.forEach(x => { x.off = true; }); P.luz.off = true; P.aparatos.forEach(a => { a.cubierto = true; }); P.cintas.forEach(c => { c.hecho = true; }); P.bolsas.forEach(b => { b.hecho = true; }); });
  for (let i = 0; i < 16 && !(await p.evaluate(() => __hc.M.fase === 'turno')); i++) { await p.evaluate(() => { const b = document.querySelector('#prepSig'); b && b.click(); }); await p.waitForTimeout(400); }
  let r = await p.evaluate(() => { const z = __hc.Z.find(z => z.id === 'campana'); __hc.M.eventos = []; __hc.pintarHud(); return { vidrio: !!z.vidrio, luces: __hc.lucesCampana.filter(l => l.userData.vidrio).length, i: __hc.lucesCampana[0].intensity, op: z.vidrio.halos[0].material.opacity }; });
  afirmar(r.vidrio && r.luces >= 1 && r.i < .5, 'la campana no tiene lámparas o empiezan limpias: ' + JSON.stringify(r));
  r = await p.evaluate(() => { const z = __hc.Z.find(z => z.id === 'campana'); z.sfs.forEach(s => s.d.fill(0)); __hc.pintarHud(); return { i: __hc.lucesCampana[0].intensity, op: z.vidrio.halos[0].material.opacity }; });
  afirmar(r.i > .8 && r.op > .5, 'limpiar la campana no aclaró las lámparas: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

if (require.main === module) correr(process.argv[2]).then(mal => process.exit(mal ? 1 : 0));
module.exports = { correr };
