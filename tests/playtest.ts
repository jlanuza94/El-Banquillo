// Prueba de juego completa: varias temporadas seguidas en distintos países, como si jugara una persona
// (el segundo toma las decisiones). Busca errores, bloqueos y cifras raras de resultados, economía y bandeja.
//   node dist-test/playtest.cjs [temporadas] [países separados por comas]
import './dom-stub';
// @ts-nocheck
import { S, T, LG, squad, uLg } from '../src/state';
import { seedRng } from '../src/core';
import { COUNTRIES } from '../src/data';
import { buildWorld, pickTeam } from '../src/world';
import { simLoop, newSeason, seasonSummary } from '../src/season';
import { takeJob } from '../src/career';
import { deleteSlot, pack, slots } from '../src/persist';
import { needsPO, poAdvance, setupPO } from '../src/playoffs';
import { applyResult, quickMatch } from '../src/engine';
import { mkTie } from '../src/competitions';
import { table } from '../src/tactics';
import { dateTxt, eventDays, seasonStart } from '../src/calendar';

const NS = +(process.argv[2] || 3), CODES = (process.argv[3] || 'ESP,BRA,MEX,USA,ING,ALE').split(',');
const t0 = Date.now(), problems: string[] = [];
const warn = (c: string, m: string) => { problems.push(`[${c}] ${m}`); console.log('   ⚠ ' + m); };
const med = (a: number[]) => { const v = a.slice().sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : 0; };
const noop = { stopped: () => false, progress: () => {}, yield: async () => {} };

