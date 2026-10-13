/* El Banquillo · views/staff.ts — Pantalla del cuerpo técnico. */
// @ts-nocheck — usa el estado heredado S.
import {DELEG,deleg} from '../delegate';
import {staffMarket} from '../extras';
import {vtab} from './common';
import {PLANS,injRisk} from '../medical';
import {nf,nameBtn} from './common';
import {esc,money} from '../core';
import {COUNTRIES,posChip} from '../data';
import {S,T,atCell,qc,squad} from '../state';
import {contactNames,ST_AT,ST_ROLES,crew,makeStaff,crewLevel,crewWages,fireCost,medLevel,trainMult,youthMult,buyMult,judge} from '../staff';

const atRow=(m,keys)=>keys.map(k=>`<span class="stat-at" title="${ST_AT[k]}"><span class="small muted">${ST_AT[k]}</span> ${atCell(m.at[k])}</span>`).join('');
const pct=x=>`${x>=1?'+':''}${Math.round((x-1)*100)}%`;

function memberRow(m){
 const R=ST_ROLES[m.role];
 return `<div class="offer"><span class="t"><b>${esc(m.name)}</b>${m.ex?' <span class="tag">Ex jugador</span>':''} <span class="small muted">· ${m.age} años · ${nf(m.nat)} ${esc(COUNTRIES[m.nat].code)} · ${money(m.wage)}/sem · contrato ${m.yrs<=1?'<b style="color:var(--loss)">acaba en junio</b>':m.yrs+' temporadas'}</span>
 <span class="row" style="gap:10px;margin-top:4px">${atRow(m,R.at)}</span>${m.role==='dd'?`<br><span class="small muted">Contactos en: <b>${esc(contactNames(m))}</b> (mejores precios y más información de esos países)</span>`:''}</span>
 ${m.yrs<=1?`<button class="btn sm" data-a="st-renew" data-id="${m.id}">Renovar</button>`:''}<button class="btn sm danger" data-a="st-fire" data-id="${m.id}">Despedir</button></div>`;
}
/** Parte médico: lesionados con su plan de recuperación y jugadores con riesgo de lesión. */
export function medHTML(){
 const sq=squad(S.user).filter(p=>!p.loan),inj=sq.filter(p=>p.inj),risk=sq.filter(p=>!p.inj).map(p=>[p,injRisk(p)]).filter(x=>x[1].lv!=='bajo').sort((a,b)=>b[1].r-a[1].r).slice(0,8);
 return `<div class="panel-h"><h2>Parte médico</h2><span class="eyebrow">${inj.length} lesionado${inj.length===1?'':'s'}</span></div>
 ${inj.length?inj.map(p=>`<div class="offer">${posChip(p)}<span class="t">${nameBtn(p)} <span class="tag bad">${esc(String(p.injT||'Lesión'))}</span><br><span class="small muted">${p.inj} partido${p.inj>1?'s':''} de baja · plan ${PLANS[p.rplan||'n'].n.toLowerCase()}</span></span>${p.rplan?'':`<span class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm" data-a="rplan" data-id="${p.id}" data-v="c" title="${esc(PLANS.c.d)}">Conservador</button><button class="btn sm" data-a="rplan" data-id="${p.id}" data-v="a" title="${esc(PLANS.a.d)}">Acelerado</button></span>`}</div>`).join(''):'<div class="empty">Nadie lesionado. ¡Que dure!</div>'}
 <p class="small muted" style="margin:8px 0 0">${Object.values(PLANS).map(x=>`<b>${x.n}</b>: ${x.d}`).join(' ')}</p>
 ${risk.length?`<h3 style="margin:14px 0 6px">Riesgo de lesión</h3>${risk.map(([p,k])=>`<div class="offer">${posChip(p)}<span class="t">${nameBtn(p)} <span class="tag ${k.lv==='alto'?'bad':''}">Riesgo ${k.lv}</span><br><span class="small muted">${esc(k.why.join(', '))}</span></span></div>`).join('')}<p class="small muted" style="margin:6px 0 0">Darles descanso, rotar o bajar la intensidad del entrenamiento reduce el riesgo.</p>`:''}`;
}
/** Técnicos que trabajan en otros clubes: mejores, pero hay que pagar su indemnización. Traen lo que saben. */
function clubStaffHTML(){const L=staffMarket(makeStaff,crewLevel);
 return `<section class="panel"><div class="panel-h"><h2>Técnicos de otros clubes</h2><span class="eyebrow">Se renueva en cada mitad de temporada</span></div>
 <p class="small muted" style="margin:0 0 8px">Son mejores que los libres, pero su club pide una indemnización. Y traen sus conocimientos: un segundo domina su sistema favorito (tu equipo lo aprende de golpe) y un director deportivo trae sus contactos (conoces mejor a los jugadores de su liga).</p>
 ${L.length?L.map(m=>{const R=ST_ROLES[m.role];return `<div class="offer"><span class="t"><b>${esc(m.name)}</b> <span class="tag">${R.n}</span> <span class="small muted">· en ${esc(T(m.club).name)} · ${m.age} años</span><br>${R.at.map(k=>`<span class="small">${ST_AT[k]} <b>${m.at[k]}</b></span>`).join(' · ')}${m.form?` · <span class="small">domina el <b>${m.form}</b></span>`:''}<br><span class="small muted">Sueldo ${money(m.wage)}/sem · indemnización ${money(m.fee)}</span></span><button class="btn sm ${S.budget>=m.fee?'primary':''}" data-a="staff-club" data-id="${m.id}">Fichar</button></div>`;}).join(''):'<div class="empty">No hay técnicos disponibles esta temporada.</div>'}</section>`;}
