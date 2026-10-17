/* El Banquillo · views/match.js — Pantalla del partido en directo. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {keys3,keysHTML} from '../r12';
import {tacReport,reportTips} from '../tacreport';
import {SHOUTS} from '../r11match';
import {attendance} from '../club';
import {FIN,reactHTML} from '../talkplus';
import {ITALK,REFS} from '../extras2';
import {WX,wxTxt} from '../extras';
import {laneShare,laneTip} from '../tactics2';
import {derbyName} from '../rivals';
import {goalsOf,soundOn} from '../replay';
import {shotMap} from './analysis';
import {matchRecord} from '../analysis';
import {esc,fill,fmtMin} from '../core';
import {GRP,MENT,OIS,TACS} from '../data';
import {slotsOf,table,teamPower} from '../tactics';
import {AT_NAME} from '../data';
import {squad} from '../state';
import {starsHTML,starsOf} from './pcard';
import {PL,RT,S,T,crest,crestStyle,lastNm,rt} from '../state';
import {GOALT,TALKS,bench,liveRatings} from '../engine';
import {pitchHTML,slotCoords} from './common';
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
const MTABS=[['com','Comentarios'],['jug','Jugadores'],['tac','Tácticas']];
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

const shirtS=n=>`<span class="wsh"><svg viewBox="0 0 40 36" aria-hidden="true"><path d="M13 2 4 6.5 1 15l6.5 2.2L8 34h24l.5-16.8L39 15l-3-8.5L27 2c-1.6 2.6-4 4-7 4s-5.4-1.4-7-4z"/></svg><b>${n}</b></span>`;
const rq=r=>r>=7.5?'q4':r>=6.8?'q3':r>=6?'q2':'q1';
/** Formación en directo de un equipo: camiseta, nota, puesto y nombre (como en el FM de PC). */
function wForm(m,s){
 const t=T(m[s]),rat=m.min>0||m.done?(m.done?m.rat:liveRatings(m)):{},sl=slotsOf(m.f[s]),C=slotCoords(m.f[s]).length===sl.length?slotCoords(m.f[s]):sl.map((x,i)=>({x:50,y:90-i*7}));
 const g={};m.ev.forEach(e=>{if(e.t==='goal'&&e.pid)g[e.pid]=(g[e.pid]||0)+1;});
 return `<div class="wpitch" style="${crestStyle(t)}"><span class="ln out"></span><span class="ln half"></span><span class="ln circ"></span><span class="ln b1"></span><span class="ln b2"></span>${m.lu[s].map((id,i)=>{const p=PL(id);if(!p||!C[i])return '';const r=rat[id];
  return `<span class="wpl${m.off.includes(id)?' off':''}" style="left:${C[i].x}%;top:${C[i].y}%">${shirtS(p.num||'')}<span class="wr">${r!=null?`<i class="${rq(r)}">${r.toFixed(1)}</i>`:''}<i class="wp">${sl[i]}</i></span><span class="wn">${g[id]?'⚽':''}${m.ycm&&m.ycm[id]?'🟨':''}${esc(lastNm(id))}</span></span>`;}).join('')}</div>`;
}
/** Goles, tarjetas, cambios y lesiones, cada uno en el lado de su equipo. */
function wEvents(m){
 const L=m.ev.filter(e=>['goal','yc','red','sub','inj'].includes(e.t)&&e.s);
 return L.length?`<div class="wevs">${L.map(e=>`<div class="wevr ${e.s}"><span>${ICON[e.t]||''}</span><span class="tx">${esc(e.pid&&PL(e.pid)?lastNm(e.pid):e.tx.split('.')[0].slice(0,40))}${e.ast&&PL(e.ast)?` <small>(${esc(lastNm(e.ast))})</small>`:''}</span><b>${fmtMin(e.min)}'</b></div>`).join('')}</div>`:'<div class="empty small">Aún no ha pasado nada importante.</div>';
}
/** Los otros partidos de la misma jornada. */
function wScores(m){
 const r=m.ref,list=r.k==='lg'?(S.fixtures[r.lg]&&S.fixtures[r.lg][r.r]||[]):r.k==='cup'?((S.cups[r.c].rounds[r.r]||{}).matches||[]):[];
 const o=list.filter(f=>!(f.h===m.h&&f.a===m.a));
 return o.length?`<div class="wscs">${o.map(f=>`<div class="wscr"><span class="h">${esc(T(f.h).short)} ${crest(T(f.h),'sm')}</span><b>${f.played?`${f.hg} - ${f.ag}`:m.done?'—':'en juego'}</b><span class="a">${crest(T(f.a),'sm')} ${esc(T(f.a).short)}</span></div>`).join('')}</div>`:'<div class="empty small">No hay otros partidos a la vez.</div>';
}
/** Barra inferior con tu once: puesto, energía (corazón) y nota. Toca para cambiarlo. */
function wStrip(m,us){
 const rat=m.min>0||m.done?(m.done?m.rat:liveRatings(m)):{},sl=slotsOf(m.f[us]),can=!m.done&&m.min>0&&m.subs[us]<5;
 return `<div class="mstrip"><span class="msub">${m.subs[us]}/5 cambios</span>${m.lu[us].map((id,i)=>{const p=PL(id);if(!p)return '';const en=Math.round(m.en[id]??p.energy),r=rat[id];
  return `<button class="mst" ${can?`data-a="m-subout" data-id="${id}"`:'disabled'} title="${esc(p.name)} · ${en}%"><span>${sl[i]}</span><i class="hrt ${en>=75?'g':en>=55?'y':'r'}">♥</i>${r!=null?`<b class="${rq(r)}">${r.toFixed(1)}</b>`:''}</button>`;}).join('')}</div>`;
}
/** Previa del partido (como el «Pre-Match Hub» del FMM): los dos equipos con su forma, estilo y formación,
 * el jugador clave, fortalezas y debilidades del rival comparadas con tu once, las bajas y la charla. */
