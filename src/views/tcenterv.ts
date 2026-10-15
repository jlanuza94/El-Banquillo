/* El Banquillo · views/tcenterv.ts — Pantallas del Centro de entrenamiento: calendario semanal, sesiones colectivas,
 * entrenamiento individual, cuerpo técnico por áreas e informe de desarrollo. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {AT_NAME,ATTRS,POS_ORD,posChip} from '../data';
import {S,T,crest,pBadge,qc,squad} from '../state';
import {DAYS,MATCH_DAY,PRESETS_T} from '../training2';
import {crew} from '../staff';
import {ST_AT,ST_ROLES} from '../staff';
import {nextMatch} from '../competitions';
import {AREAS,DRILLS,ILOAD,SLOTS,TCATS,areaLead,areaMult,areaQ,catArea,dayLoad,pLoad,tcPlan,tcWarnings,weekAt,weekLoad} from '../tcenter';
import {nameBtn,potTxt} from './common';

const dots=n=>`<span class="tcld" title="Carga ${n} de 3">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`;
const lcls=L=>L>=13?'hi':L>=9?'md':'lo';
/** Calendario: los 7 días con mañana y tarde; el día de partido, con el rival. */
export function tcCalHTML(dl){
 const P=tcPlan(),nm=nextMatch(),opp=nm?T(nm.fx.h===S.user?nm.fx.a:nm.fx.h):null,L=weekLoad(),W=tcWarnings(),sel=S.tcSel;
 const slot=(d,s)=>{const k=P.d[d][s],D=DRILLS[k],C=D&&TCATS[D.c],on=sel&&sel.d===d&&sel.s===s;
  return `<button class="tcs${D?'':' free'}${on?' on':''}" style="${C?`--cc:${C.c}`:''}" data-a="tc-slot" data-d="${d}" data-s="${s}"><small>${SLOTS[s]}</small>${D?`<b>${C.i} ${esc(D.n)}</b>${dots(D.load)}`:'<b>＋ Libre</b>'}</button>`;};
 const days=DAYS.map((n,d)=>d===MATCH_DAY?`<div class="tcday match"><div class="tcdh">${n.slice(0,3)}</div><div class="tcm">${opp?crest(opp,'sm'):'🏟️'}<b>Partido</b>${opp?`<small>${esc(opp.short||opp.name)}</small>`:''}</div><i class="tcbar hi" style="width:100%"></i></div>`
  :`<div class="tcday${d===MATCH_DAY-1?' eve':''}${d===MATCH_DAY+1?' post':''}"><div class="tcdh">${n.slice(0,3)}${d===MATCH_DAY-1?' <small>víspera</small>':d===MATCH_DAY+1?' <small>post</small>':''}</div>${slot(d,0)}${slot(d,1)}<i class="tcbar ${dayLoad(d)>=4?'hi':dayLoad(d)>=2?'md':'lo'}" style="width:${Math.min(100,dayLoad(d)*20)}%"></i></div>`).join('');
 return `${dl||''}<section class="panel"><div class="panel-h"><h2>Semana de entrenamiento</h2><span class="eyebrow">Toca una sesión para cambiarla</span></div>
 <div class="tcweek">${days}</div>
 <div class="tcload"><span>Carga de la semana</span><i class="tcbar2"><i class="${lcls(L)}" style="width:${Math.min(100,L/18*100)}%"></i></i><b>${L} <small>${L>=13?'alta':L>=9?'media':'baja'}</small></b></div>
 ${W.length?`<div class="tcwarn">${W.map(w=>`<span>⚠️ ${esc(w)}</span>`).join('')}</div>`:'<div class="tcwarn ok"><span>✔ Semana bien planificada.</span></div>'}
 <div class="chips" style="margin-top:8px"><span class="eyebrow" style="align-self:center">Plantillas:</span>${Object.entries(PRESETS_T).map(([k,v])=>`<button class="btn sm" data-a="tr-preset" data-v="${k}">${esc(v.n)}</button>`).join('')}</div></section>`;
}
/** Catálogo de sesiones colectivas, por categorías. */
export function tcSesHTML(){
 const sel=S.tcSel,cat=S.tcCat||'all',L=Object.entries(DRILLS).filter(([,D])=>cat==='all'||D.c===cat);
 const fx=D=>{const X=D.x||{},o=[];if(X.fam)o.push('dominio del sistema');if(X.chem)o.push('química');if(X.tf)o.push('instrucción: '+({pre:'presión alta',est:'posesión',rec:'contraataque'}[X.tf[0]]||''));if(X.sp)o.push('balón parado');if(X.riv)o.push('ventaja contra el próximo rival');if(X.rest)o.push('recupera energía');if(X.hap)o.push('moral');if(X.inj)o.push('menos lesiones');return o;};
 return `${sel?`<div class="negmsg ok tcpick"><span>Eligiendo sesión para <b>${DAYS[sel.d]} · ${SLOTS[sel.s].toLowerCase()}</b></span><span class="spacer"></span><button class="btn sm" data-a="tc-clear">Dejar libre</button><button class="btn sm" data-a="tc-cancel">Cancelar</button></div>`:'<p class="small muted" style="margin:0 0 8px">Cada sesión tiene un propósito: unos atributos que mejoran, una carga física y efectos para el equipo. Toca una sesión del calendario y luego elígela aquí.</p>'}
 <div class="seg tccats"><button data-a="tc-cat" data-v="all" aria-pressed="${cat==='all'}">Todas</button>${Object.entries(TCATS).map(([k,C])=>`<button data-a="tc-cat" data-v="${k}" aria-pressed="${cat===k}">${C.i} ${C.n}</button>`).join('')}</div>
 <div class="tcgrid">${L.map(([k,D])=>{const C=TCATS[D.c],a=catArea(D.c),f=fx(D);return `<div class="tcc" style="--cc:${C.c}"><div class="tcch"><span class="tcci">${C.i}</span><div><b>${esc(D.n)}</b><small>${C.n} · ${dots(D.load)}</small></div></div><p>${esc(D.d)}</p>
  ${D.at.length?`<div class="tcat">${D.at.map(x=>`<span>${AT_NAME[x]}</span>`).join('')}</div>`:''}${f.length?`<div class="tcfx">${f.map(x=>`<span>＋ ${esc(x)}</span>`).join('')}</div>`:''}
  <div class="tccf"><small>Dirige: ${areaLead(a)?esc(areaLead(a).name):'—'} · ${Math.round((areaMult(a)-1)*100)>=0?'+':''}${Math.round((areaMult(a)-1)*100)}%</small>${sel?`<button class="btn sm primary" data-a="tc-pick" data-v="${k}">Elegir</button>`:''}</div></div>`;}).join('')}</div>`;
}
/** Plan individual: carga y foco de cada jugador. extra = desarrollo y tutelaje que ya existían. */
export function tcIndHTML(extra){
 const sq=squad(S.user).filter(p=>!p.loan).sort((a,b)=>POS_ORD[a.pos]-POS_ORD[b.pos]||b.ovr-a.ovr);
 const rows=sq.map(p=>{const l=pLoad(p),e=Math.round(p.energy);return `<tr><td>${posChip(p)}</td><td>${nameBtn(p)}</td><td class="n">${p.age}</td><td class="r">${pBadge(p)}</td><td class="n">${potTxt(p)}</td>
  <td><span class="tcen ${e>=80?'ok':e>=60?'md':'lo'}">${e}%</span></td><td class="n">${p.trA!=null?`<b class="${p.trA>=7.2?'pos':p.trA<5?'neg':''}">${p.trA.toFixed(1)}</b>`:'—'}</td>
  <td><div class="seg tcil">${Object.entries(ILOAD).map(([k,v])=>`<button data-a="tc-load" data-id="${p.id}" data-v="${k}" aria-pressed="${l===k}" title="${esc(v.d)}">${v.n}</button>`).join('')}</div></td>
  <td><select data-tf="${p.id}" aria-label="Foco de ${esc(p.name)}"><option value="auto" ${!p.tf||p.tf==='auto'?'selected':''}>Según las sesiones</option>${ATTRS.filter(k=>(p.pos==='POR'||k!=='por')&&!['lid','con','gra'].includes(k)).map(k=>`<option value="${k}" ${p.tf===k?'selected':''}>${AT_NAME[k]}</option>`).join('')}</select></td>
  <td class="n">${p.sg?'+'+p.sg:'—'}</td>${p.inj?'<td><span class="tag bad">Lesionado</span></td>':'<td></td>'}</tr>`;}).join('');
 return `<section class="panel"><div class="panel-h"><h2>Entrenamiento individual</h2><span class="eyebrow">Carga y foco de cada futbolista</span></div>
 <p class="small muted" style="margin:0 0 8px">La <b>carga</b> decide cuánto se exige a cada uno: dale descanso al que va justo de energía y carga alta al joven que quieres que explote. El <b>foco</b> elige el atributo que trabaja; «Según las sesiones» usa lo que entrene el equipo esa semana, ajustado a su puesto.</p>
 <div class="tbl"><table><thead><tr><th>Pos</th><th>Jugador</th><th class="r">Edad</th><th class="r">Media</th><th class="r">Pot.</th><th>Energía</th><th class="r">Nota</th><th>Carga</th><th>Foco</th><th class="r">Mejoras</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>${extra||''}`;
}
/** Cuerpo técnico: un responsable por área, con su habilidad y su efecto. */
export function tcStaffHTML(){
 const P=tcPlan(),stars=q=>'★'.repeat(Math.max(1,Math.round(q/2)))+'☆'.repeat(5-Math.max(1,Math.round(q/2)));
 return `<section class="panel"><div class="panel-h"><h2>Responsables por área</h2><button class="btn sm" data-a="view" data-v="staff">Gestionar personal</button></div>
 <p class="small muted" style="margin:0 0 8px">Cada área la dirige un miembro de tu cuerpo técnico. Cuanto mejor es en lo suyo, más rinden las sesiones de esa área (mejora de los jugadores y efectos para el equipo).</p>
 <div class="tcareas">${Object.entries(AREAS).map(([a,A])=>{const m=areaLead(a),q=areaQ(a),c=A.role.flatMap(r=>crew(r));return `<div class="tcar"><div class="tcarh"><b>${esc(A.n)}</b><span class="tcstars">${stars(q)}</span></div>
  <div class="tcarm">${m?`<span class="stc-av">${esc(m.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span><div><b>${esc(m.name)}</b><small>${ST_ROLES[m.role].n} · ${ST_AT[A.at]} ${m.at[A.at]}</small></div>`:'<div class="small muted">Nadie en el puesto: las sesiones rinden menos.</div>'}</div>
  <div class="tcarf"><span class="small">Efecto ${Math.round((areaMult(a)-1)*100)>=0?'+':''}${Math.round((areaMult(a)-1)*100)}%</span>${c.length>1?`<select data-tclead="${a}" aria-label="Responsable de ${esc(A.n)}">${c.map(x=>`<option value="${x.id}" ${m&&m.id===x.id?'selected':''}>${esc(x.name)} · ${ST_AT[A.at]} ${x.at[A.at]}</option>`).join('')}</select>`:''}</div></div>`;}).join('')}</div></section>
 <section class="panel"><div class="panel-h"><h2>Tu cuerpo técnico</h2><span class="eyebrow">${(S.crew||[]).length} personas</span></div>
 <div class="tbl"><table><thead><tr><th>Nombre</th><th>Puesto</th><th class="r">Entren.</th><th class="r">Táctica</th><th class="r">Fisio</th><th class="r">Jóvenes</th><th class="r">Motiv.</th></tr></thead><tbody>${(S.crew||[]).map(m=>`<tr><td><b>${esc(m.name)}</b></td><td>${ST_ROLES[m.role]?ST_ROLES[m.role].n:m.role}</td>${['ent','tac','fis','jov','mot'].map(k=>`<td class="n"><span class="at ${qc(m.at[k]||0)}">${m.at[k]??'—'}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
/** Informe de desarrollo: la última semana, la evolución y cómo están los jugadores. extra = química y últimas mejoras. */
export function tcInfHTML(extra){
 const P=tcPlan(),H=P.hist||[],R=P.last,sq=squad(S.user).filter(p=>!p.loan);
 const tile=(l,v,s,c='')=>`<div class="tct ${c}"><span>${l}</span><b>${v}</b>${s?`<small>${s}</small>`:''}</div>`;
 const mx=Math.max(14,...H.map(h=>h.load));
 const chart=H.length?`<div class="tcchart">${H.map(h=>`<div class="tccol" title="J${h.wk+1}: carga ${h.load}, ${h.ups} mejoras, energía ${h.en}%"><i class="ld ${lcls(h.load)}" style="height:${h.load/mx*100}%"></i><i class="up" style="height:${Math.min(100,h.ups*8)}%"></i><small>J${h.wk+1}</small></div>`).join('')}</div><p class="small muted" style="margin:4px 0 0"><span class="tclg ld"></span> carga · <span class="tclg up"></span> mejoras</p>`:'<div class="empty">El informe empieza a llenarse tras la primera semana.</div>';
 const tired=sq.filter(p=>p.energy<65).sort((a,b)=>a.energy-b.energy).slice(0,5),best=sq.filter(p=>p.sg).sort((a,b)=>b.sg-a.sg).slice(0,5),low=sq.filter(p=>(p.hap??70)<45).slice(0,5),inj=sq.filter(p=>p.inj);
 const lst=(t,L,f)=>`<div class="tcls"><h3>${t}</h3>${L.length?L.map(p=>`<div class="offer">${posChip(p)}<span class="t">${nameBtn(p)}</span><span class="small">${f(p)}</span></div>`).join(''):'<p class="small muted">Nadie.</p>'}</div>`;
 return `<section class="panel"><div class="panel-h"><h2>Informe de desarrollo</h2><span class="eyebrow">${R?'Semana de la jornada '+(R.wk+1):'Aún sin datos'}</span></div>
 <div class="tctiles">${tile('Carga',R?R.load:weekLoad(),R?(R.load>=13?'alta':R.load>=9?'media':'baja'):'prevista',R?lcls(R.load):'')}${tile('Mejoras',R?R.ups:'—','atributos que subieron')}${tile('Energía media',(R?R.en:Math.round(sq.reduce((a,p)=>a+p.energy,0)/Math.max(1,sq.length)))+'%','',R&&R.en<70?'hi':'')}${tile('Moral media',R?R.hap:'—','de 100')}${tile('Nota entreno',R?R.tr:'—','media del equipo')}${tile('Lesiones',R?R.inj.length:0,R&&R.inj.length?esc(R.inj.join(', ')):'en el entrenamiento',R&&R.inj.length?'hi':'')}</div>
 ${chart}</section>
 <div class="grid"><section class="panel">${lst('📈 Los que más mejoran (temporada)',best,p=>'+'+p.sg)}${lst('🔋 Van justos de energía',tired,p=>Math.round(p.energy)+'%')}</section><section class="panel">${lst('😟 Moral baja',low,p=>Math.round(p.hap)+'/100')}${lst('🏥 Lesionados',inj,p=>p.inj+' sem.')}</section></div>${extra||''}`;
}
