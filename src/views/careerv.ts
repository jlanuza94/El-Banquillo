/* El Banquillo · views/careerv.ts — Club › Mi carrera: tu perfil de entrenador (nivel, licencias y cursos,
 * especialidades, mentor, red de contactos, trayectoria e insignias) y la entrevista de trabajo. */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from '../core';
import {S,T,crest,lgName,qc} from '../state';
import {MGR_AT,mgrAt} from '../extras2';
import {BADGES,CURSOS,LICS,SPECS,badges,courseBlock,courseFee,interviewQs,levelXp,licence,mentorCands,mgrLevel,network,reqLic} from '../mgrcareer';

export function careerHTML(){
 const M=S.mgr,lic=licence(),lvl=mgrLevel(),x0=levelXp(lvl),x1=levelXp(lvl+1),xp=M.xp||0,bd=badges(),to=lic+1,C=CURSOS[to],blk=courseBlock(),need=reqLic(T(S.user));
 const bar=(v,cls='')=>`<span class="abar" style="display:block"><i class="${cls||qc(v/10)}" style="width:${Math.max(0,Math.min(100,v))}%"></i></span>`;
 const prof=`<section class="panel"><div class="panel-h"><h2>Tu perfil</h2><span class="eyebrow">${M.seasons||0} temporada${(M.seasons||0)===1?'':'s'} · ${M.games||0} partidos · ${M.wins||0} victorias</span></div>
 <div class="cprof"><div class="clvl"><b>${lvl}</b><span>Nivel</span></div><div style="flex:1;min-width:0"><div class="kv" style="margin:0"><span>Reputación</span><b>${Math.round(M.rep)}/100</b><span>Licencia</span><b>${LICS[lic][0]}</b><span>Experiencia</span><b>${xp} / ${x1} XP</b></div>${bar((xp-x0)/(x1-x0)*100,'q4')}</div></div>
 ${lic<need?`<div class="negmsg no" style="margin-top:8px">Tu división exige la ${LICS[need][0]}. Sácala cuanto antes o la directiva perderá confianza.</div>`:''}</section>`;
 const licP=`<section class="panel"><div class="panel-h"><h2>Licencias</h2><span class="eyebrow">Como en la vida real: C → B → A → Pro</span></div>
 <div class="lics">${LICS.map((x,i)=>`<div class="lic${i<=lic?' on':''}${i===lic?' cur':''}"><b>${['C','B','A','PRO'][i]}</b><span>${x[0]}</span><small>${i===0?'Fútbol base y amateur':i===1?'Divisiones bajas':i===2?'Primera de ligas medianas':'Élite y selecciones'}</small></div>`).join('')}</div>
 ${M.course?`<div class="ccourse"><b>📚 Cursando la ${CURSOS[M.course.to].n}</b><span class="small muted">Quedan ${M.course.left} jornada${M.course.left===1?'':'s'}</span>${bar((1-M.course.left/M.course.tot)*100,'q4')}</div>`
 :C?`<div class="ccourse"><b>Siguiente: ${C.n}</b><span class="small muted">${C.wk} jornadas · ${money(courseFee(to))} (de tus ahorros: ${money(M.savings||0)}) · requisitos: ${C.seasons} temporada${C.seasons===1?'':'s'} y reputación ${C.rep}</span>${blk?`<span class="small" style="color:var(--loss)">${esc(blk)}</span>`:''}<button class="btn sm primary" data-a="car-course" ${blk?'disabled':''}>Apuntarme al curso</button></div>`:'<p class="small muted">Tienes la licencia más alta. Puedes entrenar cualquier club y selección.</p>'}
 <p class="small muted" style="margin:8px 0 0">Los clubes de Primera piden la Licencia A (la Pro en las ligas fuertes) y las federaciones, al menos la A para ser seleccionador.</p></section>`;
 const sp=M.spec||[],spP=`<section class="panel"><div class="panel-h"><h2>Especialidades</h2><span class="eyebrow">${sp.length} de ${lic}</span></div>
 <p class="small muted" style="margin:0 0 8px">Cada licencia te deja elegir una especialidad para siempre.</p><div class="specs">${Object.entries(SPECS).map(([k,s_])=>{const on=sp.includes(k),can=!on&&sp.length<lic;return `<div class="spec${on?' on':''}"><span>${s_[0]}</span><b>${s_[1]}</b><small>${s_[2]}</small>${on?'<em>Tu especialidad</em>':can?`<button class="btn sm primary" data-a="car-spec" data-v="${k}">Elegir</button>`:''}</div>`;}).join('')}</div></section>`;
 const atP=`<section class="panel"><div class="panel-h"><h2>Tus atributos</h2><span class="eyebrow">Mejoran con la experiencia</span></div>${Object.entries(MGR_AT).map(([k,n])=>`<div class="arow" style="grid-template-columns:110px minmax(0,1fr) 34px"><span>${n}</span>${bar(mgrAt(k)*10)}<b class="num">${mgrAt(k).toFixed(1)}</b></div>`).join('')}</section>`;
 const mc=mentorCands(),mP=`<section class="panel"><div class="panel-h"><h2>Mentor</h2><span class="eyebrow">Aprende de los mejores</span></div>
 ${M.mentor?`<p style="margin:0">Tu mentor es <b>${esc(M.mentor.name)}</b>${T(M.mentor.tid)?` (${esc(T(M.mentor.tid).name)})`:''}. Cada semana ganas experiencia y al final de la temporada mejoras un atributo.</p>`
 :mc.length?`<p class="small muted" style="margin:0 0 6px">Pide a un entrenador de más prestigio que te guíe (una vez por temporada).</p>${mc.map(c=>`<div class="offer">${crest(T(c.tid),'sm')}<span class="t"><b>${esc(c.name)}</b> <span class="small muted">· ${esc(T(c.tid).name)} · prestigio ${c.rep}</span></span><button class="btn sm" data-a="car-mentor" data-id="${c.tid}" ${M.mentorAsk===S.seasonN?'disabled':''}>Pedir</button></div>`).join('')}`:'<p class="small muted">Ahora mismo no hay entrenadores de más prestigio disponibles.</p>'}</section>`;
 const net=network().slice(0,8),nP=`<section class="panel"><div class="panel-h"><h2>Red de contactos</h2><span class="eyebrow">${network().length} clubes</span></div>
 ${net.length?net.map(e=>`<div class="offer">${crest(T(e.id),'sm')}<span class="t"><b>${esc(T(e.id).name)}</b> <span class="small muted">· ${esc(lgName(T(e.id).lg,true))} · ${esc(e.why)}</span></span><span class="tag">${'●'.repeat(Math.min(5,e.v))}</span></div>`).join(''):'<p class="small muted" style="margin:0">Haz traspasos y entrena clubes: los que te conocen te dan más opciones en las entrevistas.</p>'}</section>`;
 const hP=`<section class="panel"><div class="panel-h"><h2>Trayectoria</h2></div><ul class="news">${(M.clubs||[]).slice().reverse().map(c=>`<li><span class="wk">${esc(c.season)}</span><span class="t">Firmas por <b>${esc(c.club)}</b></span></li>`).join('')}</ul></section>`;
 const bP=`<section class="panel"><div class="panel-h"><h2>Insignias</h2><span class="eyebrow">${bd.length} de ${Object.keys(BADGES).length}</span></div><div class="badges">${Object.entries(BADGES).map(([k,b])=>`<div class="bdg${bd.includes(k)?' on':''}" title="${esc(b[2])}"><span>${b[0]}</span><b>${b[1]}</b><small>${bd.includes(k)?'Conseguida':esc(b[2])}</small></div>`).join('')}</div></section>`;
 return {left:prof+licP+spP+mP,right:atP+nP+bP+hP};
}
/** Entrevista de trabajo: tres preguntas; tus respuestas cuentan para que te elijan. */
export function interviewModal(md){const t=T(md.tid),Q=interviewQs(t),q=Q[md.i];
 return `<div class="eyebrow">Entrevista · ${esc(t.name)} · pregunta ${md.i+1} de ${Q.length}</div><h2 style="margin:4px 0 12px">«${esc(q.q)}»</h2>
 <div class="stack" style="gap:6px">${q.o.map((o,i)=>`<button class="btn" style="text-align:left;text-transform:none;letter-spacing:0;font-family:var(--f-body);font-weight:600" data-a="iv-ans" data-v="${i}">${esc(o[0])}</button>`).join('')}</div>
 <p class="small muted" style="margin:10px 0 0">Piensa en el club: los grandes quieren ambición; los modestos, realismo y cantera. Tu reputación, tu licencia y tus contactos también cuentan.</p>`;}
