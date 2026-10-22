// Pruebas de Hood Cleaners. Uso: node hoods/pruebas/casos.cjs [parte-del-nombre]
// Abren el juego construido en Chromium y comprueban que lo importante sigue funcionando y que no hay errores.
const { abrir, partida, jugarNoche, caso, afirmar, correr } = require('./lib.cjs');
global.HC_EXPORTA = ['COMPANEROS', 'compradorListo', 'tasacion', 'escurrirDucto', 'sonidoRaspa', 'TIPO_Q', 'LIMITE', 'A', 'camT', 'raspar', 'multEspuma', 'herramientas'];

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
  afirmar(JSON.stringify(r.cu) === '[["Nacho",165]]' && r.f.length === 0 && r.c1cu === 0, 'la mano derecha no se mudó con su aumento: ' + JSON.stringify(r));
  afirmar(r.lupe === 200 && r.beto === 110 && r.c1f.includes('lupe'), 'el director no tiene su aumento: ' + JSON.stringify(r));
  afirmar(r.fin && r.eq.camioneta === 3 && !r.eq.flota && r.eq.hidro && r.lg === 'B', 'la llegada al puerto no es la esperada: ' + JSON.stringify(r));
  afirmar(await p.evaluate(() => /Puerto Fritanga/.test(document.querySelector('.meta-final').innerText)), 'la cabecera no habla de Puerto Fritanga');
  const t = await jugarNoche(p, { cocina: 'cafe' });
  afirmar(/Dividendos de Ciudad Comal \(dirige Lupe\)/.test(t.texto), 'no llegaron los dividendos al parte');
  await p.evaluate(() => __hc.pantallaCamioneta()); await p.click('[data-tab="noche"]');
  await p.click('#viajar'); await p.click('#siViajar');
  const v = await p.evaluate(() => ({ c: __hc.ciudad(), d: __hc.S.dinero, f: __hc.S.fijos, carta: !!document.querySelector('#comprador') }));
  afirmar(v.c === 1 && Math.abs(v.d - 25500) <= 300 && v.f.includes('lupe') && !v.carta, 'volver a Ciudad Comal no funcionó: ' + JSON.stringify(v));
  const almacen = await p.evaluate(() => Object.keys(localStorage).map(k => k + ':' + localStorage.getItem(k).length).join(' '));
  await p.reload(); await p.waitForSelector('#continuar'); await p.click('#continuar'); await p.waitForSelector('#salir');
  afirmar(await p.evaluate(() => __hc.ciudad() === 1 && __hc.COMPANEROS.lupe.sueldo === 200), 'tras recargar se perdió la ciudad o el aumento: ' + await p.evaluate(() => JSON.stringify([__hc.ciudad(), __hc.COMPANEROS.lupe.sueldo, __hc.S.aumentos, __hc.S.noche])) + ' · antes: ' + almacen + ' · después: ' + await p.evaluate(() => Object.keys(localStorage).map(k => k + ':' + localStorage.getItem(k).length).join(' ')));
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
  afirmar(r.beto === 140 && r.chuy > 0 && r.v.restan === 30 && r.v.total === valor && r.v.porNoche === Math.round((valor * .4 + r.v.caja) / 300) * 10 && !r.viaje, 'aumentos o pagos mal: ' + JSON.stringify(r));
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
  await p.evaluate(() => __hc.pantallaCamioneta()); await p.click('[data-tab="taller"]');
  afirmar(await p.evaluate(() => document.querySelectorAll('.pared-beto span').length === 1), 'la pared del taller no muestra la huella');
  // sin Beto no hay huella
  await p.click('[data-tab="noche"]'); await p.evaluate(() => { __hc.S.hoy.comp = 'lupe'; });
  await jugarNoche(p, { cocina: 'cafe', durante: () => { const z = __hc.Z.find(z => z.id === 'campana'); z.sfs.forEach(s => s.d.fill(0)); __hc.pintarHud(); } });
  afirmar(await p.evaluate(() => __hc.S.huellas.length === 1), 'apareció una huella sin Beto');
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('objetos con historia: se tocan en la preparación y cambian en la siguiente visita', async () => {
  const p = await abrir(partida());
  const visita = async () => {
    await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('cafe'); o.nombre = 'Café La Esquina'; o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
    await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
    return p.evaluate(() => ({ n: document.querySelectorAll('.marca.recuerdo').length, rot: __hc.piezas.recuerdos.map(r => +r.mesh.rotation.z.toFixed(2)) }));
  };
  let v = await visita();
  afirmar(v.n === 3 && v.rot[0] !== 0, 'no aparecen los 3 objetos torcidos: ' + JSON.stringify(v));
  await p.evaluate(() => document.querySelector('.marca.recuerdo').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await p.waitForTimeout(2500);
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
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('burger'); o.firmado = true; o.pedido = null; o.duelo = true; o.eventos = []; o.ayud = 0; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
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
  await p.waitForFunction(() => __hc.M.duelo.animo === 'confiado', null, { timeout: 20000 });
  await p.evaluate(() => { __hc.M.duelo.prog = .99; });
  await p.waitForFunction(() => __hc.M.duelo.ganador === 'el', null, { timeout: 20000 });
  await terminarDuelo(p); await p.waitForSelector('.nota-grande', { timeout: 60000 });
  const t = await p.evaluate(() => document.querySelector('#pantalla').innerText);
  afirmar(/Duelo perdido · \d–2/i.test(t) && !/Apuesta/.test(t) && /la mitad/.test(t), 'el parte del duelo perdido no es correcto: ' + (t.match(/Duelo[^\n]*\n?[^\n]*/) || [t.slice(0, 200)])[0]);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('de arriba abajo: el ducto escurre sobre la campana limpia, y cada suciedad suena distinto', async () => {
  const p = await abrir(partida({ compPref: 'solo', aj: { asist: true, sonido: true, ahorro: true } }));
  await jugarNoche(p, { cocina: 'burger', durante: () => {
    const Z = __hc.Z, M = __hc.M, ic = Z.findIndex(z => z.id === 'campana'), id = Z.findIndex(z => z.id === 'ducto'), c = Z[ic];
    const r = {};
    // campana sucia: trabajar el ducto no la toca
    __hc.irZona(id); const m0 = __hc.micras(c); for (let i = 0; i < 5; i++) __hc.escurrirDucto(1.3); r.sucia = __hc.micras(c) === m0;
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
  afirmar(r.sucia && r.mancha > 0 && r.aviso && r.tope === 8 && r.enCampana === 0 && r.vacio && r.audio, 'el escurrido o los sonidos no funcionan: ' + JSON.stringify(r));
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
  r = await p.evaluate(() => { const out = { resenas: 0, cartel: false, primer: 0 }; for (let i = 0; i < 12; i++) { __hc.S.hoy = null; __hc.S.cartel = null; delete __hc.S.primerDuelo; __hc.pantallaCamioneta(); const H = __hc.S.hoy; if (/Reseña|oyente|En redes/.test(H.avisos.join(' '))) out.resenas++; if (__hc.S.cartel) out.cartel = true; if (H.ordenes.some(o => o.primerDuelo)) out.primer++; } return out; });
  afirmar(r.resenas >= 1 && r.cartel && r.primer === 12, 'no salen las reseñas, el cartel o el primer duelo: ' + JSON.stringify(r));
  await p.evaluate(() => { __hc.S.cartel = 21; __hc.pantallaCamioneta(); });
  await p.click('#quitarCartel');
  afirmar(await p.evaluate(() => !__hc.S.cartel && !document.querySelector('#quitarCartel')), 'no se pudo quitar el cartel');
  r = await p.evaluate(() => ({ ico: document.querySelectorAll('.ico-cocina').length, caras: document.querySelectorAll('.cara svg').length, primer: /El Cuñado lo quiere/.test(document.body.innerText) }));
  afirmar(r.ico >= 2 && r.caras >= 3, 'faltan iconos de cocina o caras: ' + JSON.stringify(r));
  // el primer duelo empieza con su escena, sin apuesta
  await p.evaluate(() => { const H = __hc.S.hoy; const i = H.ordenes.findIndex(o => o.primerDuelo); H.sel = i; H.ordenes[i].firmado = true; H.ordenes[i].eventos = []; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
  await p.waitForFunction(() => document.querySelector('.carta[role=dialog]'), null, { timeout: 90000 });
  const t = await p.evaluate(() => document.querySelector('.carta[role=dialog]').innerText);
  afirmar(/camioneta roja ya está estacionada/.test(t) && !/apuesto/.test(t), 'el primer duelo no tiene su escena: ' + t);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('tutorial compacto y barras de progreso de las zonas', async () => {
  const p = await abrir(partida({ fase: 'aprendiz', etapa: 0, empresa: null, noche: 1, compPref: 'beto', fijos: [], hoy: null }));
  await p.evaluate(() => { const H = __hc.S.hoy; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
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
  await p.click('[data-tab="taller"]');
  afirmar(await p.evaluate(() => document.querySelectorAll('[data-capricho]').length === 4), 'no salen los caprichos en el taller');
  for (const id of ['casa', 'tigres', 'radio', 'taqueria']) { await p.click('[data-tab="taller"]'); await p.click(`[data-capricho="${id}"]`); await p.click('#volverCap'); }
  let r = await p.evaluate(() => ({ d: __hc.S.dinero, c: Object.keys(__hc.S.compras), rep: __hc.S.rep, album: __hc.S.album.length }));
  afirmar(r.d === 80000 - 77000 && r.c.length === 4 && r.rep >= 43 && r.album >= 4, 'los caprichos no se cobraron o no hicieron efecto: ' + JSON.stringify(r));
  await p.evaluate(() => { __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  afirmar(await p.evaluate(() => __hc.S.hoy.ordenes.some(o => o.origen === 'Radio')), 'el programa de Don Rigo no trae un trabajo más');
  await p.evaluate(() => { __hc.S.noche = 28; }); await p.click('[data-tab="noche"]');
  const t = await jugarNoche(p, { cocina: 'cafe' });
  afirmar(/cenas en la taquería de Beto/.test(t.texto) && /de tu casa \(semanal\)/.test(t.texto), 'el parte no refleja la casa o la taquería');
  // inversiones (camino B, ya en el puerto): se pagan con la caja de Ciudad Comal y suben los dividendos
  await p.evaluate(() => { const S = __hc.S; S.legado = { camino: 'B', noche: 20, director: { n: 'Lupe', comp: 'lupe' }, mano: { n: 'Beto', comp: 'beto' } }; __hc.viajar(2, { empresa: { nombre: 'Puerto', color: '#2e9e5b' }, etapa: 1, rep: 10, dinero: 3000, clientes: [], perdidos: [], cuadrilla: [], candidatos: [], fijos: ['beto'], compPref: 'beto', abierta: S.noche, hoy: null, eq: { camioneta: 2 } }); S.ciudades[1].dinero = 20000; __hc.pantallaCamioneta(); });
  await p.click('[data-tab="taller"]'); await p.click('[data-invertir="flota"]');
  r = await p.evaluate(() => ({ c1: __hc.S.ciudades[1].dinero, d: __hc.S.dinero, inv: __hc.S.legado.inversiones }));
  afirmar(r.c1 === 10000 && r.d === 3000 && r.inv.flota, 'la inversión no se pagó con la caja de Ciudad Comal: ' + JSON.stringify(r));
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('duelo que termina antes de arrancar el marcador', async () => {
  const p = await abrir(partida({ compPref: 'solo' }));
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('burger'); o.firmado = true; o.pedido = null; o.duelo = true; o.eventos = []; o.ayud = 0; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  await p.evaluate(() => { const M = __hc.M; __hc.Z.forEach(z => z.sfs.forEach(s => s.d.fill(0))); M.t = M.dur * .5; M.fase = 'turno'; __hc.terminarTurno(); });
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

caso('soplete y gel: cada uno con su ventaja y su punto débil', async () => {
  const p = await abrir(partida({ etapa: 2, compPref: 'solo', eq: { rasqueta: 2, hidro: true, camioneta: 2, flota: 0, soplete: true, gel: true } }));
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('asador'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
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
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('burger'); o.firmado = true; o.pedido = null; o.duelo = true; o.eventos = []; o.ayud = 0; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; H.saga = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
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
  afirmar(await p.evaluate(() => document.querySelectorAll('[data-despues]').length === 5), 'no salen las opciones de después del turno');
  await p.click('[data-despues="mama"]');
  r = await p.evaluate(() => ({ ...__hc.S.yo, d: __hc.S.dinero, card: !!document.querySelector('[data-despues]'), linea: !!document.querySelector('.yo-linea') }));
  afirmar(!r.pendiente && r.descanso === 90 && !r.card && r.linea, 'visitar a mamá no hizo efecto: ' + JSON.stringify(r));
  // cansado: menos fuerza en el turno
  await p.evaluate(() => { __hc.S.yo.descanso = 10; });
  await p.evaluate(() => { const H = __hc.S.hoy; const o = __hc.genOrden('cafe'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; H.saga = null; __hc.pantallaCamioneta(); document.querySelector('#salir').click(); });
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  afirmar(await p.evaluate(() => Math.abs(__hc.M.vida - 1.03 * .8) < .001), 'el cansancio no baja la fuerza: ' + await p.evaluate(() => __hc.M.vida));
  await p.evaluate(() => { const M = __hc.M; __hc.Z.forEach(z => z.sfs.forEach(s => { s.d.fill(0); s.pol.fill(.8); })); M.t = M.dur * .6; M.fase = 'turno'; __hc.terminarTurno(); });
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  // si sales sin decidir, duermes
  await p.evaluate(() => { __hc.S.yo.salud = 10; __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  const pend = await p.evaluate(() => !!__hc.S.yo.pendiente);
  await p.evaluate(() => { const H = __hc.S.hoy; H.gripa = null; const o = __hc.genOrden('cafe'); o.firmado = true; o.pedido = null; o.duelo = false; o.eventos = []; H.ordenes = [o]; H.sel = 0; H.dia = null; H.historia = null; H.saga = null; __hc.pantallaCamioneta(); });
  afirmar(await p.evaluate(() => !!document.querySelector('[data-gripa="doctor"]')), 'no sale la tarjeta de la gripa');
  await p.evaluate(() => document.querySelector('#salir').click());
  await p.waitForFunction(() => __hc.M && __hc.M.escena === 0, null, { timeout: 90000 });
  r = await p.evaluate(() => ({ pend: __hc.S.yo.pendiente, ult: __hc.S.yo.ultimo.id, gripa: __hc.S.hoy.gripa }));
  afirmar(pend && !r.pend && r.ult === 'dormir' && r.gripa === 'trabajar', 'salir sin decidir no te mandó a dormir: ' + JSON.stringify(r));
  await p.evaluate(() => { const M = __hc.M; __hc.Z.forEach(z => z.sfs.forEach(s => { s.d.fill(0); s.pol.fill(.8); })); M.t = M.dur * .6; M.fase = 'turno'; __hc.terminarTurno(); });
  await p.waitForSelector('.nota-grande', { timeout: 60000 });
  // muebles: la cama recupera más
  await p.evaluate(() => { __hc.S.hoy = null; __hc.pantallaCamioneta(); });
  await p.click('[data-tab="cuadrilla"]'); await p.click('[data-mueble="cama"]');
  const antes = await p.evaluate(() => __hc.S.yo.descanso);
  await p.click('[data-tab="noche"]'); await p.click('[data-despues="dormir"]');
  const desp = await p.evaluate(() => __hc.S.yo.descanso);
  afirmar(await p.evaluate(() => !!__hc.S.yo.muebles.cama) && desp - antes >= 42 + 15 - 1 || desp === 100, 'la cama no ayuda a descansar: ' + antes + ' → ' + desp);
  afirmar(!p.errores.length, p.errores[0]); await p.close();
});

if (require.main === module) correr(process.argv[2]).then(mal => process.exit(mal ? 1 : 0));
module.exports = { correr };