const PM_AT=['vel','pas','reg','tir','cab','def','fis','res','dec','vis','col'];
function pmForm(tid){const tb=table(T(tid).lg),r=tb.find(x=>x.id===tid);return r?r.form.slice(-5):[];}
function pmAvg(lu,k){const L=lu.map(id=>PL(id)).filter(p=>p&&p.sp!=='POR');return L.length?L.reduce((a,p)=>a+(p.at[k]||0),0)/L.length:0;}
function pmMini(m,s,big){const sl=slotsOf(m.f[s]),C=slotCoords(m.f[s]);
 return `<div class="pmpitch${big?' big':''}">${sl.map((x,i)=>C[i]?(big?`<span class="pmp ${GRP[x]||''}" style="left:${C[i].x}%;top:${C[i].y}%">${x}</span>`:`<i class="pmd ${GRP[x]||''}" style="left:${C[i].x}%;top:${C[i].y}%"></i>`):'').join('')}</div>`;}
function preMatchView(m){
 const us=m.us,o=us==='h'?'a':'h',U=T(m[us]),O=T(m[o]),H=T(m.h),A=T(m.a);
 const pw=s=>teamPower(m.lu[s],m.f[s]).ovr,pu=pw(us),po=pw(o),fav=pu+(us==='h'?8:-8)-po;
 const st=s=>`${TACS.est.o[(m.tac[s]||{}).est||'equ']} · ${MENT[m.ment[s]].label.toLowerCase()}`;
 const fd=f=>f.length?`<span class="pmform">${f.map(x=>`<i class="${x}">${x}</i>`).join('')}</span>`:'<span class="pmform muted small">Sin partidos</span>';
 const key=m.lu[o].map(id=>PL(id)).filter(p=>p&&p.sp!=='POR').sort((a,b)=>b.ovr-a.ovr)[0];
 const df=PM_AT.map(k=>[k,pmAvg(m.lu[o],k)-pmAvg(m.lu[us],k)]).sort((a,b)=>b[1]-a[1]),fo=pmForm(m[o]),T0=Object.assign({},m.tac[o]||{});
 const str=df.filter(x=>x[1]>.35).slice(0,3).map(x=>AT_NAME[x[0]]),weak=df.filter(x=>x[1]<-.35).slice(-3).reverse().map(x=>AT_NAME[x[0]]);
 if(fo.filter(x=>x==='G').length>=3)str.push('Buena racha');if(fo.filter(x=>x==='P').length>=3)weak.push('Mala racha');
 if(T0.lin==='alt')weak.push('Espacio a la espalda (línea alta)');if(T0.pre==='alt')str.push('Presión alta');
 const out=squad(m[us]).filter(p=>p.inj||p.susp).slice(0,6);
 const quote=Math.abs(fav)<4?`${U.name} y ${O.name} llegan muy igualados: los detalles decidirán.`:fav>0?(us==='a'?`Pese a jugar fuera, ${U.name} llega como favorito ante ${O.name}.`:`${U.name} llega como ${fav>12?'claro':'ligero'} favorito en casa ante ${O.name}.`):(us==='h'?`Pese a jugar en casa, ${U.name} llega como ${fav<-12?'claro':'ligero'} tapado ante ${O.name}.`:`${U.name} visita a ${O.name} como ${fav<-12?'claro':'ligero'} tapado.`);
 const team=(t,s)=>`<div class="pmt">${crest(t,'lg')}<b>${esc(t.name)}</b>${starsHTML(starsOf(pw(s)))}${fd(pmForm(t.id))}</div>`;
 return `<div class="mtopb"><button class="btn sm" data-a="view" data-v="inicio">← Menú</button><span class="eyebrow mlbl">Previa del partido</span><span class="spacer"></span><button class="btn sm" data-a="view" data-v="tacticas">Tácticas</button><button class="btn sm primary" data-a="m-preok">Ir al partido →</button></div>
 <div class="pmhub"><div class="stack">
 <section class="panel pmvs2"><h2 class="pmcomp">${esc(m.label||'Partido')}</h2><div class="pmteams">${team(H,'h')}<b class="pmx">VS</b>${team(A,'a')}</div>
  <div class="pmwx"><span>${esc(m.ref&&m.ref.k==='cwc'?'Campo neutral':'Estadio de '+H.name)}</span><span>${m.wx?esc(wxTxt(m.wx)):''}${m.refr?` · árbitro ${esc(REFS[m.refr.k].n.toLowerCase())}`:''}</span></div></section>
 <section class="panel pmme"><div class="pmrl"><h2>${esc(U.name)}</h2><div class="kv2"><span>Estilo</span><b>${esc(st(us))}</b><span>Formación</span><b>${m.f[us]}</b></div></div>${pmMini(m,us,false)}
  <div class="pmout"><h3>No disponibles</h3>${out.length?out.map(p=>`<p><span class="pmi ${p.inj?'inj':p.susp?'sus':'int'}">${p.inj?'✚':p.susp?'■':'Int'}</span>${esc(lastNm(p.id))}</p>`).join(''):'<p class="muted">Toda la plantilla disponible</p>'}</div></section>
</div>
 <div class="stack"><section class="panel pmriv"><div class="pmrl"><h2>${esc(O.name)}</h2><div class="kv2"><span>Estilo</span><b>${esc(st(o))}</b><span>Formación</span><b>${m.f[o]}</b>${key?`<span>Jugador clave</span><b>${esc(lastNm(key.id))} · ${key.sp}</b>`:''}</div></div>${pmMini(m,o,true)}
  <div class="pmsw"><div><h3>Fortalezas</h3>${str.length?str.slice(0,4).map(x=>`<p>▸ ${esc(x)}</p>`).join(''):'<p class="muted">Ninguna destacable</p>'}</div><div><h3>Debilidades</h3>${weak.length?weak.slice(0,4).map(x=>`<p>▸ ${esc(x)}</p>`).join(''):'<p class="muted">No se aprecian debilidades</p>'}</div></div></section>
 <section class="panel pmq"><p>«${esc(quote)}»</p></section>

</div>
 <section class="panel prtalk"><div class="panel-h"><h2>Charla antes del partido</h2><span class="eyebrow">Al hablar pasas al partido</span></div><div class="pmtalks">${Object.entries(TALKS.pre).map(([k,v])=>{const [a,b]=v.split(':');return `<button class="talkc" data-a="talk" data-p="pre" data-v="${k}"><b>${esc(a)}</b><span>${esc((b||'').trim())}</span></button>`;}).join('')}</div>
 <p class="small muted" style="margin:6px 0 0">Motivar funciona mejor si eres el débil; tranquilizar, si eres favorito o en copa. Exigir es arriesgado si el equipo viene mal.</p></section></div>`;
}
const qcv=v=>v>=8?'q5':v>=7?'q4':v>=6?'q3':v>=5?'q2':'q1';
/** Franja en directo bajo el campo 2D: posesión, tiros, goles esperados y quién manda en los últimos 10 minutos. */
function liveStrip(m){const H=T(m.h),A=T(m.a),pos=Math.round((m.min?m.possSum/m.min:.5)*100),sh=m.sh||[],from=Math.max(0,m.min-10);
 const xr=s=>sh.filter(x=>x[0]===(s==='h'?0:1)&&(x[4]??0)>=from).reduce((a,x)=>a+x[2],0),xh=xr('h'),xa=xr('a'),dom=xh+xa>0?Math.round(xh/(xh+xa)*100):pos;
 const xg=s=>((m.st[s].xg)||0).toFixed(1);
 return `<div class="m2s"><span class="m2t">${esc(H.short)}</span><span class="m2bar" title="Posesión"><i style="width:${pos}%;background:${H.c1}"></i><i style="width:${100-pos}%;background:${A.c1}"></i></span><span class="m2t">${esc(A.short)}</span>
 <span class="m2k"><b>${pos}%</b> pos.</span><span class="m2k"><b>${m.st.h.sh}-${m.st.a.sh}</b> tiros</span><span class="m2k"><b>${xg('h')}-${xg('a')}</b> xG</span>
 <span class="m2k m2dom ${dom>=60?'h':dom<=40?'a':''}" title="Quién llega más en los últimos 10 minutos">${dom>=60?'▲ '+esc(H.short)+' aprieta':dom<=40?'▲ '+esc(A.short)+' aprieta':'Igualado'}</span>
 <button class="btn sm m2n" data-a="n2d" aria-pressed="${!!S.n2d}">Nombres</button></div>`;}
