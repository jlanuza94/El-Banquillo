/* El Banquillo · views/modals.js — Ventanas emergentes (negociaciones, resultados, avisos). */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {agentName} from '../connected';
import {agentFee} from '../market';
import {REFS,refFor} from '../extras2';
import {WX,coachH2H,nextWeather,spPrepFor,wxTxt} from '../extras';
import {coachOf} from '../living';
import {nextMatch} from '../competitions';
import {lineupIssues} from '../tactics';
import {dateTxt} from '../calendar';
import {derbyName,h2hTxt,isDerby} from '../rivals';
import {BB_MULT,BB_YEARS,counterTxt} from '../negotiate';
const counterBox=(st,p,m)=>st&&st.counters&&!st.closed?`<div class="negmsg"><b>Contraoferta de su agente</b><div class="row" style="margin-top:6px">${st.counters.map((c,i)=>`<button class="btn sm primary" data-a="terms-counter" data-id="${p.id}" data-m="${m}" data-i="${i}">Aceptar: ${esc(counterTxt(c,p))}</button>`).join('')}</div></div>`:'';
import {ANSWERS,TOPICS,cred} from '../talks';
import {searchModal} from './search';
import {affiliates} from '../clubplus';
import {clubModal} from './clubinfo';
import {LOAN_OBJ} from '../connected';
import {reportBody} from './analysis';
import {compareHTML} from './awards';
import {SON_PCT,dealPrice,swapValue} from '../market2';
import {fireModal} from './staff';
import {esc,money,r2} from '../core';
import {AT_SH,PERS,ROLES,posChip} from '../data';
import {PL,S,T,atCell,crest,lgName,pBadge,squad,uLg} from '../state';
import {news,objectiveFor,startBudget} from '../world';
import {step} from '../engine';
import {CONTS,CT_STAGES,CWC_NAMES,cupName,cupRoundName} from '../competitions';
import {askPrice,inWindow,negState,sell,termsForm} from '../market';
import {contractLabel,loanFee,loansIn,optPrice,renState} from '../contracts';
import {hapReasons,hapTag} from '../squad';
import {atCellS,keyAttrs,pBadgeS,resRow} from './common';
import {fichaHTML} from './squad';
import {reportHTML,tacReport} from '../tacreport';
import {helpHTML} from '../help';
export function modalView(){
 const md=S.modal;if(!md)return '';let body='';
 if(md.type==='ficha'){const p=PL(md.id);if(!p){S.modal=null;return '';}body=fichaHTML(p);}
 else if(md.type==='neg'){const p=PL(md.id),n=negState(md.id),ask=askPrice(p),suggest=n.counter||ask;
  const head=`<div class="eyebrow">${n.viaClause?'Pagas su cláusula de rescisión':p.team===null?'Agente libre · prima de fichaje':'Negociación con '+esc(T(p.team).name)}</div><h2 style="margin-top:4px">${esc(p.name)}</h2>
  <div class="row small muted" style="margin-top:6px">${posChip(p)}${pBadgeS(p)}<span>${p.age} años</span>${keyAttrs(p).map(k=>`<span>${AT_SH[k]} ${atCellS(p,k)}</span>`).join('')}</div>`;
  if(n.agreed!=null){body=head+`<div class="negmsg ok">Traspaso acordado: ${money(n.agreed)}. Falta el contrato del jugador.</div>${n.closed?'':termsForm(p,'buy')}${n.msg&&n.kind==='no'?`<div class="negmsg no">${esc(n.msg)}</div>`:''}${counterBox(n,p,'buy')}
   <div class="acts"><button class="btn" data-a="modal-close">${n.closed?'Cerrar':'Cancelar'}</button>${n.closed?'':`<button class="btn primary" data-a="terms-ok" data-id="${p.id}" data-m="buy">Proponer contrato</button>`}</div>`;}
  else body=head+`<div class="kv"><span>Valor de mercado</span><b>${money(p.value)}</b>${p.team!==null?`<span>Contrato actual</span><b>${esc(contractLabel(p))}</b><span>Cláusula de rescisión</span><b>${money(p.cl)}</b>`:''}<span>${p.team===null?'Prima que pide':'Precio que piden'}</span><b>${money(ask)}</b>${n.counter?`<span>Su última contraoferta</span><b>${money(n.counter)}</b>`:''}<span>Agente</span><b>${esc(agentName(p))} · comisión ${money(agentFee(p,ask))}</b><span>Tu presupuesto</span><b>${money(S.budget)}</b></div>
  ${n.closed?'':`<div class="row" style="margin-top:14px;align-items:flex-end"><label class="f"><span class="eyebrow">Tu oferta (en millones de €)</span><input type="number" id="bidAmt" min="0" step="0.01" value="${suggest.toFixed(3)}"></label></div>
  ${p.team!==null?`<div class="filters" style="margin-top:10px"><label class="f"><span class="eyebrow">Forma de pago</span><select id="bidInst">${[[1,'Todo ahora'],[2,'2 plazos (hoy y en un año)'],[3,'3 plazos (hoy y en dos años)']].map(([v,l])=>`<option value="${v}" ${(n.opt&&n.opt.inst||1)===v?'selected':''}>${l}</option>`).join('')}</select></label>
  <label class="f"><span class="eyebrow">Incluir a un jugador tuyo</span><select id="bidSwap"><option value="">Nadie</option>${squad(S.user).filter(q=>!q.loan).sort((a,b)=>b.value-a.value).map(q=>`<option value="${q.id}" ${n.opt&&n.opt.swap===q.id?'selected':''}>${esc(q.name)} · ${q.sp} · lo valoran en ${money(swapValue(q,p.team))}</option>`).join('')}</select></label>
  <label class="chk"><input type="checkbox" id="bidSon" ${n.opt&&n.opt.son?'checked':''}> Ofrecer un ${Math.round(SON_PCT*100)}% de una futura venta</label></div>`:''}
  ${dealPrice(p.id)!=null?`<div class="negmsg ok">Ganga del día de cierre: lo dejan ir por ${money(dealPrice(p.id))} si cerráis hoy.</div>`:''}
  <p class="small muted" style="margin:6px 0 0">Ejemplo: 0.25 = €250k. Pagar a plazos te deja más dinero ahora, pero el club lo valora un 5% menos por cada plazo. Ofrecer un % de futura venta o incluir a un jugador tuyo hace la oferta más atractiva. Si ofreces menos de lo que piden pueden aceptar, rechazar o contraofertar. Tienes 3 intentos por jornada. Si el club acepta, después negocias el contrato con el jugador.</p>`}
  ${n.msg?`<div class="negmsg ${n.kind}">${esc(n.msg)}</div>`:''}
  <div class="acts"><button class="btn" data-a="modal-close">${n.closed?'Cerrar':'Cancelar'}</button>${n.closed?'':`${p.team!==null&&p.cl<=S.budget?`<button class="btn" data-a="pay-clause" data-id="${p.id}">Pagar cláusula · ${money(p.cl)}</button>`:''}<button class="btn primary" data-a="bid" data-id="${p.id}">Enviar oferta</button>`}</div>`;}
 else if(md.type==='renew'){const p=PL(md.id),st=renState(md.id);
  body=`<div class="eyebrow">Renovación de contrato</div><h2 style="margin-top:4px">${esc(p.name)}</h2>
  <div class="row small muted" style="margin-top:6px">${posChip(p)}${pBadge(p)}<span>${p.age} años · ${hapTag(p)}</span></div>
  <div class="kv"><span>Contrato actual</span><b>${esc(contractLabel(p))}</b><span>Sueldo actual</span><b>${money(p.wage)}/sem</b><span>Rol actual</span><b>${ROLES[p.role||'ro'].n}</b><span>Cláusula actual</span><b>${money(p.cl)}</b></div>
  ${st.closed?'':termsForm(p,'renew')}
  ${st.msg?`<div class="negmsg ${st.kind}">${esc(st.msg)}</div>`:''}${counterBox(st,p,'renew')}
  <div class="acts"><button class="btn" data-a="modal-close">${st.closed?'Cerrar':'Cancelar'}</button>${st.closed?'':`<button class="btn primary" data-a="terms-ok" data-id="${p.id}" data-m="renew">Proponer renovación</button>`}</div>`;}
 else if(md.type==='meet'){const m=S.meet,p=PL(m?m.id:md.id);
  if(!p){body='<p>Esa reunión ya no está pendiente.</p><div class="acts"><button class="btn" data-a="modal-close">Cerrar</button></div>';}
  else{body=`<div class="eyebrow">Reunión en tu despacho${m?' · '+esc(TOPICS[m.topic].n):''}</div><h2 style="margin-top:4px">${esc(p.name)}</h2>
  <div class="row small muted" style="margin-top:6px">${posChip(p)}<span>${hapTag(p)} · ${ROLES[p.role||'ro'].n} · ${PERS[p.per].n} · ${money(p.wage)}/sem</span></div>
  ${m?`<blockquote class="quote">«${esc(TOPICS[m.topic].q(p))}»</blockquote>
  <div class="stack" style="gap:8px">${ANSWERS[m.topic].filter(([k])=>!(m.topic==='min'&&k==='prom'&&p.role==='cl')).map(([k,l])=>`<button class="btn" data-a="meet-ans" data-v="${k}" style="text-align:left">${esc(l)}</button>`).join('')}</div>
  <p class="small muted" style="margin:10px 0 0">Tu credibilidad en el vestuario: <b>${Math.round(cred())}</b>/100. Si prometes algo y no lo cumples, baja y las promesas valen menos.</p>`
  :md.done?`<div class="negmsg ${md.done[1]||''}">${esc(md.done[0])}</div>`:''}
  <div class="acts">${m?'<button class="btn" data-a="modal-close">Luego</button>':'<button class="btn primary" data-a="modal-close">Cerrar</button>'}</div>`;}}
 else if(md.type==='chat'){const p=PL(md.id),done=p.tw===S.week;
  body=`<div class="eyebrow">Hablar con el jugador</div><h2 style="margin-top:4px">${esc(p.name)}</h2>
  <div class="row small muted" style="margin-top:6px">${posChip(p)}<span>${hapTag(p)} · ${ROLES[p.role||'ro'].n} · ${PERS[p.per].n}</span></div>
  <ul class="news" style="margin-top:10px">${hapReasons(p).map(x=>`<li class="${x[1]}"><span class="wk"></span><span class="t">${esc(x[0])}</span></li>`).join('')}</ul>
  ${md.msg?`<div class="negmsg ${md.kind||''}">${esc(md.msg)}</div>`:''}
  ${done?'<p class="small muted">Ya has hablado con él esta jornada.</p>':`<div class="chips" style="margin-top:12px">${p.role!=='cl'?'<button class="btn sm" data-a="chat-opt" data-v="min" data-id="'+p.id+'">Prometer más minutos</button>':''}<button class="btn sm" data-a="chat-opt" data-v="elo" data-id="${p.id}">Elogiar su rendimiento</button>${p.contract<=1&&!p.loan?'<button class="btn sm" data-a="chat-opt" data-v="ren" data-id="'+p.id+'">Prometer una renovación</button>':''}${p.req?'<button class="btn sm" data-a="chat-opt" data-v="pac" data-id="'+p.id+'">Pedirle paciencia</button>':''}</div>`}
  <div class="acts"><button class="btn" data-a="modal-close">Cerrar</button></div>`;}
 else if(md.type==='loan'){const p=PL(md.id),st=S.loanTry[md.id]||{};
  body=`<div class="eyebrow">Cesión desde ${esc(T(p.team).name)}</div><h2 style="margin-top:4px">${esc(p.name)}</h2>
  <div class="row small muted" style="margin-top:6px">${posChip(p)}${pBadgeS(p)}<span>${p.age} años</span>${keyAttrs(p).map(k=>`<span>${AT_SH[k]} ${atCellS(p,k)}</span>`).join('')}</div>
  <div class="kv"><span>Cuota de cesión</span><b>${money(loanFee(p))}</b><span>Sueldo que pagas</span><b>${money(p.wage)}/sem</b><span>Duración</span><b>Hasta final de temporada</b><span>Cedidos en tu plantilla</span><b>${loansIn()} de 4</b></div>
  <p class="small muted" style="margin:10px 0 0">Vuelve a su club en junio. Mientras esté contigo no puedes venderlo ni renovarlo. Los clubes no suelen ceder a sus titulares, salvo jóvenes de 21 años o menos.</p>
  ${st.msg?`<div class="negmsg ${st.kind}">${esc(st.msg)}</div>`:''}
  <div class="acts"><button class="btn" data-a="modal-close">${st.closed?'Cerrar':'Cancelar'}</button>${st.closed?'':`<button class="btn" data-a="loan-ok" data-id="${p.id}" data-o="1">Con opción de compra · ${money(r2(loanFee(p)*1.5))} + ${money(optPrice(p))} si la ejecutas</button><button class="btn primary" data-a="loan-ok" data-id="${p.id}">Cesión simple · ${money(loanFee(p))}</button>`}</div>`;}
 else if(md.type==='loanout'){const p=PL(md.id),o=S.lo[md.id],aff=affiliates();
  body=o.none&&!aff.length?`<div class="eyebrow">Ceder jugador</div><h2 style="margin-top:4px">${esc(p.name)}</h2><p>Ningún club está interesado en llevárselo cedido esta jornada. Prueba la próxima.</p><div class="acts"><button class="btn" data-a="modal-close">Cerrar</button></div>`
  :`<div class="eyebrow">${o.none?'Ceder a un club afiliado':'Interés por una cesión'}</div><h2 style="margin-top:4px">${o.none?esc(p.name):esc(T(o.team).name)+' quiere a '+esc(p.name)+' cedido'}</h2>
  <div class="kv">${o.none?'':`<span>Club</span><b>${esc(T(o.team).name)}</b><span>Liga</span><b>${esc(lgName(T(o.team).lg))}</b>`}<span>Duración</span><b>Hasta final de temporada</b><span>Sueldo que te ahorras</span><b>${money(p.wage)}/sem</b></div>
  <label class="f" style="margin-top:12px"><span class="eyebrow">Destino</span><select id="loanTo">${o.none?'':`<option value="">${esc(T(o.team).name)} (le interesa)</option>`}${aff.map(id=>`<option value="${id}">${esc(T(id).name)} (afiliado)</option>`).join('')}</select></label>
  <label class="f" style="margin-top:12px"><span class="eyebrow">Objetivo de minutos</span><select id="loanObj">${Object.entries(LOAN_OBJ).map(([k,[l]])=>`<option value="${k}">${l}</option>`).join('')}</select></label>
  <p class="small muted" style="margin:10px 0 0">Allí jugará más minutos, y los jóvenes que juegan progresan. Con un objetivo, el club se compromete a darle esos minutos: si lo cumple vuelve más hecho; si no, te paga una compensación. Vuelve a tu plantilla en junio.</p>
  <div class="acts"><button class="btn" data-a="modal-close">Rechazar</button><button class="btn primary" data-a="loanout-ok" data-id="${p.id}">Aceptar cesión</button></div>`;}
 else if(md.type==='sell'){const p=PL(md.id),o=S.offers[md.id];body=`<div class="eyebrow">Oferta recibida</div><h2 style="margin-top:4px">${esc(T(o.team).name)} quiere a ${esc(p.name)}</h2>
  <div class="kv"><span>Liga del club</span><b>${esc(lgName(T(o.team).lg))}</b><span>Oferta</span><b>${money(o.amount)}</b><span>Valor de mercado</span><b>${money(p.value)}</b><span>Sueldo que te ahorras</span><b>${money(p.wage)}/sem</b></div>
  <p class="small muted" style="margin:10px 0 0">Si pides un ${Math.round(SON_PCT*100)}% de futura venta, cobras un 10% menos ahora, pero si algún día lo traspasan, te llevas el ${Math.round(SON_PCT*100)}% de lo que paguen.</p>
  <div class="acts"><button class="btn" data-a="modal-close">Rechazar</button><button class="btn" data-a="sell-bb" data-id="${p.id}" title="Durante ${BB_YEARS} temporadas podrás recomprarlo por el ${Math.round(BB_MULT*100)}% de lo que pagan">${money(o.amount*.9)} + cláusula de recompra</button><button class="btn" data-a="sell-son" data-id="${p.id}">${money(o.amount*.9)} + ${Math.round(SON_PCT*100)}% de futura venta</button><button class="btn primary" data-a="sell-ok" data-id="${p.id}">Aceptar ${money(o.amount)}</button></div>`;}
 else if(md.type==='round'){const fx=S.fixtures[uLg()][md.round];body=`<div class="eyebrow">${esc(lgName(uLg()))} · Resultados</div><h2 style="margin:4px 0 8px">Jornada ${md.round+1}</h2>${fx.map(f=>resRow(f,null)).join('')}
  <div class="acts"><button class="btn primary" data-a="modal-close">Continuar</button></div>`;}
 else if(md.type==='cupres'){const rd=S.cups[md.c].rounds[md.r];body=`<div class="eyebrow">${esc(cupName(md.c))}</div><h2 style="margin:4px 0 8px">${cupRoundName(rd)}</h2>${rd.matches.slice().sort((a,b)=>((b.h===S.user||b.a===S.user)?1:0)-((a.h===S.user||a.a===S.user)?1:0)).map(f=>resRow(f,null,true)).join('')}
  <div class="acts"><button class="btn" data-a="cup-open">Ver la copa</button><button class="btn primary" data-a="modal-close">Continuar</button></div>`;}
 else if(md.type==='ctres'){const d=S.conts[md.ct].dates[md.s];const me=d.filter(f=>f.h===S.user||f.a===S.user),rest=d.filter(f=>!(f.h===S.user||f.a===S.user));body=`<div class="eyebrow">${CONTS[md.ct].n}</div><h2 style="margin:4px 0 8px">${CT_STAGES[md.s]}</h2>${[...me,...rest].map(f=>resRow(f,null)).join('')}
  <div class="acts"><button class="btn" data-a="ct-open" data-v="${md.ct}">Ver la competición</button><button class="btn primary" data-a="modal-close">Continuar</button></div>`;}
 else if(md.type==='cwcres'){body=`<div class="eyebrow">Mundial de Clubes</div><h2 style="margin:4px 0 8px">${CWC_NAMES[md.s]}</h2>${S.cwc.dates[md.s].map(f=>resRow(f,null)).join('')}
  <div class="acts"><button class="btn" data-a="cwc-open">Ver el Mundial</button><button class="btn primary" data-a="modal-close">Continuar</button></div>`;}
 else if(md.type==='resign'){body=`<h2>¿Dimitir?</h2><p>Dejarás ${esc(T(S.user).name)} ahora mismo. Tu reputación bajará un poco y tendrás que elegir entre los clubes que te quieran.</p><div class="acts"><button class="btn" data-a="modal-close">Seguir en el club</button><button class="btn danger" data-a="resign-ok">Dimitir</button></div>`;}
 else if(md.type==='joboffer'){const o=md.o,t=T(o.team);body=`<div class="eyebrow">Candidatura aceptada</div><h2 style="margin-top:4px">${esc(t.name)} te quiere</h2><div class="kv"><span>Liga</span><b>${esc(lgName(t.lg))}</b><span>Salario</span><b>${money(o.sal)}/sem</b><span>Contrato</span><b>${o.yrs} temporadas</b><span>Presupuesto del club</span><b>${money(startBudget(t))}</b><span>Objetivo</span><b>${objectiveFor(t.id).txt}</b></div><p class="small muted">Si aceptas, dejas tu club actual de inmediato. Tu cantera, ojeadores y cuerpo técnico se quedan en el club que dejas.</p><div class="acts"><button class="btn" data-a="modal-close">Rechazar</button><button class="btn primary" data-a="joboffer-ok">Firmar</button></div>`;}
 else if(md.type==='matchday'){const nm=nextMatch();if(!nm){S.modal=null;return '';}const home=nm.fx.h===S.user,opp=T(home?nm.fx.a:nm.fx.h),dv=isDerby(S.user,opp.id),iss=lineupIssues();
  body=`<div class="eyebrow">${esc(dateTxt(S.day,true))} · Día de partido</div><h2 style="margin:4px 0 6px">${home?'':'En '}${esc(home?T(S.user).name+' - '+opp.name:opp.name)}</h2>
  ${dv?`<div class="derbytag">🔥 ${derbyName(S.user,opp.id)}</div>`:''}<div class="small muted">${esc(nm.label)} · ${home?'en casa':'a domicilio'} · tu historial: ${esc(h2hTxt(opp.id))}</div>${(()=>{const w=nextWeather(),c=coachOf(opp.id),r=coachH2H(opp.id);return `<div class="small" style="margin-top:6px">${w?`${esc(wxTxt(w))} · ${esc(WX[w.k].d)}`:''}${c?`<br>Enfrente: ${esc(c.name)}${r?` (tú ${r.w}G ${r.d}E ${r.l}P contra él)`:''}${S.pique&&S.pique.opp===opp.id&&S.pique.resp==='r'?' · le respondiste en la prensa: el equipo sale motivado':''}`:''}${(()=>{const R=refFor(nm.ref,nm.fx.h);return `<br>Árbitro: ${esc(R.name)} (${REFS[R.k].n.toLowerCase()})`;})()}${spPrepFor(opp.id)?'<br>Has preparado la defensa a balón parado.':''}</div>`;})()}
  ${iss.length?`<div class="warnbox" style="margin-top:10px"><span>Tu once tiene ${iss.length} hueco${iss.length>1?'s':''} o jugadores no disponibles.</span><button class="btn sm" data-a="fixlu">Completar</button></div>`:''}
  <div class="stack" style="gap:8px;margin-top:14px"><button class="btn primary big" data-a="play">Jugar el partido</button><button class="btn" data-a="sim-go" data-v="next">Simular: lo dirige tu segundo</button><button class="btn" data-a="view" data-v="tacticas">Revisar tácticas antes</button></div>
  <div class="acts"><button class="btn" data-a="modal-close">Ahora no</button></div>`;}
 else if(md.type==='sim'){body=`<h2>Simular</h2><p class="small muted">Se juegan tus partidos sin verlos, con tu alineación y tácticas actuales. Los cambios y la rotación los hace tu ayudante.</p>
  <div class="stack" style="gap:8px;margin-top:12px">${[['next','Solo el próximo partido'],['5','Próximos 5 partidos'],['win','Hasta que cierre el mercado'],['season','Hasta el final de la temporada']].map(([k,l])=>`<button class="btn" data-a="sim-go" data-v="${k}" ${k==='win'&&!inWindow()?'disabled':''}>${l}</button>`).join('')}</div>
  <label class="chk" style="margin-top:12px"><input type="checkbox" id="simStop" ${S.simStop!==false?'checked':''}> Parar si llega una oferta por un jugador o por ti</label>
  <div class="acts"><button class="btn" data-a="modal-close">Cancelar</button></div>`;}
 else if(md.type==='simsum'){const r=md.res,c={G:0,E:0,P:0};r.forEach(x=>c[x.r]++);body=`<div class="eyebrow">Simulación terminada</div><h2 style="margin:4px 0 8px">${r.length} partido${r.length===1?'':'s'}: ${c.G}G ${c.E}E ${c.P}P</h2>${md.stopReason?`<p class="small" style="margin:0 0 8px"><b>Parada:</b> ${esc(md.stopReason)}</p>`:''}${r.slice(-12).reverse().map(x=>`<div class="res ${'me'}"><div class="h"><span>${esc(T(x.h).name)}</span>${crest(T(x.h),'sm')}</div><div class="s">${x.hg} - ${x.ag}</div><div class="a">${crest(T(x.a),'sm')}<span>${esc(T(x.a).name)}</span></div><div class="sc">${esc(x.label)}${x.pen?` · penaltis ${x.pen[0]}-${x.pen[1]}`:''}</div></div>`).join('')}
  <div class="acts"><button class="btn primary" data-a="modal-close">Continuar</button></div>`;}
 else if(md.type==='backup'){body=`<h2>Copia de seguridad</h2><p class="small muted">Copia este código y guárdalo (por ejemplo, en tus notas). Para recuperar la partida, usa «Restaurar una copia» y pégalo.</p><textarea id="bkTxt" readonly style="width:100%;height:160px;font:12px var(--f-num);border:1px solid var(--line);border-radius:4px;background:var(--surface2);color:var(--ink)">${esc(md.code)}</textarea><p class="small muted">${Math.round(md.code.length/1024)} KB</p><div class="acts"><button class="btn" data-a="bk-select">Seleccionar todo</button><button class="btn primary" data-a="modal-close">Hecho</button></div>`;}
 else if(md.type==='restore'){body=`<h2>Restaurar partida</h2><p class="small muted">Pega aquí el código de tu copia de seguridad. La partida actual se sustituirá.</p><textarea id="rsTxt" style="width:100%;height:160px;font:12px var(--f-num);border:1px solid var(--line);border-radius:4px;background:var(--surface);color:var(--ink)" placeholder="EB1:..."></textarea>${md.err?`<div class="negmsg no">${esc(md.err)}</div>`:''}<div class="acts"><button class="btn" data-a="modal-close">Cancelar</button><button class="btn primary" data-a="rs-go">Restaurar</button></div>`;}
 else if(md.type==='search'){body=searchModal();}
 else if(md.type==='club'){if(!T(md.id)){S.modal=null;return '';}body=clubModal(md.id);}
 else if(md.type==='mrep'){const r=(S.mlog||[])[md.i];if(!r){S.modal=null;return '';}body=reportBody(r)+`<div class="acts">${r.tr?`<button class="btn" data-a="trep" data-v="${r.n}">Informe táctico</button>`:''}<button class="btn primary" data-a="modal-close">Cerrar</button></div>`;}
 else if(md.type==='help'){body=helpHTML(md.v)+`<div class="acts"><button class="btn primary" data-a="modal-close">Entendido</button></div>`;}
 else if(md.type==='trep'){const r=md.live?null:(S.mlog||[]).find(x=>x.n===md.n),R=md.live?(S.match&&tacReport(S.match)):r&&r.tr;if(!R){S.modal=null;return '';}const h=md.live?S.match:r;
  body=`<div class="eyebrow">Informe táctico de tu segundo entrenador</div><h2 style="margin:4px 0 10px">${esc(T(h.h).name)} ${md.live?h.score.h:h.hg}-${md.live?h.score.a:h.ag} ${esc(T(h.a).name)}</h2>${reportHTML(R)}<div class="acts">${md.live?'':`<button class="btn" data-a="an-match" data-i="${(S.mlog||[]).indexOf(r)}">Estadísticas del partido</button>`}<button class="btn primary" data-a="modal-close">Cerrar</button></div>`;}
 else if(md.type==='cmp'){const a=PL(md.a),b=PL(md.b);if(!a||!b){S.modal=null;return '';}body=compareHTML(a,b);}
 else if(md.type==='stfire'){const m=(S.crew||[]).find(x=>x.id===md.id);if(!m){S.modal=null;return '';}body=fireModal(m);}
 else if(md.type==='newgame'){body=`<h2>¿Empezar de cero?</h2><p>Perderás esta partida con ${esc(T(S.user).name)}, incluido el historial de temporadas.</p><div class="acts"><button class="btn" data-a="modal-close">Seguir con esta partida</button><button class="btn danger" data-a="new-game-ok">Borrar y empezar</button></div>`;}
 return `<div class="ov" data-a="ov"><div class="modal ${md.type==='mrep'||md.type==='trep'?'wide':''}" role="dialog" aria-modal="true">${body}</div></div>`;
}
