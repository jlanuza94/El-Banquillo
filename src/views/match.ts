/* El Banquillo · views/match.js — Pantalla del partido en directo. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {ITALK,REFS} from '../extras2';
import {WX,wxTxt} from '../extras';
import {laneShare,laneTip} from '../tactics2';
import {derbyName} from '../rivals';
import {goalsOf,soundOn} from '../replay';
import {shotMap} from './analysis';
import {matchRecord} from '../analysis';
import {esc,fill,fmtMin} from '../core';
import {GRP,MENT,OIS,TACS} from '../data';
import {slotsOf} from '../tactics';
import {PL,RT,S,T,crest,lastNm,rt} from '../state';
import {GOALT,TALKS,bench,liveRatings} from '../engine';
import {pitchHTML} from './common';
export const ICON={goal:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#fff" stroke="currentColor" stroke-width="1.2"/><path d="M8 4.6l2.6 1.9-1 3.1H6.4l-1-3.1z" fill="currentColor"/></svg>',
 yc:'<span class="ic yc" aria-label="Amarilla"></span>',red:'<span class="ic rc" aria-label="Roja"></span>',
 sub:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2v10M1.5 9.5L4 12l2.5-2.5" stroke="#2b8a4b" stroke-width="1.8" fill="none"/><path d="M12 14V4M9.5 6.5L12 4l2.5 2.5" stroke="#c23a2e" stroke-width="1.8" fill="none"/></svg>',
 inj:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="1" width="14" height="14" rx="3" fill="#c23a2e"/><path d="M8 4v8M4 8h8" stroke="#fff" stroke-width="2.2"/></svg>',
 shot:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".55"/></svg>',sys:''};
/** Por dónde ataca cada equipo (izquierda, centro, derecha de quien ataca) y el consejo del ayudante. */
function lanesHTML(m){
 if(!m.us)return '';const row=(s)=>{const L=laneShare(m,s),t=T(m[s]);if(!L)return '';return `<div class="lanes"><span class="ln-t">${esc(t.short)}</span>${[['l','Izq.'],['c','Centro'],['r','Der.']].map(([k,n])=>`<span class="ln-c" style="--v:${L[k]}"><i></i><b>${L[k]}%</b><small>${n}</small></span>`).join('')}</div>`;};
 const a=row('h'),b=row('a');if(!a&&!b)return '';const tip=laneTip(m);
 return `<section class="panel"><div class="panel-h"><h2>Por dónde se ataca</h2><span class="eyebrow">Banda de quien ataca</span></div>${a}${b}${tip?`<p class="small" style="margin:8px 0 0">💡 ${esc(tip)}</p>`:''}</section>`;
}
const MTABS=[['com','Comentarios'],['jug','Jugadores'],['est','Estadísticas'],['tac','Tácticas']];
/** Pestaña de jugadores: nota y cansancio en directo, con el cambio a mano (como en FM Mobile). */
function playersTab(m,us){
 const side=S.mside==='riv'?(us==='h'?'a':'h'):us,mine=side===us,rat=m.min>0||m.done?(m.done?m.rat:liveRatings(m)):{},sl=slotsOf(m.f[side]);
 const g={},yc={};m.ev.forEach(e=>{if(e.t==='goal'&&e.pid)g[e.pid]=(g[e.pid]||0)+1;});
 const row=(id,sp,bench)=>{const p=PL(id);if(!p)return '';const en=Math.round(m.en[id]??p.energy),r=rat[id];
  return `<tr class="${m.hurt&&m.hurt[id]?'dim':''}"><td><span class="pos ${GRP[sp]||p.pos}">${sp}</span></td><td class="nm">${esc(lastNm(id))}${g[id]?` ${'⚽'.repeat(Math.min(3,g[id]))}`:''}${m.ycm&&m.ycm[id]?' <span class="ic yc"></span>':''}${m.off.includes(id)?' <span class="ic rc"></span>':''}${m.hurt&&m.hurt[id]?' ✚':''}</td>
  <td class="r">${r!=null&&!bench?`<span class="mrat ${r>=7.5?'q4':r>=6.8?'q3':r>=6?'q2':'q1'}">${r.toFixed(1)}</span>`:'<span class="muted">—</span>'}</td>
  <td><span class="ebar"><i class="${en>=75?'':en>=55?'mid':'low'}" style="width:${en}%"></i></span><span class="small muted"> ${en}%</span></td>
  <td>${mine&&!m.done&&!bench&&m.subs[us]<5&&m.min>0?`<button class="btn sm" data-a="m-subout" data-id="${id}">Cambiar</button>`:''}</td></tr>`;};
 const xi=m.lu[side].map((id,i)=>id?row(id,sl[i],false):'').join(''),bn=mine?bench(m,us).map(p=>row(p.id,p.sp,true)).join(''):'';
 return `<div class="panel-h"><h2>Jugadores</h2><div class="seg"><button data-a="m-side" data-v="mine" aria-pressed="${mine}">${esc(T(m[us]).short)}</button><button data-a="m-side" data-v="riv" aria-pressed="${!mine}">${esc(T(m[us==='h'?'a':'h']).short)}</button></div></div>
 <table class="ptab"><thead><tr><th>Pos</th><th>Jugador</th><th class="r">Nota</th><th>Energía</th><th></th></tr></thead><tbody>${xi}</tbody></table>
 ${bn?`<div class="eyebrow" style="margin:10px 0 4px">Banquillo</div><table class="ptab"><tbody>${bn}</tbody></table>`:''}`;
}
export function matchView(){
 const m=S.match,H=T(m.h),A=T(m.a),us=m.us,ut=T(m[us]);
 const poss=m.min?Math.round(m.possSum/m.min*100):50;
 const label=m.done?'Final':m.min===0?'Previa':m.paused&&m.min===45?'Descanso':fmtMin(m.min)+"'";
 const resumeL=m.min===0?'Comenzar partido':m.min===45&&m.half&&m.paused?'Segunda parte':'Reanudar';
 const flash=m.flash===m.min&&m.min>0&&!m.done;
 const stat=(l,a,b)=>`<div class="stat"><span>${a}</span><span class="c">${l}</span><span class="r">${b}</span></div>`;
 const xi=m.lu[us].map((id,i)=>({id,i})).filter(x=>x.id);
 const subsP=m.subOpen?(()=>{const bn=bench(m,us);return `<div class="subs"><h3>Cambio ${m.subs[us]+1} de 5</h3>
  <div class="row"><label class="f" style="flex:1"><span class="eyebrow">Sale</span><select id="subOut">${xi.map(x=>{const p=PL(x.id);return `<option value="${x.id}" ${m.subOut===x.id?'selected':''}>${p.pos} · ${esc(p.name)} · ${Math.round(m.en[x.id])}%${m.hurt[x.id]?' · lesionado':''}</option>`;}).join('')}</select></label>
  <label class="f" style="flex:1"><span class="eyebrow">Entra</span><select id="subIn">${bn.map(p=>`<option value="${p.id}">${p.pos} · ${esc(p.name)} · ${rt(p)}</option>`).join('')}</select></label></div>
  <div class="row"><button class="btn primary" data-a="m-dosub" ${bn.length&&xi.length?'':'disabled'}>Hacer cambio</button><button class="btn" data-a="m-subclose">Cerrar</button></div></div>`;})():'';
 const tph=m.done?null:m.min===0?'pre':(m.half&&m.min===45&&m.paused?'half':null);
 const talkP=tph&&!m.talks[tph]?`<div class="subs"><h3>${tph==='pre'?'Charla antes del partido':'Charla del descanso'}</h3><div class="chips">${Object.entries(TALKS[tph]).map(([k,v])=>`<button class="btn sm" data-a="talk" data-p="${tph}" data-v="${k}">${esc(v)}</button>`).join('')}</div><p class="small muted" style="margin:0">${tph==='pre'?'Motivar funciona mejor si eres el débil; tranquilizar, si eres favorito o en partidos de copa. Exigir es arriesgado si el equipo viene mal.':'La bronca puede despertar a un equipo que pierde, pero sienta mal si vais ganando. Con ventaja, mejor pedir calma.'}</p></div>`:'';
 const talkDone=Object.entries(m.talks).map(([ph,x])=>`<div class="negmsg ${x.d>0?'ok':x.d<-.005?'no':''}" style="margin:0 0 10px">${ph==='pre'?'Charla previa':'Descanso'}: ${esc(TALKS[ph][x.opt].split(':')[0])}: ${esc(x.txt)}</div>`).join('');
 const ctl=m.done?`<button class="btn primary big" data-a="m-finish">Ver resultados de la jornada</button>${m.us?`<button class="btn big" data-a="trep" data-v="live">📋 Informe táctico</button>`:''}`:`
  ${m.paused?`<button class="btn primary" data-a="m-play">${resumeL}</button>`:`<button class="btn dark" data-a="m-pause">Pausar</button>`}
  <div class="seg" aria-label="Velocidad">${[1,2,4,9].map(v=>`<button data-a="m-speed" data-v="${v}" aria-pressed="${m.speed===v}" ${v===9?'title="Solo ocasiones, goles y decisiones"':''}>${v===9?'Clave':'x'+v}</button>`).join('')}</div>
  <div class="seg" aria-label="Mentalidad">${Object.entries(MENT).map(([k,v])=>`<button data-a="m-ment" data-v="${k}" aria-pressed="${m.ment[us]===k}">${v.label}</button>`).join('')}</div>
  <label class="f"><span class="eyebrow">Estilo</span><select id="m-est">${Object.entries(TACS.est.o).map(([k,v])=>`<option value="${k}" ${m.tac[us].est===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="f"><span class="eyebrow">Presión</span><select id="m-pre">${Object.entries(TACS.pre.o).map(([k,v])=>`<option value="${k}" ${m.tac[us].pre===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="f"><span class="eyebrow">Al perder</span><select id="m-per">${Object.entries(TACS.per.o).map(([k,v])=>`<option value="${k}" ${(m.tac[us].per||'nor')===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="f"><span class="eyebrow">Al recuperar</span><select id="m-rec">${Object.entries(TACS.rec.o).map(([k,v])=>`<option value="${k}" ${(m.tac[us].rec||'nor')===k?'selected':''}>${v}</option>`).join('')}</select></label>
  ${Object.keys(ut.plans||{}).length?`<div class="seg" aria-label="Tácticas guardadas">${['A','B','C'].filter(k=>ut.plans[k]).map(k=>`<button data-a="m-plan" data-v="${k}" aria-pressed="${m.plan===k}" title="${esc(ut.plans[k].name)}">Táctica ${k}</button>`).join('')}</div>`:''}
  <div class="chips" aria-label="Instrucciones al rival">${Object.entries(OIS).map(([k,v])=>`<button class="btn sm ${m.oi&&m.oi[us]&&m.oi[us][k]?'dark':''}" data-a="m-oi" data-v="${k}" title="${esc(v.d)}" aria-pressed="${!!(m.oi&&m.oi[us]&&m.oi[us][k])}">${v.n}</button>`).join('')}</div>
  <button class="btn" data-a="m-subs" ${m.subs[us]>=5||m.min===0?'disabled':''}>Cambios ${m.subs[us]}/5</button><span class="spacer"></span><button class="btn" data-a="m-sim">Simular hasta el final</button>`;
 const feed=m.ev.map((e,i)=>({e,i})).reverse().map(({e,i})=>`<div class="ev ${e.t==='goal'?'goal':e.t==='sys'?'sys':''}"><span class="m">${fmtMin(e.min)}'</span><span>${ICON[e.t]||''}</span><span class="tx">${e.s?`<b>${T(m[e.s]).short}</b> · `:''}${esc(e.tx)}${e.t==='goal'?` <button class="btn sm rpbtn" data-a="replay" data-i="${i}">▶ Repetición</button>`:''}</span></div>`).join('')||`<div class="empty">${esc(H.name)} recibe a ${esc(A.name)}. Pulsa “Comenzar partido” cuando quieras.</div>`;
 const tab=S.mtab||'com';
 const scorers=s=>m.ev.filter(e=>e.t==='goal'&&e.s===s).map(e=>`${lastNm(e.pid)} ${fmtMin(e.min)}'`).join(', ');
 return `<div class="row" style="margin-bottom:10px"><button class="btn sm" data-a="view" data-v="inicio">← Menú</button><span class="small muted mhint">El partido sigue en pausa si sales; vuelve desde el menú.</span><span class="spacer"></span><button class="btn sm" data-a="sound" aria-pressed="${soundOn()}" title="Sonido y vibración">${soundOn()?'Sonido: sí':'Sonido: no'}</button><div class="seg"><button data-a="v2d" data-v="1" aria-pressed="${S.v2d!==false}">Vista 2D</button><button data-a="v2d" data-v="0" aria-pressed="${S.v2d===false}">Solo texto</button></div></div>
 ${m.label?`<div class="eyebrow" style="margin-bottom:8px">${m.derby?`<span class="derbytag sm">${derbyName(m.h,m.a)}</span> `:''}${esc(m.label)}${m.agg?` · vuelta: ida ${m.agg[1]}-${m.agg[0]}, si el global empata hay penaltis`:m.ko?' · eliminatoria: si hay empate, penaltis':''}</div>`:''}
 <div class="mlay"><div class="mlL"><div class="board ${flash?'flash':''}"><div class="bs">${crest(H,'lg')}<div class="tn">${esc(H.name)}</div><div class="small" style="color:var(--board-dim)">${esc(scorers('h'))}</div></div>
 <div class="sc">${m.score.h}<span style="opacity:.4">:</span>${m.score.a}</div>
 <div class="bs">${crest(A,'lg')}<div class="tn">${esc(A.name)}</div><div class="small" style="color:var(--board-dim)">${esc(scorers('a'))}</div></div>
 <div class="mn">${label}${m.agg?` · global ${m.score.h+m.agg[0]}-${m.score.a+m.agg[1]}`:''}${m.pen?` · pen. ${m.pen[0]}-${m.pen[1]}`:''}</div><div class="prog"><i style="width:${Math.min(100,m.min/m.end*100)}%"></i></div></div>
 ${S.v2d!==false?`<div class="p2d"><canvas id="pitch2d" width="800" height="512" aria-label="Vista del partido en 2D"></canvas><div class="mcom" id="mcom" aria-live="polite">${esc(RT.com2d||'')}</div></div>`:''}
 ${RT.replay?`<div class="row" style="justify-content:center;margin-top:8px"><span class="small muted">Viendo la repetición</span><button class="btn sm dark" data-a="replay-stop">Cerrar repetición</button></div>`:''}
 </div><div class="mlR">
 <div class="mbar">${m.done?`<button class="btn primary" data-a="m-finish">Ver resultados de la jornada</button>${m.us?`<button class="btn" data-a="trep" data-v="live">📋 Informe táctico</button>`:''}`:`${m.paused?`<button class="btn primary" data-a="m-play">${resumeL}</button>`:`<button class="btn dark" data-a="m-pause">Pausar</button>`}
  <div class="seg" aria-label="Velocidad">${[1,2,4,9].map(v=>`<button data-a="m-speed" data-v="${v}" aria-pressed="${m.speed===v}" ${v===9?'title="Solo ocasiones, goles y decisiones"':''}>${v===9?'Clave':'x'+v}</button>`).join('')}</div>
  <button class="btn" data-a="m-subs" ${m.subs[us]>=5||m.min===0?'disabled':''}>Cambios ${m.subs[us]}/5</button><button class="btn" data-a="m-sim">Simular</button>`}</div>
 ${m.mom&&!m.done?`<div class="momb"><b>${esc(m.mom.txt)}</b><div class="stack" style="gap:6px;margin-top:8px">${m.mom.opts.map(([v,l])=>`<button class="btn ${v===m.mom.opts[0][0]?'primary':''}" data-a="mom" data-v="${v}">${esc(l)}</button>`).join('')}</div></div>`:''}${m.half&&m.paused&&!m.done&&m.min===45&&m.us?`<div class="itkb"><b>Habla con un jugador</b> <span class="small muted">(hasta 2)</span><div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><select id="itkP">${m.lu[m.us].filter(Boolean).map(id=>`<option value="${id}">${esc(PL(id).name)}${m.itk&&m.itk[id]?' ✓':''}</option>`).join('')}</select>${Object.entries(ITALK).map(([k,l])=>`<button class="btn sm" data-a="itk" data-v="${k}">${l}</button>`).join('')}</div></div>`:''}${m.alert&&!m.done?`<div class="alert">${esc(m.alert)}</div>`:''}${talkP}${subsP}
 <div class="seg mtabs" role="tablist">${MTABS.map(([k,l])=>`<button data-a="m-tab" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>
 <section class="panel mtab">${tab==='jug'?playersTab(m,us):tab==='est'?`<div class="panel-h"><h2>Estadísticas</h2>${m.wx?`<span class="eyebrow" title="${esc(WX[m.wx.k].d)}">${esc(wxTxt(m.wx))}${m.refr?` · árbitro ${esc(REFS[m.refr.k].n.toLowerCase())}`:''}</span>`:''}</div>
  <div class="stat"><span>${poss}%</span><span class="c">Posesión</span><span class="r">${100-poss}%</span></div><div class="pbar"><i style="width:${poss}%;background:${H.c1}"></i><i style="width:${100-poss}%;background:${A.c1}"></i></div>
  ${stat('Goles esperados (xG)',(m.st.h.xg||0).toFixed(2),(m.st.a.xg||0).toFixed(2))}${stat('Tiros',m.st.h.sh,m.st.a.sh)}${stat('A puerta',m.st.h.ot,m.st.a.ot)}${stat('Córners',m.st.h.co||0,m.st.a.co||0)}${stat('Faltas',m.st.h.fo||0,m.st.a.fo||0)}${stat('Pases buenos',(m.st.h.pa?Math.round(m.st.h.pc/m.st.h.pa*100):0)+'%',(m.st.a.pa?Math.round(m.st.a.pc/m.st.a.pa*100):0)+'%')}${stat('Amarillas',m.st.h.yc,m.st.a.yc)}${stat('Rojas',m.st.h.rc,m.st.a.rc)}${stat('Cambios',m.subs.h,m.subs.a)}${(()=>{const G=m.ev.filter(e=>e.t==='goal');if(!G.length)return '';const ks=[...new Set(G.map(e=>e.gt||'otro'))];return `<div class="eyebrow" style="margin:10px 0 4px">Cómo llegaron los goles</div>${ks.map(k=>stat(GOALT[k]?GOALT[k].n:k,G.filter(e=>e.s==='h'&&(e.gt||'otro')===k).length,G.filter(e=>e.s==='a'&&(e.gt||'otro')===k).length)).join('')}`;})()}
  ${lanesHTML(m)}${m.done&&m.sh?`<div class="panel-h" style="margin-top:12px"><h2>Mapa de tiros</h2></div><div class="shotmaps">${shotMap(matchRecord(m),0,T(m.h).name)}${shotMap(matchRecord(m),1,T(m.a).name)}</div>`:''}`
 :tab==='tac'?(m.done?`<div class="empty">El partido ha terminado.</div>`:`<div class="panel-h"><h2>Tácticas</h2><span class="eyebrow">${m.f[us]} · ${MENT[m.ment[us]].label}</span></div><div class="mctl">
  <div class="seg" aria-label="Mentalidad">${Object.entries(MENT).map(([k,v])=>`<button data-a="m-ment" data-v="${k}" aria-pressed="${m.ment[us]===k}">${v.label}</button>`).join('')}</div>
  <label class="f"><span class="eyebrow">Estilo</span><select id="m-est">${Object.entries(TACS.est.o).map(([k,v])=>`<option value="${k}" ${m.tac[us].est===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="f"><span class="eyebrow">Presión</span><select id="m-pre">${Object.entries(TACS.pre.o).map(([k,v])=>`<option value="${k}" ${m.tac[us].pre===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="f"><span class="eyebrow">Al perder</span><select id="m-per">${Object.entries(TACS.per.o).map(([k,v])=>`<option value="${k}" ${(m.tac[us].per||'nor')===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="f"><span class="eyebrow">Al recuperar</span><select id="m-rec">${Object.entries(TACS.rec.o).map(([k,v])=>`<option value="${k}" ${(m.tac[us].rec||'nor')===k?'selected':''}>${v}</option>`).join('')}</select></label>
  ${Object.keys(ut.plans||{}).length?`<div class="seg" aria-label="Tácticas guardadas">${['A','B','C'].filter(k=>ut.plans[k]).map(k=>`<button data-a="m-plan" data-v="${k}" aria-pressed="${m.plan===k}" title="${esc(ut.plans[k].name)}">Táctica ${k}</button>`).join('')}</div>`:''}
  <div class="chips" aria-label="Instrucciones al rival">${Object.entries(OIS).map(([k,v])=>`<button class="btn sm ${m.oi&&m.oi[us]&&m.oi[us][k]?'dark':''}" data-a="m-oi" data-v="${k}" title="${esc(v.d)}" aria-pressed="${!!(m.oi&&m.oi[us]&&m.oi[us][k])}">${v.n}</button>`).join('')}</div></div>
  ${pitchHTML(ut,m.lu[us],m.f[us],{roles:m.ro&&m.ro[us],en:m.en,rat:m.min>0?liveRatings(m):null})}`)
 :`${m.done&&goalsOf(m).length?`<div class="panel-h"><h2>Los goles</h2><span class="eyebrow">Toca para ver la repetición</span></div><div class="chips" style="margin-bottom:10px">${goalsOf(m).map(({e,i})=>`<button class="btn sm" data-a="replay" data-i="${i}">▶ ${fmtMin(e.min)}' ${esc(T(m[e.s]).short)} · ${esc(lastNm(e.pid))}${e.gt&&GOALT[e.gt]&&e.gt!=='otro'?` <span class="muted">· ${GOALT[e.gt].n.toLowerCase()}</span>`:''}</button>`).join('')}</div>`:''}${m.adv&&!m.done?`<div class="negmsg" style="margin:0 0 10px"><b>${m.adv.min}'</b> · ${esc(m.adv.tx)}</div>`:''}${talkDone}${m.done&&m.mvp?`<p class="small" style="margin:0 0 8px">Jugador del partido: <b>${esc(PL(m.mvp).name)}</b> · ${m.rat[m.mvp].toFixed(1)}</p>`:''}<div class="feed">${feed}</div>`}</section></div></div>`;
}
