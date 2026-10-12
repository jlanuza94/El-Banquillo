// Prueba automática de El Banquillo (sin navegador real).
// Juega partidos, recorre todas las pantallas, simula temporadas enteras y comprueba el guardado
// en varias partidas (IndexedDB) y la copia de seguridad.
//   npm test                         una temporada
//   node dist-test/test.cjs 3        tres temporadas (después de npm test)
import './dom-stub';
// @ts-nocheck
import { S, setS, dirty } from '../src/state';
import { money } from '../src/core';
import { pickTeam } from '../src/world';
import { table } from '../src/tactics';
import { finishRound, friendlyOpts, newSeason, playFriendly, playMatch, simLoop, simRun, simState, simToEnd } from '../src/season';
import { takeJob } from '../src/career';
import { answerPress } from '../src/club';
import { exportCode, importCode, loadAsync, loadSlot, deleteSlot, pack, unpack, saveNow, slots, MAX_SLOTS } from '../src/persist';
import { render, shell } from '../src/views/common';
import { boot } from '../src/boot';
import { matchView } from '../src/views/match';
import { modalView } from '../src/views/modals';
import { seasonLabel, uLg } from '../src/state';
import '../src/events';
import { hireStaff, migrateCrew } from '../src/staff';
import { queueScout, scoutingWeekly, seen } from '../src/scouting';
import { lgName, squad, T } from '../src/state';
import { editClub, editNames, editPlayer, exportClubsCSV, exportMod, importData } from '../src/mods';
import { quickWeekly, search, suggestions } from '../src/quick';
import { ylTable } from '../src/youth';
import { agentFee, askPrice, makeBid, makeTerms, refuses, sell } from '../src/market';
import { r3 } from '../src/core';
import { deadlineDeals, rumoursWeekly, sellOnIn } from '../src/market2';
import { agentOf, contacts, trackLoans, vestMult } from '../src/connected';
import { addAffiliate, affCandidates, affiliates, bankWeekly, createFilial, filial, fixFilialMoves, fromFilial, moveBudget, takeBankLoan, toFilial, wageCheck } from '../src/clubplus';
import { acceptLoanOut, makeLoanOut } from '../src/contracts';
import { renState } from '../src/contracts';
import { devSeason, rateOld, signWage } from '../src/players';
import { addPair, mentorWeekly, pairs, removePair } from '../src/mentor';
import { PL } from '../src/state';
import { fixLineup } from '../src/tactics';
import { TUNE, createMatch, liveRatings, quickMatch, step } from '../src/engine';
import { mkTie } from '../src/competitions';
import { setFormation, teamPower, userRoles } from '../src/tactics';
import { learnTactic, loadPlan, planFam, planInMatch, savePlan } from '../src/plans';

const seasons = +(process.argv[2] || 1);
let fails = 0;
const ok = (cond: unknown, msg: string) => { if (!cond) { console.error('FALLO:', msg); fails++; } else console.log('ok  ', msg); };
const until = (fn: () => boolean) => new Promise<void>(r => { const iv = setInterval(() => { if (fn()) { clearInterval(iv); r(); } }, 10); });
const flush = () => new Promise(r => setTimeout(r, 50));
const app = document.getElementById('app')!;

