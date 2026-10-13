// Banco de pruebas del motor: miles de partidos y varias temporadas para equilibrar con datos.
//   npm run bench                 10.000 partidos rápidos, 1.000 en directo y 6 carreras de 2 temporadas
//   node dist-test/bench.cjs 2000 200 2   (partidos rápidos, en directo, carreras)
import './dom-stub';
// @ts-nocheck
import { S, setS, dirty, T, LG, squad, uLg } from '../src/state';
import { rngState, setRngState, seedRng } from '../src/core';
import { buildWorld, pickTeam } from '../src/world';
import { createMatch, quickMatch, step } from '../src/engine';
import { mkTie } from '../src/competitions';
import { simLoop, newSeason, seasonSummary } from '../src/season';
import { takeJob } from '../src/career';
import { deleteSlot, pack, slots, unpack } from '../src/persist';
import { table } from '../src/tactics';
import { strength } from '../src/players';

const [NQ, NL, NC] = [+(process.argv[2] || 10000), +(process.argv[3] || 1000), +(process.argv[4] || 6)];
const t0 = Date.now();
const pct = (a: number, b: number) => (100 * a / Math.max(1, b)).toFixed(1) + '%';
const row = (k: string, v: unknown) => console.log('  ' + k.padEnd(34) + v);

seedRng(12345); buildWorld(12345);
// Un club cualquiera para tener partida (las carreras usan otros)
pickTeam(S.teams.find(t => S.leagues[t.lg].lv === 2)!.id);
S.fr = [];

