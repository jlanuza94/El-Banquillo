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
import { finishRound, friendlyOpts, newSeason, playFriendly, playMatch, simRun, simState, simToEnd } from '../src/season';
import { takeJob } from '../src/career';
import { answerPress } from '../src/club';
import { exportCode, importCode, loadAsync, loadSlot, deleteSlot, pack, saveNow, slots, MAX_SLOTS } from '../src/persist';
import { render, shell } from '../src/views/common';
import { matchView } from '../src/views/match';
import { modalView } from '../src/views/modals';
import { seasonLabel, uLg } from '../src/state';
import '../src/events';
import { hireStaff, migrateCrew } from '../src/staff';
import { queueScout, scoutingWeekly, seen } from '../src/scouting';
import { squad } from '../src/state';

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
  S.view = 'staff'; render();
  ok(app.textContent.includes('Director deportivo'), 'pantalla del cuerpo técnico');
  { const keep = S.crew; S.crew = undefined; S.staff = { pre: 4, fis: 3 }; migrateCrew();
    ok(S.crew.filter(m => m.role === 'ent').length === 3 && S.crew.filter(m => m.role === 'fis').length === 1, 'migración del cuerpo técnico antiguo'); S.crew = keep; }

  for (let s = 0; s < seasons; s++) {
    simRun('season', false);
    await until(() => !simState);
    if (S.jobless) { console.log('     (despedido: se acepta la primera oferta)'); takeJob(S.jobless.offers[0]); }
    const pos = table(uLg()).findIndex(r => r.id === S.user) + 1;
    const fx = S.fixtures.flat(2).filter(f => f.played);
    const gpm = fx.reduce((a, f) => a + f.hg + f.ag, 0) / fx.length;
    console.log(`     temporada ${seasonLabel()}: puesto ${pos}, presupuesto ${money(S.budget)}, ${gpm.toFixed(2)} goles por partido`);
    ok(gpm > 2 && gpm < 4, 'goles por partido razonables');
    S.modal = null; S.view = 'inicio'; render(); newSeason();
    ok(S.week === 0, 'empieza la temporada siguiente');
  }

  // Guardado en IndexedDB y varias partidas
  saveNow(); await flush();
  const week = S.week, club = S.teams[S.user].name;
  const loaded = await loadAsync();
  ok(loaded && loaded.slot === 1 && loaded.week === week && loaded.teams[loaded.user].name === club, 'la partida se guarda y se carga');
  ok(slots.length === 1, 'aparece en «Tus partidas»');
  setS(null); dirty(); render();
  ok(app.textContent!.includes(club), 'la pantalla de inicio muestra la partida guardada');
  pickTeam(S.teams.find(t => t.id !== team)!.id); saveNow(); await flush();
  ok(S.slot === 2 && slots.length === 2, 'segunda partida en otra ranura');
  ok((await loadSlot(1))?.teams[team] && (await loadSlot(1)).user === team, 'la primera partida sigue intacta');
  await deleteSlot(2);
  ok(slots.length === 1 && !(await loadSlot(2)), 'se puede borrar una partida');
  ok(MAX_SLOTS === 5, 'hasta 5 partidas');

  const code = exportCode();
  ok(importCode(code) === true, 'copia de seguridad: exportar e importar');
  const kb = Math.round(pack().length / 1024);
  ok(kb < 6000, `tamaño del guardado: ${kb} KB`);
  console.log(`Terminado en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