export function staffView(){
 const roles=Object.entries(ST_ROLES).map(([k,R])=>{const c=crew(k);return `<section class="panel"><div class="panel-h"><h2>${R.pl}</h2><span class="eyebrow">${c.length} de ${R.max}</span></div>
  <p class="small muted" style="margin:0 0 8px">${R.d}</p>${c.length?c.map(memberRow).join(''):`<div class="empty">Sin ${R.n.toLowerCase()}. Contrata uno abajo.</div>`}</section>`;}).join('');
 const eff=`<section class="panel"><div class="panel-h"><h2>Efecto en tu equipo</h2><span class="eyebrow">Sueldos ${money(crewWages())}/sem</span></div>
 <div class="kv" style="margin-top:0"><span>Mejora en el entrenamiento</span><b>${pct(trainMult())}</b><span>Mejora de la cantera</span><b>${pct(youthMult())}</b><span>Nivel médico</span><b>${medLevel().toFixed(1)} de 10</b><span>Precio de los fichajes</span><b>${pct(buyMult())}</b><span>Ojo para juzgar jugadores</span><b>${judge()} de 10</b></div>
 <p class="small muted" style="margin:8px 0 0">Los ojeadores se gestionan en <button class="linkname" data-a="view" data-v="cantera">Cantera y ojeo</button>.</p></section>`;
 const pool=(S.staffPool||[]).slice().sort((a,b)=>a.role.localeCompare(b.role));
 const cands=`<section class="panel"><div class="panel-h"><h2>Candidatos disponibles</h2><span class="eyebrow">Cambian cada 10 jornadas</span></div>
 ${pool.length?pool.map(m=>{const R=ST_ROLES[m.role],full=crew(m.role).length>=R.max;return `<div class="offer"><span class="t"><b>${esc(m.name)}</b> <span class="tag">${R.n}</span>${m.ex?` <span class="tag xi">Ex jugador${m.from?' de '+esc(m.from):''}</span>`:''} <span class="small muted">· ${m.age} años · ${money(m.wage)}/sem</span><span class="row" style="gap:10px;margin-top:4px">${atRow(m,R.at)}</span>${m.role==='dd'?`<span class="small muted">Contactos en: ${esc(contactNames(m))}</span>`:''}</span><button class="btn sm primary" data-a="st-hire" data-id="${m.id}" ${full?'disabled title="Puesto completo"':''}>Contratar</button></div>`;}).join(''):'<div class="empty">No hay candidatos ahora mismo.</div>'}
 <p class="small muted" style="margin:8px 0 0">Firman por 2 temporadas. Despedir a alguien cuesta unas 12 semanas de sueldo por cada temporada de contrato que le quede.</p></section>`;
 const med=`<section class="panel">${medHTML()}</section>`;
 const tb=vtab('st',[['eq','Tu cuerpo técnico'],['fich','Contratar'],['club','De otros clubes'],['ef','Efectos'],['med','Parte médico']],'eq');
 return tb.bar+(tb.cur==='eq'?delegHTML()+`<div class="grid">${roles}</div>`:tb.cur==='fich'?cands:tb.cur==='club'?clubStaffHTML():tb.cur==='ef'?eff:med);
}
export function fireModal(m){return `<h2>¿Despedir a ${esc(m.name)}?</h2><p>Tendrás que pagarle una indemnización de <b>${money(fireCost(m))}</b>.</p><div class="acts"><button class="btn" data-a="modal-close">Cancelar</button><button class="btn danger" data-a="st-fire-ok" data-id="${m.id}">Despedir</button></div>`;}

/** Delegar en tu cuerpo técnico: profundidad opcional. */
export function delegHTML(){
 return `<section class="panel"><div class="panel-h"><h2>Delegar en tu cuerpo técnico</h2><span class="eyebrow">Tú decides cuánto controlas</span></div>
 <div class="deleg">${Object.entries(DELEG).map(([k,x])=>`<button class="dlg ${deleg(k)?'on':''}" data-a="deleg" data-v="${k}" aria-pressed="${deleg(k)}"><b>${x.n}</b><span class="small">${x.d}</span><span class="dst">${deleg(k)?'Lo lleva tu cuerpo técnico':'Lo llevas tú'}</span></button>`).join('')}</div></section>`;
}
