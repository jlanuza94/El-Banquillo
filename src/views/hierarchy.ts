/* El Banquillo · views/hierarchy.ts — Jerarquía del vestuario (como «Dinámica › Jerarquía» del FM): líderes, muy influyentes,
 * influyentes y el resto, con la capitanía y los grupos sociales. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {PERS,ROLES,posChip} from '../data';
import {S,T,squad} from '../state';
import {influence,langOf} from '../tactics';
import {faceSVG} from './pcard';

const TIERS=[['lid','Líderes del equipo',3,'Marcan el ambiente: si están contentos, tiran del resto; si se enfadan, contagian a su grupo. Venderlos sienta mal.'],
 ['muy','Muy influyentes',5,'Tienen voz en el vestuario y su opinión pesa en los nuevos.'],
 ['inf','Influyentes',6,'Se les escucha, sobre todo dentro de su grupo.'],
 ['otr','Otros',99,'Jóvenes, recién llegados o con poco peso todavía. Jugando y ganando suben.']];
const LN={es:'Hispanohablantes',en:'Angloparlantes',it:'Italianos',de:'Germanoparlantes',fr:'Francófonos',pt:'Lusófonos',nl:'Neerlandeses',tr:'Turcos',ja:'Japoneses'};
const mood=p=>{const h=p.hap==null?70:p.hap;return h>=75?'😀':h>=55?'🙂':h>=40?'😐':h>=25?'🙁':'😠';};

export function jerarquiaHTML(){
 const t=T(S.user),sq=squad(S.user).filter(p=>!p.loan),R=sq.map(p=>[p,influence(p,sq)]).sort((a,b)=>b[1]-a[1]),vc=t.vc||[];
 const tag=p=>t.cap===p.id?'<span class="jtag cap">C</span>':vc.includes(p.id)?'<span class="jtag">VC</span>':'';
 const card=([p,v])=>`<button class="jcard" data-a="ficha" data-id="${p.id}">${tag(p)}${faceSVG(p)}<b>${esc(p.name.split(' ').slice(-1)[0])}</b><small>${posChip(p)} ${p.age} años</small><span class="jinf"><i style="width:${Math.min(100,v)}%"></i></span><small>${PERS[p.per||'nor'].n} · ${(ROLES[p.role||'ro']||ROLES.ro).n} ${mood(p)}</small></button>`;
 let k=0;const tiers=TIERS.map(([id,n,c,d])=>{const L=R.slice(k,k+c);k+=L.length;return L.length?`<div class="jtier jt-${id}"><div class="jth"><b>${n}</b><span class="small muted">${esc(d)}</span></div><div class="jrow">${L.map(card).join('')}</div></div>`:'';}).join('');
 const opt=(id,cur)=>`<select id="${id}"><option value="">${id==='t-cap'?'Automático':'—'}</option>${sq.map(p=>`<option value="${p.id}" ${cur===p.id?'selected':''}>${esc(p.name)} · liderazgo ${(p.at.lid??5)*10}</option>`).join('')}</select>`;
 const groups={};sq.forEach(p=>{const l=langOf(p);(groups[l]=groups[l]||[]).push(p);});const G=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length);
 const avg=sq.length?Math.round(sq.reduce((a,p)=>a+(p.hap||70),0)/sq.length):70,unhappyLead=R.slice(0,8).filter(([p])=>(p.hap||70)<40);
 return `<div class="grid jgrid"><section class="panel"><div class="panel-h"><h2>Jerarquía del vestuario</h2><span class="eyebrow">Ambiente ${avg}/100</span></div>
 ${unhappyLead.length?`<p class="small" style="margin:0 0 8px;color:var(--loss)">⚠ ${unhappyLead.map(([p])=>esc(p.name)).join(', ')} ${unhappyLead.length>1?'están descontentos':'está descontento'} y ${unhappyLead.length>1?'tienen':'tiene'} mucho peso: habla con ${unhappyLead.length>1?'ellos':'él'} antes de que contagie al grupo.</p>`:''}
 ${tiers}</section>
 <div class="stack"><section class="panel"><div class="panel-h"><h2>Felicidad del vestuario</h2><span class="eyebrow">${avg}/100</span></div><div class="hapd">${[['😀','Muy contentos',p=>(p.hap??70)>=75],['🙂','Contentos',p=>(p.hap??70)>=55&&(p.hap??70)<75],['😐','Normales',p=>(p.hap??70)>=40&&(p.hap??70)<55],['🙁','Descontentos',p=>(p.hap??70)>=25&&(p.hap??70)<40],['😠','Enfadados',p=>(p.hap??70)<25]].map(([e,l,f])=>{const n=sq.filter(f).length;return `<div><span>${e}</span><i><b style="width:${sq.length?Math.round(n/sq.length*100):0}%"></b></i><em>${n}</em><small>${l}</small></div>`;}).join('')}</div></section>
 <section class="panel"><div class="panel-h"><h2>Capitanía</h2></div>
 <div class="filters" style="grid-template-columns:1fr"><label class="f"><span class="eyebrow">Capitán</span>${opt('t-cap',t.cap)}</label><label class="f"><span class="eyebrow">Vicecapitán</span>${opt('t-vc0',vc[0])}</label><label class="f"><span class="eyebrow">Segundo vicecapitán</span>${opt('t-vc1',vc[1])}</label></div>
 <p class="small muted" style="margin:6px 0 0">El capitán gana influencia. Con buen liderazgo calma a los descontentos; si elige a alguien con poco peso, los líderes pueden molestarse.</p></section>
 <section class="panel"><div class="panel-h"><h2>Grupos sociales</h2></div>
 ${G.map(([l,ps],i)=>{const h=Math.round(ps.reduce((a,p)=>a+(p.hap??70),0)/ps.length);return `<div class="offer"><span class="t"><b>${i===0?'Grupo principal':ps.length===1?'Aislado':'Grupo secundario'}</b> · ${LN[l]||l} · ${ps.length} <span class="ghap"><i style="width:${h}%" class="${h>=65?'ok':h>=45?'mid':'low'}"></i></span> <b>${h}</b> ${mood({hap:h})}<br><span class="small muted">${ps.map(p=>esc(p.name.split(' ').slice(-1)[0])+(p.adapt>0?' (adaptándose)':'')).join(', ')}</span></span></div>`;}).join('')}
 <p class="small muted" style="margin:6px 0 0">Los fichajes se adaptan antes si en el vestuario hay compañeros que hablan su idioma.</p></section></div></div>`;
}
