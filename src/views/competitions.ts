/* El Banquillo · views/competitions.js — Ligas, copas y competiciones continentales. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {wcs} from '../state';
import {ecoTable} from './economy';
import {flag} from '../flags';
import {clamp,esc,money,pick,r2} from '../core';
import {COUNTRIES,LV_NAMES,W,posChip} from '../data';
import {PL,LG,S,T,crest,lgTeams,seasonLabel,squad,uLg,unit} from '../state';
import {nRounds,table} from '../tactics';
import {CONTS,CT_STAGES,CUP_AFTER,NCUP,CWC_NAMES,GL,ctOf,ctStatus,ctTable,cupName,cupRoundName,cupStatus,cwcStatus,cwcTable} from '../competitions';
import {nameBtn,resRow,tableHTML,vtab} from './common';
import {dateTxt,lgDay} from '../calendar';
export function ctView(){
 if(!S.conts)return '<section class="panel"><div class="empty">Las competiciones continentales empiezan la próxima temporada.</div></section>';
 const ci=S.ctSel!=null?S.ctSel:Math.max(0,ctOf(S.user)),C=S.conts[ci],D=CONTS[ci],u=unit(D.top);
 const pickC=`<div class="seg" style="margin-bottom:14px">${CONTS.map((x,i)=>`<button data-a="ct-sel" data-v="${i}" aria-pressed="${i===ci}">${x.n} · ${x.reg}</button>`).join('')}</div>`;
 const quota=Object.entries(D.q).map(([c,n])=>`${COUNTRIES[c].n} ${n}`).join(', ');
 const groups=C.groups.map((g,gi)=>{const tb=ctTable(ci,gi);return `<section class="panel"><div class="panel-h"><h2>Grupo ${GL[gi]}</h2></div><div class="tbl"><table><thead><tr><th>#</th><th>Equipo</th><th class="r">PJ</th><th class="r">DG</th><th class="r">Pts</th></tr></thead><tbody>${tb.map((r,i)=>`<tr class="${r.id===S.user?'me':''}"><td class="n"><span class="zone ${i<2?'z4':''}"></span>${i+1}</td><td><span class="teamcell">${crest(T(r.id),'sm')}${esc(T(r.id).name)} <span class="divtag">${COUNTRIES[LG(T(r.id).lg).c].code}</span></span></td><td class="n">${r.pj}</td><td class="n">${r.gf-r.gc>0?'+':''}${r.gf-r.gc}</td><td class="pts">${r.pts}</td></tr>`).join('')}</tbody></table></div></section>`;}).join('');
 const ko=[6,7,8,9,10,11,12].filter(s=>C.dates[s]&&C.dates[s].length).reverse().map(s=>`<h3 style="margin:16px 0 6px">${CT_STAGES[s]}</h3>${C.dates[s].map(f=>resRow(f,null)).join('')}`).join('');
 return pickC+`<section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>${D.n} ${seasonLabel()}</h2><span class="eyebrow">${C.winner!=null?'Campeón: '+esc(T(C.winner).name):ctOf(S.user)===ci?'Tu equipo: '+ctStatus():D.reg}</span></div>
 <p class="small muted" style="margin:0">${C.teams.length} equipos de las primeras divisiones (${quota}), según la clasificación de la temporada anterior. ${D.G} grupos de 4 a ida y vuelta; pasan los dos primeros. ${D.G===8?'Octavos, cuartos y semifinales':'Cuartos y semifinales'} a ida y vuelta (si el global empata, penaltis) y final a partido único en campo neutral. Cada victoria en grupos da ${money(r2(u*.3))}, cada eliminatoria superada ${money(r2(u))} y el campeón cobra ${money(r2(u*5))}.</p>${ko}</section>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))">${groups}</div>`;
}
export function copasView(){
 const tab=S.cupTab||'cup';
 const segH=`<div class="seg" style="margin-bottom:14px"><button data-a="cup-tab" data-v="cup" aria-pressed="${tab==='cup'}">Copa nacional</button><button data-a="cup-tab" data-v="ct" aria-pressed="${tab==='ct'}">Continental</button><button data-a="cup-tab" data-v="cwc" aria-pressed="${tab==='cwc'}">Mundial de Clubes</button></div>`;
 if(tab==='ct')return segH+ctView();
 if(tab==='cup'){
  const c=S.cupC!=null?S.cupC:LG(uLg()).c,cup=S.cups&&S.cups[c];
  const pick=`<label class="f" style="margin-bottom:14px;max-width:260px"><span class="eyebrow">País</span><select id="cupC">${wcs().map(i=>COUNTRIES[i]).map((C,i)=>`<option value="${i}" ${i===c?'selected':''}>${C.n}</option>`).join('')}</select></label>`;
  if(!cup)return segH+pick+'<section class="panel"><div class="empty">Las copas empiezan la próxima temporada.</div></section>';
  const C=COUNTRIES[c],rounds=cup.rounds.map((rd,k)=>({rd,k})).filter(x=>x.rd).reverse();
  const info=`<p class="small muted" style="margin:0 0 12px">${cup.alive.length+(cup.winner!=null?0:0)} equipos siguen vivos. Eliminatoria a partido único: juega en casa el de categoría más baja y, si hay empate, penaltis. Juegan todos los clubes del país desde la primera ronda; en alguna ronda, para cuadrar el cuadro, unos pocos equipos sorteados pasan sin jugar. Premio por ronda superada: desde ${money(r2(.25*unit(C.top)))}; campeón ${money(r2(unit(C.top)*3))}.</p>`;
  return segH+pick+`<section class="panel"><div class="panel-h"><h2>${esc(cupName(c))}</h2><span class="eyebrow">${cup.winner!=null?'Campeón: '+esc(T(cup.winner).name):c===LG(uLg()).c?'Tu equipo: '+cupStatus():'En juego'}</span></div>${info}
  ${rounds.length?rounds.map(({rd,k})=>`<h3 style="margin:16px 0 6px">${cupRoundName(rd)} <span class="muted small">· tras la jornada ${CUP_AFTER[k+NCUP-cup.R]+1}${rd.byes.length?' · '+rd.byes.length+' exentos':''}</span></h3>${rd.matches.slice().sort((a,b)=>((b.h===S.user||b.a===S.user)?1:0)-((a.h===S.user||a.a===S.user)?1:0)).map(f=>resRow(f,null,true)).join('')}`).join(''):`<div class="empty">El sorteo de la primera ronda se hace tras la jornada ${CUP_AFTER[NCUP-cup.R]+1}.</div>`}</section>`;
 }
 const W=S.cwc;if(!W)return segH+'<section class="panel"><div class="empty">El Mundial de Clubes empieza la próxima temporada.</div></section>';
 const groups=W.groups.map((g,gi)=>{const tb=cwcTable(gi);return `<section class="panel"><div class="panel-h"><h2>Grupo ${'ABCD'[gi]}</h2></div><div class="tbl"><table><thead><tr><th>#</th><th>Equipo</th><th class="r">PJ</th><th class="r">DG</th><th class="r">Pts</th></tr></thead><tbody>${tb.map((r,i)=>`<tr class="${r.id===S.user?'me':''}"><td class="n"><span class="zone ${i<2?'z4':''}"></span>${i+1}</td><td><span class="teamcell">${crest(T(r.id),'sm')}${esc(T(r.id).name)} <span class="divtag">${COUNTRIES[LG(T(r.id).lg).c].code}</span></span></td><td class="n">${r.pj}</td><td class="n">${r.gf-r.gc>0?'+':''}${r.gf-r.gc}</td><td class="pts">${r.pts}</td></tr>`).join('')}</tbody></table></div>
  ${[0,1,2].map(d=>W.dates[d].filter(f=>f.g===gi&&f.played)).flat().map(f=>resRow(f,null)).join('')}</section>`;}).join('');
 const ko=[3,4,5].filter(s=>W.dates[s]).map(s=>`<h3 style="margin:16px 0 6px">${CWC_NAMES[s]}</h3>${W.dates[s].map(f=>resRow(f,null)).join('')}`).join('');
 return segH+`<section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Mundial de Clubes ${seasonLabel()}</h2><span class="eyebrow">${W.winner!=null?'Campeón: '+esc(T(W.winner).name):'Tu equipo: '+cwcStatus()}</span></div>
 <p class="small muted" style="margin:0">Lo juegan los 10 campeones de Primera de la temporada anterior y los subcampeones de los 6 países más fuertes. Campo neutral. Grupos de 4 y los dos primeros pasan a cuartos. Cada victoria da ${money(r2(unit(76)))} y el campeón cobra ${money(r2(unit(76)*8))}.</p>${ko||''}</section>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))">${groups}</div>`;
}
export function ligaView(world){
 const lg=world?S.ligaLg:uLg(),L=LG(lg),C=COUNTRIES[L.c],tb=table(lg),r=clamp(S.ligaRound,0,nRounds()-1),pl=squadsInLeague(lg);
 const T_=vtab('liga',[['tab','Clasificación'],['jor','Jornadas'],['gol','Goleadores'],['jug','Jugadores'],['mes','Premios del mes'],['camp','Campeones'],['eco','Dinero']],'tab');
 const pickRow=world?`<div class="wcountries">${wcs().map(i=>[i,COUNTRIES[i]]).map(([i,c])=>`<button class="wc${i===L.c?' on':''}" data-a="w-country" data-v="${i}">${flag(c.code,'sm')}<span>${esc(c.n)}</span></button>`).join('')}</div>
 <div class="row" style="margin:0 0 10px;align-items:center;gap:8px"><div class="seg" style="max-width:100%;overflow-x:auto">${Array.from({length:C.lv},(_,i)=>`<button data-a="liga-lv" data-v="${i}" aria-pressed="${L.lv===i}">${LV_NAMES[i]}</button>`).join('')}</div>${lg!==uLg()?`<button class="btn sm" data-a="liga-mine">Ir a mi liga</button>`:''}</div>`:'';
 const head=(h,e)=>`<div class="panel-h"><h2>${h}</h2><span class="eyebrow">${e||`${esc(C.n)} · ${LV_NAMES[L.lv]}`}</span></div>`;
 const pRow=(p,i,cols)=>`<tr class="${p.team===S.user?'me':''}"><td class="n">${i+1}</td><td>${posChip(p)} ${nameBtn(p)}</td><td><span class="teamcell">${crest(T(p.team),'sm')}${esc(T(p.team).short)}</span></td>${cols.map(c=>`<td class="${c[1]?'pts':'n'}">${c[0]}</td>`).join('')}</tr>`;
 const top=(f,n=20)=>pl.filter(p=>p.st&&f(p)>0).sort((a,b)=>f(b)-f(a)||(a.st.pj-b.st.pj)).slice(0,n);
 let body='';
 if(T_.cur==='tab')body=`<div class="grid"><section class="panel">${head(`${esc(C.n)} · ${LV_NAMES[L.lv]}`,`Tras ${S.week} jornada${S.week===1?'':'s'}`)}${tableHTML(tb,lg,false)}</section>
  <div class="stack"><section class="panel"><div class="panel-h"><h2>Jornada ${r+1}</h2><div class="row"><button class="btn sm" data-a="liga-r" data-d="-1" ${r===0?'disabled':''} aria-label="Jornada anterior">‹</button><button class="btn sm" data-a="liga-r" data-d="1" ${r>=nRounds()-1?'disabled':''} aria-label="Jornada siguiente">›</button></div></div>${S.fixtures[lg][r].map(f=>resRow(f,null)).join('')}</section>
  <section class="panel">${head('Pichichi','Top 5')}${(()=>{const g=top(p=>p.st.g,5);return g.length?`<div class="tbl"><table><tbody>${g.map((p,i)=>pRow(p,i,[[p.st.g,1]])).join('')}</tbody></table></div>`:'<div class="empty">Aún sin goles.</div>';})()}</section></div></div>`;
 else if(T_.cur==='jor')body=`<section class="panel"><div class="panel-h"><h2>Jornada ${r+1}</h2><div class="row"><button class="btn sm" data-a="liga-r" data-d="-1" ${r===0?'disabled':''} aria-label="Jornada anterior">‹</button><span class="eyebrow">${dateTxt(lgDay(r))}</span><button class="btn sm" data-a="liga-r" data-d="1" ${r>=nRounds()-1?'disabled':''} aria-label="Jornada siguiente">›</button></div></div>${S.fixtures[lg][r].map(f=>resRow(f,null)).join('')}</section>`;
 else if(T_.cur==='gol'){const g=top(p=>p.st.g),a=top(p=>p.st.a),th=l=>`<thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th class="r">PJ</th><th class="r">${l}</th></tr></thead>`;
  body=`<div class="grid"><section class="panel">${head('Goleadores')}${g.length?`<div class="tbl"><table>${th('Goles')}<tbody>${g.map((p,i)=>pRow(p,i,[[p.st.pj],[p.st.g,1]])).join('')}</tbody></table></div>`:'<div class="empty">Aún sin goles.</div>'}</section>
  <section class="panel">${head('Asistentes')}${a.length?`<div class="tbl"><table>${th('Asist.')}<tbody>${a.map((p,i)=>pRow(p,i,[[p.st.pj],[p.st.a,1]])).join('')}</tbody></table></div>`:'<div class="empty">Aún sin asistencias.</div>'}</section></div>`;}
 else if(T_.cur==='jug'){const k=S.ljK||'r',m=Math.max(1,Math.floor(S.week/3)),D={r:['Nota',p=>p.st.pj>=m?p.st.rs/p.st.pj:0,v=>v.toFixed(2)],mv:['MVP',p=>p.st.mv,v=>v],ga:['G+A',p=>p.st.g+p.st.a,v=>v],cs:['Porterías a 0',p=>['POR','DFC','LI','LD'].includes(p.sp)?p.st.cs:0,v=>v],yc:['Tarjetas',p=>p.st.yc+2*p.st.rc,v=>v],mi:['Minutos',p=>p.st.mi,v=>v]};
  const L2=top(D[k][1],30);
  body=`<section class="panel"><div class="panel-h"><h2>Cómo van los jugadores</h2><div class="seg">${Object.entries(D).map(([kk,v])=>`<button data-a="lj-k" data-v="${kk}" aria-pressed="${k===kk}">${v[0]}</button>`).join('')}</div></div>
  ${L2.length?`<div class="tbl"><table><thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th class="r">PJ</th><th class="r">Goles</th><th class="r">Asist.</th><th class="r">MVP</th><th class="r">Nota</th><th class="r">${D[k][0]}</th></tr></thead><tbody>${L2.map((p,i)=>pRow(p,i,[[p.st.pj],[p.st.g],[p.st.a],[p.st.mv],[p.st.pj?(p.st.rs/p.st.pj).toFixed(2):'—'],[D[k][2](D[k][1](p)),1]])).join('')}</tbody></table></div>`:'<div class="empty">Aún no hay datos.</div>'}
  ${k==='r'?`<p class="small muted" style="margin:8px 0 0">La nota exige haber jugado ${m} partido${m>1?'s':''}.</p>`:''}</section>`;}
 else if(T_.cur==='mes'){const M=((S.monthly||{})[lg]||[]).slice().reverse();
  const who=(x,ex)=>x?`<div class="mw">${PL(x.pid)?nameBtn(PL(x.pid)):esc(x.name)}<small>${esc(x.club)} · ${x.pj} PJ · nota ${x.r.toFixed(2)}${x.g?` · ${x.g} G`:''}${x.a?` · ${x.a} A`:''}${ex||''}</small></div>`:'<div class="mw muted">—</div>';
  body=M.length?`<div class="mgrid">${M.map(A=>`<section class="panel mcard"><div class="panel-h"><h2>${esc(A.m)}</h2><span class="eyebrow">${A.sn===S.seasonN?'Esta temporada':'Temporada anterior'}</span></div>
  <div class="mtop"><span class="mic">🏅</span><div><div class="eyebrow">Jugador del mes</div>${who(A.pom)}</div></div>
  <div class="mtop"><span class="mic">🧑‍💼</span><div><div class="eyebrow">Entrenador del mes</div>${A.coach?`<div class="mw">${esc(A.coach.name)}<small>${T(A.coach.tid)?esc(T(A.coach.tid).name):''} · ${A.coach.pts} de ${A.coach.of} puntos</small></div>`:'—'}</div></div>
  <div class="mtop"><span class="mic">⭐</span><div><div class="eyebrow">Mejor joven (sub-21)</div>${who(A.young)}</div></div>
  <div class="mpos">${[['POR','Portero'],['DEF','Defensa'],['MED','Centrocampista'],['DEL','Delantero']].map(([g,n])=>`<div><div class="eyebrow">${n}</div>${who(A.pos[g])}</div>`).join('')}</div></section>`).join('')}</div>`
  :`<section class="panel"><div class="empty">Los premios del mes se entregan tras la última jornada de cada mes en las ligas de tu país: jugador del mes, entrenador del mes, mejor joven y el mejor de cada línea.</div></section>`;}
 else if(T_.cur==='camp'){const E=(S.ency||[]).slice().reverse().map(e=>({s:e.season,c:(e.champs||[]).find(x=>x.c===L.c&&x.lv===L.lv),cup:L.lv===0?((e.cups||[]).find(x=>x.c===L.c)||{}).w:null,boot:L.lv===0&&e.boot?e.boot:null})).filter(x=>x.c);
  body=`<section class="panel">${head('Campeones')}${E.length?`<div class="tbl"><table><thead><tr><th>Temporada</th><th>Campeón</th><th>Subcampeón</th><th class="r">Pts</th>${L.lv===0?'<th>Copa</th>':''}</tr></thead><tbody>${E.map(x=>`<tr><td class="num">${x.s}</td><td><b>🏆 ${esc(x.c.champ)}</b></td><td>${esc(x.c.runner)}</td><td class="n">${x.c.pts}</td>${L.lv===0?`<td>${esc(x.cup||'—')}</td>`:''}</tr>`).join('')}</tbody></table></div>`:'<div class="empty">Al acabar la primera temporada aparecerán aquí los campeones de esta liga.</div>'}</section>`;}
 else body=`<section class="panel">${head('Dinero de los clubes')}${ecoTable(lg)}</section>`;
 return T_.bar+pickRow+body;
}
export const squadsInLeague=lg=>lgTeams(lg).flatMap(t=>squad(t.id));
