/* El Banquillo · views/competitions.js — Ligas, copas y competiciones continentales. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {flag} from '../flags';
import {clamp,esc,money,pick,r2} from '../core';
import {COUNTRIES,LV_NAMES,W,posChip} from '../data';
import {LG,S,T,crest,lgTeams,seasonLabel,squad,uLg,unit} from '../state';
import {nRounds,table} from '../tactics';
import {CONTS,CT_STAGES,CUP_AFTER,NCUP,CWC_NAMES,GL,ctOf,ctStatus,ctTable,cupName,cupRoundName,cupStatus,cwcStatus,cwcTable} from '../competitions';
import {nameBtn,resRow,tableHTML} from './common';
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
  const pick=`<label class="f" style="margin-bottom:14px;max-width:260px"><span class="eyebrow">País</span><select id="cupC">${COUNTRIES.map((C,i)=>`<option value="${i}" ${i===c?'selected':''}>${C.n}</option>`).join('')}</select></label>`;
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
export function ligaView(){
 const lg=S.ligaLg,L=LG(lg),C=COUNTRIES[L.c],tb=table(lg),r=clamp(S.ligaRound,0,nRounds()-1);
 const ld=S.ldTab||'g',pl=squadsInLeague(lg);
 const scorers=ld==='g'?pl.filter(p=>p.goals>0).sort((a,b)=>b.goals-a.goals||a.apps-b.apps).slice(0,10):ld==='a'?pl.filter(p=>p.st&&p.st.a>0).sort((a,b)=>b.st.a-a.st.a).slice(0,10):pl.filter(p=>p.st&&p.st.pj>=5).sort((a,b)=>b.st.rs/b.st.pj-a.st.rs/a.st.pj).slice(0,10);
 const ldVal=p=>ld==='g'?p.goals:ld==='a'?p.st.a:(p.st.rs/p.st.pj).toFixed(2);
 return `<div class="row" style="margin-bottom:14px;align-items:flex-end"><label class="f"><span class="eyebrow">País</span><select id="lgC">${COUNTRIES.map((c,i)=>`<option value="${i}" ${i===L.c?'selected':''}>${c.n}</option>`).join('')}</select></label>${flag(C.code)}
 <div class="seg" style="max-width:100%;overflow-x:auto">${Array.from({length:C.lv},(_,i)=>`<button data-a="liga-lv" data-v="${i}" aria-pressed="${L.lv===i}">${LV_NAMES[i]}</button>`).join('')}</div>
 ${lg!==uLg()?`<button class="btn sm" data-a="liga-mine">Ir a mi liga</button>`:''}</div>
 <div class="grid"><section class="panel"><div class="panel-h"><h2>${esc(C.n)} · ${LV_NAMES[L.lv]}</h2><span class="eyebrow">Tras ${S.week} jornada${S.week===1?'':'s'}</span></div>${tableHTML(tb,lg,false)}</section>
 <div class="stack"><section class="panel"><div class="panel-h"><h2>Jornada ${r+1}</h2><div class="row"><button class="btn sm" data-a="liga-r" data-d="-1" ${r===0?'disabled':''} aria-label="Jornada anterior">‹</button><button class="btn sm" data-a="liga-r" data-d="1" ${r>=nRounds()-1?'disabled':''} aria-label="Jornada siguiente">›</button></div></div>
 ${S.fixtures[lg][r].map(f=>resRow(f,null)).join('')}</section>
 <section class="panel"><div class="panel-h"><h2>Líderes</h2><div class="seg"><button data-a="ld-tab" data-v="g" aria-pressed="${ld==='g'}">Goles</button><button data-a="ld-tab" data-v="a" aria-pressed="${ld==='a'}">Asistencias</button><button data-a="ld-tab" data-v="r" aria-pressed="${ld==='r'}">Nota media</button></div></div>${scorers.length?`<div class="tbl"><table><thead><tr><th>Jugador</th><th>Equipo</th><th class="r">PJ</th><th class="r">${ld==='g'?'Goles (liga)':ld==='a'?'Asist.':'Nota'}</th></tr></thead><tbody>${scorers.map(p=>`<tr class="${p.team===S.user?'me':''}"><td>${posChip(p)} ${nameBtn(p)}</td><td><span class="teamcell">${crest(T(p.team),'sm')}${T(p.team).short}</span></td><td class="n">${p.st?p.st.pj:p.apps}</td><td class="pts">${ldVal(p)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Aún no hay datos.</div>'}${ld!=='g'?'<p class="small muted" style="margin:8px 0 0">Asistencias y nota cuentan todas las competiciones. La nota exige 5 partidos.</p>':''}</section></div></div>`;
}
export const squadsInLeague=lg=>lgTeams(lg).flatMap(t=>squad(t.id));
