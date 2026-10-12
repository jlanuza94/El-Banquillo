/* El Banquillo · views/common.js — Piezas de interfaz compartidas, menú, cabecera y render principal. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {natFlag,flag} from '../flags';
export const nf=nat=>natFlag(nat,COUNTRIES);
import {themeBtn} from '../theme';
import {DEEP_ONLY,quick} from '../quick';
import {importData} from '../mods';
import {editorView} from './editor';
import {analisisView} from './analysis';
import {premiosView} from './awards';
import {EXACT,knowledge,seen} from '../scouting';
import {staffView} from './staff';
import morphdom from 'morphdom';
import {$app,esc,money,r2} from '../core';
import {COUNTRIES,AT_COLS,AT_NAME,AT_SH,ATTRS,FORMS,GRP,SPN} from '../data';
/** Cabecera de las columnas de atributos de las tablas. */
export const attrHead=()=>AT_COLS.map(k=>`<th class="r" title="${AT_NAME[k]}">${AT_SH[k]}</th>`).join('');
import {RT,LG,PL,S,T,atCell,available,crest,crestStyle,lgName,lowest,pBadge,qc,rt,seasonLabel} from '../state';
import {buildWorld} from '../world';
import {eff,footF,nRounds,posOf,prof,slotsOf,table,zoneOf} from '../tactics';
import {nextMatch} from '../competitions';
import {simState} from '../season';
import {inWindow} from '../market';
import {jobsView,startView} from './start';
import {calendarioView,inicioView,seasonEndView} from './home';
import {canteraView,entrenoView,plantillaView,tacticasView} from './squad';
import {copasView,ligaView} from './competitions';
import {mercadoView} from './market';
import {clubView,historiaView} from './club';
import {matchView} from './match';
import {modalView} from './modals';
import {buzonView} from './inbox';
import {unread} from '../inbox';
export function toast(msg){if(typeof document==='undefined')return;let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el);}
 el.textContent=msg;el.hidden=false;clearTimeout(RT.toastT);RT.toastT=setTimeout(()=>{el.hidden=true;},3400);}
