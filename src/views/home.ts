/* El Banquillo · views/home.js — Inicio, informe del rival, calendario y fin de temporada. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {unread} from '../inbox';
import {esc,money} from '../core';
import {COUNTRIES,LV_NAMES,MENT,SPN,TAC0,TACS} from '../data';
import {LG,PL,S,T,crest,lgName,rt,seasonLabel,squad,uLg} from '../state';
import {strength} from '../players';
import {news} from '../world';
import {autoLineup,chemMult,lineupIssues,posOf,table,teamPower,userRoles} from '../tactics';
import {CONTS,CT_STAGES,compLabel,ctOf,ctStatus,cupName,cupSlotRound,cupStatus,cwcStatus,getFx,nextMatch,userCup,userRefFor} from '../competitions';
import {friendlyOpts,seasonSummary} from '../season';
import {sell,windowTxt} from '../market';
import {contractsPanel} from '../contracts';
import {spDesc} from '../club';
import {FOCUS} from '../squad';
import {cmpRow,formDots,nameBtn,resRow,tableHTML} from './common';
export function offersPanel(){
 const inc=Object.entries(S.offers).filter(([id,o])=>o.incoming&&PL(id)&&PL(id).team===S.user);
 if(!inc.length)return '';
 return `<section class="panel"><div class="panel-h"><h2>Ofertas recibidas</h2><span class="eyebrow">Caducan al jugar la jornada</span></div>
 ${inc.map(([id,o])=>{const p=PL(id);return `<div class="offer">${crest(T(o.team),'sm')}<span class="t"><b>${esc(T(o.team).name)}</b> <span class="divtag">${lgName(T(o.team).lg,true)}</span> ofrece <b>${money(o.amount)}</b> por ${nameBtn(p)} <span class="muted">(${rt(p)} · valor ${money(p.value)})</span></span><button class="btn sm" data-a="offer-no" data-id="${id}">Rechazar</button><button class="btn sm primary" data-a="sell-ok" data-id="${id}">Aceptar</button></div>`;}).join('')}</section>`;
}
export function inicioView(){
 const nm=nextMatch(),lg=uLg(),tb=table(lg),t=T(S.user);if(!nm)return '<div class="empty">Cargando la siguiente fecha…</div>';
 const fx=nm.fx,home=fx.h===S.user,opp=T(home?fx.a:fx.h);
 const myP=teamPower(t.lineup,t.formation,null,null,chemMult(t.formation),userRoles()),opP=teamPower(autoLineup(opp.id,opp.formation),opp.formation);
 const issues=lineupIssues(),rowT=id=>tb.find(r=>r.id===id);
 const side=tm=>`<div class="side">${crest(tm,'lg')}<div class="tn">${esc(tm.name)}</div><div class="row small muted">${rowT(tm.id)?`${S.week?posOf(tm.id)+'º · ':''}${formDots(rowT(tm.id).form)}`:`<span class="divtag">${lgName(tm.lg,true)}</span>`}</div></div>`;
 const L=home?myP:opP,R=home?opP:myP;
 const next=`<section class="panel"><div class="panel-h"><h2>Próximo partido</h2><span class="eyebrow">${esc(nm.label)} · ${nm.ref.k==='cwc'?'Campo neutral':home?'En casa':'A domicilio'}</span></div>
  <div class="versus">${side(T(fx.h))}<div class="vs">VS</div>${side(T(fx.a))}</div>
  ${cmpRow('Ataque',L.atk,R.atk)}${cmpRow('Medio',L.mid,R.mid)}${cmpRow('Defensa',L.def,R.def)}
  ${issues.length?`<div class="warnbox" style="margin-top:14px"><span>Tu once tiene ${issues.length} hueco${issues.length>1?'s':''} sin cubrir o con jugadores no disponibles.</span><button class="btn sm" data-a="fixlu">Completar con suplentes</button></div>`:''}
  <div class="row" style="margin-top:16px"><span class="muted small">${t.formation} · Mentalidad ${MENT[t.ment].label.toLowerCase()} · Química ${Math.round(S.chem)} · Entreno: ${FOCUS[S.train.focus].n.toLowerCase()}</span><span class="spacer"></span>
  <button class="btn" data-a="view" data-v="plantilla">Alineación</button><button class="btn" data-a="view" data-v="tacticas">Tácticas</button><button class="btn" data-a="sim-menu">Simular</button><button class="btn primary big" data-a="play">Jugar partido</button></div></section>`;
 const last=[];for(let r=S.week-1;r>=0&&last.length<5;r--){last.push([r,S.fixtures[lg][r].find(f=>f.h===S.user||f.a===S.user)]);}
 const lastH=last.length?last.map(([r,f])=>resRow(f,r)).join(''):`<div class="empty">Aún no has jugado. Tu primer partido es contra ${esc(opp.name)}.</div>`;
 const jobsP=(S.jobOffers||[]).length?`<section class="panel"><div class="panel-h"><h2>Ofertas de trabajo</h2><span class="eyebrow">Para ti como entrenador</span></div>${S.jobOffers.map((o,i)=>`<div class="offer">${crest(T(o.team),'sm')}<span class="t"><b>${esc(T(o.team).name)}</b> <span class="divtag">${lgName(T(o.team).lg,true)}</span> te ofrece ${money(o.sal)}/sem hasta junio de ${2025+S.seasonN+o.yrs}.</span><button class="btn sm" data-a="job-no" data-i="${i}">Rechazar</button><button class="btn sm primary" data-a="job-yes" data-i="${i}">Aceptar</button></div>`).join('')}</section>`:'';
 const preP=S.pre&&S.pre.left>0&&S.week===0&&S.ci===0?`<section class="panel"><div class="panel-h"><h2>Pretemporada</h2><span class="eyebrow">${S.pre.left} amistoso${S.pre.left>1?'s':''} disponible${S.pre.left>1?'s':''}</span></div><p class="small muted" style="margin:0 0 10px">Los amistosos suben la química y el dominio de la formación, dan algo de taquilla y no cuentan para las estadísticas.</p>${friendlyOpts().map(id=>{const o=T(id);return `<div class="offer">${crest(o,'sm')}<span class="t"><b>${esc(o.name)}</b> <span class="divtag">${lgName(o.lg,true)}</span> <span class="small muted">· nivel ${(strength(id)/10).toFixed(1)}</span></span><button class="btn sm" data-a="friendly" data-id="${id}">Jugar amistoso</button></div>`;}).join('')}<div class="row" style="margin-top:8px"><button class="btn sm" data-a="pre-skip">Saltar pretemporada</button></div></section>`:'';
 const spP=!S.sponsor&&S.spOffers&&S.spOffers.length?`<section class="panel"><div class="panel-h"><h2>Elige patrocinador</h2><span class="eyebrow">Antes de la jornada 4</span></div>${S.spOffers.map((o,i)=>`<div class="offer"><span class="t"><b>${esc(o.name)}</b><br><span class="small muted">${spDesc(o)}</span></span><button class="btn sm primary" data-a="sponsor" data-i="${i}">Firmar</button></div>`).join('')}</section>`:'';
 const pressP=S.press?`<section class="panel"><div class="panel-h"><h2>Rueda de prensa</h2><span class="eyebrow">Antes del próximo partido</span></div><p style="margin:0 0 10px"><b>«${esc(S.press.q)}»</b></p><div class="stack" style="gap:6px">${S.press.o.map((x,i)=>`<button class="btn" style="text-align:left;text-transform:none;letter-spacing:0;font-family:var(--f-body);font-weight:600" data-a="press" data-i="${i}">${esc(x[0])}</button>`).join('')}</div><p class="small muted" style="margin:8px 0 0">Lo que digas afecta al vestuario, a la afición y a la directiva. Si no vas a la rueda de prensa, a la directiva no le gusta.</p></section>`:'';
 return `<div class="grid"><div class="stack">${jobsP}${pressP}${preP}${spP}${offersPanel()}${next}${reportHTML(opp.id,true)}
  <section class="panel"><div class="panel-h"><h2>Últimos resultados</h2></div>${lastH}</section></div>
  <div class="stack">${contractsPanel()}<section class="panel"><div class="panel-h"><h2>Competiciones</h2><button class="btn sm" data-a="view" data-v="copas">Ver copas</button></div><div class="kv" style="margin-top:0"><span>${userCup()?cupName(userCup().c):'Copa nacional'}</span><b>${cupStatus()}</b><span>${ctOf(S.user)>=0?CONTS[ctOf(S.user)].n:'Competición continental'}</span><b>${ctStatus()}</b><span>Mundial de Clubes</span><b>${cwcStatus()}</b></div></section><section class="panel"><div class="panel-h"><h2>${LV_NAMES[LG(lg).lv]}</h2><button class="btn sm" data-a="view" data-v="liga">Ver ligas</button></div>${tableHTML(tb,lg,true)}</section>
  <section class="panel"><div class="panel-h"><h2>Noticias</h2><button class="btn sm" data-a="view" data-v="buzon">Bandeja de entrada${unread()?' ('+unread()+')':''}</button></div><ul class="news">${S.news.slice(0,8).map(n=>`<li class="${n.kind}"><span class="wk">J${n.wk}</span><span class="t">${esc(n.txt)}</span></li>`).join('')}</ul></section></div></div>`;
}
export function reportHTML(oid,compact){
 const o=T(oid),lu=autoLineup(oid,o.formation),tp=teamPower(lu,o.formation),tac=Object.assign({},TAC0,o.tac||{});
 const ps=squad(oid),key=ps.slice().sort((a,b)=>b.ovr-a.ovr)[0],sc=ps.filter(p=>p.st&&p.st.g).sort((a,b)=>b.st.g-a.st.g)[0];
 const lines=[['ataque',tp.atk],['medio',tp.mid],['defensa',tp.def]].sort((a,b)=>a[1]-b[1]);
 const tips=[];if(tac.est==='con')tips.push('Juegan al contragolpe: no adelantes la línea defensiva.');if(tac.pre==='alt')tips.push('Presionan arriba: el juego directo o el contragolpe les hacen daño.');if(tac.pre==='baj')tips.push('Presionan poco: el estilo de posesión les incomoda.');if(tac.lin==='alt')tips.push('Defienden con la línea alta: el contragolpe es tu mejor arma.');
 tips.push(`Su punto débil es ${lines[0][0]==='defensa'?'la defensa: ataca con decisión':lines[0][0]==='medio'?'el centro del campo: busca la posesión':'el ataque: puedes arriesgar más'}.`);
 if(key)tips.push(`Su mejor jugador es ${key.name} (${SPN[key.sp].toLowerCase()}, ${rt(key)}). La orden «Marcar a su estrella» reduce su peligro.`);
 return `<section class="panel"><div class="panel-h"><h2>Informe del rival</h2><span class="eyebrow">${esc(o.name)}</span></div>
 <div class="kv" style="margin-top:0"><span>Formación</span><b>${o.formation}</b><span>Estilo</span><b>${TACS.est.o[tac.est]} · presión ${TACS.pre.o[tac.pre].toLowerCase()}</b>${sc?`<span>Máximo goleador</span><b>${esc(sc.name)} (${sc.st.g})</b>`:''}<span>Nivel</span><b>${(tp.ovr/10).toFixed(1)}</b></div>
 <ul class="news" style="margin-top:8px">${tips.slice(0,compact?3:6).map(t=>`<li><span class="wk"></span><span class="t">${esc(t)}</span></li>`).join('')}</ul></section>`;
}
export function calendarioView(){
 const me=f=>f.h===S.user||f.a===S.user,items=[];
 for(let i=S.ci;i<S.cal.length&&items.length<14;i++){const ev=S.cal[i];let ref=null;try{ref=userRefFor(ev);}catch(e){}
  if(ev.t==='lg'){items.push({lbl:`${LV_NAMES[LG(uLg()).lv]} · Jornada ${ev.r+1}`,fx:S.fixtures[uLg()][ev.r].find(me)});continue;}
  if(ref){items.push({lbl:compLabel(ref),fx:getFx(ref)});continue;}
  if(ev.t==='cup'){const cup=userCup(),k=cup?cupSlotRound(cup,ev.s):null;if(cup&&k!=null&&cup.alive.includes(S.user)&&!cup.rounds[k])items.push({lbl:`${cupName(cup.c)} · ronda ${k+1}`,fx:null,txt:'Sorteo pendiente'});}
  if(ev.t==='ct'&&ctOf(S.user)>=0){const C=S.conts[ctOf(S.user)];if(!C.dates[ev.s]&&ctStatus().indexOf('Eliminado')<0&&ctStatus()!=='¡Campeón!')items.push({lbl:`${CONTS[ctOf(S.user)].n} · ${CT_STAGES[ev.s]}`,fx:null,txt:'Si pasas de ronda'});}
 }
 const past=[];S.fixtures[uLg()].slice(0,S.week).forEach((rd,r)=>{const f=rd.find(me);if(f)past.push([r,f]);});
 return `<div class="grid"><section class="panel"><div class="panel-h"><h2>Próximas fechas</h2><span class="eyebrow">${windowTxt()}</span></div>
 ${items.length?items.map(x=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="eyebrow">${esc(x.lbl)}</div>${x.fx?resRow(x.fx,null):`<div class="small muted">${esc(x.txt||'')}</div>`}</div>`).join(''):'<div class="empty">No quedan partidos esta temporada.</div>'}</section>
 <section class="panel"><div class="panel-h"><h2>Resultados de liga</h2><span class="eyebrow">${past.length} jugados</span></div>${past.length?past.slice().reverse().map(([r,f])=>resRow(f,r)).join(''):'<div class="empty">Aún no has jugado ninguna jornada.</div>'}</section></div>`;
}
export function seasonEndView(){
 const sm=seasonSummary(),champ=T(sm.tb[0].id),C=COUNTRIES[sm.L.c];
 const title=sm.L.lv===0&&sm.champ?'¡Campeones de liga!':sm.up?`¡Ascenso a ${LV_NAMES[sm.L.lv-1]}!`:sm.down?`Descenso a ${LV_NAMES[sm.L.lv+1]}`:sm.ok?'Objetivo cumplido':'Objetivo fallado';
 return `<div class="grid"><section class="panel"><div class="eyebrow">Fin de temporada ${seasonLabel()} · ${esc(C.n)} · ${LV_NAMES[sm.L.lv]}</div>
 <div class="row" style="margin-block:10px 6px;gap:16px"><span class="big-num">${sm.pos}º</span><div><h2>${title}</h2><div class="muted">${sm.tb[sm.pos-1].pts} puntos · Campeón: ${esc(champ.name)}</div></div></div>
 <p>La directiva pedía: ${S.obj.txt.toLowerCase()}. ${sm.ok?'Están satisfechos con tu trabajo.':'Esperan una reacción la próxima temporada.'} Premio total: <b>${money(sm.prize)}</b>.</p>
 <p class="small muted">Al empezar la nueva temporada se aplican ascensos y descensos en los 10 países, los jugadores cumplen un año (los jóvenes mejoran, los veteranos bajan y algunos se retiran) y suben dos canteranos. Los jugadores sin renovar se irán libres y los cedidos vuelven a su club.</p>
 <button class="btn primary big" data-a="new-season">Empezar temporada ${seasonLabel(S.seasonN+1)}</button></section>
 <div class="stack">${contractsPanel()}<section class="panel"><div class="panel-h"><h2>Clasificación final</h2></div>${tableHTML(sm.tb,sm.lg,true)}</section></div></div>`;
}
