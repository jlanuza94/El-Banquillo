/* El Banquillo · views/pcard.ts — Cabecera de la ficha del jugador al estilo FM Mobile: tarjeta con cara,
 * estrellas, datos del contrato, mapa de posiciones, pies y atributos en tres columnas con colores. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,esc,money} from '../core';
import {AT_GROUPS,AT_NAME,COUNTRIES,ROLES,SPN,SPXY} from '../data';
import {S,T,crestStyle,lgName,qc,squad} from '../state';
import {prof} from '../tactics';
import {scouted,seen} from '../scouting';
import {atCellS,nf,pBadgeS} from './common';
import {contractLabel} from '../contracts';
import {askPrice} from '../market';

const H=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h;};
const SKIN=['#f1c9a5','#e0ac83','#c68a5e','#9c6644','#6f4a32','#f5d5b8'],HAIR=['#1d1612','#3b2618','#6b4423','#a26a33','#d9b26a','#2a2a2a','#7a7a7a'];
/** Cara sencilla y siempre la misma para cada jugador, con la camiseta de su club. */
export function faceSVG(p){
 const h=H(p.id+p.name),sk=SKIN[h%SKIN.length],hc=p.age>=34&&h%3===0?'#9a9a9a':HAIR[(h>>3)%HAIR.length],st=(h>>6)%5,t=p.team!=null?T(p.team):null,c1=t?t.c1:'#556',c2=t?t.c2:'#889';
 const hair=[`<path d="M30 44c0-14 9-22 20-22s20 8 20 22c-3-6-9-9-20-9s-17 3-20 9z" fill="${hc}"/>`,
  `<path d="M31 42c1-12 9-18 19-18s18 6 19 18c-4-3-10-5-19-5s-15 2-19 5z" fill="${hc}" opacity=".55"/>`,
  `<g fill="${hc}"><circle cx="36" cy="33" r="7"/><circle cx="45" cy="28" r="8"/><circle cx="55" cy="28" r="8"/><circle cx="64" cy="33" r="7"/><circle cx="68" cy="41" r="5"/><circle cx="32" cy="41" r="5"/></g>`,
  `<path d="M29 50c-1-18 8-28 21-28s22 10 21 28l-4-1c0-10-6-16-17-16s-17 6-17 16z" fill="${hc}"/>`,
  ''][st];
 const beard=(h>>9)%4===0?`<path d="M36 58c2 9 8 13 14 13s12-4 14-13c-3 4-8 6-14 6s-11-2-14-6z" fill="${hc}" opacity=".85"/>`:'';
 return `<svg class="face" viewBox="0 0 100 100" aria-hidden="true"><path d="M8 100c2-17 15-25 42-25s40 8 42 25z" fill="${c1}"/><path d="M38 76l12 10 12-10" fill="none" stroke="${c2}" stroke-width="4"/>
 <rect x="42" y="62" width="16" height="16" rx="5" fill="${sk}"/><ellipse cx="50" cy="47" rx="19" ry="23" fill="${sk}"/><ellipse cx="31" cy="49" rx="3" ry="5" fill="${sk}"/><ellipse cx="69" cy="49" rx="3" ry="5" fill="${sk}"/>
 ${hair}${beard}<g fill="#1d1612"><ellipse cx="42" cy="48" rx="2.2" ry="2.6"/><ellipse cx="58" cy="48" rx="2.2" ry="2.6"/></g><path d="M38 42h8M54 42h8" stroke="${hc}" stroke-width="2.4" stroke-linecap="round"/><path d="M45 61c3 2 7 2 10 0" fill="none" stroke="#8a4b3a" stroke-width="2" stroke-linecap="round"/></svg>`;
}
/** Estrellas de 0,5 a 5, comparando con tu once (como en el FM: relativas a tu equipo). */
export function starsOf(v){const xi=squad(S.user).map(x=>x.ovr).sort((a,b)=>b-a).slice(0,11),ref=xi.length?xi.reduce((a,b)=>a+b,0)/xi.length:55;return Math.round(clamp(3+(v-ref)/6,.5,5)*2)/2;}
export const starsHTML=(n,pot)=>`<span class="stars${pot?' pot':''}" title="${n} de 5">${[1,2,3,4,5].map(i=>`<i class="${n>=i?'f':n>=i-.5?'h':''}">★</i>`).join('')}</span>`;
function feet(p){const f=p.foot||'D',wf=p.wf||3,L=f==='I'||f==='A'?5:wf,R=f==='D'||f==='A'?5:wf,c=v=>v>=5?'g':v>=3?'y':'r';
 return `<div class="feet"><span class="ft ${c(L)}" title="Izquierdo ${L}/5">I</span><b>${f==='A'?'Ambidiestro':f==='I'?'Zurdo':'Diestro'}</b><span class="ft ${c(R)}" title="Derecho ${R}/5">D</span></div>`;}
