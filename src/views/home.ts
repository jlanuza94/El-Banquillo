/* El Banquillo · views/home.js — Inicio, informe del rival, calendario y fin de temporada. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {winRounds} from '../calendar';
import {INT_MAX,PRE_GAP,daysToLeague,friendlyWait,inPre,preTasks,ptNext} from '../preseason';
import {needsPO,poRound,setupPO,userTie} from '../playoffs';
import {mkTie} from '../competitions';
import {galaAwards} from '../extras';
import {FIRST_LG,cal,lgDay,MONTHS_L,agenda,dateOf,dateTxt,dayOfEvent,daysToMatch,eventDays,seasonStart,syncDay} from '../calendar';
import {stadiumSVG} from './title';
import {nC} from '../state';
import {derbyName,h2hDots,h2hStreak,h2hTxt,isDerby} from '../rivals';
import {TOPICS} from '../talks';
import {quick,suggestions} from '../quick';
import {STYLES} from '../living';
import {segAt} from '../staff';
import {unread} from '../inbox';
import {esc,money} from '../core';
import {posChip,COUNTRIES,LV_NAMES,MENT,SPN,TAC0,TACS} from '../data';
import {LG,PL,S,T,crest,lgName,pBadge,rt,seasonLabel,squad,uLg} from '../state';
import {strength} from '../players';
import {news} from '../world';
import {autoLineup,chemMult,lineupIssues,posOf,table,teamPower,userRoles} from '../tactics';
import {cupRoundName,CONTS,CT_STAGES,compLabel,ctOf,ctStatus,cupName,cupSlotRound,cupStatus,cwcStatus,getFx,nextMatch,userCup,userRefFor} from '../competitions';
import {friendlyOpts,seasonSummary} from '../season';
import {askPrice,inWindow,sell,windowTxt} from '../market';
import {contractsPanel} from '../contracts';
import {spDesc} from '../club';
import {FOCUS} from '../squad';
import {cmpRow,formDots,nameBtn,pBadgeS,resRow,tableHTML,vtab} from './common';
export function offersPanel(){
 const inc=Object.entries(S.offers).filter(([id,o])=>o.incoming&&PL(id)&&PL(id).team===S.user);
 if(!inc.length)return '';
 return `<section class="panel"><div class="panel-h"><h2>Ofertas recibidas</h2><span class="eyebrow">Caducan al jugar la jornada</span></div>
 ${inc.map(([id,o])=>{const p=PL(id);return `<div class="offer">${crest(T(o.team),'sm')}<span class="t"><b>${esc(T(o.team).name)}</b> <span class="divtag">${lgName(T(o.team).lg,true)}</span> ofrece <b>${money(o.amount)}</b> por ${nameBtn(p)} <span class="muted">(${rt(p)} · valor ${money(p.value)})</span></span><button class="btn sm" data-a="offer-no" data-id="${id}">Rechazar</button><button class="btn sm primary" data-a="sell-ok" data-id="${id}">Aceptar</button></div>`;}).join('')}</section>`;
}
/** Panel de mando: tarjetas con lo esencial y las tareas pendientes. */
function dashHTML(nm,tb){
 const fx=nm.fx,opp=T(fx.h===S.user?fx.a:fx.h),dtm=daysToMatch(),me=tb.find(r=>r.id===S.user),sq=squad(S.user),inj=sq.filter(p=>p.inj).length,sus=sq.filter(p=>p.susp).length;
 const negs=Object.values(S.neg||{}).filter(n=>n.wait||n.agreed).length,inc=Object.values(S.offers||{}).filter(o=>o.incoming).length,un=unread();
 const T_=[];const add=(t,a,v)=>T_.push(`<button class="task" data-a="${a}" data-v="${v||''}">${t}</button>`);
 if(lineupIssues().length)add('⚠️ Completa tu once','view','tacticas');
 if(S.spOffers&&S.spOffers.length&&!S.sponsor)add('🤝 Elige patrocinador','view','inicio');
 if(S.meet)add('🗣️ Un jugador quiere hablar contigo','meet');
 if(inc)add(`💰 ${inc} oferta${inc>1?'s':''} por tus jugadores`,'view','mercado');
 const exp=sq.filter(p=>!p.loan&&p.contract<=1).length;if(exp)add(`📝 ${exp} contrato${exp>1?'s':''} acaba${exp>1?'n':''}`,'view','inicio');
 const sad=sq.filter(p=>(p.hap??70)<40).length;if(sad)add(`😠 ${sad} jugador${sad>1?'es':''} descontento${sad>1?'s':''}`,'view','plantilla');
 if(!S.proj&&S.projOpts)add('🎯 Pacta un proyecto con la directiva','view','club');
 const ev=dayOfEvent(S.ci),home=fx.h===S.user,O=S.mgr?Math.round(S.mgr.conf):60,mk=inWindow();
 const tside=tm=>{const r=tb.find(x=>x.id===tm.id);return `<div class="hteam">${crest(tm,'lg')}<b>${esc(tm.name)}</b><span>${r&&S.week?`${posOf(tm.id)}º · `:''}${r&&r.form&&r.form.length?formDots(r.form.slice(-5)):`<span class="divtag">${lgName(tm.lg,true)}</span>`}</span></div>`;};
 const stat=(l,v,sub,a,vv,cls='')=>`<button class="hstat ${cls}" data-a="${a}" data-v="${vv}"><span>${l}</span><b>${v}</b><small>${sub}</small></button>`;
 const hero=`<section class="hero"><div class="hbg">${stadiumSVG()}</div><div class="hin">
  <div class="hmain"><div class="hcomp">${esc(nm.label)} · ${dateTxt(ev)} · ${nm.ref.k==='cwc'?'campo neutral':home?'en casa':'a domicilio'}</div>
  <div class="hvs">${tside(T(fx.h))}<div class="hmid"><b>VS</b><span class="${dtm===0?'today':''}">${dtm===0?'¡Hoy!':dtm===1?'Mañana':`en ${dtm} días`}</span></div>${tside(T(fx.a))}</div>
  <div class="hbtns"><button class="btn" data-a="view" data-v="tacticas">Tácticas</button>${dtm===0?'<button class="btn" data-a="sim-menu">Simular</button><button class="btn primary" data-a="play">Jugar partido</button>':'<button class="btn primary" data-a="continue">Continuar</button>'}</div></div>
  <div class="hstats">
   ${stat('Liga',S.week?`${posOf(S.user)}º`:'—',me?`${me.pts} pts · ${me.pj} PJ`:'','view','liga')}
   ${stat('Confianza',O,O>=60?'La directiva confía':O>=35?'Algo de dudas':'¡En peligro!','view','club',O<35?'warn':'')}
   ${stat('Enfermería',inj,`lesionado${inj===1?'':'s'}${sus?` · ${sus} sanc.`:''}`,'view','plantilla',inj?'warn':'')}
   ${stat('Mercado',mk?'Abierto':'Cerrado',mk?`${negs} negoc. · ${inc} ofertas`:S.week<winRounds()[1]?`invierno en ${winRounds()[1]-S.week} jorn.`:'abre en verano','view','mercado',mk?'ok':'')}
   ${stat('Bandeja',un,un===1?'sin leer':'sin leer','view','buzon',un?'hot':'')}
  </div></div></section>`;
 return `${hero}${T_.length?`<div class="tasks"><span class="eyebrow">Pendiente</span>${T_.join('')}</div>`:''}`;
}
export function inicioView(){
 const nm=nextMatch(),lg=uLg(),tb=table(lg),t=T(S.user);if(!nm)return '<div class="empty">Cargando la siguiente fecha…</div>';
 const fx=nm.fx,home=fx.h===S.user,opp=T(home?fx.a:fx.h);
 const myP=teamPower(t.lineup,t.formation,null,null,chemMult(t.formation),userRoles()),opP=teamPower(autoLineup(opp.id,opp.formation),opp.formation);
 const issues=lineupIssues(),rowT=id=>tb.find(r=>r.id===id);
 const side=tm=>`<div class="side">${crest(tm,'lg')}<div class="tn">${esc(tm.name)}</div><div class="row small muted">${rowT(tm.id)?`${S.week?posOf(tm.id)+'º · ':''}${formDots(rowT(tm.id).form)}`:`<span class="divtag">${lgName(tm.lg,true)}</span>`}</div></div>`;
 const L=home?myP:opP,R=home?opP:myP;
 const next=`<section class="panel"><div class="panel-h"><h2>Previa del partido</h2><span class="eyebrow">${esc(nm.label)} · ${nm.ref.k==='cwc'?'Campo neutral':home?'En casa':'A domicilio'}</span></div>
  ${(()=>{const opp=fx.h===S.user?fx.a:fx.h,dv=isDerby(S.user,opp),st=h2hStreak(opp);return `${dv?`<div class="derbytag">🔥 ${derbyName(S.user,opp)} · más tensión, más público y la ciudad pendiente</div>`:''}<div class="small muted" style="text-align:center;margin:0 0 6px">Tu historial: ${h2hTxt(opp)} ${h2hDots(opp)}${st?' · '+st:''}</div>`;})()}
  <div class="pvs"><span>${esc(T(fx.h).short)}</span><span class="small muted">vs</span><span>${esc(T(fx.a).short)}</span></div>
  ${cmpRow('Ataque',L.atk,R.atk)}${cmpRow('Medio',L.mid,R.mid)}${cmpRow('Defensa',L.def,R.def)}
  ${issues.length?`<div class="warnbox" style="margin-top:14px"><span>Tu once tiene ${issues.length} hueco${issues.length>1?'s':''} sin cubrir o con jugadores no disponibles.</span><button class="btn sm" data-a="fixlu">Completar con suplentes</button></div>`:''}
  <div class="row" style="margin-top:16px"><span class="muted small">${t.formation} · Mentalidad ${MENT[t.ment].label.toLowerCase()} · Química ${Math.round(S.chem)} · Entreno: ${FOCUS[S.train.focus].n.toLowerCase()}</span><span class="spacer"></span>
  <button class="btn" data-a="view" data-v="plantilla">Alineación</button><button class="btn" data-a="view" data-v="tacticas">Tácticas</button><button class="btn" data-a="sim-menu">Simular</button><button class="btn primary big" data-a="play">Jugar partido</button></div></section>`;
 const last=[];for(let r=S.week-1;r>=0&&last.length<5;r--){last.push([r,S.fixtures[lg][r].find(f=>f.h===S.user||f.a===S.user)]);}
 const lastH=last.length?last.map(([r,f])=>resRow(f,r)).join(''):`<div class="empty">Aún no has jugado. Tu primer partido es contra ${esc(opp.name)}.</div>`;
 const jobsP=(S.jobOffers||[]).length?`<section class="panel"><div class="panel-h"><h2>Ofertas de trabajo</h2><span class="eyebrow">Para ti como entrenador</span></div>${S.jobOffers.map((o,i)=>`<div class="offer">${crest(T(o.team),'sm')}<span class="t"><b>${esc(T(o.team).name)}</b> <span class="divtag">${lgName(T(o.team).lg,true)}</span> te ofrece ${money(o.sal)}/sem hasta junio de ${2025+S.seasonN+o.yrs}.</span><button class="btn sm" data-a="job-no" data-i="${i}">Rechazar</button><button class="btn sm primary" data-a="job-yes" data-i="${i}">Aceptar</button></div>`).join('')}</section>`:'';
 const preP=inPre()?`<section class="panel prep"><div class="panel-h"><h2>Pretemporada</h2><span class="eyebrow">${daysToLeague()} días para la jornada 1</span></div>
 <p class="small muted" style="margin:0 0 8px">Prepara la temporada: revisa a tus jugadores, monta tu once, busca refuerzos y prueba la táctica en los amistosos.</p>
 <div class="ptasks">${preTasks().map(([k,l,done,a,v])=>`<div class="ptask${done?' ok':''}"><span class="ck">${done?'✔':''}</span><span class="t">${l}</span>${a?`<button class="btn sm${done?'':' primary'}" data-a="${a}"${v?` data-v="${v}"`:''}>${done?'Ver':'Ir'}</button>`:''}</div>`).join('')}</div>
 ${S.pre.left>0?`<div class="eyebrow" style="margin:12px 0 4px">Amistoso · elige rival${friendlyWait()?` · el próximo, dentro de ${friendlyWait()} día${friendlyWait()>1?'s':''}`:''}</div>${friendlyOpts().map(id=>{const o=T(id);return `<div class="offer">${crest(o,'sm')}<span class="t"><b>${esc(o.name)}</b> <span class="divtag">${lgName(o.lg,true)}</span> <span class="small muted">· nivel ${(strength(id)/10).toFixed(1)}</span></span><button class="btn sm" data-a="friendly" data-id="${id}" ${friendlyWait()?'disabled':''}>Jugar</button></div>`;}).join('')}<p class="small muted" style="margin:6px 0 0">Los amistosos suben la química y el dominio de la táctica, dan algo de taquilla y no cuentan para las estadísticas. Uno cada ${PRE_GAP} días como mucho.</p>`:'<p class="small" style="margin:10px 0 0">✔ Amistosos completados.</p>'}
 ${S.ptour&&S.ptour.st!=='no'?`<div class="ptour"><div class="eyebrow" style="margin:12px 0 4px">🏆 ${esc(S.ptour.n)}</div>${S.ptour.st==='inv'?`<p class="small" style="margin:0 0 6px">Te invitan a un torneo de 4 equipos: semifinal y final. Campeón: ${money(S.ptour.prize[0])}; finalista: ${money(S.ptour.prize[1])}.</p><div class="row"><button class="btn sm primary" data-a="pt-join" data-v="yes">Participar</button><button class="btn sm" data-a="pt-join" data-v="no">No, gracias</button></div>`:ptNext()?`<div class="offer">${crest(T(ptNext()[0]),'sm')}<span class="t"><b>${ptNext()[1]}</b> contra ${esc(T(ptNext()[0]).name)}</span><button class="btn sm primary" data-a="pt-play" ${friendlyWait()?'disabled':''}>Jugar</button></div><button class="btn sm" data-a="pt-view">Ver cuadro</button>`:`<p class="small" style="margin:0">${S.ptour.champ===S.user?'🏆 ¡Campeones!':`Campeón: ${esc(T(S.ptour.champ).name)}.`} <button class="btn sm" data-a="pt-view">Ver resultados</button></p>`}</div>`:''}
 <div class="eyebrow" style="margin:12px 0 4px">Partido interno</div><div class="offer"><span class="t">Titulares contra suplentes, 90 minutos: pruebas tu once, sube la química y ves quién está en forma.<br><span class="small muted">${S.pre.intN||0} de ${INT_MAX} jugados</span></span><button class="btn sm" data-a="int-play" ${(S.pre.intN||0)>=INT_MAX||friendlyWait()?'disabled':''}>Jugar</button></div></section>`:'';
 const spP=!S.sponsor&&S.spOffers&&S.spOffers.length?`<section class="panel"><div class="panel-h"><h2>Elige patrocinador</h2><span class="eyebrow">Antes de la jornada 4</span></div>${S.spOffers.map((o,i)=>`<div class="offer"><span class="t"><b>${esc(o.name)}</b><br><span class="small muted">${spDesc(o)}</span></span><button class="btn sm primary" data-a="sponsor" data-i="${i}">Firmar</button></div>`).join('')}</section>`:'';
 const mp=S.meet&&PL(S.meet.id),meetP=mp?`<section class="panel"><div class="panel-h"><h2>Reunión pendiente</h2><span class="eyebrow">${esc(TOPICS[S.meet.topic].n)}</span></div><div class="offer">${posChip(mp)}<span class="t">${nameBtn(mp)} quiere hablar contigo.<br><span class="small muted">Si no le recibes en dos jornadas, se molestará.</span></span><button class="btn primary sm" data-a="meet">Reunirse</button></div></section>`:'';
 const pressP=S.press?`<section class="panel"><div class="panel-h"><h2>Rueda de prensa</h2><span class="eyebrow">Antes del próximo partido</span></div><p style="margin:0 0 10px"><b>«${esc(S.press.q)}»</b></p><div class="stack" style="gap:6px">${S.press.o.map((x,i)=>`<button class="btn" style="text-align:left;text-transform:none;letter-spacing:0;font-family:var(--f-body);font-weight:600" data-a="press" data-i="${i}">${esc(x[0])}</button>`).join('')}</div><p class="small muted" style="margin:8px 0 0">Lo que digas afecta al vestuario, a la afición y a la directiva. Si no vas a la rueda de prensa, a la directiva no le gusta.</p></section>`:'';
 let sugP='';if(inWindow()||quick()){const sg=suggestions(3);if(sg.list.length)sugP=`<section class="panel"><div class="panel-h"><h2>Tu segundo recomienda</h2><span class="eyebrow">Refuerzos para ${{POR:'la portería',DEF:'la defensa',MED:'el medio',DEL:'el ataque'}[sg.g]}</span></div>${sg.list.map(p=>`<div class="offer">${crest(T(p.team??S.user),'sm')}<span class="t">${nameBtn(p)} <span class="small muted">· ${p.age} años · ${p.team===null?'libre':esc(T(p.team).short)} · ${money(askPrice(p))}</span></span>${pBadgeS(p)}<button class="btn sm primary" data-a="neg" data-id="${p.id}">Ofertar</button></div>`).join('')}</section>`;}
 return dashHTML(nm,tb)+`<div class="grid"><div class="stack">${jobsP}${meetP}${pressP}${preP}${spP}${offersPanel()}${next}${sugP}${reportHTML(opp.id,true)}
  <section class="panel"><div class="panel-h"><h2>Últimos resultados</h2></div>${lastH}</section></div>
  <div class="stack">${poHTML()}${galaHTML()}${contractsPanel()}<section class="panel"><div class="panel-h"><h2>Competiciones</h2><button class="btn sm" data-a="view" data-v="copas">Ver copas</button></div><div class="kv" style="margin-top:0"><span>${userCup()?cupName(userCup().c):'Copa nacional'}</span><b>${cupStatus()}</b><span>${ctOf(S.user)>=0?CONTS[ctOf(S.user)].n:'Competición continental'}</span><b>${ctStatus()}</b><span>Mundial de Clubes</span><b>${cwcStatus()}</b></div></section><section class="panel"><div class="panel-h"><h2>${LV_NAMES[LG(lg).lv]}</h2><button class="btn sm" data-a="view" data-v="liga">Ver ligas</button></div>${tableHTML(tb,lg,true)}</section>
  <section class="panel"><div class="panel-h"><h2>Noticias</h2><button class="btn sm" data-a="view" data-v="buzon">Bandeja de entrada${unread()?' ('+unread()+')':''}</button></div><ul class="news">${S.news.slice(0,8).map(n=>`<li class="${n.kind}"><span class="wk">J${n.wk}</span><span class="t">${esc(n.txt)}</span></li>`).join('')}</ul></section></div></div>`;
}
export function reportHTML(oid,compact){
 const o=T(oid),lu=autoLineup(oid,o.formation),tp=teamPower(lu,o.formation),tac=Object.assign({},TAC0,o.tac||{});
 const ps=squad(oid),key=ps.slice().sort((a,b)=>b.ovr-a.ovr)[0],sc=ps.filter(p=>p.st&&p.st.g).sort((a,b)=>b.st.g-a.st.g)[0];
 const lines=[['ataque',tp.atk],['medio',tp.mid],['defensa',tp.def]].sort((a,b)=>a[1]-b[1]);
 const tips=[];if(tac.est==='con')tips.push('Juegan al contragolpe: no adelantes la línea defensiva.');if(tac.pre==='alt')tips.push('Presionan arriba: el juego directo o el contragolpe les hacen daño.');if(tac.pre==='baj')tips.push('Presionan poco: el estilo de posesión les incomoda.');if(tac.lin==='alt')tips.push('Defienden con la línea alta: el contragolpe es tu mejor arma.');
 tips.push(`Su punto débil es ${lines[0][0]==='defensa'?'la defensa: ataca con decisión':lines[0][0]==='medio'?'el centro del campo: busca la posesión':'el ataque: puedes arriesgar más'}.`);
 if(key)tips.push(`Su mejor jugador es ${key.name} (${SPN[key.sp].toLowerCase()}, ${rt(key)}). La orden «Marcar a su estrella» reduce su peligro.`);
 const co=S.coaches&&S.coaches[oid];
 return `<section class="panel"><div class="panel-h"><h2>Informe del rival</h2><button class="linkname eyebrow" data-a="club-open" data-id="${oid}">${esc(o.name)}</button></div>
 <div class="kv" style="margin-top:0">${co?`<span>Entrenador</span><b>${esc(co.name)} · ${STYLES[co.st].n.toLowerCase()}</b>`:''}<span>Formación</span><b>${o.formation}</b><span>Estilo</span><b>${TACS.est.o[tac.est]} · presión ${TACS.pre.o[tac.pre].toLowerCase()}</b>${sc?`<span>Máximo goleador</span><b>${esc(sc.name)} (${sc.st.g})</b>`:''}<span>Nivel</span><b>${(tp.ovr/10).toFixed(1)}</b></div>
 <ul class="news" style="margin-top:8px">${tips.slice(0,Math.min(compact?3:6,segAt('tac')>=7?6:segAt('tac')>=4?4:2)).map(t=>`<li><span class="wk"></span><span class="t">${esc(t)}</span></li>`).join('')}</ul></section>`;
}
/** Calendario mensual día a día: partidos (con rival y resultado), entrenamientos, mercado y el día de hoy. */
/** Eventos del calendario que no son partidos tuyos: mercado, parones, sorteos y rondas de otras competiciones. */
function calNotes(){
 const N={},add=(d,t,c='')=>{(N[d]=N[d]||[]).push([t,c]);},W=winRounds(),C=cal(),evd=eventDays();
 add(0,'Empieza la pretemporada','pre');add(0,`Abre el mercado ${C.wn[0]}`,'mk');
 add(lgDay(W[0]),`Cierre del mercado ${C.wn[0]}`,'mk');add(lgDay(W[1]),`Abre el mercado ${C.wn[1]}`,'mk');add(lgDay(W[2]),`Cierre del mercado ${C.wn[1]}`,'mk');
 add(FIRST_LG,'Jornada 1 de liga','lg');
 if(C.brk)add(lgDay(C.brk[0])+3,C.brk[2],'brk');
 const nL=S.fixtures[uLg()].length;add(lgDay(nL-1),'Última jornada de liga','lg');
 const cup=userCup();S.cal.forEach((ev,i)=>{let ref=null;try{ref=userRefFor(ev);}catch(e){}if(ref)return;
  if(ev.t==='cup'&&cup){const k=cupSlotRound(cup,ev.s);if(k!=null)add(evd[i],`${cupName(cup.c)} · ${cup.rounds[k]?cupRoundName(cup.rounds[k]):'ronda '+(k+1)}`,'oth');}
  else if(ev.t==='ct')add(evd[i],`Continental · ${CT_STAGES[ev.s]||''}`,'oth');});
 return N;
}
function monthHTML(){
 syncDay();const me=f=>f.h===S.user||f.a===S.user,evd=eventDays(),byDay={},notes=calNotes();
 S.cal.forEach((ev,i)=>{let ref=null;try{ref=userRefFor(ev);}catch(e){}let fx=null,lbl='',k=ev.t;
  if(ev.t==='lg'){fx=S.fixtures[uLg()][ev.r].find(me);lbl=`${LV_NAMES[LG(uLg()).lv]} · J${ev.r+1}`;}else if(ref){fx=getFx(ref);lbl=compLabel(ref);}
  if(fx)(byDay[evd[i]]=byDay[evd[i]]||[]).push({fx,lbl,k});});
 (S.fr||[]).forEach(f=>{if(f.day!=null&&me(f))(byDay[f.day]=byDay[f.day]||[]).push({fx:f,lbl:f.lbl||'Amistoso',k:'fr'});});
 const off=S.calM||0,base=dateOf(S.day),y=base.getUTCFullYear(),mo=base.getUTCMonth()+off,first=new Date(Date.UTC(y,mo,1)),M=first.getUTCMonth(),Y=first.getUTCFullYear();
 const start=seasonStart(),dayIdx=dt=>Math.round((dt-start)/864e5),lead=(first.getUTCDay()+6)%7,nDays=new Date(Date.UTC(Y,M+1,0)).getUTCDate();
 const W=winRounds(),win=di=>(di>=0&&di<=lgDay(W[0]))||(di>=lgDay(W[1])&&di<=lgDay(W[2]));
 const card=x=>{const f=x.fx,home=f.h===S.user,opp=T(home?f.a:f.h),r=f.played?((home?f.hg>f.ag:f.ag>f.hg)?'G':(f.hg===f.ag?'E':'P')):'';
  return `<button class="fev k-${x.k} ${r}" data-a="club-open" data-id="${opp.id}" title="${esc(x.lbl)}"><span class="fcomp">${esc(x.lbl)}</span><span class="fmain">${crest(opp,'sm')}<b>${esc(opp.name)}</b>${f.played?`<em>${home?f.hg:f.ag}-${home?f.ag:f.hg}</em>`:''}</span><span class="fha">${home?'Casa':'Fuera'}</span></button>`;};
 let cells='';for(let k=0;k<lead;k++)cells+='<div class="fday out"></div>';
 for(let d=1;d<=nDays;d++){const di=dayIdx(new Date(Date.UTC(Y,M,d))),evs=byDay[di]||[],nt=notes[di]||[];
  cells+=`<div class="fday${di===S.day?' today':''}${di<S.day?' past':''}${win(di)?' win':''}"><span class="dn">${d}${di===S.day?' · Hoy':''}</span>${evs.map(card).join('')}${nt.map(([t,c])=>`<span class="fnote ${c}">${esc(t)}</span>`).join('')}</div>`;}
 const tail=(7-(lead+nDays)%7)%7;for(let k=0;k<tail;k++)cells+='<div class="fday out"></div>';
 return `<section class="panel fcalp"><div class="panel-h"><h2>${MONTHS_L[M]} ${Y}</h2><div class="row" style="gap:6px"><button class="btn sm" data-a="cal-m" data-v="-1" aria-label="Mes anterior">◀</button><button class="btn sm" data-a="cal-m" data-v="0">Hoy</button><button class="btn sm" data-a="cal-m" data-v="1" aria-label="Mes siguiente">▶</button></div></div>
 <div class="fcal">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(x=>`<div class="fwd"><span>${x}</span><span>${x.slice(0,3)}</span></div>`).join('')}${cells}</div>
 <p class="small muted" style="margin:8px 0 0">Hoy: <b>${esc(dateTxt(S.day,true))}</b> · ${esc(agenda())}. <span class="fleg"><i class="G"></i>victoria <i class="E"></i>empate <i class="P"></i>derrota <i class="w"></i>mercado abierto</span></p></section>`;
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
 const tb=vtab('cal',[['mes','Calendario'],['lista','Lista']],'mes');if(tb.cur==='mes')return tb.bar+monthHTML();
 return tb.bar+`<div class="grid"><div class="stack"><section class="panel"><div class="panel-h"><h2>Próximas fechas</h2><span class="eyebrow">${windowTxt()}</span></div>
 ${items.length?items.map(x=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="eyebrow">${esc(x.lbl)}</div>${x.fx?resRow(x.fx,null):`<div class="small muted">${esc(x.txt||'')}</div>`}</div>`).join(''):'<div class="empty">No quedan partidos esta temporada.</div>'}</section></div>
 <div class="stack"><section class="panel"><div class="panel-h"><h2>Resultados de liga</h2><span class="eyebrow">${past.length} jugados</span></div>${past.length?past.slice().reverse().map(([r,f])=>resRow(f,r)).join(''):'<div class="empty">Aún no has jugado ninguna jornada.</div>'}</section></div></div>`;
}
/** Liguilla o playoffs: cuadro, tu partido y simular la ronda. */
function poHTML(){const P=S.po;if(!P||P.season!==S.seasonN)return '';const ui=userTie();
 const row=(f,i,cur)=>`<div class="res ${f.h===S.user||f.a===S.user?'me':''}"><div class="h"><span>${esc(T(f.h).name)}</span>${crest(T(f.h),'sm')}</div><div class="s">${f.played?f.hg+' - '+f.ag+(f.pen?` (${f.pen[0]}-${f.pen[1]} pen.)`:''):'vs'}</div><div class="a">${crest(T(f.a),'sm')}<span>${esc(T(f.a).name)}</span></div></div>`;
 return `<section class="panel"><div class="panel-h"><h2>🏆 ${esc(P.n)}</h2><span class="eyebrow">${P.done?'Terminada':esc(poRound())}</span></div>
 ${(P.hist||[]).map((r,k)=>`<div class="eyebrow" style="margin-top:6px">${['Cuartos de final','Semifinales'][k]}</div>${r.map(row).join('')}`).join('')}
 <div class="eyebrow" style="margin-top:6px">${P.done?'Final':esc(poRound())}</div>${P.ties.map(row).join('')}
 ${P.done?`<p style="margin:8px 0 0"><b>Campeón: ${esc(T(P.champ).name)}</b>${P.champ===S.user?' 🎉':''}</p>`:`<div class="row" style="margin-top:10px;gap:8px">${ui>=0?`<button class="btn primary" data-a="po-play" data-i="${ui}">Jugar mi partido</button>`:''}<button class="btn" data-a="po-sim">${ui>=0?'Simular mi partido y la ronda':'Simular la ronda'}</button></div>`}</section>`;}
/** Gala del club: los premios de tu equipo esta temporada. */
function galaHTML(){const A=galaAwards();if(!A.length)return '';
 return `<section class="panel gala"><div class="panel-h"><h2>🏆 Gala del club</h2><span class="eyebrow">Temporada ${seasonLabel()}</span></div>
 ${A.map(x=>{const p=PL(x.id);return `<div class="offer"><span class="t"><span class="eyebrow">${esc(x.n)}</span><br>${nameBtn(p)} <span class="small muted">· ${esc(x.t)}</span></span>${pBadge(p)}</div>`;}).join('')}</section>`;}
export function seasonEndView(){
 if(needsPO())setupPO(seasonSummary().tb,mkTie);const poPending=!!(S.po&&S.po.season===S.seasonN&&!S.po.done);
 const sm=seasonSummary(),champ=T(sm.tb[0].id),C=COUNTRIES[sm.L.c];
 const title=sm.L.lv===0&&sm.champ?'¡Campeones de liga!':sm.up?`¡Ascenso a ${LV_NAMES[sm.L.lv-1]}!`:sm.down?`Descenso a ${LV_NAMES[sm.L.lv+1]}`:sm.ok?'Objetivo cumplido':'Objetivo fallado';
 return `<div class="grid"><section class="panel"><div class="eyebrow">Fin de temporada ${seasonLabel()} · ${esc(C.n)} · ${LV_NAMES[sm.L.lv]}</div>
 <div class="row" style="margin-block:10px 6px;gap:16px"><span class="big-num">${sm.pos}º</span><div><h2>${title}</h2><div class="muted">${sm.tb[sm.pos-1].pts} puntos · Campeón: ${esc(champ.name)}</div></div></div>
 <p>La directiva pedía: ${S.obj.txt.toLowerCase()}. ${sm.ok?'Están satisfechos con tu trabajo.':'Esperan una reacción la próxima temporada.'} Premio total: <b>${money(sm.prize)}</b>.</p>
 <p class="small muted">Al empezar la nueva temporada se aplican ascensos y descensos en los ${nC()} países, los jugadores cumplen un año (los jóvenes mejoran, los veteranos bajan y algunos se retiran) y suben dos canteranos. Los jugadores sin renovar se irán libres y los cedidos vuelven a su club.</p>
 ${poPending?`<div class="negmsg">Antes de empezar la nueva temporada se juega la ${esc(S.po.n)}.</div>`:`<button class="btn primary big" data-a="new-season">Empezar temporada ${seasonLabel(S.seasonN+1)}</button>`}</section>
 <div class="stack">${contractsPanel()}<section class="panel"><div class="panel-h"><h2>Clasificación final</h2></div>${tableHTML(sm.tb,sm.lg,true)}</section></div></div>`;
}