function matches(n: number, live: boolean) {
  const r = { g: 0, h: 0, d: 0, a: 0, sh: 0, yc: 0, rc: 0, inj: 0, xg: 0, co: 0, dist: [0, 0, 0, 0, 0, 0, 0], blk: [0, 0, 0, 0, 0, 0, 0], gt: {}, l60: 0, l60w: 0 };
  const ts = S.teams.filter(t => t.id !== S.user);
  for (let i = 0; i < n; i++) {
    const h = ts[(i * 7919) % ts.length], pool = S.teams.filter(t => t.lg === h.lg && t.id !== h.id && t.id !== S.user), a = pool[i % pool.length];
    S.fr.push(mkTie(h.id, a.id)); const ref = { k: 'fr', i: S.fr.length - 1 };
    let m; if (live) { m = createMatch(ref); m.auto = true; while (!m.done) step(m); } else m = quickMatch(ref);
    const g = m.score.h + m.score.a; r.g += g; r.dist[Math.min(6, g)]++;
    if (live) { const G = m.ev.filter(e => e.t === 'goal'); G.forEach(e => { r.blk[Math.min(6, Math.floor((e.min - 1) / 15))]++; r.gt[e.gt || '?'] = (r.gt[e.gt || '?'] || 0) + 1; });
      const at = (mn, s) => G.filter(e => e.min <= mn && e.s === s).length, d60 = at(60, 'h') - at(60, 'a');
      if (d60 !== 0) { r.l60++; const lead = d60 > 0 ? 'h' : 'a', o = lead === 'h' ? 'a' : 'h'; if (m.score[lead] > m.score[o]) r.l60w++; } }
    if (m.score.h > m.score.a) r.h++; else if (m.score.h < m.score.a) r.a++; else r.d++;
    r.sh += m.st.h.sh + m.st.a.sh; r.yc += m.st.h.yc + m.st.a.yc; r.rc += m.st.h.rc + m.st.a.rc; r.xg += (m.st.h.xg || 0) + (m.st.a.xg || 0); r.co += (m.st.h.co || 0) + (m.st.a.co || 0);
    Object.keys(m.played).forEach(id => { const p = S.players[id]; if (p && p.pInj) { r.inj++; p.pInj = 0; p.pInjT = 0; } if (p) p.pSusp = 0; });
    if (S.fr.length > 200) S.fr = [];
  }
  S.fr = [];
  return r;
}
function report(name: string, n: number, r) {
  console.log(`\n${name} (${n} partidos)`);
  if (r.l60) { const tg = r.blk.reduce((a, b) => a + b, 0) || 1; row('Goles por tramo 1-15…76-90, desc.', r.blk.map(x => Math.round(x / tg * 100) + '%').join(' '));
    row('Tipos de gol', Object.entries(r.gt).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(v / tg * 100)}%`).join(' · '));
    row('Gana quien manda en el 60\'', Math.round(r.l60w / r.l60 * 100) + '%'); }
  row('Goles por partido', (r.g / n).toFixed(2));
  row('Victoria local / empate / visitante', `${pct(r.h, n)} / ${pct(r.d, n)} / ${pct(r.a, n)}`);
  row('Partidos con 0,1,2,3,4,5,6+ goles', r.dist.map(x => pct(x, n)).join(' '));
  row('Tiros por partido', (r.sh / n).toFixed(1));
  if (r.xg) row('xG por partido', (r.xg / n).toFixed(2));
  if (r.co) row('Córners por partido', (r.co / n).toFixed(1));
  row('Amarillas / rojas por partido', `${(r.yc / n).toFixed(2)} / ${(r.rc / n).toFixed(3)}`);
  row('Lesiones por partido', (r.inj / n).toFixed(2));
}

// 1. Determinismo: misma partida guardada → mismos resultados
{
  const saved = pack(), run = () => { setS(unpack(saved)); dirty(); const out = []; for (let i = 0; i < 20; i++) { const m = quickMatch((S.fr.push(mkTie(S.teams[i].id, S.teams[i + 1].id)), { k: 'fr', i: S.fr.length - 1 })); out.push(m.score.h + '-' + m.score.a); } return out.join(','); };
  const a = run(), b = run();
  console.log('\nDeterminismo: ' + (a === b ? 'OK, los mismos 20 resultados dos veces' : 'FALLO\n' + a + '\n' + b));
  if (a !== b) process.exitCode = 1;
}

report('Partidos rápidos', NQ, matches(NQ, false));
report('Partidos en directo', NL, matches(NL, true));

// 3. Carreras: clubes de distinto nivel, el ayudante toma todas las decisiones
(async () => {
console.log(`\nCarreras (${NC} clubes × 2 temporadas, dificultad normal)`);
const careers = [];
for (let c = 0; c < NC; c++) {
  for (const x of [...slots]) await deleteSlot(x.id);
  const seed = 1000 + c; buildWorld(seed);
  const lvPick = [4, 3, 2, 1, 0, 4][c % 6];
  const cands = S.teams.filter(t => S.leagues[t.lg].c === c % 5 && S.leagues[t.lg].lv === Math.min(lvPick, 4));
  pickTeam(cands[(c * 3) % cands.length].id); S.pre.left = 0;
  const log = { club: T(S.user).name, lg: S.leagues[T(S.user).lg].lv + 1, seasons: [] };
  for (let s = 0; s < 2; s++) {
    S.expRank = S.teams.filter(t => t.lg === T(S.user).lg).sort((a, b) => strength(b.id) - strength(a.id)).findIndex(t => t.id === S.user) + 1;
    await simLoop('season', false, { stopped: () => false, progress: () => {}, yield: async () => {} });
    const fired = !!S.jobless, wk = S.week;
    if (S.jobless) takeJob(S.jobless.offers[0]);
    else {
      // terminar la temporada si faltan partidos (no debería)
      if (S.week < S.fixtures[0].length) await simLoop('season', false, { stopped: () => false, progress: () => {}, yield: async () => {} });
    }
    const sm = fired ? null : seasonSummary();
    // puesto que le correspondía por fuerza al empezar (objetivo) frente al real

    const top = Object.values(S.players).filter(p => p.st && p.team !== null).sort((a, b) => b.st.g - a.st.g)[0];
    log.seasons.push({ expRank: S.expRank, fired, wk, pos: sm ? sm.pos : '-', obj: S.obj.txt, ok: sm ? sm.ok : false, budget: S.budget.toFixed(2), conf: Math.round(S.mgr.conf), top: top ? top.st.g : 0, squad: squad(S.user).length });
    if (!fired) newSeason();
  }
  careers.push(log);
  console.log(`  ${log.club.padEnd(26)} ${log.lg}ª · ` + log.seasons.map(s => s.fired ? `DESPEDIDO en la jornada ${s.wk}` : `${s.pos}º [fuerza ${s.expRank}º] (${s.obj}${s.ok ? ', cumplido' : ''}) conf ${s.conf} €${s.budget}M`).join(' → '));
}
// 4. Economía del mundo a largo plazo: caja de los clubes, plantillas y valores durante varias temporadas
{
  const NS = +(process.argv[5] || 4);
  for (const x of [...slots]) await deleteSlot(x.id);
  buildWorld(777); pickTeam(S.teams.find(t => S.leagues[t.lg].lv === 2).id); S.pre.left = 0;
  console.log(`\nEconomía del mundo (${NS} temporadas)`);
  const med = a => { const v = a.slice().sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : 0; };
  for (let s = 0; s <= NS; s++) {
    const ai = S.teams.filter(t => t.id !== S.user && !t.parent), byLv = [0, 1, 2, 3, 4].map(lv => ai.filter(t => S.leagues[t.lg].lv === lv));
    const cash = byLv.map(ts => ts.length ? `${med(ts.map(t => t.cash ?? 0)).toFixed(2)}` : '-').join(' / ');
    const neg = ai.filter(t => (t.cash ?? 0) < 0).length, sizes = ai.map(t => squad(t.id).length), gk = ai.filter(t => squad(t.id).filter(p => p.pos === 'POR').length >= 2).length;
    const vals = Object.values(S.players).filter(p => p.team !== null).map(p => p.value).sort((a, b) => b - a);
    const top1 = S.leagues.filter(L => L.lv === 0).map(L => { const ts = S.teams.filter(t => t.lg === L.id).map(t => strength(t.id)).sort((a, b) => b - a); return ts[0] - ts[ts.length - 1]; });
    row(`Temporada ${s}`, `caja mediana por división (1ª/2ª/3ª/4ª/5ª) ${cash} M · en rojo ${neg} · plantilla ${Math.min(...sizes)}-${Math.max(...sizes)} (med ${med(sizes)}) · con 2+ porteros ${gk}/${ai.length} · valor máx ${vals[0].toFixed(1)} M, mediano ${med(vals).toFixed(3)} · diferencia de fuerza en 1ª ${(med(top1) / 10).toFixed(2)} · fuerza mediana 1ª/5ª ${(med(ai.filter(t => S.leagues[t.lg].lv === 0).map(t => strength(t.id))) / 10).toFixed(2)}/${(med(ai.filter(t => S.leagues[t.lg].lv === 4).map(t => strength(t.id))) / 10).toFixed(2)}`);
    if (s === NS) break;
    await simLoop('season', false, { stopped: () => false, progress: () => {}, yield: async () => {} });
    if (S.jobless) takeJob(S.jobless.offers[0]); else newSeason();
  }
}
const sacked = careers.reduce((a, c) => a + c.seasons.filter(s => s.fired).length, 0);
{ const d = careers.flatMap(c => c.seasons.filter(s => !s.fired).map(s => s.pos - s.expRank)); console.log(`\n  Puesto real menos puesto por fuerza (media): ${(d.reduce((a, b) => a + b, 0) / d.length).toFixed(1)}`); }
console.log(`\n  Despidos: ${sacked} de ${NC * 2} temporadas`);
console.log(`\nTerminado en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})().catch(e => { console.error(e); process.exit(1); });