/** Pantalla del pitido final (como la del FMM): goleadores de cada equipo con sus minutos, estadio y público, y las cifras clave. */
function ftHTML(m){
 const H=T(m.h),A=T(m.a),side=s=>{const by={};m.ev.filter(e=>(e.t==='goal'||e.t==='red')&&e.s===s).forEach(e=>{const k=(e.t==='red'?'r':'g')+e.pid;(by[k]=by[k]||{t:e.t,pid:e.pid,m:[]}).m.push(fmtMin(e.min)+(e.gt==='pen'?' (pen.)':''));});
  return Object.values(by).map(x=>`<div class="ftsc"><i>${x.t==='red'?'🟥':'⚽'}</i><b>${esc(lastNm(x.pid).toUpperCase())}</b> ${esc(x.m.join(', '))}</div>`).join('')||'<div class="ftsc muted">—</div>';};
 const cc=s=>(m.sh||[]).filter(x=>x[0]===(s==='h'?0:1)&&x[2]>=30).length,tr=s=>{const L=m.lu[s].concat(Object.keys(m.played).filter(id=>PL(id)&&PL(id).team===m[s])).filter((v,i,a)=>v&&a.indexOf(v)===i).map(id=>m.rat&&m.rat[id]).filter(Boolean);return L.length?(L.reduce((a,b)=>a+b,0)/L.length).toFixed(1):'—';};
 const poss=Math.round(m.possSum/Math.max(1,m.min)*100),row=(a,l,b)=>`<div class="ftr"><b>${a}</b><span>${l}</span><b>${b}</b></div>`;
 const stad=m.h===S.user&&S.naming&&S.naming.until>=S.seasonN?S.naming.name:`Estadio de ${H.city||H.name.split(' ').slice(-1)[0]}`,att=m.h===S.user&&S.club?Math.min(S.club.cap,attendance()):null;
 return `<div class="ftb"><div class="fth"><span>FINAL</span><span class="ftt">${crest(H,'sm')} ${esc(H.short)} <b>${m.score.h} - ${m.score.a}</b> ${esc(A.short)} ${crest(A,'sm')}</span>${m.pen?`<span>pen. ${m.pen[0]}-${m.pen[1]}</span>`:'<span></span>'}</div>
 <div class="ftg"><div>${side('h')}</div><div>${side('a')}</div></div>
 <div class="ftst">${esc(stad)}${att?` (público: ${att.toLocaleString('es')})`:''}</div>
 <div class="ftgrid"><div>${row(poss+'%','Posesión',(100-poss)+'%')}${row(cc('h'),'Ocasiones claras',cc('a'))}${row(tr('h'),'Nota del equipo',tr('a'))}</div><div>${row(`${m.st.h.sh} (${m.st.h.ot})`,'Tiros (a puerta)',`${m.st.a.sh} (${m.st.a.ot})`)}${row(m.st.h.co||0,'Córners',m.st.a.co||0)}${row(m.st.h.fo||0,'Faltas',m.st.a.fo||0)}</div></div>
 <div class="ftf"><span>${esc(m.label||'')}</span></div></div>${m.us?(()=>{try{const R=tacReport(m);return R?keysHTML(keys3(R,reportTips(R))):'';}catch(e){return '';}})():''}`;}
