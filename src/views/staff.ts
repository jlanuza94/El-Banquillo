/* El Banquillo · views/staff.ts — Pantalla del cuerpo técnico. */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from '../core';
import {COUNTRIES} from '../data';
import {S,atCell,qc} from '../state';
import {contactNames,ST_AT,ST_ROLES,crew,crewWages,fireCost,medLevel,trainMult,youthMult,buyMult,judge} from '../staff';

const atRow=(m,keys)=>keys.map(k=>`<span class="stat-at" title="${ST_AT[k]}"><span class="small muted">${ST_AT[k]}</span> ${atCell(m.at[k])}</span>`).join('');
const pct=x=>`${x>=1?'+':''}${Math.round((x-1)*100)}%`;

function memberRow(m){
 const R=ST_ROLES[m.role];
 return `<div class="offer"><span class="t"><b>${esc(m.name)}</b> <span class="small muted">· ${m.age} años · ${esc(COUNTRIES[m.nat].code)} · ${money(m.wage)}/sem · contrato ${m.yrs<=1?'<b style="color:var(--loss)">acaba en junio</b>':m.yrs+' temporadas'}</span>
 <span class="row" style="gap:10px;margin-top:4px">${atRow(m,R.at)}</span>${m.role==='dd'?`<br><span class="small muted">Contactos en: <b>${esc(contactNames(m))}</b> (mejores precios y más información de esos países)</span>`:''}</span>
 ${m.yrs<=1?`<button class="btn sm" data-a="st-renew" data-id="${m.id}">Renovar</button>`:''}<button class="btn sm danger" data-a="st-fire" data-id="${m.id}">Despedir</button></div>`;
}
export function staffView(){
 const roles=Object.entries(ST_ROLES).map(([k,R])=>{const c=crew(k);return `<section class="panel"><div class="panel-h"><h2>${R.pl}</h2><span class="eyebrow">${c.length} de ${R.max}</span></div>
  <p class="small muted" style="margin:0 0 8px">${R.d}</p>${c.length?c.map(memberRow).join(''):`<div class="empty">Sin ${R.n.toLowerCase()}. Contrata uno abajo.</div>`}</section>`;}).join('');
 const eff=`<section class="panel"><div class="panel-h"><h2>Efecto en tu equipo</h2><span class="eyebrow">Sueldos ${money(crewWages())}/sem</span></div>
 <div class="kv" style="margin-top:0"><span>Mejora en el entrenamiento</span><b>${pct(trainMult())}</b><span>Mejora de la cantera</span><b>${pct(youthMult())}</b><span>Nivel médico</span><b>${medLevel().toFixed(1)} de 10</b><span>Precio de los fichajes</span><b>${pct(buyMult())}</b><span>Ojo para juzgar jugadores</span><b>${judge()} de 10</b></div>
 <p class="small muted" style="margin:8px 0 0">Los ojeadores se gestionan en <button class="linkname" data-a="view" data-v="cantera">Cantera y ojeo</button>.</p></section>`;
 const pool=(S.staffPool||[]).slice().sort((a,b)=>a.role.localeCompare(b.role));
 const cands=`<section class="panel"><div class="panel-h"><h2>Candidatos disponibles</h2><span class="eyebrow">Cambian cada 10 jornadas</span></div>
 ${pool.length?pool.map(m=>{const R=ST_ROLES[m.role],full=crew(m.role).length>=R.max;return `<div class="offer"><span class="t"><b>${esc(m.name)}</b> <span class="tag">${R.n}</span> <span class="small muted">· ${m.age} años · ${money(m.wage)}/sem</span><span class="row" style="gap:10px;margin-top:4px">${atRow(m,R.at)}</span>${m.role==='dd'?`<span class="small muted">Contactos en: ${esc(contactNames(m))}</span>`:''}</span><button class="btn sm primary" data-a="st-hire" data-id="${m.id}" ${full?'disabled title="Puesto completo"':''}>Contratar</button></div>`;}).join(''):'<div class="empty">No hay candidatos ahora mismo.</div>'}
 <p class="small muted" style="margin:8px 0 0">Firman por 2 temporadas. Despedir a alguien cuesta unas 12 semanas de sueldo por cada temporada de contrato que le quede.</p></section>`;
 return `<div class="grid"><div class="stack">${roles}</div><div class="stack">${eff}${cands}</div></div>`;
}
export function fireModal(m){return `<h2>¿Despedir a ${esc(m.name)}?</h2><p>Tendrás que pagarle una indemnización de <b>${money(fireCost(m))}</b>.</p><div class="acts"><button class="btn" data-a="modal-close">Cancelar</button><button class="btn danger" data-a="st-fire-ok" data-id="${m.id}">Despedir</button></div>`;}
