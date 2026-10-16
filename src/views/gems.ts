/* El Banquillo · views/gems.ts — «Mis joyas»: cómo han crecido los jugadores que fichaste o subiste de la cantera
 * (media y valor al llegar y ahora, internacionalidades) y lo que ganaste con los que vendiste. */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from '../core';
import {posChip} from '../data';
import {S,qBadge,squad} from '../state';
import {nameBtn,nf} from './common';

const d1=(a,b)=>{const d=Math.round(b-a);return `<span class="jd ${d>0?'up':d<0?'dn':''}">${d>0?'+':''}${d}</span>`;};
export function joyasHTML(){
 const L=squad(S.user).filter(p=>p.h0).map(p=>({p,g:p.ovr-p.h0[0],v0:p.h0[3]})).sort((a,b)=>b.g-a.g),sold=S.jsold||[];
 const intl=L.filter(x=>x.p.caps||x.p.ntc).length,u21=L.filter(x=>x.p.u21).length,disc=L.filter(x=>x.p.h0[2]).length;
 const reval=L.reduce((a,x)=>a+(x.v0!=null?x.p.value-x.v0:0),0),profit=sold.reduce((a,x)=>a+x.fee-(x.paid||0),0);
 const best=L[0];
 const kpi=`<div class="jk"><div><b>${L.length}</b><small>Jugadores tuyos</small></div><div><b class="${reval>=0?'up':'dn'}">${reval>=0?'+':''}${money(reval)}</b><small>Revalorización</small></div><div><b>${intl}</b><small>Internacionales</small></div><div><b>${u21}</b><small>Con la Sub-21</small></div><div><b>${disc}</b><small>Descubiertos por ti ★</small></div><div><b class="${profit>=0?'up':'dn'}">${profit>=0?'+':''}${money(profit)}</b><small>Ganado en ventas</small></div></div>`;
 const tag=p=>[p.h0[2]?'<span class="tag xi" title="Llegó flojo y ya es una estrella">★ Descubierto</span>':'',p.ntc||p.caps?`<span class="tag">🌍 ${p.caps||0} int.</span>`:'',p.u21?`<span class="tag">Sub-21 · ${p.u21}</span>`:''].join(' ');
 return `<p class="small muted" style="margin:0 0 10px">Todos los que han llegado a tu club desde que eres el entrenador (fichados o subidos de la cantera): cómo estaban al llegar y cómo están ahora. Busca joyas en el mercado, dales minutos y míralas crecer.</p>${kpi}
 ${best&&best.g>0?`<div class="jbest">🏆 Tu mejor apuesta: ${nameBtn(best.p)} — llegó en ${esc(best.p.h0[1])} con ${Math.round(best.p.h0[0])} y ya es un ${Math.round(best.p.ovr)} (${d1(best.p.h0[0],best.p.ovr)}).</div>`:''}
 ${L.length?`<div class="tbl"><table><thead><tr><th>Pos</th><th>Jugador</th><th class="r">Edad</th><th>Llegó</th><th class="r">Media al llegar</th><th class="r">Ahora</th><th class="r">Crecimiento</th><th class="r">Pot.</th><th class="r">Valor al llegar</th><th class="r">Valor ahora</th><th>Logros</th></tr></thead><tbody>
 ${L.map(({p,v0})=>`<tr><td>${posChip(p)}</td><td>${nameBtn(p)}</td><td class="n">${p.age}</td><td class="small">${esc(p.h0[1])}${p.home?' · cantera':''}</td><td class="r">${qBadge(p.h0[0]/10)}</td><td class="r">${qBadge(p.ovr/10)}</td><td class="r">${d1(p.h0[0],p.ovr)}</td><td class="n">${p.pot!=null?Math.round(p.pot*10):'—'}</td><td class="n">${v0!=null?money(v0):'—'}</td><td class="n">${money(p.value)}</td><td>${tag(p)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Aún no ha llegado nadie desde que entrenas aquí. Ficha a tu primera joya en el mercado.</div>'}
 ${sold.length?`<h3 style="margin:16px 0 6px">Los que vendiste</h3><div class="tbl"><table><thead><tr><th>Jugador</th><th>Llegó</th><th class="r">Media</th><th class="r">Te costó</th><th class="r">Lo vendiste por</th><th class="r">Beneficio</th><th>Vendido</th></tr></thead><tbody>
 ${sold.map(x=>`<tr><td>${nf(x.nat)} ${esc(x.n)} <span class="small muted">${x.sp}</span></td><td class="small">${esc(x.s0)}${x.home?' · cantera':''}</td><td class="r">${Math.round(x.o0)} → ${Math.round(x.o1)}</td><td class="n">${x.paid?money(x.paid):x.home?'Cantera':'Libre'}</td><td class="n">${money(x.fee)}</td><td class="n"><span class="jd ${x.fee-(x.paid||0)>=0?'up':'dn'}">${x.fee-(x.paid||0)>=0?'+':''}${money(x.fee-(x.paid||0))}</span></td><td class="small">${esc(x.s)}</td></tr>`).join('')}</tbody></table></div>`:''}`;
}