(async () => {
 for (const code of CODES) {
  const c = COUNTRIES.findIndex(x => x.code === code); if (c < 0) continue;
  for (const x of [...slots]) await deleteSlot(x.id);
  const seed = 4000 + c; seedRng(seed); buildWorld(seed);
  const lowest = Math.max(...S.leagues.filter(L => L.c === c).map(L => L.lv));
  const cands = S.teams.filter(t => S.leagues[t.lg].c === c && S.leagues[t.lg].lv === Math.min(1, lowest));
  if (!cands.length) { warn(code, 'no hay clubes en ese país'); continue; }
  pickTeam(cands[3 % cands.length].id); S.pre.left = 0;
  console.log(`\n${COUNTRIES[c].n} · ${T(S.user).name} (${S.leagues[T(S.user).lg].lv + 1}ª) · empieza ${dateTxt(0, true)}`);
  for (let s = 0; s < NS; s++) {
   const ts = Date.now(), inbox0 = (S.inbox || []).length, cash0 = S.budget;
   try {
    await simLoop('season', false, noop);
    if (S.jobless) { console.log('   despedido: toma otro club'); takeJob(S.jobless.offers[0]); continue; }
    const sm = seasonSummary();
    let po = '';
    if (needsPO()) { setupPO(sm.tb, mkTie); let k = 0; while (S.po && !S.po.done && k++ < 5) poAdvance(quickMatch, applyResult, mkTie); po = S.po && S.po.done ? ` · ${S.po.n}: gana ${T(S.po.champ).name}` : ' · LIGUILLA SIN TERMINAR'; if (!S.po || !S.po.done) warn(code, 'la liguilla no termina'); }
    // cifras de la temporada
    const L = LG(uLg()), lgFx = S.fixtures[uLg()].flat().filter(f => f.played), goals = lgFx.reduce((a, f) => a + f.hg + f.ag, 0) / Math.max(1, lgFx.length);
    const homeW = lgFx.filter(f => f.hg > f.ag).length / Math.max(1, lgFx.length);
    const tb = table(uLg()), spread = tb[0].pts - tb[tb.length - 1].pts;
    const ai = S.teams.filter(t => t.id !== S.user && !t.parent), red = ai.filter(t => (t.cash ?? 0) < 0), deep = ai.filter(t => (t.cash ?? 0) < -5);
    const sizes = ai.map(t => squad(t.id).length), small = ai.filter(t => squad(t.id).length < 16).length, noGK = ai.filter(t => !squad(t.id).some(p => p.pos === 'POR')).length;
    const vals = Object.values(S.players).filter(p => p.team !== null).map(p => p.value).sort((a, b) => b - a);
    const mails = (S.inbox || []).length - inbox0, perWk = mails / Math.max(1, S.week);
    const ev = eventDays(), lastDay = ev[ev.length - 1];
    const secs = (Date.now() - ts) / 1000, size = pack().length / 1024;
    console.log(`  T${s + 1}: ${sm.pos}º de ${tb.length} (${sm.ok ? 'objetivo cumplido' : 'objetivo fallado'})${po} · ${goals.toFixed(2)} goles/partido · local gana ${(homeW * 100).toFixed(0)}% · diferencia 1º-último ${spread} pts`);
    console.log(`      economía IA: ${red.length} en rojo (${deep.length} muy hundidos) · quiebras acumuladas ${S.teams.reduce((a,t)=>a+(t.quiebras||0),0)} · con sanción ${S.teams.filter(t=>t.ded&&t.ded.s===S.seasonN).length} · libres ${Object.values(S.players).filter(p => p.team === null).length} · plantillas ${Math.min(...sizes)}-${Math.max(...sizes)} (med ${med(sizes)}) · <16: ${small} · sin portero: ${noGK} · jugador más caro €${vals[0].toFixed(1)}M`);
    {const P=Object.values(S.players),sz=k=>JSON.stringify(S[k]||'').length;console.log(`      tamaño: jugadores ${P.length} (en clubes ${P.filter(p=>p.team!==null).length}, libres ${P.filter(p=>p.team===null).length}) · campos: ${(()=>{const F={};P.forEach(p=>Object.entries(p).forEach(([k,v])=>{F[k]=(F[k]||0)+JSON.stringify(v===undefined?null:v).length+k.length+3;}));return Object.entries(F).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>k+' '+Math.round(v/1024)+'K').join(', ');})()} · claves grandes: ${Object.keys(S).map(k=>[k,sz(k)]).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>k+' '+Math.round(v/1024)+'KB').join(', ')}`);}
    console.log(`      tu club: presupuesto €${cash0.toFixed(2)}M → €${S.budget.toFixed(2)}M · confianza ${Math.round(S.mgr.conf)} · bandeja ${mails} mensajes (${perWk.toFixed(1)}/jornada) · última fecha ${dateTxt(lastDay, true)} · ${secs.toFixed(0)} s · guardado ${size.toFixed(0)} KB`);
    if (goals < 2 || goals > 3.6) warn(code, `goles por partido raros: ${goals.toFixed(2)}`);
    if (homeW < .33 || homeW > .58) warn(code, `ventaja local rara: ${(homeW * 100).toFixed(0)}%`);
    if (small) warn(code, `${small} clubes de la IA con menos de 16 jugadores`);
    if (noGK) warn(code, `${noGK} clubes sin portero`);
    ai.filter(t => !squad(t.id).some(p => p.pos === 'POR')).forEach(t => console.log('      sin portero:', t.name, LG(t.lg).c, LG(t.lg).lv, squad(t.id).length, t.parent != null ? 'filial' : '', squad(t.id).map(p => p.pos + (p.loan ? 'L' : '')).join(' ')));
    if (perWk > 9) warn(code, `demasiados mensajes en la bandeja: ${perWk.toFixed(1)} por jornada`);
    if (vals[0] > 400) warn(code, `precio disparado: €${vals[0].toFixed(0)}M`);
    if (!isFinite(S.budget)) warn(code, 'presupuesto no válido');
    if (size > 18000) warn(code, `partida guardada muy grande: ${size.toFixed(0)} KB`);
    newSeason();
    const st = seasonStart();
    if (!(st instanceof Date) || isNaN(+st)) warn(code, 'fecha de inicio no válida');
   } catch (e) { warn(code, `ERROR en la temporada ${s + 1}: ${e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e}`); break; }
  }
 }
 console.log(`\n${problems.length ? 'PROBLEMAS (' + problems.length + '):\n' + problems.join('\n') : 'SIN PROBLEMAS'}`);
 console.log(`Terminado en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})().catch(e => { console.error(e); process.exit(1); });
