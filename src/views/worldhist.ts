/* El Banquillo · views/worldhist.ts — Enciclopedia de temporadas, salón de la fama y récords del mundo. */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from '../core';
import {ALLN,COUNTRIES,LV_SH,SPN} from '../data';
import {S} from '../state';
import {CONTS,cupName} from '../competitions';
import {TOURN} from '../nations';
import {flag} from '../flags';
import {clubRecords} from '../worldhist';

const fl=c=>flag((ALLN[c]||COUNTRIES[c]||{code:'---'}).code,'xs');
/** Historia → Enciclopedia: cada temporada con sus campeones, premios y el gran fichaje. */
export function enciclopediaHTML(){
 const E=(S.ency||[]).slice().reverse();if(!E.length)return `<section class="panel"><div class="empty">La enciclopedia se escribe al terminar cada temporada.</div></section>`;
 const sel=S.encS&&E.find(x=>x.season===S.encS)?S.encS:E[0].season,P=E.find(x=>x.season===sel);
 const intl=(S.intl&&S.intl.hist||[]).filter(t=>String(t.year)===String(+sel.slice(0,4)+1));
 return `<div class="row" style="margin-bottom:12px;flex-wrap:wrap;gap:6px">${E.map(x=>`<button class="btn sm ${x.season===sel?'dark':''}" data-a="enc-s" data-v="${x.season}">${x.season}</button>`).join('')}</div>
 <div class="grid"><section class="panel"><div class="panel-h"><h2>Temporada ${esc(P.season)}</h2><span class="eyebrow">Campeones de liga</span></div>
 <div class="tbl"><table><thead><tr><th>Liga</th><th>Campeón</th><th>Subcampeón</th></tr></thead><tbody>${P.champs.filter(c=>c.lv<=1).sort((a,b)=>a.lv-b.lv||a.c-b.c).map(c=>`<tr><td>${fl(c.c)} ${LV_SH[c.lv]}</td><td><b>${esc(c.champ)}</b>${c.lv===0?` <span class="small muted">${c.pts} pts</span>`:''}</td><td>${esc(c.runner)}</td></tr>`).join('')}</tbody></table></div></section>
 <div class="stack"><section class="panel"><div class="panel-h"><h2>Copas y premios</h2></div><div class="kv" style="margin-top:0">
 ${P.conts.map(x=>`<span>${esc(CONTS[x.i]?CONTS[x.i].n:'Continental')}</span><b>${esc(x.w)}</b>`).join('')}${P.cwc?`<span>Mundial de Clubes</span><b>${esc(P.cwc)}</b>`:''}
 ${P.ballon?`<span>Balón de Oro</span><b>${esc(P.ballon.name)} · ${esc(P.ballon.club)}</b>`:''}${P.boot?`<span>Bota de Oro</span><b>${esc(P.boot.name)} · ${P.boot.g} goles</b>`:''}${P.young?`<span>Mejor joven</span><b>${esc(P.young.name)}</b>`:''}
 ${P.transfer?`<span>Fichaje del año</span><b>${esc(P.transfer.name)}: ${esc(P.transfer.from)} → ${esc(P.transfer.to)} · ${money(P.transfer.fee)}</b>`:''}
 ${intl.map(t=>`<span>${esc(t.n)} ${t.year}</span><b>${fl(t.champ)} ${esc((ALLN[t.champ]||{n:'?'}).n)}</b>`).join('')}</div></section>
 <section class="panel"><div class="panel-h"><h2>Copas nacionales</h2></div><div class="kv" style="margin-top:0">${P.cups.map(x=>`<span>${fl(x.c)} ${esc(cupName(x.c))}</span><b>${esc(x.w)}</b>`).join('')}</div></section>
 <section class="panel"><div class="panel-h"><h2>Tu temporada</h2></div><p style="margin:0">${esc(P.me.club)}: ${P.me.pos}º en ${esc(P.me.lg)}${P.me.champ?' · <b>¡campeón!</b>':P.me.up?' · <b>ascenso</b>':P.me.down?' · descenso':''}.</p></section></div></div>`;
}
/** Historia → Salón de la fama: leyendas retiradas, entrenadores con más títulos y récords del mundo. */
export function fameHTML(){
 const L=(S.legends||[]).slice(0,20),C=Object.entries(S.coachHall||{}).sort((a,b)=>b[1].n-a[1].n).slice(0,12),W=S.wrec||{};
 return `<div class="grid"><section class="panel"><div class="panel-h"><h2>Leyendas</h2><span class="eyebrow">Jugadores retirados</span></div>
 ${L.length?`<div class="tbl"><table><thead><tr><th>Jugador</th><th>Club</th><th class="r">PJ</th><th class="r">Goles</th><th class="r">Asist.</th><th>Hasta</th></tr></thead><tbody>${L.map(x=>`<tr><td>${fl(x.nat)} <b>${esc(x.name)}</b> <span class="small muted">${esc(SPN[x.pos]||'')}</span></td><td>${esc(x.club)}</td><td class="n">${x.pj}</td><td class="n">${x.g}</td><td class="n">${x.a}</td><td class="num">${esc(x.end)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Aún no se ha retirado ninguna leyenda. Entran los que pasan de 40 goles o 320 partidos.</div>'}</section>
 <div class="stack"><section class="panel"><div class="panel-h"><h2>Entrenadores campeones</h2><span class="eyebrow">Ligas de Primera</span></div>
 ${C.length?C.map(([n,e])=>`<div class="offer"><span class="t"><b>${esc(n)}</b> · ${e.n} título${e.n>1?'s':''}<br><span class="small muted">${esc(e.titles.slice(-3).join(' · '))}</span></span></div>`).join(''):'<div class="empty">Se completa al terminar cada temporada.</div>'}</section>
 <section class="panel"><div class="panel-h"><h2>Récords del mundo</h2></div><div class="kv" style="margin-top:0">
 ${W.fee?`<span>Fichaje más caro</span><b>${esc(W.fee.name)} · ${money(W.fee.fee)} (${esc(W.fee.from)} → ${esc(W.fee.to)}, ${esc(W.fee.season)})</b>`:''}
 ${W.goals?`<span>Más goles en una temporada</span><b>${esc(W.goals.name)} · ${W.goals.g} (${esc(W.goals.season)})</b>`:''}
 ${W.pts?`<span>Más puntos de un campeón</span><b>${esc(W.pts.club)} · ${W.pts.pts} (${esc(W.pts.lg)}, ${esc(W.pts.season)})</b>`:''}
 ${!W.fee&&!W.goals?'<span>Récords</span><b>Se irán llenando con los años</b>':''}</div></section></div></div>`;
}
/** Récords de un club (para su ficha). */
export function clubRecordsHTML(tid){
 const r=clubRecords(tid);if(!r.best&&!r.buy&&!r.sell)return '';
 return `<h3 style="margin:14px 0 4px">Récords del club</h3><div class="kv" style="margin-top:0">${r.best?`<span>Mejor clasificación</span><b>${esc(r.best)}</b>`:''}<span>Temporadas en Primera</span><b>${r.top}</b><span>Títulos</span><b>${r.titles}</b>
 ${r.buy?`<span>Fichaje más caro</span><b>${esc(r.buy.name)} · ${money(r.buy.fee)} (${esc(r.buy.season)})</b>`:''}${r.sell?`<span>Venta más cara</span><b>${esc(r.sell.name)} · ${money(r.sell.fee)} (${esc(r.sell.season)})</b>`:''}</div>`;
}
export {TOURN};
