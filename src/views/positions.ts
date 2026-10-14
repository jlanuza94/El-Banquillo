/* El Banquillo · views/positions.ts — Tácticas › Posiciones: toca un puesto y decide rol, cometido e instrucciones (como en FM). */
// @ts-nocheck — usa el estado heredado S.
import {synergies,synergyMods} from '../synergy';
import {esc} from '../core';
import {GRP,ORDERS,SPN,posChip} from '../data';
import {PL,S,T,available,qBadge,squad} from '../state';
import {eff,slotsOf,userRoles} from '../tactics';
import {formRows} from '../freeboard';
import {roleDef,roleList} from '../roles';
import {DUTIES,piList,posSummary,userPos} from '../positions';
import {nameBtn} from './common';
import {roleFam} from '../tactics2';

export function posicionesHTML(){
 const t=T(S.user),sl=slotsOf(t.formation),ro=userRoles(),{du,pi}=userPos(sl);
 let sel=S.posSel;if(sel==null||sel>=sl.length)sel=S.posSel=Math.max(0,sl.indexOf('DC'));
 const SY=synergies(sl,ro,du,pi,t.lineup),SM=synergyMods(SY),link=i=>SY.find(x=>x[0]===sel&&x[1]===i||x[1]===sel&&x[0]===i),cnt=(i,v)=>SY.filter(x=>(x[0]===i||x[1]===i)&&Math.sign(x[2])===v).length;
 const nmOf=i=>{const p=PL(t.lineup[i]);return p?esc(p.name.split(' ').slice(1).join(' ')||p.name):sl[i];};
 // campo: filas de la formación, el ataque arriba
 const rows=[[['POR'],89]].concat(formRows(t.formation));let k=0;const R=rows.map(([list,y])=>({y,it:list.map(s=>({s,i:k++}))})).sort((a,b)=>a.y-b.y);
 const card=({s,i})=>{const p=PL(t.lineup[i]),d=DUTIES[du[i]]||DUTIES.apo,n=(pi[i]||[]).length;
  const lk=i!==sel&&link(i),g=cnt(i,1),b=cnt(i,-1);
  return `<button class="pcard${i===sel?' on':''}${lk?(lk[2]>0?' lk-g':' lk-b'):''}" data-a="pos-sel" data-i="${i}">${g||b?`<span class="synb">${g?`<i class="g">+${g}</i>`:''}${b?`<i class="b">−${b}</i>`:''}</span>`:''}<span class="pos ${GRP[s]}">${s}</span><b>${p?esc(p.name.split(' ').slice(1).join(' ')||p.name):'—'}</b><span class="rl">${esc(roleDef(s,ro[i])[1])}</span><span class="du du-${du[i]}">${d.n}${n?` · ${n} instr.`:''}</span></button>`;};
 const field=`<div class="pfield">${R.map(r=>`<div class="prow">${r.it.map(card).join('')}</div>`).join('')}</div>`;
 // detalle del puesto elegido
 const s=sl[sel],p=PL(t.lineup[sel]),rk=ro[sel],myPi=pi[sel]||[];
 const best=squad(S.user).filter(x=>!x.loan&&available(x)).map(x=>[x,eff(x,s,null,rk)]).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const det=`<section class="panel pdet"><div class="panel-h"><h2>${esc(SPN[s]||s)}</h2><span class="eyebrow">${p?esc(p.name)+' · '+(eff(p,s,null,rk)/10).toFixed(1):'Sin jugador'}</span></div>
 <div class="eyebrow" style="margin:2px 0 4px">Rol</div>
 <select data-role="${sel}" aria-label="Rol del puesto ${s}" style="max-width:100%">${roleList(s).map(r=>`<option value="${r[0]}" ${rk===r[0]?'selected':''}>${esc(r[1])}${p?' · '+(eff(p,s,null,r[0])/10).toFixed(1):''}</option>`).join('')}</select>
 <p class="small muted" style="margin:4px 0 10px">${esc(roleDef(s,rk)[4])}${p?` <b>Dominio del rol: ${Math.round(roleFam(p,rk))}%</b> (sube jugando en él; más alto, mejor rinde).`:''}</p>
 ${s!=='POR'?`<div class="eyebrow" style="margin:0 0 4px">Cometido</div><div class="seg">${Object.entries(DUTIES).map(([k,v])=>`<button data-a="duty" data-i="${sel}" data-v="${k}" aria-pressed="${du[sel]===k}">${v.n}</button>`).join('')}</div>
 <p class="small muted" style="margin:4px 0 10px">${esc((DUTIES[du[sel]]||DUTIES.apo).d)}</p>`:''}
 <div class="eyebrow" style="margin:0 0 4px">Instrucciones del puesto</div>
 <div class="pis">${piList(s).map(([k,n,,d])=>`<button class="pi${myPi.includes(k)?' on':''}" data-a="pi-tog" data-i="${sel}" data-v="${k}" aria-pressed="${myPi.includes(k)}" title="${esc(d)}"><b>${myPi.includes(k)?'✓ ':''}${esc(n)}</b><span>${esc(d)}</span></button>`).join('')}</div>
 ${p?`<div class="eyebrow" style="margin:10px 0 4px">Orden especial para ${esc(p.name.split(' ').slice(1).join(' ')||p.name)}</div><select data-ord="${p.id}" aria-label="Orden para ${esc(p.name)}">${Object.entries(ORDERS).map(([k,v])=>`<option value="${k}" ${((t.orders||{})[p.id]||'')===k?'selected':''}>${v}</option>`).join('')}</select>`:''}
 ${(()=>{const L=SY.filter(x=>x[0]===sel||x[1]===sel);return `<div class="eyebrow" style="margin:10px 0 4px">Sinergias de este puesto</div>${L.length?L.map(x=>{const o=x[0]===sel?x[1]:x[0];return `<div class="syn ${x[2]>0?'g':'b'}"><b>${x[2]>0?'✔':'✖'} Con ${sl[o]} (${nmOf(o)})</b><span>${esc(x[3])}</span></div>`;}).join(''):'<p class="small muted" style="margin:0">Sin parejas destacadas. Prueba a combinar su rol y su cometido con los de sus compañeros de banda o de línea.</p>'}`;})()}
 <div class="offer" style="margin-top:10px"><span class="t"><b>Efecto de este puesto</b><br><span class="small muted">${esc(posSummary(s,du[sel],myPi))}</span></span></div>
 <div class="eyebrow" style="margin:10px 0 4px">Mejores de tu plantilla para ${s} (${esc(roleDef(s,rk)[1])})</div>
 ${best.map(([x,v])=>`<div class="offer">${posChip(x)}<span class="t">${nameBtn(x)}</span>${qBadge(v/10)}${t.lineup[sel]===x.id?'<span class="tag onxi">Juega aquí</span>':`<button class="btn sm" data-a="pos-put" data-id="${x.id}" data-i="${sel}">Poner</button>`}</div>`).join('')}</section>`;
 const help=`<p class="small muted" style="margin:8px 0 0">Toca un puesto. El cometido decide cuánto ataca o defiende; las instrucciones afinan cómo juega. Todo se guarda en el puesto: el que entre desde el banquillo lo cumplirá.</p>`;
 const synP=`<section class="panel"><div class="panel-h"><h2>Sinergias del once</h2><span class="eyebrow">${SM.g} buenas · ${SM.b} malas</span></div>
 <p class="small muted" style="margin:0 0 6px">Efecto en el partido: ${SM.own>=1?'+':''}${Math.round((SM.own-1)*1000)/10}% en tus ocasiones y ${SM.opp<=1?'':'+'}${Math.round((SM.opp-1)*1000)/10}% en las del rival.</p>
 ${SY.length?SY.map(x=>`<div class="syn ${x[2]>0?'g':'b'}"><b>${x[2]>0?'✔':'✖'} ${sl[x[0]]} ${nmOf(x[0])} + ${sl[x[1]]} ${nmOf(x[1])}</b><span>${esc(x[3])}</span></div>`).join(''):'<p class="small muted" style="margin:0">Aún no hay parejas que se complementen. Combina roles: un lateral que sube con un extremo que se mete, un pivote con un organizador, un delantero que descarga con uno que remata…</p>'}</section>`;
 return `<div class="grid posgrid"><div class="stack"><section class="panel"><div class="panel-h"><h2>Tu once: roles e instrucciones</h2><span class="eyebrow">${esc(t.formation)}</span></div>${field}${help}</section>${synP}</div><div class="stack">${det}</div></div>`;
}
