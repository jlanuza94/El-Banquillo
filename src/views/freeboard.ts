/* El Banquillo · views/freeboard.ts — Pizarra táctica libre: arrastra a cada jugador (o tócalo y toca dónde ponerlo). */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {FORMS,GRP,ORDERS,SPN} from '../data';
import {PL,S,T,crestStyle} from '../state';
import {FREE,freeCoords,freeWarn,spAt} from '../freeboard';
import {famOf} from '../tactics';

export function boardHTML(){
 const t=T(S.user);
 if(t.formation!==FREE)return `<section class="panel"><div class="panel-h"><h2>Pizarra táctica libre</h2><span class="eyebrow">Mueve a cada jugador</span></div>
 <p class="small muted" style="margin:0 0 10px">Coloca a cada jugador donde quieras del campo: su puesto sale de la zona (lateral, central, pivote, mediapunta, extremo, delantero…). El equipo rinde según cuántos defensas, medios y delanteros dejes y lo bien que juega cada uno en su puesto. Una pizarra nueva hay que trabajarla: empieza con poco dominio.</p>
 <button class="btn primary" data-a="fb-start">Abrir la pizarra con tu ${esc(t.formation)}</button></section>`;
 const C=freeCoords(),sp=C.map((c,i)=>i?spAt(c.x,c.y):'POR'),n=g=>sp.filter(s=>GRP[s]===g).length,w=freeWarn(),ords=t.orders||{};
 const dots=C.map((c,i)=>{const p=PL(t.lineup[i]);const nm=p?p.name.split(' ').slice(1).join(' '):'Vacío';
  return `<button class="fbdot${i===0?' gk':''}${S.fbSel===i-1&&i?' sel':''}" ${i?`data-fb="${i-1}"`:'disabled'} style="left:${c.x}%;top:${c.y}%;${crestStyle(t)}" aria-label="${esc(SPN[sp[i]])}: ${esc(nm)}"><span class="sh">${p?p.num:'+'}</span><span class="fbsp">${sp[i]}</span><span class="nm">${esc(nm)}</span>${p&&ords[p.id]?`<span class="fbord">${ords[p.id]==='sube'?'↑':ords[p.id]==='fija'?'↓':ords[p.id]==='libre'?'★':'◎'}</span>`:''}</button>`;}).join('');
 return `<section class="panel"><div class="panel-h"><h2>Pizarra táctica libre</h2><span class="eyebrow">${n('DEF')}-${n('MED')}-${n('DEL')} · dominio ${Math.round(famOf(FREE))}%</span></div>
 <p class="small muted" style="margin:0 0 8px">Arrastra a un jugador, o tócalo y luego toca el sitio del campo. La zona decide su puesto. Abajo, su orden en ataque y defensa.</p>
 <div class="fbpitch" data-a="fb-place" aria-label="Campo: toca para colocar al jugador seleccionado"><div class="fbz z1"></div><div class="fbz z2"></div><div class="fbz z3"></div><div class="fbz z4"></div><div class="fbmid"></div>${dots}</div>
 ${w?`<div class="negmsg no" style="margin-top:8px">${esc(w)}</div>`:''}
 <div class="row" style="margin:10px 0 4px;flex-wrap:wrap;gap:6px"><span class="small muted">Empezar desde:</span>${Object.keys(FORMS).slice(0,6).map(f=>`<button class="btn sm" data-a="fb-from" data-v="${f}">${f}</button>`).join('')}</div>
 <div class="tbl" style="margin-top:8px"><table><thead><tr><th>Puesto</th><th>Jugador</th><th>Orden en ataque y defensa</th></tr></thead><tbody>
 ${C.slice(1).map((c,i)=>{const p=PL(t.lineup[i+1]);return `<tr><td><b>${sp[i+1]}</b></td><td>${p?esc(p.name):'—'}</td><td>${p?`<select data-ord="${p.id}" aria-label="Orden para ${esc(p.name)}">${Object.entries(ORDERS).map(([k,v])=>`<option value="${k}" ${(ords[p.id]||'')===k?'selected':''}>${v}</option>`).join('')}</select>`:''}</td></tr>`;}).join('')}</tbody></table></div></section>`;
}
