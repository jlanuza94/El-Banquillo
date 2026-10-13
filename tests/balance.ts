// Equilibrio táctico: cada sistema famoso contra rivales de fuerza parecida (con la IA adaptándose).
//   node tools/build.mjs --test && node dist-test/balance.cjs [partidos por sistema]
// Ningún sistema debería sacar más de ~1,6 puntos por partido ni menos de ~0,8 con un equipo medio.
import './dom-stub';
// @ts-nocheck
import { S, T, setS, dirty } from '../src/state';
import { seedRng } from '../src/core';
import { buildWorld, pickTeam } from '../src/world';
import { createMatch, step } from '../src/engine';
import { teamPower } from '../src/tactics';
import { mkTie } from '../src/competitions';
import { strength } from '../src/players';
import { PRESETS, applyPreset } from '../src/tactics2';
import { pack, unpack } from '../src/persist';
import { tacReport } from '../src/tacreport';
const N = +(process.argv[2] || 200);
seedRng(9); buildWorld(9);
const lg = S.leagues.find(L => L.lv === 0 && L.c === 0);
const ts = S.teams.filter(t => t.lg === lg.id).sort((a, b) => strength(b.id) - strength(a.id));
pickTeam(ts[9].id); S.pre.left = 0; S.chem = 70;
const opp = ts.filter(t => t.id !== S.user).slice(4, 15); // rivales de fuerza parecida
const base = pack();
const rows = [];
for (const k of ['ninguno', ...Object.keys(PRESETS)]) {
  setS(unpack(base)); dirty(); if (k !== 'ninguno') applyPreset(k);
  let pts = 0, gf = 0, ga = 0; const fac = {}; let atk = 0, def = 0, en = 0, mu = 0;
  for (let i = 0; i < N; i++) {
    const o = opp[i % opp.length].id, home = i % 2 === 0;
    S.fr.push(home ? mkTie(S.user, o) : mkTie(o, S.user)); const m = createMatch({ k: 'fr', i: S.fr.length - 1 }); m.auto = true; { const P = teamPower(m.lu[m.us], m.f[m.us], m.en, m.hurt, m.mult[m.us], m.ro && m.ro[m.us]); atk += P.atk; def += P.def; mu += m.mult[m.us]; }
    while (!m.done) step(m);
    { const ids = m.lu[m.us].filter(Boolean); en += ids.reduce((a, id) => a + m.en[id], 0) / ids.length; }
    { const r = m.tl.r, n = m.tl.n; ['est', 'fase', 'rit', 'pre', 'lin'].forEach(k => { if (r[k]) { const e = fac['RIVAL_' + k] || (fac['RIVAL_' + k] = [0, 0]); e[0] += Math.exp(r[k][0] / n) - 1; } }); }
    { const R = tacReport(m); R.f.forEach(x => { const e = fac[x[0]] || (fac[x[0]] = [0, 0]); e[0] += x[2]; e[1] += x[3]; }); }
    const us = m.us, th = us === 'h' ? 'a' : 'h', my = m.score[us], op = m.score[th]; gf += my; ga += op; pts += my > op ? 3 : my === op ? 1 : 0;
    Object.keys(m.played).forEach(id => { const p = S.players[id]; if (p) { p.energy = 100; p.pInj = 0; p.pSusp = 0; } });
    if (S.fr.length > 100) S.fr = [];
  }
  rows.push(`${(k === 'ninguno' ? 'Táctica normal' : PRESETS[k].n).padEnd(16)} ${(pts / N).toFixed(2)} pts/partido · goles ${(gf / N).toFixed(2)}-${(ga / N).toFixed(2)} · ataque ${(atk / N).toFixed(1)} defensa ${(def / N).toFixed(1)} mult ${(mu / N).toFixed(3)} energía final ${(en / N).toFixed(0)}% | ` + Object.entries(fac).map(([k, e]) => `${k} ${(e[0] / N).toFixed(2)}/${(e[1] / N).toFixed(2)}`).join(' '));
}
console.log(`${N} partidos por sistema contra rivales de fuerza parecida (con la IA adaptándose):\n` + rows.join('\n'));
