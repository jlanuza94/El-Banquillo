/* El Banquillo · views/nations.ts — Pantalla de selecciones: ranking, torneos, tus internacionales y tu convocatoria. */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from '../core';
import {COUNTRIES,GRP,posChip} from '../data';
import {PL,S,T,squad} from '../state';
import {flag} from '../flags';
import {NT_SAL,TOURN,autoCall,callOf,initIntl,nextTournaments,ntReq,pool,ranking,strengthOf,summerYear} from '../nations';
import {nameBtn} from './common';

const fl=c=>flag(COUNTRIES[c].code,'sm');
export function seleccionesView(){
 initIntl();const tab=S.ntTab||(S.nt?'mi':'rk'),I=S.intl;
 const [nn,nk]=nextTournaments();
 const seg=`<div class="seg" style="margin-bottom:14px;max-width:100%;overflow-x:auto">${[['rk','Ranking'],['tor','Torneos'],['int','Tus internacionales'],['mi',S.nt?'Mi selección':'Ser seleccionador']].map(([k,l])=>`<button data-a="nt-tab" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`;
 const next=`<div class="negmsg" style="margin:0 0 14px">Próximo torneo: <b>${nk.map(k=>TOURN[k].n).join(' y ')}</b>, en el verano de ${summerYear(nn)}${nn===S.seasonN?' (al acabar esta temporada)':''}. Durante la temporada hay dos parones de selecciones (jornadas 10 y 28).</div>`;
 let body='';
 if(tab==='rk'){
  body=`<section class="panel"><div class="panel-h"><h2>Ranking mundial</h2><span class="eyebrow">Sube y baja con cada partido</span></div><div class="tbl"><table><thead><tr><th>#</th><th>Selección</th><th class="r">Puntos</th><th class="r">Nivel del once</th><th>Su estrella</th><th class="r" title="Mundiales · Eurocopas · Copas América">Títulos</th></tr></thead><tbody>
  ${ranking().map((c,i)=>{const call=callOf(c),star=PL(call.slice().sort((a,b)=>PL(b).ovr-PL(a).ovr)[0]),t=I.titles[c],tt=t.wc+t.eu+t.ca;return `<tr${S.nt&&S.nt.c===c?' class="me"':''}><td class="num">${i+1}</td><td style="white-space:nowrap">${fl(c)} <b>${esc(COUNTRIES[c].n)}</b></td><td class="num r">${I.elo[c]}</td><td class="num r">${(strengthOf(call)/10).toFixed(1)}</td><td>${star?nameBtn(star):'—'}</td><td class="num r" title="${t.wc} Mundial · ${t.eu} Eurocopa · ${t.ca} Copa América">${tt||'—'}</td></tr>`;}).join('')}</tbody></table></div></section>`;
 }else if(tab==='tor'){
  body=I.hist.length?I.hist.map(T0=>`<section class="panel"><div class="panel-h"><h2>${esc(T0.n)} ${T0.year||''}</h2><span class="eyebrow">Campeona: ${fl(T0.champ)} ${esc(COUNTRIES[T0.champ].n)}</span></div>
   ${T0.top?`<p class="small muted" style="margin:0 0 8px">Máximo goleador: <b>${esc(T0.top.name)}</b> (${fl(T0.top.c)}) con ${T0.top.g} goles.</p>`:''}
   <div class="grid">${T0.groups.map((g,gi)=>`<div><div class="eyebrow" style="margin-bottom:4px">${T0.groups.length>1?'Grupo '+'AB'[gi]:'Liguilla'}</div><div class="tbl"><table><thead><tr><th>Selección</th><th class="r">Pts</th><th class="r">GF</th><th class="r">GC</th></tr></thead><tbody>${g.tb.map(r=>`<tr><td>${fl(r.c)} ${esc(COUNTRIES[r.c].n)}</td><td class="num r">${r.pts}</td><td class="num r">${r.gf}</td><td class="num r">${r.ga}</td></tr>`).join('')}</tbody></table></div></div>`).join('')}</div>
   ${T0.ko.map(r=>`<div class="eyebrow" style="margin:10px 0 4px">${r.rd}</div>${r.ms.map(m=>`<div class="small">${esc(m)}</div>`).join('')}`).join('')}</section>`).join(''):
   `<section class="panel"><div class="empty">Todavía no se ha jugado ningún torneo. El primero será ${nk.map(k=>TOURN[k].n).join(' y ')} en el verano de ${summerYear(nn)}.</div></section>`;
 }else if(tab==='int'){
  const mine=squad(S.user).filter(p=>!p.loan).map(p=>({p,call:callOf(p.nat).includes(p.id)})).filter(x=>x.call||x.p.caps).sort((a,b)=>(b.call-a.call)||(b.p.caps||0)-(a.p.caps||0));
  body=`<section class="panel"><div class="panel-h"><h2>Tus internacionales</h2><span class="eyebrow">${mine.filter(x=>x.call).length} convocados ahora</span></div>
  <p class="small muted" style="margin:0 0 10px">Ir con la selección les da prestigio y ánimo, pero vuelven cansados de los parones y a veces lesionados. Ganar un torneo los revaloriza.</p>
  ${mine.length?`<div class="tbl"><table><thead><tr><th>Pos</th><th>Nombre</th><th>Selección</th><th class="r">Partidos</th><th class="r">Goles</th><th>Ahora</th></tr></thead><tbody>${mine.map(({p,call})=>`<tr><td>${posChip(p)}</td><td>${nameBtn(p)}</td><td>${esc(COUNTRIES[p.nat].n)}</td><td class="num r">${p.caps||0}</td><td class="num r">${p.ig||0}</td><td>${call?'<span class="tag xi">Convocado</span>':'<span class="small muted">No convocado</span>'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Ningún jugador de tu plantilla está en la lista de su selección.</div>'}</section>`;
 }else if(!S.nt){
  body=`<section class="panel"><div class="panel-h"><h2>Ser seleccionador</h2><span class="eyebrow">Tu reputación: ${Math.round(S.mgr.rep)}/100</span></div>
  <p class="small muted" style="margin:0 0 10px">Puedes dirigir a una selección a la vez que a tu club: eliges la convocatoria y te juegas el prestigio en los torneos. Las mejores selecciones piden más reputación. Si tu reputación es alta, alguna federación te llamará en verano.</p>
  ${ranking().map(c=>{const req=ntReq(c),done=(S.ntApplied||{})[c]===S.seasonN,ok=S.mgr.rep>=req-8;return `<div class="offer">${fl(c)}<span class="t"><b>${esc(COUNTRIES[c].n)}</b><br><span class="small muted">Pide ${req} de reputación · ${money(NT_SAL(c))}/sem</span></span><button class="btn sm" data-a="nt-apply" data-v="${c}" ${done||!ok?'disabled':''}>${done?'Rechazado':ok?'Presentar candidatura':'Reputación insuficiente'}</button></div>`;}).join('')}
  ${S.ntOffer!=null?`<div class="acts" style="justify-content:flex-start"><button class="btn primary" data-a="nt-accept">Aceptar la oferta de ${esc(COUNTRIES[S.ntOffer].n)}</button></div>`:''}</section>`;
 }else{
  const c=S.nt.c,call=callOf(c),P=pool(c,45),cnt=g=>call.map(PL).filter(p=>p&&(GRP[p.sp]||p.pos)===g).length;
  body=`<section class="panel"><div class="panel-h"><h2>${fl(c)} ${esc(COUNTRIES[c].n)}</h2><span class="eyebrow">Seleccionador desde ${esc(S.nt.since)} · ${money(NT_SAL(c))}/sem</span></div>
  <div class="kv" style="margin-top:0"><span>Puesto en el ranking</span><b>${ranking().indexOf(c)+1}º</b><span>Nivel del once</span><b>${(strengthOf(call)/10).toFixed(1)}</b><span>Convocados</span><b>${call.length}/23 · ${cnt('POR')} POR · ${cnt('DEF')} DEF · ${cnt('MED')} MED · ${cnt('DEL')} DEL</b></div>
  ${(S.nt.res||[]).length?`<p class="small" style="margin:10px 0 0">Tus torneos: ${S.nt.res.map(r=>`${esc(r.n)} ${esc(r.season)}: ${r.place===1?'campeón':r.place===2?'finalista':r.place===3?'semifinal':'fase de grupos'}`).join(' · ')}</p>`:''}
  <p class="small muted" style="margin:10px 0">Marca a los 23 que quieres llevar. Si no tocas nada, se convoca a los mejores. Con menos de 18 válidos se usa la lista automática.</p>
  <div class="row" style="margin-bottom:10px"><button class="btn sm" data-a="nt-auto">Convocar a los mejores</button><button class="btn sm danger" data-a="nt-leave">Dejar el cargo</button></div>
  <div class="tbl"><table><thead><tr><th></th><th>Pos</th><th>Nombre</th><th>Club</th><th class="r">Edad</th><th class="r">Media</th><th class="r">Partidos</th></tr></thead><tbody>
  ${P.map(p=>{const on=call.includes(p.id);return `<tr${on?' class="me"':''}><td><button class="btn sm ${on?'dark':''}" data-a="nt-call" data-id="${p.id}" aria-pressed="${on}" aria-label="${on?'Quitar':'Convocar'}">${on?'✓':'+'}</button></td><td>${posChip(p)}</td><td>${nameBtn(p)}${p.inj?' <span class="tag bad">Lesionado</span>':''}</td><td class="small">${p.team!==null?esc(T(p.team).short):'Libre'}</td><td class="num r">${p.age}</td><td class="num r">${(p.ovr/10).toFixed(1)}</td><td class="num r">${p.caps||0}</td></tr>`;}).join('')}</tbody></table></div></section>`;
 }
 return seg+next+body;
}
export {autoCall};