export function matchView(){
 if(S.match&&S.match.us&&S.match.min===0&&!S.match.done&&!S.match.talks.pre&&!S.match.preOk)return preMatchView(S.match);
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
 const tph=m.done?null:m.min===0?(m.preOk?null:'pre'):(m.half&&m.min===45&&m.paused?'half':null);
 const talkP=tph&&!m.talks[tph]?`<div class="subs"><h3>${tph==='pre'?'Charla antes del partido':'Charla del descanso'}</h3><div class="chips">${Object.entries(TALKS[tph]).map(([k,v])=>`<button class="btn sm" data-a="talk" data-p="${tph}" data-v="${k}">${esc(v)}</button>`).join('')}</div><p class="small muted" style="margin:0">${tph==='pre'?'Motivar funciona mejor si eres el débil; tranquilizar, si eres favorito o en partidos de copa. Exigir es arriesgado si el equipo viene mal.':'La bronca puede despertar a un equipo que pierde, pero sienta mal si vais ganando. Con ventaja, mejor pedir calma.'}</p></div>`:'';
 const talkDone=Object.entries(m.talks).map(([ph,x])=>`<div class="negmsg ${x.d>0?'ok':x.d<-.005?'no':''}" style="margin:0 0 10px;display:block">${ph==='pre'?'Charla previa':ph==='fin'?'Charla final':'Descanso'}: ${esc((ph==='fin'?FIN[x.opt]:TALKS[ph][x.opt]).split(':')[0])}: ${esc(x.txt)}${reactHTML(x.re)}</div>`).join('')+(m.done&&m.us&&m.ref.k!=='fr'&&!m.talks.fin?`<div class="subs" style="margin:0 0 10px"><h3>Charla final</h3><div class="chips">${Object.entries(FIN).map(([k,v])=>`<button class="btn sm" data-a="ftalk" data-v="${k}">${esc(v)}</button>`).join('')}</div><p class="small muted" style="margin:4px 0 0">Elogiar sienta bien tras un buen partido; exigir puede espabilar a los que fallaron, pero molesta a los que cumplieron.</p></div>`:'');
 const ctl=m.done?`<button class="btn primary big" data-a="m-finish">Ver resultados de la jornada</button>${m.us?`<button class="btn big" data-a="post" data-v="live">📊 Resumen</button><button class="btn big" data-a="trep" data-v="live">📋 Informe táctico</button>`:''}`:`
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
 const estC=`<div class="panel-h"><h2>Estadísticas</h2>${m.wx?`<span class="eyebrow" title="${esc(WX[m.wx.k].d)}">${esc(wxTxt(m.wx))}${m.refr?` · árbitro ${esc(REFS[m.refr.k].n.toLowerCase())}`:''}</span>`:''}</div>
  <div class="stat"><span>${poss}%</span><span class="c">Posesión</span><span class="r">${100-poss}%</span></div><div class="pbar"><i style="width:${poss}%;background:${H.c1}"></i><i style="width:${100-poss}%;background:${A.c1}"></i></div>
  ${stat('Goles esperados (xG)',(m.st.h.xg||0).toFixed(2),(m.st.a.xg||0).toFixed(2))}${stat('Tiros',m.st.h.sh,m.st.a.sh)}${stat('A puerta',m.st.h.ot,m.st.a.ot)}${stat('Córners',m.st.h.co||0,m.st.a.co||0)}${stat('Faltas',m.st.h.fo||0,m.st.a.fo||0)}${stat('Pases buenos',(m.st.h.pa?Math.round(m.st.h.pc/m.st.h.pa*100):0)+'%',(m.st.a.pa?Math.round(m.st.a.pc/m.st.a.pa*100):0)+'%')}${stat('Amarillas',m.st.h.yc,m.st.a.yc)}${stat('Rojas',m.st.h.rc,m.st.a.rc)}${stat('Cambios',m.subs.h,m.subs.a)}${(()=>{const G=m.ev.filter(e=>e.t==='goal');if(!G.length)return '';const ks=[...new Set(G.map(e=>e.gt||'otro'))];return `<div class="eyebrow" style="margin:10px 0 4px">Cómo llegaron los goles</div>${ks.map(k=>stat(GOALT[k]?GOALT[k].n:k,G.filter(e=>e.s==='h'&&(e.gt||'otro')===k).length,G.filter(e=>e.s==='a'&&(e.gt||'otro')===k).length)).join('')}`;})()}
  ${lanesHTML(m)}${m.done&&m.sh?`<div class="panel-h" style="margin-top:12px"><h2>Mapa de tiros</h2></div><div class="shotmaps">${shotMap(matchRecord(m),0,T(m.h).name)}${shotMap(matchRecord(m),1,T(m.a).name)}</div>`:''}`;
 const mw=S.mw||'par';
 return `<div class="mtopb"><button class="btn sm" data-a="view" data-v="inicio">← Menú</button>${m.label?`<span class="eyebrow mlbl">${m.derby?`<span class="derbytag sm">${derbyName(m.h,m.a)}</span> `:''}${esc(m.label)}${m.agg?` · vuelta: ida ${m.agg[1]}-${m.agg[0]}`:m.ko?' · eliminatoria':''}</span>`:''}<span class="spacer"></span><button class="btn sm" data-a="sound" aria-pressed="${soundOn()}" title="Sonido y vibración">${soundOn()?'🔊':'🔇'}</button><div class="seg"><button data-a="v2d" data-v="1" aria-pressed="${S.v2d!==false}">2D</button><button data-a="v2d" data-v="0" aria-pressed="${S.v2d===false}">Texto</button></div></div>
 <div class="mfm mw-${mw}"><div class="mlL"><div class="mscore ${flash?'flash':''}"><span class="mtime">${label}</span><span class="mtm" style="${crestStyle(H)}">${esc(H.short)}</span><b class="msc h">${m.score.h}</b>${crest(m.us?T(m[m.us]):H,'sm')}<b class="msc a">${m.score.a}</b><span class="mtm" style="${crestStyle(A)}">${esc(A.short)}</span></div>
 <div class="mscr"><span>${esc(scorers('h'))}</span><span class="mag">${m.agg?`global ${m.score.h+m.agg[0]}-${m.score.a+m.agg[1]}`:''}${m.pen?` pen. ${m.pen[0]}-${m.pen[1]}`:''}</span><span>${esc(scorers('a'))}</span></div><div class="mprog"><i style="width:${Math.min(100,m.min/m.end*100)}%"></i></div>
 ${m.done&&!RT.replay?ftHTML(m):''}${S.v2d!==false&&!(m.done&&!RT.replay)?`<div class="p2d"><canvas id="pitch2d" width="800" height="512" aria-label="Vista del partido en 2D"></canvas><div class="mcom" id="mcom" aria-live="polite">${esc(RT.com2d||'')}</div>${liveStrip(m)}</div>`:''}
 ${RT.replay?`<div class="row" style="justify-content:center;margin-top:8px"><span class="small muted">Viendo la repetición</span><button class="btn sm dark" data-a="replay-stop">Cerrar repetición</button></div>`:''}
 </div><div class="mlR"><div class="seg mwsel">${[['par','Partido'],['est','Estadísticas'],['eve','Eventos'],['for','Formaciones'],['res','Resultados']].map(([k,l])=>`<button data-a="m-w" data-v="${k}" aria-pressed="${mw===k}">${l}</button>`).join('')}</div><div class="wpar">
 <div class="mbar">${m.done?`<button class="btn primary" data-a="m-finish">Ver resultados de la jornada</button>${m.us?`<button class="btn" data-a="post" data-v="live">📊 Resumen</button><button class="btn" data-a="trep" data-v="live">📋 Informe táctico</button>`:''}`:`${m.paused?`<button class="btn primary" data-a="m-play">${resumeL}</button>`:`<button class="btn dark" data-a="m-pause">Pausar</button>`}
  <div class="seg" aria-label="Velocidad">${[1,2,4,9].map(v=>`<button data-a="m-speed" data-v="${v}" aria-pressed="${m.speed===v}" ${v===9?'title="Solo ocasiones, goles y decisiones"':''}>${v===9?'Clave':'x'+v}</button>`).join('')}</div>
  <button class="btn" data-a="m-subs" ${m.subs[us]>=5||m.min===0?'disabled':''}>Cambios ${m.subs[us]}/5</button><button class="btn" data-a="m-sim">Simular</button>`}</div>${!m.done&&m.min>0&&m.us?`<div class="shouts"><span class="eyebrow">📣 Gritos${m.shCd&&m.min<m.shCd?` · otra vez en el ${m.shCd}'`:''}</span>${Object.entries(SHOUTS).map(([k,l])=>`<button class="btn sm ${m.shx&&m.shx.k===k&&m.min<=m.shx.until?'dark':''}" data-a="m-shout" data-v="${k}" ${m.shCd&&m.min<m.shCd?'disabled':''}>${l}</button>`).join('')}</div>`:''}
 ${m.mom&&!m.done?`<div class="momb"><b>${esc(m.mom.txt)}</b><div class="stack" style="gap:6px;margin-top:8px">${m.mom.opts.map(([v,l])=>`<button class="btn ${v===m.mom.opts[0][0]?'primary':''}" data-a="mom" data-v="${v}">${esc(l)}</button>`).join('')}</div></div>`:''}${m.half&&m.paused&&!m.done&&m.min===45&&m.us?`<div class="itkb"><b>Habla con un jugador</b> <span class="small muted">(hasta 2)</span><div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><select id="itkP">${m.lu[m.us].filter(Boolean).map(id=>`<option value="${id}">${esc(PL(id).name)}${m.itk&&m.itk[id]?' ✓':''}</option>`).join('')}</select>${Object.entries(ITALK).map(([k,l])=>`<button class="btn sm" data-a="itk" data-v="${k}">${l}</button>`).join('')}</div></div>`:''}${m.alert&&!m.done?`<div class="alert">${esc(m.alert)}</div>`:''}${talkP}${subsP}
 <div class="seg mtabs" role="tablist">${MTABS.map(([k,l])=>`<button data-a="m-tab" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>
 <section class="panel mtab">${tab==='jug'?playersTab(m,us):tab==='est'?estC
 :tab==='tac'?(m.done?`<div class="empty">El partido ha terminado.</div>`:`<div class="panel-h"><h2>Tácticas</h2><span class="eyebrow">${m.f[us]} · ${MENT[m.ment[us]].label}</span></div><div class="mctl">
  <div class="seg" aria-label="Mentalidad">${Object.entries(MENT).map(([k,v])=>`<button data-a="m-ment" data-v="${k}" aria-pressed="${m.ment[us]===k}">${v.label}</button>`).join('')}</div>
  <label class="f"><span class="eyebrow">Estilo</span><select id="m-est">${Object.entries(TACS.est.o).map(([k,v])=>`<option value="${k}" ${m.tac[us].est===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="f"><span class="eyebrow">Presión</span><select id="m-pre">${Object.entries(TACS.pre.o).map(([k,v])=>`<option value="${k}" ${m.tac[us].pre===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="f"><span class="eyebrow">Al perder</span><select id="m-per">${Object.entries(TACS.per.o).map(([k,v])=>`<option value="${k}" ${(m.tac[us].per||'nor')===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="f"><span class="eyebrow">Al recuperar</span><select id="m-rec">${Object.entries(TACS.rec.o).map(([k,v])=>`<option value="${k}" ${(m.tac[us].rec||'nor')===k?'selected':''}>${v}</option>`).join('')}</select></label>
  ${Object.keys(ut.plans||{}).length?`<div class="seg" aria-label="Tácticas guardadas">${['A','B','C'].filter(k=>ut.plans[k]).map(k=>`<button data-a="m-plan" data-v="${k}" aria-pressed="${m.plan===k}" title="${esc(ut.plans[k].name)}">Táctica ${k}</button>`).join('')}</div>`:''}
  <div class="chips" aria-label="Instrucciones al rival">${Object.entries(OIS).map(([k,v])=>`<button class="btn sm ${m.oi&&m.oi[us]&&m.oi[us][k]?'dark':''}" data-a="m-oi" data-v="${k}" title="${esc(v.d)}" aria-pressed="${!!(m.oi&&m.oi[us]&&m.oi[us][k])}">${v.n}</button>`).join('')}</div></div>
  ${pitchHTML(ut,m.lu[us],m.f[us],{roles:m.ro&&m.ro[us],en:m.en,rat:m.min>0?liveRatings(m):null})}`)
 :`${m.done&&goalsOf(m).length?`<div class="panel-h"><h2>Los goles</h2><span class="eyebrow">Toca para ver la repetición</span></div><div class="chips" style="margin-bottom:10px">${goalsOf(m).map(({e,i})=>`<button class="btn sm" data-a="replay" data-i="${i}">▶ ${fmtMin(e.min)}' ${esc(T(m[e.s]).short)} · ${esc(lastNm(e.pid))}${e.gt&&GOALT[e.gt]&&e.gt!=='otro'?` <span class="muted">· ${GOALT[e.gt].n.toLowerCase()}</span>`:''}</button>`).join('')}</div>`:''}${m.adv&&!m.done?`<div class="negmsg advm" style="margin:0 0 10px"><span><b>${m.adv.min}'</b> · ${esc(m.adv.tx)}</span>${m.adv.act?`<button class="btn sm primary" data-a="adv-apply">${m.adv.act.k==='sub'?'Hacer el cambio':'Aplicar'}</button>`:''}</div>`:''}${talkDone}${m.done&&m.mvp?`<p class="small" style="margin:0 0 8px">Jugador del partido: <b>${esc(PL(m.mvp).name)}</b> · ${m.rat[m.mvp].toFixed(1)}</p>`:''}<div class="feed">${feed}</div>`}</section></div></div>
 <section class="w wst"><div class="wh">Estadísticas</div>${estC.replace("<h2>Estadísticas</h2>","")}</section>
 <section class="w wev"><div class="wh">Eventos <b>${m.score.h} : ${m.score.a}</b></div>${wEvents(m)}</section>
 <section class="w wfh"><div class="wh">Formación · ${esc(H.short)} <span>${m.f.h}</span></div>${wForm(m,'h')}</section>
 <section class="w wfa"><div class="wh">Formación · ${esc(A.short)} <span>${m.f.a}</span></div>${wForm(m,'a')}</section>
 <section class="w wsc"><div class="wh">Otros resultados</div>${wScores(m)}</section></div>${m.us?wStrip(m,us):''}`;
}