(async () => {
  const t0 = Date.now();
  setS(null); dirty(); render();
  ok(S.teams.length === 860, 'se crean 860 clubes');
  ok(app.textContent!.includes('Empieza tu carrera'), 'pantalla de inicio');
  const team = S.teams.filter(t => S.leagues[t.lg].c === 0 && S.leagues[t.lg].lv === 4).sort((a, b) => b.rep - a.rep)[0].id;
  pickTeam(team);
  ok(S.user === team && S.slot === 1, 'se elige club (partida 1)');
  ok(app.querySelector('nav, .side, .bnav') !== null, 'se pinta el menú');

  playFriendly(friendlyOpts()[0]); simToEnd(); matchView(); finishRound();
  ok(S.pre.left === 2, 'amistoso de pretemporada');
  S.pre.left = 0; S.sponsor = S.spOffers[0];

  for (let i = 0; i < 3; i++) { playMatch(); matchView(); simToEnd(); finishRound(); modalView(); if (S.press) answerPress(0); }
  for (const v of ['inicio', 'plantilla', 'tacticas', 'entreno', 'cantera', 'calendario', 'liga', 'copas', 'mercado', 'club', 'historia']) {
    S.view = v; shell(); render();
  }
  ok(true, 'todas las pantallas se pintan sin errores');
  // Un clic real recorre events.ts y morphdom
  S.view = 'inicio'; S.modal = null; render();
  const btn = app.querySelector('[data-a="view"][data-v="plantilla"]') as HTMLElement | null;
  btn?.click();
  ok(!btn || S.view === 'plantilla', 'el menú responde a los clics');
  ok(S.inbox.length > 0 && S.inbox.some(m => !m.read), 'la bandeja de entrada recibe mensajes');
  S.view = 'buzon'; render();
  const first = app.querySelector('[data-a="mail-open"]') as HTMLElement;
  first.click();
  ok(S.mailSel && S.inbox.find(m => m.id === S.mailSel).read === 1 && app.querySelector('.mdetail h2'), 'abrir un mensaje lo marca como leído');
  for (const m of S.inbox.filter(m => m.act)) { S.mailSel = m.id; render(); }
  ok(true, 'los mensajes con botones se pintan');
  ok(S.crew.length === 3 && S.staffPool.length === 8, 'cuerpo técnico inicial y candidatos');
  const cand = S.staffPool.find(m => m.role === 'dd');
  hireStaff(cand.id);
  ok(S.crew.some(m => m.id === cand.id), 'se contrata un director deportivo');
  {
    const far = Object.values(S.players).find(p => p.team !== null && S.leagues[S.teams[p.team].lg].c !== S.leagues[S.teams[S.user].lg].c && p.age > 24);
    const sn = seen(far);
    ok(!sn.exact && sn.ovr[0] <= far.ovr && far.ovr <= sn.ovr[1] && Object.keys(far.at).every(k => sn.at[k][0] <= far.at[k] && far.at[k] <= sn.at[k][1]), 'un jugador lejano se ve con rangos que contienen su valor real');
    ok(JSON.stringify(seen(far)) === JSON.stringify(sn), 'los rangos no cambian al repintar');
    ok(seen(squad(S.user)[0]).exact, 'tus jugadores se ven exactos');
    ok(queueScout(far.id) === '', 'se pide un informe');
    const before = S.inbox.length; for (let i = 0; i < 4; i++) { S.week++; scoutingWeekly(); } S.week -= 4;
    ok(seen(far).exact && S.inbox.slice(0, S.inbox.length - before).some(m => m.subj.startsWith('Informe: ' + far.name)), 'llega el informe y el jugador pasa a conocerse');
    S.mk.tab = 'buy'; S.mk.c = 'ALL'; S.view = 'mercado'; render();
    ok(app.querySelector('.at.rng'), 'el mercado muestra rangos');
    S.modal = { type: 'ficha', id: far.id }; render(); S.modal = null;
  }
  {
    const t = S.teams[S.user], base = teamPower(t.lineup, t.formation).ovr, withRoles = teamPower(t.lineup, t.formation, null, null, 1, userRoles()).ovr;
    ok(Math.abs(base - withRoles) < 3, `los roles por defecto no cambian mucho la fuerza (${(base/10).toFixed(2)} → ${(withRoles/10).toFixed(2)})`);
    const keep = t.formation; setFormation('3-5-2'); ok(t.roles.length === 11, 'roles al cambiar de formación'); setFormation(keep);
    S.view = 'tacticas'; render(); ok(app.querySelector('[data-role]'), 'panel de roles en tácticas');
  }
  {
    // Mismos partidos (IA contra IA, sin tu equipo) con y sin las novedades del motor, para que no cambie el número de goles.
    const N = +(process.env.NLIVE || 700), pairs = [];
    const ts = S.teams.filter(t => t.id !== S.user);
    for (let i = 0; i < N; i++) { const a = ts[(i * 7919) % ts.length], b = S.teams.filter(t => t.lg === a.lg && t.id !== a.id && t.id !== S.user)[i % 18]; pairs.push([a.id, b.id]); }
    const run = (tune) => { Object.assign(TUNE, tune); let g = 0, co = 0, xgs = 0, fo = 0, cg = 0;
      for (const [h, a] of pairs) { S.fr.push(mkTie(h, a)); const m = createMatch({ k: 'fr', i: S.fr.length - 1 }); m.auto = true; while (!m.done) step(m);
        g += m.score.h + m.score.a; co += m.st.h.co + m.st.a.co; xgs += m.st.h.xg + m.st.a.xg; fo += m.st.h.fo + m.st.a.fo; }
      S.fr = []; return { g: g / N, co: co / N, xg: xgs / N, fo: fo / N }; };
    const def = { ...TUNE }, old = run({ corner: 0, open: 1 }), now = run(def); Object.assign(TUNE, def);
    console.log(`     motor: antes ${old.g.toFixed(2)} goles/partido, ahora ${now.g.toFixed(2)} (xG ${now.xg.toFixed(2)}, ${now.co.toFixed(1)} córners, ${now.fo.toFixed(1)} faltas)`);
    ok(Math.abs(now.g - old.g) < .3 && now.co > 6 && now.co < 14 && Math.abs(now.xg - now.g) / now.g < .3, 'el partido en directo mantiene los goles y da estadísticas razonables');
    // y un partido tuyo en directo con consejos del segundo
    T(S.user).oi = { ban: true, dur: true }; S.fr.push(mkTie(S.user, pairs[0][0])); const m = createMatch({ k: 'fr', i: S.fr.length - 1 }); m.auto = true; let tips = 0;
    while (!m.done) { step(m); if (m.adv && m.adv.min === m.min) tips++; } S.fr = []; T(S.user).oi = {};
    ok(tips >= 3 && Object.keys(liveRatings(m)).length >= 22, `consejos del segundo (${tips}) y notas en directo`);
  }
  {
    // Mercado: plazos, intercambio y % de futura venta
    const realBudget = S.budget, realCap = S.wageCap; S.budget = 500; S.wageCap = 99; const b0 = S.budget;
    const myLg = S.teams[S.user].lg, cands = Object.values(S.players).filter(p => p.team !== null && p.team !== S.user && S.teams[p.team].lg === myLg && !p.loan && p.age < 30 && !refuses(p));
    const target = cands[0], from = target.team, swapP = squad(S.user).filter(p => !p.loan).sort((a, b) => a.value - b.value)[0];
    const amt = askPrice(target) * 1.5; makeBid(target.id, amt, { inst: 3, swap: swapP.id });
    ok(S.neg[target.id].agreed != null, 'oferta a plazos con jugador incluido aceptada' + (S.neg[target.id].agreed != null ? '' : ': ' + S.neg[target.id].msg));
    const D = renState; void D;
    makeTerms(target.id, 'buy', { w: signWage(target) * 3, yrs: 2, role: 'ti', cl: target.value * 3, bonus: 0 });
    ok(target.team === S.user && swapP.team === from && S.debts.length === 1 && S.debts[0].left === 2, 'fichaje completado: plazos pendientes y el otro jugador se va');
    ok(Math.abs(b0 - S.budget - (r3(amt / 3) + agentFee(target, amt))) < .01, 'solo se paga el primer plazo (y la comisión del agente)');
    S.offers[target.id] = { team: from, amount: 2, incoming: true }; S.view = 'inicio';
    S.week = 3; sell(target.id, true);
    ok(target.team === from && target.son && target.son.team === S.user, 'venta con % de futura venta');
    const bb = S.budget; sellOnIn(target, 10); ok(Math.abs(S.budget - bb - 1.5) < .01 && !target.son, 'cobras el % cuando lo vuelven a vender');
    S.week = 4; deadlineDeals(); const dk = Object.keys(S.deals || {});
    ok(dk.every(id => askPrice(PL(id)) === S.deals[id]), `gangas del día de cierre (${dk.length})`); S.week = 3; S.deals = {};
    for (let i = 0; i < 30; i++) rumoursWeekly();
    ok(Object.keys(S.interest).length > 0, 'rumores de interés por tus jugadores');
    fixLineup(); S.budget = realBudget; S.wageCap = realCap; S.debts = [];
  }
  { const a = squad(S.user)[0], b = Object.values(S.players).find(p => p.team !== S.user && p.team !== null);
    S.modal = { type: 'cmp', a: a.id, b: b.id }; render(); ok(app.querySelector('.cmpgrid'), 'comparador de jugadores'); S.modal = null; }
  { // misma partida guardada → mismos resultados
    const saved = pack(), run = () => { setS(unpack(saved)); dirty(); const o = []; for (let i = 0; i < 10; i++) { S.fr.push(mkTie(S.teams[i].id, S.teams[i + 1].id)); const m = quickMatch({ k: 'fr', i: S.fr.length - 1 }); o.push(m.score.h + '-' + m.score.a); } return o.join(','); };
    const a = run(), b = run(); ok(a === b, 'motor con semilla: la misma partida da los mismos resultados'); setS(unpack(saved)); dirty(); S.fr = [];
  }
  { const y = squad(S.user).find(p => p.age <= 21) || squad(S.user)[0]; const mt = squad(S.user).find(p => p.age >= 27); if (y.age <= 21 && mt) { mt.per = 'pro'; mt.at.lid = 8; const e = addPair(y.id, mt.id); ok(e === '' && pairs().length === 1, 'tutelaje: se asigna un tutor'); for (let i = 0; i < 200; i++) mentorWeekly(); ok(y.per === 'pro', 'tutelaje: el joven adopta el carácter del tutor'); removePair(y.id); } }
  { let boom = 0, stag = 0; const ps = Object.values(S.players).filter(p => p.age <= 21).slice(0, 2000); ps.forEach(p => { const c = JSON.parse(JSON.stringify(p)); c.st = { mi: 2000 }; const e = devSeason(c, {}); if (e === 'boom') boom++; if (e === 'stag') stag++; }); ok(boom > 0 && stag > 0, `desarrollo: hay jóvenes que explotan (${boom}) y que se estancan (${stag}) de ${ps.length}`); }
  { const t = T(S.user), f0 = t.formation; savePlan('A'); setFormation('3-5-2'); T(S.user).tac = { ...T(S.user).tac, est: 'pos' }; savePlan('B'); loadPlan('A');
    ok(t.formation === f0 && t.plans.B.formation === '3-5-2', 'tácticas guardadas A y B');
    S.fr.push(mkTie(S.user, S.teams.find(x => x.id !== S.user).id)); const m = createMatch({ k: 'fr', i: S.fr.length - 1 }); m.auto = true; for (let i = 0; i < 30; i++) step(m);
    ok(planInMatch(m, 'B') && m.f[m.us] === '3-5-2' && m.lu[m.us].filter(Boolean).length >= 10 && m.tac[m.us].est === 'pos', 'cambio de táctica en pleno partido'); while (!m.done) step(m); S.fr = [];
    const before = planFam(t.tac); learnTactic(t.tac); ok(planFam(t.tac) > before, 'el equipo aprende la táctica que usa'); render(); S.view = 'tacticas'; render(); ok(app.textContent.includes('Jugadas ensayadas'), 'pantalla de tácticas con planes y jugadas'); }
  { // sistemas conectados
    const ags = {}; Object.values(S.players).slice(0, 3000).forEach(p => { const a = agentOf(p); ags[a.n] = (ags[a.n] || 0) + 1; });
    ok(Object.keys(ags).length === 4, 'agentes: ' + Object.entries(ags).map(([k, v]) => k + ' ' + v).join(', '));
    const dd = S.crew.find(m => m.role === 'dd'); ok(dd && contacts().length >= 1, 'el director deportivo tiene contactos en ' + contacts().length + ' país(es)');
    const vm = vestMult(); ok(vm >= .96 && vm <= 1.02, `el vestuario afecta al rendimiento (${((vm - 1) * 100).toFixed(1)}%)`);
    // cesión con objetivo: el club le da minutos
    const cand = squad(S.user).filter(p => !p.loan && p.pos !== 'POR').sort((a, b) => a.ovr - b.ovr)[0], wk0 = S.week; S.week = 2;
    const lo = makeLoanOut(cand.id); if (!lo.none) { acceptLoanOut(cand.id, 'ti'); ok(cand.loan && cand.loan.obj === .6, 'cesión con objetivo de minutos');
      const tm = cand.team, opp = S.teams.find(t => t.lg === S.teams[tm].lg && t.id !== tm && t.id !== S.user);
      for (let i = 0; i < 6; i++) { S.fr.push(mkTie(tm, opp.id)); const m = quickMatch({ k: 'fr', i: S.fr.length - 1 }); m.ref = { k: 'lg' }; trackLoans(m); }
      S.fr = []; ok(cand.lmt === 6 && cand.lpj >= 3, `el club cumple: juega ${cand.lpj} de ${cand.lmt}`);
      cand.team = S.user; cand.loan = null; cand.lpj = cand.lmt = 0; }
    S.week = wk0; fixLineup();
  }
  { // editor y mods
    const t = T(S.user), oldName = t.name;
    ok(editClub(t.id, { name: 'Real Prueba', short: 'rpr', c1: '#112233', c2: '#ffffff', cs: 's' }) === '' && t.name === 'Real Prueba' && t.short === 'RPR' && t.cs === 's', 'editor: club');
    const p = squad(S.user)[0]; ok(editPlayer(p.id, { name: 'Lionel Prueba', tir: 10, age: 30 }) === '' && p.name === 'Lionel Prueba' && p.at.tir === 10, 'editor: jugador');
    editNames({ 0: 'Hispania' }, { [t.lg]: 'Liga Prueba' }); ok(lgName(t.lg) === 'Hispania · Liga Prueba', 'editor: nombres de liga y país');
    const mod = JSON.parse(exportMod(false)); mod.clubs[0].name = 'Club del Mod'; ok(importData(JSON.stringify(mod)).ok && S.teams[0].name === 'Club del Mod', 'mod JSON: exportar e importar');
    const csv = exportClubsCSV().replace(/^(\d+;[^;]*;[^;]*;)[^;]*/m, '$1Club CSV'); ok(importData(csv).ok && S.teams.some(x => x.name === 'Club CSV'), 'CSV de clubes: exportar, editar e importar');
    const pc = 'club;nombre;posicion;edad\n' + t.name + ';Nuevo Nombre;DC;24'; const r = importData(pc); ok(r.ok && squad(S.user).some(x => x.name === 'Nuevo Nombre'), 'CSV de jugadores sin id (por club y posición): ' + r.msg);
    S.view = 'editor'; for (const tb of ['club', 'pl', 'names', 'io']) { S.edTab = tb; S.edClub = S.user; S.edPl = p.id; render(); } ok(app.textContent.includes('Importar'), 'pantalla del editor');
    t.name = oldName; S.cNames = {}; S.lgNames = {};
  }
  { // búsqueda global y modo rápido
    const p = Object.values(S.players).find(x => x.team !== S.user && x.team !== null), q = p.name.split(' ')[1].slice(0, 4);
    const r = search(q); ok(r.pl.some(x => x.name.includes(q)), 'búsqueda global de jugadores');
    S.modal = { type: 'search' }; render(); const inp = document.getElementById('gsq'); inp.value = q; inp.dispatchEvent(new window.Event('input', { bubbles: true })); ok(document.getElementById('gsres').querySelector('[data-a=ficha]'), 'la búsqueda muestra resultados al escribir'); S.modal = null;
    S.mode = 'rapido'; S.press = { q: '¿?', o: [['Bien', {}], ['Mal', {}]] }; quickWeekly(); ok(!S.press && S.autoRot, 'modo rápido: el segundo responde a la prensa y rota'); render();
    ok(!document.querySelector('.side [data-v=analisis]'), 'modo rápido: menú simplificado'); S.mode = 'profundo';
    const sg = suggestions(3); ok(Array.isArray(sg.list), `sugerencias de fichajes (${sg.list.length} para ${sg.g})`);
  }
  S.view = 'staff'; render();
  ok(app.textContent.includes('Director deportivo'), 'pantalla del cuerpo técnico');
  { const keep = S.crew; S.crew = undefined; S.staff = { pre: 4, fis: 3 }; migrateCrew();
    ok(S.crew.filter(m => m.role === 'ent').length === 3 && S.crew.filter(m => m.role === 'fis').length === 1, 'migración del cuerpo técnico antiguo'); S.crew = keep; }

  for (let s = 0; s < seasons; s++) {
    if (S.jobless) { console.log('     (sin contrato: se acepta la primera oferta)'); takeJob(S.jobless.offers[0]); }
    simRun('season', false);
    await until(() => !simState);
    { const c = {}; S.inbox.filter(m => !m.read).forEach(m => { const k = m.cat + ':' + m.subj.replace(/[0-9€.,]+/g, '#').slice(0, 28); c[k] = (c[k] || 0) + 1; }); console.log('     no leídos: ' + Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => k + '×' + v).join(' | ')); }
    const fired = !!S.jobless;
    if (S.jobless) { console.log('     (despedido: se acepta la primera oferta)'); takeJob(S.jobless.offers[0]); }
    const pos = table(uLg()).findIndex(r => r.id === S.user) + 1;
    const fx = S.fixtures.flat(2).filter(f => f.played);
    const gpm = fx.reduce((a, f) => a + f.hg + f.ag, 0) / fx.length;
    { const ps = Object.values(S.players).filter(p => p.team !== null), avg = ps.reduce((a, p) => a + p.ovr, 0) / ps.length, top = ps.filter(p => S.leagues[S.teams[p.team].lg].lv === 0), at = top.reduce((a, p) => a + p.ovr, 0) / top.length; console.log(`     media de los jugadores: ${(avg / 10).toFixed(2)} (Primera ${(at / 10).toFixed(2)}), jóvenes ≤21: ${ps.filter(p => p.age <= 21).length}, ≥33: ${ps.filter(p => p.age >= 33).length}`); }
    console.log(`     temporada ${seasonLabel()}: puesto ${pos}, presupuesto ${money(S.budget)}, ${gpm.toFixed(2)} goles por partido`);
    ok(gpm > 2 && gpm < 4, 'goles por partido razonables');
    { const top = Object.values(S.players).filter(p => p.st && p.team !== null).sort((a, b) => b.st.g - a.st.g).slice(0, 5); console.log('     máximos goleadores (todas las comp.): ' + top.map(p => p.st.g + ' en ' + p.st.pj).join(', ')); }
    if (!fired) { const tb = ylTable(); ok(S.yl.round === S.yl.fx.length && tb.every(r => r.pj === 18) && S.academy.some(p => p.yst && p.yst.pj > 0), `liga sub-19 completa (tu sub-19: ${tb.findIndex(r => r.id === 'u') + 1}º)`);
      S.view = 'cantera'; render(); ok(app.textContent.includes('Liga sub-19'), 'panel de la liga sub-19'); }
    for (const tb of ['temp', 'part', 'jug', 'riv']) { S.anTab = tb; S.view = 'analisis'; render(); }
    ok(S.tl.length >= 30 && S.mlog.length > 0 && S.mlog[0].sh.length > 5 && Object.values(S.players).some(p => p.st && p.st.kp > 0 && p.st.tk > 0 && p.st.xg > 0), 'análisis: evolución de la temporada, informes con tiros y estadísticas avanzadas');
    S.modal = { type: 'mrep', i: 0 }; render(); ok(app.querySelector('.shotmap svg circle'), 'informe de partido con mapa de tiros'); S.modal = null;
    for (const tb of ['race', 'stats', 'xi', 'hist']) { S.awTab = tb; S.view = 'premios'; render(); }
    ok(app.textContent.includes('Palmarés'), 'pantalla de estadísticas y premios');
    S.modal = null; S.view = 'inicio'; render(); const na = (S.awards || []).length; newSeason();
    ok(S.awards.length === na + 1 && S.awards[na].ballon.length === 10 && S.awards[na].boot && S.awards[na].xi.filter(([, c]) => c).length >= 9, `premios de la temporada (Balón de Oro: ${S.awards[na].ballon[0].name})`);
    ok(S.week === 0, 'empieza la temporada siguiente');
    ok(Object.keys(S.coaches).length === S.teams.length - 1 && !S.coaches[S.user], 'cada club rival tiene entrenador con nombre');
    ok(Object.keys(S.chist).length > 800 && S.chist[S.user] && S.chist[S.user].s.length >= 1, 'historia de cada club');
    { const sacks = S.inbox.filter(m => /^(Destitución|Relevo) en/.test(m.subj)).length; console.log(`     relevos de entrenadores esta temporada: ${sacks}`); }
    S.modal = { type: 'club', id: S.user }; render(); ok(app.textContent.includes('Palmarés'), 'ficha de club con palmarés e historia'); S.modal = null;
  }

  // Guardado en IndexedDB y varias partidas
  saveNow(); await flush();
  const week = S.week, club = S.teams[S.user].name, me = S.user;
  const loaded = await loadAsync();
  ok(loaded && loaded.slot === 1 && loaded.week === week && loaded.teams[loaded.user].name === club, 'la partida se guarda y se carga');
  ok(slots.length === 1, 'aparece en «Tus partidas»');
  setS(null); dirty(); render();
  ok(app.textContent!.includes(club), 'la pantalla de inicio muestra la partida guardada');
  pickTeam(S.teams.find(t => t.id !== team)!.id); saveNow(); await flush();
  ok(S.slot === 2 && slots.length === 2, 'segunda partida en otra ranura');
  ok((await loadSlot(1))?.user === me, 'la primera partida sigue intacta');
  await deleteSlot(2);
  ok(slots.length === 1 && !(await loadSlot(2)), 'se puede borrar una partida');
  { // club: filial, afiliados, límite salarial y préstamos (con un club de 4ª para poder tener filial)
    setS(null); dirty(); render(); const pick4 = S.teams.find(t => S.leagues[t.lg].c === 0 && S.leagues[t.lg].lv === 3); pickTeam(pick4.id);
    ok(createFilial() === '' && filial() && S.leagues[filial().lg].lv === 4, 'se crea el filial en la última división');
    const young = squad(S.user).sort((a, b) => a.age - b.age)[0]; ok(toFilial(young.id) === '' && young.team === filial().id, 'un joven baja al filial'); ok(fromFilial(young.id) === '' && young.team === S.user, 'y vuelve a subir');
    // el filial queda 1º pero el primer equipo sigue en 4ª: no puede subir
    const tabs = S.leagues.map(L => table(L.id)); const bi = S.leagues.indexOf(S.leagues[filial().lg]); const b = tabs[bi].findIndex(r => r.id === filial().id); const tb = tabs[bi]; [tb[0], tb[b]] = [tb[b], tb[0]];
    const moves = []; S.leagues.forEach((L, i) => { if (L.lv > 0) tabs[i].slice(0, 3).forEach(r => moves.push([r.id, S.leagues.find(x => x.c === L.c && x.lv === L.lv - 1).id])); });
    const moves2 = moves.filter(m => m[0] !== S.user); moves.length = 0; moves.push(...moves2); // el primer equipo se queda en 4ª
    const fixed = fixFilialMoves(tabs, moves); ok(!fixed.some(m => m[0] === filial().id) && fixed.filter(m => S.leagues[m[1]].c === 0 && S.leagues[m[1]].lv === 3 && S.leagues[T(m[0]).lg].lv === 4).length === 3, 'el filial no puede subir a la división de su primer equipo (sube el siguiente)');
    const cap = S.wageCap; ok(wageCheck(cap * 2) !== '' && wageCheck(0.0001) === '', 'el límite salarial frena sueldos que no caben');
    S.budget = 50; ok(moveBudget(1) === '' && S.wageCap > cap, 'se puede pasar dinero de fichajes a sueldos');
    const b0 = S.budget; ok(takeBankLoan(0) === '' && S.budget > b0 && S.bank.length === 1, 'préstamo bancario'); const pay = bankWeekly(); ok(pay > 0 && S.bank[0].left === S.bank[0].yrs * 38 - 1, 'se devuelve cada semana');
    const aff = affCandidates()[0]; ok(addAffiliate(aff.id) === '' && affiliates().length === 1, 'club afiliado');
    S.view = 'club'; render(); ok(app.textContent.includes('Filial') && app.textContent.includes('Préstamos bancarios'), 'pantalla del club con filial, afiliados y presupuestos');
    S.pre.left = 0; await simLoop('season', false, { stopped: () => false, progress: () => {}, yield: async () => {} }); if (S.jobless) takeJob(S.jobless.offers[0]); else { S.modal = null; newSeason(); }
    ok(S.leagues.every(L => S.teams.filter(t => t.lg === L.id).length === 20), 'tras una temporada con filial, todas las ligas siguen teniendo 20 equipos');
    ok(!filial() || S.leagues[filial().lg].lv > S.leagues[T(S.user).lg].lv, 'y el filial sigue por debajo de su primer equipo');
    saveNow(); await flush(); await deleteSlot(S.slot);
  }
  ok(MAX_SLOTS === 5, 'hasta 5 partidas');

  { // una partida de la versión anterior (sin bandeja, cuerpo técnico, sub-19…) se convierte al cargarla
    const o = JSON.parse(pack()); for (const k of ['inbox', 'crew', 'staffPool', 'yl', 'know', 'scoutQ', 'awards', 'debts', 'interest', 'hot', 'deals']) delete o[k];
    const pf = o.pf, before = {}; o.pk.forEach(a => { a[pf.length] = a[pf.length].slice(0, 6); before['p' + a[0]] = null; });
    Object.values(S.players).forEach(p => { if (before[p.id] === null) before[p.id] = Math.round(rateOld(p.at, p.pos) * 10); });
    o.academy.forEach(p => { for (const k of ['cab', 'vis', 'col', 'dec', 'vel', 'res', 'lid', 'con', 'gra']) delete p.at[k]; });
    o.staff = { pre: 2, fis: 2 }; o.teams.forEach(t => { delete t.roles; delete t.oi; }); o.scouts.forEach(sc => { delete sc.jui; delete sc.jpo; delete sc.job; });
    boot(unpack(JSON.stringify(o)));
    ok(S.inbox.length > 0 && S.crew.length >= 3 && S.yl && S.scouts.every(sc => sc.jui), 'una partida antigua se actualiza al cargarla');
    const diffs = Object.values(S.players).filter(p => before[p.id] != null).map(p => Math.abs(p.ovr - before[p.id]));
    ok(Object.values(S.players).every(p => Object.keys(p.at).length === 15) && S.academy.every(p => p.at.cab != null) && diffs.reduce((a, b) => a + b, 0) / diffs.length < 1.5, `jugadores antiguos con 15 atributos y la misma media (diferencia media ${(diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(2)})`);
    for (const v of ['inicio', 'buzon', 'plantilla', 'tacticas', 'entreno', 'cantera', 'staff', 'mercado', 'premios', 'club']) { S.view = v; render(); }
    ok(true, 'y todas las pantallas funcionan con ella');
  }
  const code = exportCode();
  ok(importCode(code) === true, 'copia de seguridad: exportar e importar');
  const kb = Math.round(pack().length / 1024);
  ok(kb < 6000, `tamaño del guardado: ${kb} KB`);
  console.log(`Terminado en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
