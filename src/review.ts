/* El Banquillo · review.ts — Resumen de la temporada (como en FM): cómo fue tu puesto jornada a jornada,
 * el mejor jugador, la revelación, el que más creció, el máximo goleador, la mejor venta y el once de la temporada. */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from './core';
import {GRP,SPN} from './data';
import {S,T,seasonLabel,squad} from './state';
import {slotsOf} from './tactics';

const avg=p=>p.st&&p.st.pj?p.st.rs/p.st.pj:0;
export function seasonReview(){
 const sq=squad(S.user).filter(p=>!p.loan&&p.st&&p.st.pj),lbl=seasonLabel();
 const reg=sq.filter(p=>p.st.pj>=8),best=reg.slice().sort((a,b)=>avg(b)-avg(a))[0]||null;
 const rev=sq.filter(p=>p.age<=21&&p.st.pj>=5&&p!==best).sort((a,b)=>avg(b)-avg(a))[0]||null;
 const g0=p=>{const x=(p.ph||[]).find(x=>x[0]===lbl);return x?x[1]:null;},grow=squad(S.user).filter(p=>g0(p)!=null).map(p=>[p,p.ovr-g0(p)]).sort((a,b)=>b[1]-a[1])[0]||null;
 const top=sq.slice().sort((a,b)=>b.st.g-a.st.g)[0]||null;
 const sale=(S.tlog||[]).filter(x=>x.from===S.user&&x.season===lbl&&x.fee).sort((a,b)=>b.fee-a.fee)[0]||null;
 const buy=(S.tlog||[]).filter(x=>x.to===S.user&&x.season===lbl&&x.fee).sort((a,b)=>b.fee-a.fee)[0]||null;
 const sl=slotsOf(T(S.user).formation),used=new Set(),xi=sl.map(sp=>{const c=reg.concat(sq.filter(p=>p.st.pj>=4)).filter(p=>!used.has(p.id)&&(p.sp===sp||(p.alt||[]).includes(sp)||GRP[p.sp]===GRP[sp])).sort((a,b)=>(b.sp===sp)-(a.sp===sp)||avg(b)-avg(a))[0];if(c)used.add(c.id);return [sp,c||null];});
 const tl=(S.tl||[]).map(x=>x.pos);
 return {lbl,best,rev,grow:grow&&grow[1]>0?grow:null,top:top&&top.st.g?top:null,sale,buy,xi,tl};
}
const chart=tl=>{if(tl.length<2)return '';const n=Math.max(...tl,10),W=320,H=90,X=i=>10+i*(W-20)/(tl.length-1),Y=v=>8+(v-1)/(n-1)*(H-20);
 return `<svg viewBox="0 0 ${W} ${H}" class="rvch" role="img" aria-label="Tu puesto jornada a jornada"><line x1="10" y1="${Y(1)}" x2="${W-10}" y2="${Y(1)}" stroke="var(--line)" stroke-dasharray="3 3"/><polyline fill="none" stroke="var(--accent)" stroke-width="2.5" points="${tl.map((v,i)=>X(i)+','+Y(v)).join(' ')}"/>${tl.map((v,i)=>i===tl.length-1||i===0?`<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="var(--ink)"/><text x="${X(i)}" y="${Y(v)-6}" font-size="10" text-anchor="middle" fill="var(--ink)">${v}º</text>`:'').join('')}<text x="10" y="${H-1}" font-size="9" fill="var(--muted)">J1</text><text x="${W-10}" y="${H-1}" font-size="9" text-anchor="end" fill="var(--muted)">J${tl.length}</text></svg>`;};
export function reviewHTML(R,nameBtn){
 const R_=R||seasonReview(),card=(ico,t,p,sub)=>`<div class="rvc"><span class="rvi">${ico}</span><div><small>${t}</small>${p?`<b>${nameBtn(p)}</b><em>${sub}</em>`:'<em>—</em>'}</div></div>`;
 return `<section class="panel review"><div class="panel-h"><h2>Resumen de la temporada ${esc(R_.lbl)}</h2></div>
 ${R_.tl.length>1?`<div class="eyebrow">Tu puesto jornada a jornada</div>${chart(R_.tl)}`:''}
 <div class="rvg">${card('⭐','Mejor jugador',R_.best,R_.best?`nota ${avg(R_.best).toFixed(2)} en ${R_.best.st.pj} partidos`:'')}${card('🌟','Revelación',R_.rev,R_.rev?`${R_.rev.age} años · nota ${avg(R_.rev).toFixed(2)}`:'')}${card('📈','El que más creció',R_.grow&&R_.grow[0],R_.grow?`+${Math.round(R_.grow[1])} de media`:'')}${card('⚽','Máximo goleador',R_.top,R_.top?`${R_.top.st.g} goles`:'')}
 <div class="rvc"><span class="rvi">💰</span><div><small>Mejor venta</small>${R_.sale?`<b>${esc(R_.sale.name)}</b><em>${money(R_.sale.fee)}</em>`:'<em>—</em>'}</div></div><div class="rvc"><span class="rvi">✍️</span><div><small>Fichaje más caro</small>${R_.buy?`<b>${esc(R_.buy.name)}</b><em>${money(R_.buy.fee)}</em>`:'<em>—</em>'}</div></div></div>
 <div class="eyebrow" style="margin-top:8px">Once de la temporada</div><div class="rvxi">${R_.xi.map(([sp,p])=>`<span><i>${sp}</i>${p?nameBtn(p):'—'}${p?`<small>${avg(p).toFixed(1)}</small>`:''}</span>`).join('')}</div></section>`;
}
/** Versión corta para guardar en el historial de temporadas. */
export const reviewShort=R=>({best:R.best?[R.best.name,+avg(R.best).toFixed(2)]:null,rev:R.rev?[R.rev.name,R.rev.age]:null,grow:R.grow?[R.grow[0].name,Math.round(R.grow[1])]:null,sale:R.sale?[R.sale.name,R.sale.fee]:null});
