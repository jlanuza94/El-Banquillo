/* El Banquillo · views/journey.ts — «Mi camino»: tu historia con el club temporada a temporada (de Quinta hacia arriba),
 * tus mejores apuestas, los internacionales que formaste y el salón de la fama de los que más han jugado contigo. */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from '../core';
import {LV_NAMES,posChip} from '../data';
import {LG,S,T,seasonLabel,squad,uLg} from '../state';
import {kitSVG} from '../kit';
import {nameBtn,nf} from './common';

const ICON={Campeón:'🏆','Campeón y ascenso':'🏆',Ascenso:'⬆️',Descenso:'⬇️'};
export function caminoHTML(){
 const t=T(S.user),H=(S.history||[]).slice().reverse(),lv=LG(uLg()).lv,short=t.short;
 const steps=LV_NAMES.slice().reverse().map((n,i)=>{const l=LV_NAMES.length-1-i;return `<div class="jst ${l===lv?'me':l>lv?'done':''}"><i></i><span>${esc(n.replace(' División',''))}</span></div>`;}).join('');
 const tl=H.length?H.map(h=>`<div class="jtl ${h.res==='Descenso'?'dn':h.res?'up':''}"><span class="jtl-s">${esc(h.season)}</span><span class="jtl-i">${ICON[h.res]||'•'}</span><div class="jtl-t"><b>${esc(h.lg)} · ${h.pos}º${h.res?' · '+esc(h.res):''}</b><small>${h.pts} puntos · ${h.obj?'objetivo cumplido':'objetivo no cumplido'} · pichichi del club: ${esc(h.top)}</small></div></div>`).join('')
  :'<div class="empty">Tu primera temporada está en marcha: aquí irás viendo cada ascenso, cada título y cada bajón.</div>';
 // salón de la fama: los que más partidos han jugado en tu club (temporadas cerradas + la actual)
 const hof=Object.values(S.players).map(p=>{let pj=0,g=0;(p.hist||[]).forEach(h=>{if(h[1]===short){pj+=h[2];g+=h[3];}});if(p.team===S.user&&p.st){pj+=p.st.pj||0;g+=p.st.g||0;}return {p,pj,g};}).filter(x=>x.pj>0).sort((a,b)=>b.pj-a.pj||b.g-a.g).slice(0,8);
 const sc=hof.slice().sort((a,b)=>b.g-a.g)[0];
 const mine=squad(S.user).filter(p=>p.h0),bets=mine.map(p=>({p,d:p.ovr-p.h0[0]})).filter(x=>x.d>0).sort((a,b)=>b.d-a.d).slice(0,5);
 const intl=mine.filter(p=>p.caps||p.ntc||p.u21).map(p=>p).concat([]),soldI=(S.jsold||[]).filter(x=>x.caps||x.u21);
 const sold=(S.jsold||[]).slice().sort((a,b)=>(b.fee-(b.paid||0))-(a.fee-(a.paid||0))).slice(0,3);
 return `<div class="grid"><div class="stack"><section class="panel"><div class="panel-h"><h2>Mi camino con ${esc(t.name)}</h2><span class="eyebrow">${H.length} temporada${H.length===1?'':'s'} completada${H.length===1?'':'s'}</span></div>
 <div class="jladder">${steps}</div>
 ${Object.keys(S.kits||{}).length?`<div class="eyebrow" style="margin:6px 0 2px">Tus camisetas</div><div class="kith">${Object.entries(S.kits).sort((a,b)=>a[0]-b[0]).map(([n,k])=>`<span title="${seasonLabel(+n)}">${kitSVG(k,'sm')}<small>${seasonLabel(+n).slice(2)}</small></span>`).join('')}</div>`:''}
 <div class="jtls">${tl}</div></section>
 <section class="panel"><div class="panel-h"><h2>Salón de la fama</h2><span class="eyebrow">Los que más han jugado contigo</span></div>
 ${hof.length?hof.map((x,i)=>`<div class="offer"><b class="num" style="width:22px">${i+1}</b>${posChip(x.p)}<span class="t">${nameBtn(x.p)}<br><span class="small muted">${x.pj} partidos · ${x.g} goles${x.p.team!==S.user?` · ahora en ${x.p.team!=null?esc(T(x.p.team).name):'sin equipo'}`:''}</span></span>${sc&&sc.p===x.p&&x.g?'<span class="tag xi">Máximo goleador</span>':''}</div>`).join(''):'<div class="empty">Juega partidos y aquí aparecerán tus leyendas.</div>'}</section></div>
 <div class="stack"><section class="panel"><div class="panel-h"><h2>Tus mejores apuestas</h2></div>
 ${bets.length?bets.map(x=>`<div class="offer">${posChip(x.p)}<span class="t">${nameBtn(x.p)}<br><span class="small muted">llegó en ${esc(x.p.h0[1])} con ${Math.round(x.p.h0[0])} · ahora ${Math.round(x.p.ovr)}</span></span><span class="jd up">+${Math.round(x.d)}</span></div>`).join(''):'<div class="empty small">Ficha jóvenes y dales minutos: aquí verás cuánto han crecido contigo.</div>'}
 ${sold.length?`<h3 style="margin:10px 0 4px">Mejores ventas</h3>${sold.map(x=>`<div class="offer"><span class="t">${nf(x.nat)} <b>${esc(x.n)}</b><br><span class="small muted">${x.paid?'te costó '+money(x.paid):x.home?'de la cantera':'llegó libre'} · vendido por ${money(x.fee)} (${esc(x.s)})</span></span><span class="jd up">+${money(x.fee-(x.paid||0))}</span></div>`).join('')}`:''}</section>
 <section class="panel"><div class="panel-h"><h2>Internacionales formados</h2><span class="eyebrow">${intl.length+soldI.length}</span></div>
 ${intl.length||soldI.length?intl.map(p=>`<div class="offer">${posChip(p)}<span class="t">${nameBtn(p)}<br><span class="small muted">${p.caps?p.caps+' con la absoluta':''}${p.caps&&p.u21?' · ':''}${p.u21?p.u21+' con la Sub-21':''}${!p.caps&&!p.u21&&p.ntc?'convocado con la absoluta':''}</span></span></div>`).join('')+soldI.map(x=>`<div class="offer"><span class="t">${nf(x.nat)} <b>${esc(x.n)}</b><br><span class="small muted">formado contigo · vendido en ${esc(x.s)}</span></span></div>`).join(''):'<div class="empty small">Ninguno todavía. Los chavales con potencial que juegan y rinden acaban en la Sub-21.</div>'}</section></div></div>`;
}
