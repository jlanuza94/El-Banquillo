/* El Banquillo · views/home.js — Inicio, informe del rival, calendario y fin de temporada. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {fLabel} from '../freeboard';
import {winRounds} from '../calendar';
import {INT_MAX,PRE_FR,PRE_GAP,daysToLeague,friendlyWait,inPre,preTasks,ptNext} from '../preseason';
import {needsPO,poRound,setupPO,userTie} from '../playoffs';
import {mkTie} from '../competitions';
import {galaAwards} from '../extras';
import {FIRST_LG,cal,lgDay,MONTHS_L,agenda,dateOf,dateTxt,dayOfEvent,daysToMatch,eventDays,seasonStart,syncDay} from '../calendar';
import {stadiumSVG} from './title';
import {SES,sched} from '../training2';
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
import {friendlyFee,friendlyOpts,friendlyTire,seasonSummary} from '../season';
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
 const hero=`<section class="hero slim"><div class="hbg">${stadiumSVG()}</div><div class="hin">
  <div class="hmain"><div class="hcomp">${esc(nm.label)} · ${dateTxt(ev)} · ${nm.ref.k==='cwc'?'campo neutral':home?'en casa':'a domicilio'}</div>
  <div class="hvs">${tside(T(fx.h))}<div class="hmid"><b>VS</b><span class="${dtm===0?'today':''}">${dtm===0?'¡Hoy!':dtm===1?'Mañana':`en ${dtm} días`}</span></div>${tside(T(fx.a))}</div>
  </div><div class="hbtns"><button class="btn" data-a="view" data-v="tacticas">Tácticas</button>${dtm===0?'<button class="btn" data-a="sim-menu">Simular</button><button class="btn primary" data-a="play">Jugar partido</button>':'<button class="btn primary" data-a="continue">Continuar</button>'}</div></div></section>
  <div class="hstats">
   ${stat('Liga',S.week?`${posOf(S.user)}º`:'—',me?`${me.pts} pts · ${me.pj} PJ`:'','view','liga')}
   ${stat('Confianza',O,O>=60?'La directiva confía':O>=35?'Algo de dudas':'¡En peligro!','view','club',O<35?'warn':'')}
   ${stat('Enfermería',inj,`lesionado${inj===1?'':'s'}${sus?` · ${sus} sanc.`:''}`,'view','plantilla',inj?'warn':'')}
   ${stat('Mercado',mk?'Abierto':'Cerrado',mk?`${negs} negoc. · ${inc} ofertas`:S.week<winRounds()[1]?`invierno en ${winRounds()[1]-S.week} jorn.`:'abre en verano','view','mercado',mk?'ok':'')}
   ${stat('Bandeja',un,un===1?'sin leer':'sin leer','view','buzon',un?'hot':'')}
  </div>`;
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
  <div class="row" style="margin-top:16px"><span class="muted small">${fLabel(t.formation)} · Mentalidad ${MENT[t.ment].label.toLowerCase()} · Química ${Math.round(S.chem)} · Entreno: ${FOCUS[S.train.focus].n.toLowerCase()}</span><span class="spacer"></span>
  <button class="btn" data-a="view" data-v="plantilla">Alineación</button><button class="btn" data-a="view" data-v="tacticas">Tácticas</button><button class="btn" data-a="sim-menu">Simular</button><button class="btn primary big" data-a="play">Jugar partido</button></div></section>`;
 const last=[];for(let r=S.week-1;r>=0&&last.length<5;r--){last.push([r,S.fixtures[lg][r].find(f=>f.h===S.user||f.a===S.user)]);}
 const lastH=last.length?last.map(([r,f])=>resRow(f,r)).join(''):`<div class="empty">Aún no has jugado. Tu primer partido es contra ${esc(opp.name)}.</div>`;
 const jobsP=(S.jobOffers||[]).length?`<section class="panel"><div class="panel-h"><h2>Ofertas de trabajo</h2><span class="eyebrow">Para ti como entrenador</span></div>${S.jobOffers.map((o,i)=>`<div class="offer">${crest(T(o.team),'sm')}<span class="t"><b>${esc(T(o.team).name)}</b> <span class="divtag">${lgName(T(o.team).lg,true)}</span> te ofrece ${money(o.sal)}/sem hasta junio de ${2025+S.seasonN+o.yrs}.${o.bud?`<br><span class="small muted">Presupuesto ~${money(o.bud)} · ${LG(T(o.team).lg).lv<LG(T(S.user).lg).lv?`subes ${LG(T(S.user).lg).lv-LG(T(o.team).lg).lv} categoría${LG(T(S.user).lg).lv-LG(T(o.team).lg).lv>1?'s':''}`:''}${o.obj?' · objetivo: '+esc(o.obj):''}</span>`:''}</span><button class="btn sm" data-a="job-no" data-i="${i}">Rechazar</button><button class="btn sm primary" data-a="job-yes" data-i="${i}">Aceptar</button></div>`).join('')}</section>`:'';
 const preP=inPre()?(()=>{const TK=preTasks(),dn=TK.filter(x=>x[2]).length,IC={rep:'📋',pl:'👕',tac:'🧠',mk:'🔁',fr:'🤝',int:'⚔️'},SH={rep:'Informe del segundo',pl:'Revisar la plantilla',tac:'Once y táctica',mk:'Buscar refuerzos',fr:`Amistosos ${PRE_FR-S.pre.left}/${PRE_FR}`,int:`Partido interno ${S.pre.intN||0}/${INT_MAX}`},fw=friendlyWait(),P=S.ptour;
  const tasks=`<div class="ptk">${TK.map(([k,l,done,a,v])=>`<button class="ptk1${done?' ok':''}" ${a?`data-a="${a}"${v?` data-v="${v}"`:''}`:'disabled'}><span class="pti">${done?'✔':IC[k]||'•'}</span><span>${esc(SH[k]||l)}</span></button>`).join('')}</div>`;
  const fr=S.pre.left>0?`<div class="pcol"><h3>🤝 Amistosos <small>${PRE_FR-S.pre.left}/${PRE_FR}</small></h3>${fw?`<p class="small muted">El próximo, dentro de ${fw} día${fw>1?'s':''}.</p>`:''}${friendlyOpts().map(id=>{const o=T(id),[tl]=friendlyTire(id);return `<button class="prr" data-a="friendly" data-id="${id}" ${fw?'disabled':''}>${crest(o,'sm')}<span><b>${esc(o.name)}</b><small>${esc(lgName(o.lg,true))} · nivel ${Math.round(strength(id))} · 💶 ${money(friendlyFee(id))} · cansancio ${tl}</small></span><i>Jugar ▶</i></button>`;}).join('')}</div>`:'<div class="pcol"><h3>🤝 Amistosos</h3><p class="small">✔ Completados.</p></div>';
  const pt=P&&P.st!=='no'?`<div class="pcol ptourc"><h3>🏆 ${esc(P.n)}</h3>${P.st==='inv'?`<p class="small">Torneo de 4 equipos. Campeón: <b>${money(P.prize[0])}</b>.</p><div class="row" style="gap:6px"><button class="btn sm primary" data-a="pt-join" data-v="yes">Participar</button><button class="btn sm" data-a="pt-join" data-v="no">No</button></div>`:ptNext()?`<button class="prr" data-a="pt-play" ${fw?'disabled':''}>${crest(T(ptNext()[0]),'sm')}<span><b>${esc(T(ptNext()[0]).name)}</b><small>${ptNext()[1]}</small></span><i>Jugar ▶</i></button><button class="btn sm" data-a="pt-view">Ver cuadro</button>`:`<p class="small">${P.champ===S.user?'🏆 ¡Campeones!':`Campeón: ${esc(T(P.champ).name)}`}</p><button class="btn sm" data-a="pt-view">Ver cuadro</button>`}</div>`:'';
  const inn=`<div class="pcol"><h3>⚔️ Partido interno <small>${S.pre.intN||0}/${INT_MAX}</small></h3><p class="small muted">Titulares contra suplentes: sube la química y ves quién está en forma.</p><button class="btn sm${(S.pre.intN||0)<INT_MAX&&!fw?' primary':''}" data-a="int-play" ${(S.pre.intN||0)>=INT_MAX||fw?'disabled':''}>Jugar</button></div>`;
  return `<section class="panel prep2"><div class="panel-h"><h2>Pretemporada</h2><span class="eyebrow">${daysToLeague()} días para la jornada 1</span></div>
  <div class="pprog"><i style="width:${Math.round(dn/TK.length*100)}%"></i><span>${dn} de ${TK.length} tareas</span></div>${tasks}<div class="pcols">${fr}${pt}${inn}</div></section>`;})():'';
 const spP=!S.sponsor&&S.spOffers&&S.spOffers.length?`<section class="panel"><div class="panel-h"><h2>Elige patrocinador</h2><span class="eyebrow">Antes de la jornada 4</span></div>${S.spOffers.map((o,i)=>`<div class="offer"><span class="t"><b>${esc(o.name)}</b><br><span class="small muted">${spDesc(o)}</span></span><button class="btn sm primary" data-a="sponsor" data-i="${i}">Firmar</button></div>`).join('')}</section>`:'';
 const mp=S.meet&&PL(S.meet.id),meetP=mp?`<section class="panel"><div class="panel-h"><h2>Reunión pendiente</h2><span class="eyebrow">${esc(TOPICS[S.meet.topic].n)}</span></div><div class="offer">${posChip(mp)}<span class="t">${nameBtn(mp)} quiere hablar contigo.<br><span class="small muted">Si no le recibes en dos jornadas, se molestará.</span></span><button class="btn primary sm" data-a="meet">Reunirse</button></div></section>`:'';
 const pressP=S.press?`<section class="panel"><div class="panel-h"><h2>Rueda de prensa</h2><span class="eyebrow">Antes del próximo partido</span></div><p style="margin:0 0 10px"><b>«${esc(S.press.q)}»</b></p><div class="stack" style="gap:6px">${S.press.o.map((x,i)=>`<button class="btn" style="text-align:left;text-transform:none;letter-spacing:0;font-family:var(--f-body);font-weight:600" data-a="press" data-i="${i}">${esc(x[0])}</button>`).join('')}</div><p class="small muted" style="margin:8px 0 0">Lo que digas afecta al vestuario, a la afición y a la directiva. Si no vas a la rueda de prensa, a la directiva no le gusta.</p></section>`:'';
 let sugP='';if(inWindow()||quick()){const sg=suggestions(3);if(sg.list.length)sugP=`<section class="panel"><div class="panel-h"><h2>Tu segundo recomienda</h2><span class="eyebrow">Refuerzos para ${{POR:'la portería',DEF:'la defensa',MED:'el medio',DEL:'el ataque'}[sg.g]}</span></div>${sg.list.map(p=>`<div class="offer">${crest(T(p.team??S.user),'sm')}<span class="t">${nameBtn(p)} <span class="small muted">· ${p.age} años · ${p.team===null?'libre':esc(T(p.team).short)} · ${money(askPrice(p))}</span></span>${pBadgeS(p)}<button class="btn sm primary" data-a="neg" data-id="${p.id}">Ofertar</button></div>`).join('')}</section>`;}
 return dashHTML(nm,tb)+preP+`<div class="grid"><div class="stack">${jobsP}${meetP}${pressP}${spP}${offersPanel()}${next}${sugP}${reportHTML(opp.id,true)}
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
 <div class="kv" style="margin-top:0">${co?`<span>Entrenador</span><b>${esc(co.name)} · ${STYLES[co.st].n.toLowerCase()}</b>`:''}<span>Formación</span><b>${o.formation}</b><span>Estilo</span><b>${TACS.est.o[tac.est]} · presión ${TACS.pre.o[tac.pre].toLowerCase()}</b>${sc?`<span>Máximo goleador</span><b>${esc(sc.name)} (${sc.st.g})</b>`:''}<span>Nivel</span><b>${Math.round(tp.ovr)}</b></div>
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
/** Tus partidos de la temporada por día: liga, copas, continental y amistosos. */
function userDays(){
 const me=f=>f.h===S.user||f.a===S.user,evd=eventDays(),byDay={};
 S.cal.forEach((ev,i)=>{let ref=null;try{ref=userRefFor(ev);}catch(e){}let fx=null,lbl='',k=ev.t;
  if(ev.t==='lg'){fx=S.fixtures[uLg()][ev.r].find(me);lbl=`${LV_NAMES[LG(uLg()).lv]} · J${ev.r+1}`;}else if(ref){fx=getFx(ref);lbl=compLabel(ref);}
  if(fx)(byDay[evd[i]]=byDay[evd[i]]||[]).push({fx,lbl,k});});
 (S.fr||[]).forEach(f=>{if(f.day!=null&&me(f))(byDay[f.day]=byDay[f.day]||[]).push({fx:f,lbl:f.lbl||'Amistoso',k:'fr'});});
 const P=S.ptour;if(P&&P.st!=='no'&&P.st!=='inv'){(P.res||[]).forEach(r=>{if(r.d!=null&&(r.h===S.user||r.a===S.user))(byDay[r.d]=byDay[r.d]||[]).push({fx:{h:r.h,a:r.a,hg:r.sh,ag:r.sa,pen:r.pen,played:true},lbl:`${P.n} · ${r.f==='final'?'Final':'Semifinal'}`,k:'pt'});});
  const nx=ptNext();if(nx&&inPre()){const d=(S.day||0)+friendlyWait();(byDay[d]=byDay[d]||[]).push({fx:{h:S.user,a:nx[0],played:false},lbl:`${P.n} · ${nx[1]}`,k:'pt'});}}
 return byDay;
}
/** Lista de partidos de la temporada, como «Partidos del club» del FM: fecha, rival, campo, resultado y competición. */
function fixturesHTML(){
 syncDay();const byDay=userDays(),days=Object.keys(byDay).map(Number).sort((a,b)=>a-b);
 const rows=days.flatMap(d=>byDay[d].map(x=>{const f=x.fx,home=f.h===S.user,opp=T(home?f.a:f.h),r=f.played?((home?f.hg>f.ag:f.ag>f.hg)?'G':(f.hg===f.ag?'E':'P')):'';
  return `<tr class="${d===S.day?'today':''}${d<S.day&&!f.played?' dim':''}"><td class="fxd">${esc(dateTxt(d))}</td><td class="fxo">${crest(opp,'sm')}<button class="linkname" data-a="club-open" data-id="${opp.id}">${esc(opp.name)}</button></td><td class="c"><span class="fxha ${home?'h':'a'}">${home?'C':'F'}</span></td><td class="c">${f.played?`<span class="fxr ${r}">${r}</span><b class="num">${home?f.hg:f.ag}-${home?f.ag:f.hg}</b>${f.pen?` <small>(${home?f.pen[0]:f.pen[1]}-${home?f.pen[1]:f.pen[0]} p.)</small>`:''}`:'<span class="muted">—</span>'}</td><td class="fxc k-${x.k}">${esc(x.lbl)}</td></tr>`;})).join('');
 const P=days.flatMap(d=>byDay[d]).filter(x=>x.fx.played),w=P.filter(x=>{const f=x.fx,h=f.h===S.user;return h?f.hg>f.ag:f.ag>f.hg;}).length,dr=P.filter(x=>x.fx.hg===x.fx.ag).length;
 return `<section class="panel"><div class="panel-h"><h2>Partidos · temporada ${seasonLabel()}</h2><span class="eyebrow">${P.length} jugados · ${w}G ${dr}E ${P.length-w-dr}P</span></div>
 <div class="tbl fxtbl"><table><thead><tr><th>Fecha</th><th>Rival</th><th class="c">C/F</th><th class="c">Resultado</th><th>Competición</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="muted">Sin partidos.</td></tr>'}</tbody></table></div></section>`;
}
function monthHTML(){
 syncDay();const me=f=>f.h===S.user||f.a===S.user,evd=eventDays(),byDay=userDays(),notes=calNotes();
 const off=S.calM||0,base=dateOf(S.day),y=base.getUTCFullYear(),mo=base.getUTCMonth()+off,first=new Date(Date.UTC(y,mo,1)),M=first.getUTCMonth(),Y=first.getUTCFullYear();
 const start=seasonStart(),dayIdx=dt=>Math.round((dt-start)/864e5),lead=(first.getUTCDay()+6)%7,nDays=new Date(Date.UTC(Y,M+1,0)).getUTCDate();
 const W=winRounds(),win=di=>(di>=0&&di<=lgDay(W[0]))||(di>=lgDay(W[1])&&di<=lgDay(W[2]));
 const card=x=>{const f=x.fx,home=f.h===S.user,opp=T(home?f.a:f.h),r=f.played?((home?f.hg>f.ag:f.ag>f.hg)?'G':(f.hg===f.ag?'E':'P')):'';
  return `<button class="fev k-${x.k} ${r}" data-a="club-open" data-id="${opp.id}" title="${esc(x.lbl)}"><span class="fcomp">${esc(x.lbl)}</span><span class="fmain">${crest(opp,'sm')}<b>${esc(opp.name)}</b>${f.played?`<em>${home?f.hg:f.ag}-${home?f.ag:f.hg}</em>`:''}</span><span class="fha">${home?'Casa':'Fuera'}</span></button>`;};
 const SCH=sched();let cells='';for(let k=0;k<lead;k++)cells+='<div class="fday out"></div>';
 for(let d=1;d<=nDays;d++){const di=dayIdx(new Date(Date.UTC(Y,M,d))),evs=byDay[di]||[],nt=notes[di]||[];
  const wd=(lead+d-1)%7,tk=!evs.length&&di>=S.day&&di>=0&&di<S.day+70?SCH[wd]:null,tr=tk&&SES[tk]?`<span class="ftr" title="Entrenamiento: ${esc(SES[tk].n)}">${SES[tk].i}<small>${esc(SES[tk].n)}</small></span>`:'';
  const nts=nt.slice(0,evs.length?1:2).map(([t,c])=>`<span class="fnote ${c}" title="${esc(t)}">${esc(t)}</span>`).join('')+(nt.length>(evs.length?1:2)?`<span class="fnote more" title="${esc(nt.slice(evs.length?1:2).map(x=>x[0]).join(' · '))}">+${nt.length-(evs.length?1:2)}</span>`:'');
  cells+=`<div class="fday${di===S.day?' today':''}${di<S.day?' past':''}${di<0?' pre0':''}${win(di)?' win':''}${wd>=5?' we':''}"><div class="fdh"><span class="dn">${d}</span>${di===S.day?'<span class="hoy">Hoy</span>':''}${tr}</div>${evs.map(card).join('')}${nts}</div>`;}
 const tail=(7-(lead+nDays)%7)%7;for(let k=0;k<tail;k++)cells+='<div class="fday out"></div>';
 {const parts=cells.split(/(?=<div class="fday)/),rows=[];for(let i=0;i<parts.length;i+=7)rows.push(parts.slice(i,i+7));const keep=rows.filter(r=>!r.every(c=>/fday out|pre0/.test(c)));cells=(keep.length?keep:rows).map(r=>r.join('')).join('');}
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
 const tb=vtab('cal',[['mes','Calendario'],['fx','Partidos'],['lista','Próximas fechas']],'mes');if(tb.cur==='mes')return tb.bar+monthHTML();if(tb.cur==='fx')return tb.bar+fixturesHTML();
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
