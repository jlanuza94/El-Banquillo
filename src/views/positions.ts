/* El Banquillo · views/positions.ts — Tácticas › Posiciones: toca un puesto y decide rol, cometido e instrucciones (como en FM). */
// @ts-nocheck — usa el estado heredado S.
import {slotCoords} from '../freeboard';
import {synergies,synergyMods} from '../synergy';
import {esc} from '../core';
import {GRP,ORDERS,SPN,posChip} from '../data';
import {PL,S,T,available,qBadge,squad} from '../state';
import {eff,slotsOf,userRoles} from '../tactics';
import {fLabel,formRows} from '../freeboard';
import {roleDef,roleList} from '../roles';
import {DUTIES,piList,posSummary,userPos} from '../positions';
import {hpos,nameBtn,VLINES,vCoords} from './common';
import {roleFam} from '../tactics2';

/** Abreviatura del rol (como en el FMM: DLI, MCE, DT…): iniciales del nombre del rol, o el puesto si no hay rol. */
function roleAbbr(s,rk){const n=(roleDef(s,rk)||[])[1]||s,w=n.replace(/\(.*\)/,'').split(/[\s-]+/).filter(x=>x&&!/^(de|del|la|el|en|a|y|al)$/i.test(x));return w.length>1?w.slice(0,3).map(x=>x[0].toUpperCase()).join(''):/^(central|portero)$/i.test(n)?s:n.slice(0,3).toUpperCase();}
export function posicionesHTML(){
 const t=T(S.user),sl=slotsOf(t.formation),ro=userRoles(),{du,pi}=userPos(sl);
 let sel=S.posSel;if(sel==null||sel>=sl.length)sel=S.posSel=Math.max(0,sl.indexOf('DC'));
 const SY=synergies(sl,ro,du,pi,t.lineup),SM=synergyMods(SY),link=i=>SY.find(x=>x[0]===sel&&x[1]===i||x[1]===sel&&x[0]===i),cnt=(i,v)=>SY.filter(x=>(x[0]===i||x[1]===i)&&Math.sign(x[2])===v).length;
 const nmOf=i=>{const p=PL(t.lineup[i]);return p?esc(p.name.split(' ').slice(1).join(' ')||p.name):sl[i];};
 // campo: filas de la formación, el ataque arriba
 const C=vCoords(t.formation),B={};C.forEach((c,i)=>{const key=Math.round(c.y/9);(B[key]=B[key]||[]).push({s:c.s,i,x:c.x,y:c.y});});const R=Object.keys(B).map(k=>({y:+k,it:B[k].sort((a,b)=>a.x-b.x)})).sort((a,b)=>a.y-b.y);
 const card=({s,i})=>{const p=PL(t.lineup[i]),d=DUTIES[du[i]]||DUTIES.apo,n=(pi[i]||[]).length;
  const lk=i!==sel&&link(i),g=cnt(i,1),b=cnt(i,-1);
  return `<button class="tchip${i===sel?' on':''}${lk?(lk[2]>0?' lk-g':' lk-b'):''}" style="${hpos(C[i].x,C[i].y)}" data-a="pos-sel" data-i="${i}">${g||b?`<span class="synb">${g?`<i class="g">+${g}</i>`:''}${b?`<i class="b">−${b}</i>`:''}</span>`:''}<span class="tpos du-${du[i]}">${esc(roleAbbr(s,ro[i]))}</span><b>${p?esc(p.name.split(' ').slice(1).join(' ')||p.name):'—'}</b><span class="du du-${du[i]}">${d.n}${n?` · ${n}`:''}</span></button>`;};
 const field=`<div class="vpitch tacp hp">${VLINES}<span class="atk">Ataque ▶</span>${R.map(r=>r.it.map(card).join('')).join('')}</div>`;
 // detalle del puesto elegido
 const s=sl[sel],p=PL(t.lineup[sel]),rk=ro[sel],myPi=pi[sel]||[];
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
 <button class="btn sm" data-a="vtab" data-k="tac" data-v="best" style="margin-top:10px">Ver los mejores de tu plantilla para cada puesto ›</button></section>`;
 const help=`<p class="small muted" style="margin:8px 0 0">Toca un puesto. El cometido decide cuánto ataca o defiende; las instrucciones afinan cómo juega. Todo se guarda en el puesto: el que entre desde el banquillo lo cumplirá.</p>`;
 const synP=`<section class="panel"><div class="panel-h"><h2>Sinergias del once</h2><span class="eyebrow">${SM.g} buenas · ${SM.b} malas</span></div>
 <p class="small muted" style="margin:0 0 6px">Efecto en el partido: ${SM.own>=1?'+':''}${Math.round((SM.own-1)*1000)/10}% en tus ocasiones y ${SM.opp<=1?'':'+'}${Math.round((SM.opp-1)*1000)/10}% en las del rival.</p>
 ${SY.length?SY.map(x=>`<div class="syn ${x[2]>0?'g':'b'}"><b>${x[2]>0?'✔':'✖'} ${sl[x[0]]} ${nmOf(x[0])} + ${sl[x[1]]} ${nmOf(x[1])}</b><span>${esc(x[3])}</span></div>`).join(''):'<p class="small muted" style="margin:0">Aún no hay parejas que se complementen. Combina roles: un lateral que sube con un extremo que se mete, un pivote con un organizador, un delantero que descarga con uno que remata…</p>'}</section>`;
 return `<div class="grid posgrid"><div class="stack"><section class="panel"><div class="panel-h"><h2>Tu once: roles e instrucciones</h2><span class="eyebrow">${esc(fLabel(t.formation))}</span></div>${field}${help}</section>${synP}</div><div class="stack">${det}</div></div>`;
}

/** Pestaña «Por puesto»: para cada puesto de tu formación, quién lo juega y los mejores de tu plantilla para él (con su rol). */
export function bestHTML(){
 const t=T(S.user),sl=slotsOf(t.formation),ro=userRoles(),C=vCoords(t.formation),L=squad(S.user).filter(x=>!x.loan);
 const order=sl.map((s,i)=>i).sort((a,b)=>C[b].y-C[a].y||C[a].x-C[b].x);
 const card=i=>{const s=sl[i],rk=ro[i],cur=PL(t.lineup[i]),best=L.map(x=>[x,eff(x,s,null,rk)]).sort((a,b)=>b[1]-a[1]).slice(0,4);
  return `<div class="bpc"><div class="bph"><span class="pos ${GRP[s]}">${s}</span><b>${esc(roleDef(s,rk)[1])}</b>${cur?`<span class="small muted">· ${esc(cur.name.split(' ').slice(-1)[0])}</span>`:'<span class="small muted">· vacío</span>'}</div>
  ${best.map(([x,v],k)=>{const on=t.lineup[i]===x.id,el=t.lineup.indexOf(x.id);return `<div class="bpr${on?' on':''}${available(x)?'':' dim'}"><span class="bpn">${k+1}</span><span class="bpnm">${nameBtn(x)}</span>${qBadge(v/10)}${on?'<span class="tag onxi">Juega</span>':`<button class="btn sm" data-a="pos-put" data-id="${x.id}" data-i="${i}" title="${el>=0?'Ahora juega de '+sl[el]:''}">${el>=0?'Mover':'Poner'}</button>`}</div>`;}).join('')}</div>`;};
 return `<section class="panel"><div class="panel-h"><h2>Mejores de tu plantilla por puesto</h2><span class="eyebrow">${esc(fLabel(t.formation))} · con el rol de cada puesto</span></div>
 <p class="small muted" style="margin:0 0 8px">Los cuatro mejores de tu plantilla para cada puesto de tu formación, contando el rol, la posición, el pie, los rasgos, la energía y el ánimo. «Poner» lo mete en ese puesto; «Mover», si ya es titular en otro.</p>
 <div class="bpg">${order.map(card).join('')}</div></section>`;
}