export function formDots(arr){return `<span class="formdots">${arr.slice(-5).map(x=>`<span class="${x}" title="${x==='G'?'Ganado':x==='E'?'Empate':'Perdido'}">${x}</span>`).join('')}</span>`;}
export function energyBar(e){return `<span class="bar" title="Energía ${Math.round(e)}%"><i class="${e>=75?'':e>=55?'mid':'low'}" style="width:${Math.round(e)}%"></i></span>`;}
export function formCell(f){return f>0?`<span class="fm up">▲${f}</span>`:f<0?`<span class="fm dn">▼${-f}</span>`:`<span class="fm eq">–</span>`;}
export function status(p,xi){if(p.inj)return `<span class="tag bad" title="${esc(p.injT||'Lesión')}">${esc(String(p.injT||'Lesión').split(' ')[0])} ${p.inj}p</span>`;if(p.susp)return `<span class="tag bad">Sanción ${p.susp}</span>`;if(p.recov>0)return `<span class="tag" title="Recién recuperado: más riesgo de recaída">Recién recuperado</span>`;return xi?`<span class="tag xi">Titular</span>`:`<span class="tag">Suplente</span>`;}
export const nameBtn=p=>`${nf(p.nat)}<button class="linkname" data-a="ficha" data-id="${p.id}">${esc(p.name)}</button>`;
export const keyAttrs=p=>({POR:['por','col','dec','pas'],DEF:['def','col','cab','vel','fis'],MED:['pas','vis','dec','res','reg'],DEL:['tir','col','vel','reg','cab']})[GRP[p.sp]||p.pos];
/** Celda de atributo tal como la conoces: exacta o como rango «6-8». */
export function atCellS(p,k,sn){sn=sn||seen(p);if(sn.exact)return atCell(p.at[k]);const [a,b]=sn.at[k];return `<span class="at rng ${qc((a+b)/2)}" title="Aún no lo conoces bien">${a}-${b}</span>`;}
export const attrCells=p=>{const sn=seen(p);return AT_COLS.map(k=>`<td class="r">${p.pos!=='POR'&&k==='por'?'<span class="muted">–</span>':atCellS(p,k,sn)}</td>`).join('');};
/** Media tal como la conoces. */
export function pBadgeS(p,cls=''){const sn=seen(p);if(sn.exact)return pBadge(p).replace('class="q ','class="q '+cls+' ');const [a,b]=sn.ovr;return `<span class="q rng ${cls} ${qc((a+b)/20)}" title="Media estimada: aún no lo conoces bien">${(a/10).toFixed(1)}–${(b/10).toFixed(1)}</span>`;}
export const potTxt=p=>{if(p.age>23)return '—';const r=seen(p).pot;return r[0]===r[1]?`~${r[0].toFixed(1)}`:`${r[0].toFixed(1)}–${r[1].toFixed(1)}`;};
export const knowTag=p=>{const k=knowledge(p);return `<span class="know" title="Conocimiento del jugador"><span class="kb"><i style="width:${k}%"></i></span>${k>=EXACT?'Conocido':'Conocimiento '+k+'%'}</span>`;};
export const clubCell=p=>p.team===null?'<span class="tag">Libre</span>':`<span class="teamcell">${crest(T(p.team),'sm')}${T(p.team).short} <span class="divtag">${lgName(T(p.team).lg,true)}</span></span>`;
export const NAVI={home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',shirt:'<path d="M8 3L3 6l2 4 3-1v12h8V9l3 1 2-4-5-3c-1 2-2.5 2.5-4 2.5S9 5 8 3z"/>',board:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M7 9l2 2M9 9l-2 2M15 14a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/>',cone:'<path d="M12 3l6 16H6zM8.5 12h7M4 19h16"/>',sprout:'<path d="M12 21v-8M12 13c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5zM12 13c0-3-2-5.5-6-5.5 0 3 2 5.5 6 5.5"/>',cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',table:'<path d="M4 6h16M4 11h16M4 16h16M4 21h10"/>',cup:'<path d="M7 4h10v5a5 5 0 0 1-10 0zM12 14v4M8 21h8M17 6h3a3 3 0 0 1-3.5 4M7 6H4a3 3 0 0 0 3.5 4"/>',swap:'<path d="M4 8h14l-4-4M20 16H6l4 4"/>',bank:'<path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 21h18"/>',book:'<path d="M5 4h11a3 3 0 0 1 3 3v14H8a3 3 0 0 1-3-3zM5 18a3 3 0 0 1 3-3h11"/>',more:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',whistle:'<circle cx="9" cy="14" r="5"/><path d="M12 10.5L21 6v4l-8 3M9 9V4h4"/>',pen:'<path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',ball:'<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>'};
export const icon=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${NAVI[k]}</svg>`;
export const NAVG=[{g:'',it:[['inicio','Inicio','home'],['buzon','Bandeja de entrada','mail']]},{g:'Equipo',it:[['plantilla','Plantilla','shirt'],['tacticas','Tácticas','board'],['entreno','Entrenamiento','cone'],['cantera','Cantera y ojeo','sprout'],['staff','Cuerpo técnico','whistle']]},{g:'Competición',it:[['calendario','Calendario','cal'],['liga','Ligas','table'],['copas','Copas','cup'],['analisis','Análisis','chart'],['premios','Estadísticas y premios','star']]},{g:'Club',it:[['mercado','Mercado','swap'],['club','Club y finanzas','bank'],['historia','Historia','book'],['editor','Editor y mods','pen']]}];
export const NAVL={};NAVG.forEach(g=>g.it.forEach(([v,l,i])=>NAVL[v]=[l,i]));
export function header(){
 const t=T(S.user),pos=posOf(S.user),o=S.obj,played=S.week>0,nm=S.match?null:nextMatch(),ended=S.week>=nRounds();
 let cta='';
 if(S.match)cta=`<div class="cta"><div class="l"><span class="eyebrow">En juego · ${S.match.min}'</span><b>${esc(T(S.match.h).short)} ${S.match.score.h}-${S.match.score.a} ${esc(T(S.match.a).short)}</b></div><button class="btn primary" data-a="view" data-v="partido">Volver al partido</button></div>`;
 else if(ended)cta=`<div class="cta"><div class="l"><span class="eyebrow">Temporada terminada</span><b>Mira el resumen</b></div><button class="btn primary" data-a="view" data-v="inicio">Ver resumen</button></div>`;
 else if(nm){const opp=T(nm.fx.h===S.user?nm.fx.a:nm.fx.h);cta=`<div class="cta"><div class="l"><span class="eyebrow">${esc(nm.label)}</span><b>${nm.fx.h===S.user?'vs':'en'} ${esc(opp.name)}</b></div><button class="btn primary" data-a="play">Jugar</button><button class="btn" data-a="sim-menu">Simular</button></div>`;}
 return `<header class="top2">${themeBtn()}<button class="gsbtn" data-a="gsearch" aria-label="Buscar" title="Buscar (tecla /)"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></button><div class="club">${crest(t,'lg')}<div style="min-width:0"><div class="eyebrow">${lgName(t.lg)} · ${seasonLabel()} · ${ended?'Fin de temporada':'Jornada '+(S.week+1)+'/'+nRounds()}${inWindow()&&!ended?' · <span style="color:var(--win)">Mercado abierto</span>':''}</div><h1>${esc(t.name)}</h1>
 <div class="kpis" style="margin-top:6px"><div class="kpi"><span class="eyebrow">Presupuesto</span><b>${money(S.budget)}</b></div><div class="kpi"><span class="eyebrow">Posición</span><b class="${played?(pos<=o.max?'ok':'bad'):''}">${played?pos+'º':'—'}</b></div><div class="kpi"><span class="eyebrow">Objetivo</span><b style="font-size:16px">${o.txt}</b></div><div class="kpi"><span class="eyebrow">Confianza</span><b class="${S.mgr.conf>=50?'ok':S.mgr.conf<25?'bad':''}">${Math.round(S.mgr.conf)}</b></div></div></div></div>${cta}</header>`;
}
export function nav(){
 const cur=S.view==='partido'?'':S.view,badge={inicio:Object.values(S.offers).filter(o=>o.incoming).length+(S.jobOffers||[]).length,buzon:unread(),mercado:inWindow()?'●':''};
 const it=([v,l,i])=>`<button class="nitem" data-a="view" data-v="${v}" aria-current="${cur===v}">${icon(i)}<span>${l}</span>${badge[v]?`<span class="badge">${badge[v]}</span>`:''}</button>`;
 const t=T(S.user);
 const side=`<aside class="side"><div class="brand">El Banquillo<small>${esc(S.mgr?'Reputación '+Math.round(S.mgr.rep)+'/100':'')}</small></div>
 <div class="sclub">${crest(t)}<div style="min-width:0"><div class="n">${esc(t.name)}</div><div class="small muted">${esc(lgName(t.lg,true))} · ${money(S.budget)}</div></div></div>
 ${S.match?`<button class="nitem" data-a="view" data-v="partido" aria-current="${S.view==='partido'}" style="color:var(--loss)">${icon('ball')}<span>En juego ${S.match.min}'</span></button>`:''}
 ${NAVG.map(g=>{const items=g.it.filter(([v])=>!quick()||!DEEP_ONLY.includes(v));return items.length?`<div class="ngroup">${g.g?`<div class="gt">${g.g}</div>`:''}${items.map(it).join('')}</div>`:'';}).join('')}
 <button class="nitem" data-a="set-mode" data-v="${quick()?'profundo':'rapido'}" style="margin-top:auto;opacity:.8"><span class="small">Modo ${quick()?'rápido':'profundo'} · cambiar</span></button></aside>`;
 const mob=['inicio','buzon','plantilla','mercado'];
 const bnav=`<nav class="bnav" aria-label="Secciones">${mob.map(v=>`<button data-a="view" data-v="${v}" aria-current="${cur===v}">${icon(NAVL[v][1])}<span>${v==='buzon'?'Bandeja':NAVL[v][0].split(' ')[0]}</span>${badge[v]&&v==='buzon'?`<span class="badge">${badge[v]}</span>`:''}</button>`).join('')}<button data-a="more" aria-current="${!mob.includes(cur)&&cur!==''}">${icon('more')}<span>Más</span></button></nav>`;
 return side+bnav;
}
export function shell(){
 const ended=S.week>=nRounds();let body='';
 switch(S.view){case'partido':body=matchView();break;case'buzon':body=buzonView();break;case'staff':body=staffView();break;case'premios':body=premiosView();break;case'analisis':body=analisisView();break;case'editor':body=editorView();break;case'plantilla':body=plantillaView();break;case'tacticas':body=tacticasView();break;case'calendario':body=calendarioView();break;case'historia':body=historiaView();break;case'copas':body=copasView();break;case'entreno':body=entrenoView();break;case'cantera':body=canteraView();break;case'liga':body=ligaView();break;case'mercado':body=mercadoView();break;case'club':body=clubView();break;default:body=ended?seasonEndView():inicioView();}
 const more=S.moreOpen?`<div class="sheet" data-a="more-close"><div class="in">${NAVG.flatMap(g=>g.it).map(([v,l,i])=>`<button class="nitem" data-a="view" data-v="${v}" aria-current="${S.view===v}">${icon(i)}<span>${l}</span></button>`).join('')}</div></div>`:'';
 const sim=simState?`<div class="simov"><div class="box"><div class="eyebrow">Simulando</div><h2 style="margin:6px 0">${simState.n} partido${simState.n===1?'':'s'}</h2><p class="small muted">${esc(simState.txt)}</p><button class="btn" data-a="sim-stop">Detener</button></div></div>`:'';
 return `<div class="app">${nav()}<div class="mainc">${S.view==='partido'?'':header()}<main>${body}</main></div></div>${more}${sim}`;
}
export function cmpRow(lbl,a,b){const mx=Math.max(a,b,1);return `<div class="cmp"><span class="a">${(a/10).toFixed(1)}</span><span class="l"><i style="width:${a/mx*100}%"></i></span><span class="lbl">${lbl}</span><span class="r2"><i style="width:${b/mx*100}%"></i></span><span class="b">${(b/10).toFixed(1)}</span></div>`;}
export function resRow(f,r,tags){
 const me=f.h===S.user||f.a===S.user;const sc=(f.ev||[]).filter(e=>e.t==='goal').map(e=>`${e.n} ${e.min}'`).join(', ');
 const nm=id=>`<span style="${f.w===id&&f.pen?'font-weight:700':''}">${esc(T(id).name)}</span>${tags?` <span class="divtag">${lgName(T(id).lg,true)}</span>`:''}`;
 const pen=f.pen?` · penaltis ${f.pen[0]}-${f.pen[1]}`:'';
 return `<div class="res ${me?'me':''}"><div class="h">${nm(f.h)}${crest(T(f.h),'sm')}</div><div class="s">${f.played?f.hg+' - '+f.ag:'vs'}</div><div class="a">${crest(T(f.a),'sm')}${nm(f.a)}</div>${r!=null||sc||pen?`<div class="sc">${r!=null?'J'+(r+1)+(sc?' · ':''):''}${esc(sc)}${pen}</div>`:''}</div>`;
}
export function tableHTML(tb,lg,compact){
 const L=LG(lg);
 const legend=(L.lv===0?'<span><span class="zone z1"></span>Campeón</span>':'<span><span class="zone z4"></span>Ascenso</span>')+(lowest(L)?'':'<span><span class="zone z3"></span>Descenso</span>');
 return `<div class="tbl"><table><thead><tr><th>#</th><th>Equipo</th><th class="r">PJ</th>${compact?'':'<th class="r">G</th><th class="r">E</th><th class="r">P</th><th class="r">GF</th><th class="r">GC</th>'}<th class="r">DG</th><th class="r">Pts</th>${compact?'':'<th>Forma</th>'}</tr></thead><tbody>
 ${tb.map((r,i)=>{const tm=T(r.id);return `<tr class="${r.id===S.user?'me':''}"><td class="n"><span class="zone ${zoneOf(lg,i)}"></span>${i+1}</td><td><span class="teamcell">${crest(tm,'sm')}<button class="linkname" data-a="club-open" data-id="${tm.id}">${esc(tm.name)}</button></span></td><td class="n">${r.pj}</td>${compact?'':`<td class="n">${r.g}</td><td class="n">${r.e}</td><td class="n">${r.p}</td><td class="n">${r.gf}</td><td class="n">${r.gc}</td>`}<td class="n">${r.gf-r.gc>0?'+':''}${r.gf-r.gc}</td><td class="pts">${r.pts}</td>${compact?'':`<td>${formDots(r.form)}</td>`}</tr>`;}).join('')}
 </tbody></table></div><div class="row small muted" style="margin-top:10px;gap:14px">${legend}</div>`;
}
export function pitchHTML(t,lu,f,opts={}){
 const slots=slotsOf(f),rows=[[['POR'],89]].concat(FORMS[f]);let si=0,h='';
 rows.forEach(([list,y0])=>list.forEach((s,k)=>{
  const sx=si++,n=list.length,x=(k+1)/(n+1)*100;let y=y0;
  if(n===5&&GRP[s]==='DEF'&&(k===0||k===4))y-=8;
  if(n===5&&GRP[s]==='MED'&&(k===0||k===4))y-=5;
  if(s==='MCD'&&list.some(x=>x!=='MCD'))y+=7;
  const p=PL(lu[sx]);let cls='',sh='+',nm=s,rtv='';
  if(!p)cls='empty';else{sh=p.num;nm=p.name.split(' ').slice(1).join(' ');rtv=(eff(p,s,opts.en?opts.en[p.id]:null,opts.roles?opts.roles[sx]:null)/10).toFixed(1);if(!available(p)||p.team!==S.user)cls='bad';else if(prof(p,s)<1||footF(p,s)<1)cls='oop';}
  if(opts.sel===sx)cls+=' sel';
  const rate=opts.rat&&p&&opts.rat[p.id]!=null?`<span class="rt" style="background:${opts.mvp===p.id?'#c99a06':'rgba(0,0,0,.6)'}">${opts.rat[p.id].toFixed(1)}${opts.mvp===p.id?' · MVP':''}</span>`:'';
  h+=`<button class="slot ${cls}" style="left:${x}%;top:${y}%;${crestStyle(t)}" ${opts.click?`data-a="slot" data-i="${sx}"`:'tabindex="-1"'} aria-label="${SPN[s]}${p?': '+esc(p.name):' vacío'}"><span class="sh">${sh}</span><span class="nm">${esc(nm)}</span>${rate||(rtv!==''?`<span class="rt">${s} ${rtv}${p&&p.sp!==s?' · '+p.sp:''}</span>`:`<span class="rt">${s}</span>`)}</button>`;
 }));
 return `<div class="pitch"><span class="ln out"></span><span class="ln half"></span><span class="ln circ"></span><span class="ln box1"></span><span class="ln box2"></span>${h}</div>`;
}
/** Pinta la pantalla actual. Solo actualiza en el DOM lo que ha cambiado (morphdom). */
export function render(){
 RT.keyCache=null;
 if(!$app)return;
 let html;
 if(!S||S.user==null){if(!S){buildWorld(RT.seed);if(RT.mod){RT.modMsg=importData(RT.mod);}}html=`<div class="startscr">${startView()}</div>`;}
 else if(S.jobless)html=`<div class="startscr">${jobsView()}</div>`+modalView();
 else{if(S.view==='partido'&&!S.match)S.view='inicio';html=shell()+modalView();}
 patchApp(html);
}
function patchApp(html){
 const next=document.createElement('div');next.id='app';next.innerHTML=html;
 morphdom($app,next,{onBeforeElUpdated:(from,to)=>{
  if(from.tagName==='CANVAS')return false;           // la vista 2D se dibuja sola; no la tocamos
  if(from===document.activeElement&&(from.tagName==='INPUT'||from.tagName==='TEXTAREA')&&from.type!=='checkbox'){to.value=from.value;}
  return !from.isEqualNode(to);
 }});
}
