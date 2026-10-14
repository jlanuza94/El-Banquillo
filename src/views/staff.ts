/* El Banquillo · views/staff.ts — Pantalla del cuerpo técnico. */
// @ts-nocheck — usa el estado heredado S.
import {DELEG,deleg} from '../delegate';
import {retiring,suggestRole} from '../mgrcareer';
import {staffMarket} from '../extras';
import {vtab} from './common';
import {PLANS,injRisk} from '../medical';
import {nf,nameBtn} from './common';
import {esc,money} from '../core';
import {COUNTRIES,posChip} from '../data';
import {S,T,atCell,qc,squad} from '../state';
import {clubTier,courseCost,staffMax,tierOf,contactNames,ST_AT,ST_ROLES,crew,makeStaff,crewLevel,crewWages,fireCost,medLevel,trainMult,youthMult,buyMult,judge} from '../staff';

const atRow=(m,keys)=>keys.map(k=>`<span class="stat-at" title="${ST_AT[k]}"><span class="small muted">${ST_AT[k]}</span> ${atCell(m.at[k])}</span>`).join('');
const pct=x=>`${x>=1?'+':''}${Math.round((x-1)*100)}%`;

const medal=t=>`<span class="smedal ${t[0]}" title="Nivel ${t[1]}">${'★'.repeat(t[2])}<b>${t[1]}</b></span>`;
const pl=(n,a,b)=>`${n} ${n===1?a:b}`;
const atBars=(m,keys)=>keys.map(k=>`<div class="sab"><span>${ST_AT[k]}</span><i><b class="${qc(m.at[k])}" style="width:${m.at[k]*10}%"></b></i><em>${m.at[k]}</em></div>`).join('');
function memberRow(m){
 const R=ST_ROLES[m.role],t=tierOf(m),cc=courseCost(m);
 return `<div class="stc ${t[0]}"><div class="stc-h"><span class="stc-av">${esc(m.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span><div style="min-width:0;flex:1"><b class="stc-n">${esc(m.name)}</b><small>${m.age} años · ${nf(m.nat)} ${esc(COUNTRIES[m.nat].code)}${m.ex?' · ex jugador':''}</small></div>${medal(t)}</div>
 <div class="stc-at">${atBars(m,R.at)}</div>
 <div class="stc-f"><span class="small muted">${money(m.wage)}/sem · ${m.yrs<=1?'<b style="color:var(--loss)">acaba en junio</b>':m.yrs+' temporadas'}</span>${m.role==='dd'?`<span class="small muted">Contactos: ${esc(contactNames(m))}</span>`:''}</div>
 <div class="stc-b">${m.course===S.seasonN?'<span class="tag">Curso hecho</span>':`<button class="btn sm primary" data-a="st-course" data-id="${m.id}" title="Sube sus atributos del puesto">📈 Formación · ${money(cc)}</button>`}${m.yrs<=1?`<button class="btn sm" data-a="st-renew" data-id="${m.id}">Renovar</button>`:''}<button class="btn sm danger" data-a="st-fire" data-id="${m.id}">Despedir</button></div></div>`;
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
 const tier=clubTier(),TN=['modesto','pequeño','mediano','grande','gigante'][tier];
 const roles=Object.entries(ST_ROLES).map(([k,R])=>{const c=crew(k),mx=staffMax(k),free=Math.max(0,mx-c.length);return `<section class="panel stp"><div class="panel-h"><h2>${R.pl}</h2><span class="eyebrow">${c.length} de ${mx}</span></div>
  <p class="small muted" style="margin:0 0 8px">${R.d}</p><div class="stgrid">${c.map(memberRow).join('')}${Array.from({length:free},()=>`<button class="stc empty" data-a="st-slot" data-v="${k}"><span class="stc-plus">+</span><b>Plaza libre</b><small>Contratar ${R.n.toLowerCase()}</small></button>`).join('')}</div></section>`;}).join('')
  +`<section class="panel stp"><div class="panel-h"><h2>Ojeadores</h2><span class="eyebrow">${(S.scouts||[]).length} de ${staffMax('sc')}</span></div><p class="small muted" style="margin:0 0 8px">Buscan jugadores y juveniles por el mundo. Se gestionan en <button class="linkname" data-a="view" data-v="cantera">Cantera y ojeo</button>.</p></section>`;
 const sizeP=`<div class="stsize"><b>Club ${TN}</b><span>Según tu división y tu economía puedes tener hasta ${pl(staffMax('ent'),'entrenador','entrenadores')}, ${pl(staffMax('fis'),'fisioterapeuta','fisioterapeutas')} y ${pl(staffMax('sc'),'ojeador','ojeadores')}. Los clubes grandes tienen más personal. Cada técnico tiene un nivel (bronce, plata, oro o élite) que sube con la experiencia y con un curso de formación por temporada.</span></div>`;
 const eff=`<section class="panel"><div class="panel-h"><h2>Efecto en tu equipo</h2><span class="eyebrow">Sueldos ${money(crewWages())}/sem</span></div>
 <div class="kv" style="margin-top:0"><span>Mejora en el entrenamiento</span><b>${pct(trainMult())}</b><span>Mejora de la cantera</span><b>${pct(youthMult())}</b><span>Nivel médico</span><b>${medLevel().toFixed(1)} de 10</b><span>Precio de los fichajes</span><b>${pct(buyMult())}</b><span>Ojo para juzgar jugadores</span><b>${judge()} de 10</b></div>
 <p class="small muted" style="margin:8px 0 0">Los ojeadores se gestionan en <button class="linkname" data-a="view" data-v="cantera">Cantera y ojeo</button>.</p></section>`;
 const fr=S.stRole&&ST_ROLES[S.stRole]?S.stRole:null,pool=(S.staffPool||[]).filter(m=>!fr||m.role===fr).slice().sort((a,b)=>a.role.localeCompare(b.role)||tierOf(b)[2]-tierOf(a)[2]);
 const cands=`<section class="panel"><div class="panel-h"><h2>Candidatos disponibles</h2><span class="eyebrow">Cambian cada 10 jornadas</span></div>
 <div class="seg" style="margin-bottom:10px;max-width:100%;overflow-x:auto"><button data-a="st-role" data-v="" aria-pressed="${!fr}">Todos</button>${Object.entries(ST_ROLES).map(([k,R])=>`<button data-a="st-role" data-v="${k}" aria-pressed="${fr===k}">${R.n}</button>`).join('')}</div>
 <div class="stgrid">${pool.length?pool.map(m=>{const R=ST_ROLES[m.role],full=crew(m.role).length>=staffMax(m.role),t=tierOf(m);return `<div class="stc ${t[0]}"><div class="stc-h"><span class="stc-av">${esc(m.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span><div style="min-width:0;flex:1"><b class="stc-n">${esc(m.name)}</b><small>${R.n} · ${m.age} años${m.ex?' · ex jugador':''}</small></div>${medal(t)}</div><div class="stc-at">${atBars(m,R.at)}</div><div class="stc-f"><span class="small muted">${money(m.wage)}/sem</span></div><div class="stc-b"><button class="btn sm primary" data-a="st-hire" data-id="${m.id}" ${full?'disabled title="Puesto completo"':''}>${full?'Puesto completo':'Contratar'}</button></div></div>`;}).join(''):'<div class="empty">No hay candidatos ahora.</div>'}</div>
 <p class="small muted" style="margin:8px 0 0">Firman por 2 temporadas. Despedir a alguien cuesta unas 12 semanas de sueldo por cada temporada de contrato que le quede.</p></section>`;
 const med=`<section class="panel">${medHTML()}</section>`;
 const R2=retiring(),retP=`<section class="panel"><div class="panel-h"><h2>Veteranos que se retiran</h2><span class="eyebrow">De jugador a técnico</span></div>
 <p class="small muted" style="margin:0 0 8px">Jugadores de 33 años o más que pueden colgar las botas este verano. Ofrécele un puesto: si acepta, al retirarse entra en tu cuerpo técnico. Su liderazgo, sus decisiones y su visión marcan qué tal entrenará. Aceptan más si es de tu plantilla y si tienes buena reputación.</p>
 ${R2.length?`<div class="tbl"><table><thead><tr><th>Pos</th><th>Jugador</th><th>Club</th><th class="r">Edad</th><th class="r">Liderazgo</th><th class="r">Decisiones</th><th>Puesto</th><th></th></tr></thead><tbody>${R2.map(p=>`<tr><td>${posChip(p)}</td><td>${nameBtn(p)}</td><td>${esc(T(p.team).short)}</td><td class="n">${p.age}</td><td class="n">${p.at.lid??'—'}</td><td class="n">${p.at.dec??'—'}</td><td>${p.toStaff?`<span class="tag onxi">Será ${esc(ST_ROLES[p.toStaff].n.toLowerCase())}</span>`:p.toStaffNo===S.seasonN?'<span class="tag">Dijo que no</span>':`<select id="rr_${p.id}" aria-label="Puesto para ${esc(p.name)}">${Object.entries(ST_ROLES).map(([k,R])=>`<option value="${k}" ${suggestRole(p)===k?'selected':''}>${R.n}</option>`).join('')}</select>`}</td><td class="r">${p.toStaff||p.toStaffNo===S.seasonN?'':`<button class="btn sm primary" data-a="st-offer" data-id="${p.id}">Ofrecer puesto</button>`}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay veteranos a punto de retirarse.</div>'}</section>`;
 const tb=vtab('st',[['eq','Tu personal'],['fich','Contratar'],['ret','Se retiran'],['club','De otros clubes'],['ef','Efectos'],['med','Parte médico']],'eq');
 return tb.bar+(tb.cur==='eq'?sizeP+`<div class="stroles">${roles}</div>`+delegHTML():tb.cur==='fich'?cands:tb.cur==='ret'?retP:tb.cur==='club'?clubStaffHTML():tb.cur==='ef'?eff:med);
}
export function fireModal(m){return `<h2>¿Despedir a ${esc(m.name)}?</h2><p>Tendrás que pagarle una indemnización de <b>${money(fireCost(m))}</b>.</p><div class="acts"><button class="btn" data-a="modal-close">Cancelar</button><button class="btn danger" data-a="st-fire-ok" data-id="${m.id}">Despedir</button></div>`;}

/** Delegar en tu cuerpo técnico: profundidad opcional. */
export function delegHTML(){
 return `<section class="panel"><div class="panel-h"><h2>Delegar en tu cuerpo técnico</h2><span class="eyebrow">Tú decides cuánto controlas</span></div>
 <div class="deleg">${Object.entries(DELEG).map(([k,x])=>`<button class="dlg ${deleg(k)?'on':''}" data-a="deleg" data-v="${k}" aria-pressed="${deleg(k)}"><b>${x.n}</b><span class="small">${x.d}</span><span class="dst">${deleg(k)?'Lo lleva tu cuerpo técnico':'Lo llevas tú'}</span></button>`).join('')}</div></section>`;
}