/** Nota de los últimos partidos (forma). */
function formRow(p){const L=(S.mlog||[]).map(r=>(r.pl||[]).find(x=>x[0]===p.id)).filter(Boolean).slice(0,5).map(x=>x[2]).filter(Boolean);return L.length?L.map(v=>v.toFixed(1)).join(' · '):'—';}
export function cardHTML(p){
 const sn=seen(p),t=p.team!=null?T(p.team):null,s=p.st||{},ex=sn.exact,v=ex?p.ovr:(sn.ovr[0]+sn.ovr[1])/2,st=starsOf(v),pot=p.age<=23?starsOf(Math.max(v,((seen(p).pot[0]+seen(p).pot[1])/2)*10)):null;
 const sc=scouted(p),tier=!sc?'bronze':st>=4?'gold':st>=2.5?'silver':'bronze',mine=p.team===S.user,hap=p.hap==null?70:p.hap;
 const dots=Object.keys(SPXY).map(sp=>{const pr=prof(p,sp),[x,y]=SPXY[sp],c=sp===p.sp?'n':pr>=.95?'c':pr>=.86?'u':'';return c?`<span class="pd ${c}" style="left:${x}%;top:${y}%" title="${SPN[sp]}">${sp}</span>`:'';}).join('');
 const col=ks=>ks.map(k=>{const r=sn.at[k],v=sn.exact?p.at[k]:(r[0]+r[1])/2;return `<div class="fa"><span>${AT_NAME[k]}</span><i class="fab"><b class="${qc(v)}" style="width:${sc?v*10:0}%"></b></i>${atCellS(p,k,sn)}</div>`;}).join('');
 const G=AT_GROUPS.filter(([n])=>n!=='Portero'||p.sp==='POR');
 const extra=`<div class="fa"><span>Energía</span><b class="${p.energy>=75?'ok':p.energy>=55?'mid':'low'}">${Math.round(p.energy)}%</b></div><div class="fa"><span>Moral</span><b>${hap>=75?'Excelente':hap>=55?'Buena':hap>=40?'Normal':hap>=25?'Baja':'Muy baja'}</b></div><div class="fa"><span>Forma</span><b>${formRow(p)}</b></div><div class="fa"><span>Nota media</span><b>${s.pj?(s.rs/s.pj).toFixed(2):'—'}</b></div>`;
 return `<div class="pfc">
 <div class="pc ${tier}" style="${t?crestStyle(t):''}"><span class="pnum">${p.num||''}</span>${t?`<span class="pcrest crest ${t.cs?'cs-'+t.cs:''}">${esc(t.short)}</span>`:''}<span class="pflag">${nf(p.nat)}</span>${faceSVG(p)}<b class="psur">${esc(p.name.split(' ').slice(1).join(' ')||p.name)}</b><span class="ppos">${SPN[p.sp]}</span>${sc?starsHTML(st):'<span class="small" style="opacity:.8">Sin ojear</span>'}${sc&&pot!=null&&pot>st?`<span class="small" style="opacity:.8">Potencial ${starsHTML(pot,1)}</span>`:''}</div>
 <div class="pinfo"><div class="pig"><div><b>${p.age} años</b><small>Edad</small></div><div><b>${esc(COUNTRIES[p.nat].n)}</b><small>${p.caps||p.u21?[p.caps?`${p.caps} internacional${p.caps>1?'es':''}`:'',p.u21?`Sub-21: ${p.u21}`:''].filter(Boolean).join(' · '):'Nacionalidad'}</small></div></div>
  <div class="pclub"><b>${t?esc(t.name):'Agente libre'}</b>${t?`<small>${esc(lgName(t.lg))}</small>`:''}${mine?`<span class="prole">${ROLES[p.role||'ro'].n}</span>`:''}</div>
  <div class="pmedia">Media ${pBadgeS(p,'lg')}</div></div>
 <div class="ppos2"><div class="pmap"><span class="ln out"></span><span class="ln half"></span><span class="ln box"></span>${dots}</div>${feet(p)}</div>
 </div>
 <div class="fattrs"><div><div class="fah">${G[0][0]}</div>${col(G[0][1])}${G[3]?`<div class="fah">Portero</div>${col(G[3][1])}`:''}</div><div><div class="fah">${G[1][0]}</div>${col(G[1][1])}</div><div><div class="fah">${G[2][0]}</div>${col(G[2][1])}<div class="fah">Estado</div>${extra}</div></div>
 <div class="fstats">${[['PJ',s.pj||0],['Minutos',s.mi||0],['Goles',s.g||0],['Asist.',s.a||0],['Nota',s.pj?(s.rs/s.pj).toFixed(2):'—'],['MVP',s.mv||0],['Tarjetas',`${s.yc||0}/${s.rc||0}`],...(p.sp==='POR'||['DFC','LI','LD'].includes(p.sp)?[['Port. a 0',s.cs||0]]:[])].map(([l,v])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
 <div class="fstats fmon">${[['Valor',money(p.value)],['Sueldo/sem',money(p.wage)],['Contrato',esc(contractLabel(p).replace('Hasta junio de ','Jun. '))],...(p.team!=null&&!p.loan?[['Cláusula',money(p.cl||0)]]:[]),...(p.team!==S.user?[['Piden',money(askPrice(p))]]:[])].map(([l,v])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
}
