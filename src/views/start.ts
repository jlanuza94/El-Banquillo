/* El Banquillo · views/start.js — Pantallas de inicio de partida y de entrenador sin club. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {nC} from '../state';
import {MODES} from '../quick';
import {DIFF} from '../difficulty';
import {slots,MAX_SLOTS} from '../persist';
import {esc,money,pick} from '../core';
import {COUNTRIES,LV_NAMES,LV_SH} from '../data';
import {RT,S,T,crest,findLg,lgName,lgTeams,lowest,rt} from '../state';
import {strength} from '../players';
import {startBudget} from '../world';
import {start} from '../boot';
import {flag} from '../flags';
import {themeBtn} from '../theme';
import {logoSVG,stadiumSVG,titleHTML} from './title';
export function startView(){
 const scr=RT.startScreen||(RT.startStep?'new':'title');
 if(scr==='title')return titleHTML(`${nC()} países · ${S.leagues.length} ligas · ${S.teams.length.toLocaleString('es')} clubes`)+themeBtn('onhero');
 const C=COUNTRIES[RT.startC];RT.startLv=Math.min(RT.startLv,C.lv-1);
 const L=findLg(RT.startC,RT.startLv),teams=lgTeams(L.id).sort((a,b)=>b.rep-a.rep);
 const cards=teams.map((t,r)=>{const lowestL=lowest(L);
  const obj=L.lv===0?(r<3?'Pelear el título':r<7?'Parte alta':r<13?'Mitad de tabla':'Evitar el descenso'):(r<3?'Ascender':r<8?'Pelear el ascenso':!lowestL&&r>=14?'Evitar el descenso':'Mitad de tabla');
  return `<button class="tcard" data-a="pick-team" data-i="${t.id}">${crest(t,'lg')}<div><div class="tn">${esc(t.name)}</div><div class="muted small">Objetivo: ${obj}</div></div>
  <dl><div><dt>Nivel</dt><dd>${(strength(t.id)/10).toFixed(1)}</dd></div><div><dt>Presupuesto</dt><dd>${money(startBudget(t))}</dd></div><div><dt>Liga</dt><dd>${LV_SH[L.lv]} ${C.code}</dd></div></dl></button>`;}).join('');
 const saved=slots.length?`<section class="panel" style="margin-bottom:22px"><div class="panel-h"><h2>Tus partidas</h2><span class="eyebrow">${slots.length} de ${MAX_SLOTS}</span></div>
 ${slots.slice().sort((a,b)=>b.updated-a.updated).map(x=>`<div class="offer">${crest({c1:x.c1,c2:x.c2,short:x.short},'')}<span class="t"><b>${esc(x.club)}</b><br><span class="small muted">${esc(x.lg)} · ${esc(x.season)} · jornada ${x.week+1} · ${new Date(x.updated).toLocaleDateString('es')}</span></span>${RT.delConfirm===x.id?`<button class="btn sm danger" data-a="slot-del-ok" data-id="${x.id}">Sí, borrar</button><button class="btn sm" data-a="slot-del-no">No</button>`:`<button class="btn sm" data-a="slot-del" data-id="${x.id}">Borrar</button><button class="btn sm primary" data-a="slot-load" data-id="${x.id}">Continuar</button>`}</div>`).join('')}
 ${slots.length>=MAX_SLOTS?'<p class="small muted" style="margin:8px 0 0">Tienes el máximo de partidas. Borra una para empezar otra.</p>':''}</section>`:'';
 const openF=`<div class="row" style="margin:0 0 18px"><label class="btn" style="cursor:pointer">Abrir partida desde archivo<input type="file" id="saveFile" accept=".ebsave,.txt,text/plain" hidden></label><span class="small muted">¿Vienes de otro móvil u ordenador? Abre aquí el archivo de tu partida.</span></div>`;
 const step=RT.startStep||'c',nT=c=>c.lv*20;
 const pickC=` <div class="cgrid">${COUNTRIES.map((c,i)=>`<button class="ccard" data-a="start-c" data-v="${i}">${flag(c.code)}<span class="cn">${esc(c.n)}</span><span class="small muted">${c.lv} divisiones · ${nT(c)} clubes</span></button>`).join('')}</div>`;
 const pickD=`<div class="dgrid">${Array.from({length:C.lv},(_,i)=>{const Li=findLg(RT.startC,i),TT=lgTeams(Li.id),ts=TT.map(t=>strength(t.id)/10),lo=Math.min(...ts),hi=Math.max(...ts),top=TT.slice().sort((a,b)=>b.rep-a.rep).slice(0,4);
  return `<button class="dtile t${Math.min(i,4)}" data-a="start-lv" data-v="${i}"><span class="dnum">${i+1}</span><span class="dnm">${esc((S.lgNames||{})[Li.id]||LV_NAMES[i])}</span><span class="dcr">${top.map(t=>crest(t,'sm')).join('')}</span><span class="dlv"><span>Nivel ${lo.toFixed(1)}–${hi.toFixed(1)}</span><i><b style="left:${(lo-3)/6*100}%;right:${100-(hi-3)/6*100}%"></b></i></span><span class="dds">${i===0?'Pelea por el título':i===C.lv-1?'Sin descenso · suben 3':'Suben 3 · bajan 3'}</span>${i===C.lv-1?'<span class="dtg">Desde abajo</span>':i===0?'<span class="dtg top">Máximo reto</span>':''}</button>`;}).join('')}</div>`;
 const chosen='';
 const done={c:step!=='c',d:step==='club'};
 const bar=`<div class="sbar">${logoSVG()}<b class="stt">Nueva partida</b><div class="ssteps">${[['c',step!=='c'?`${flag(C.code,'sm')} ${esc(C.n)}`:'País'],['d',step==='club'?esc(LV_SH[L.lv]+' · '+((S.lgNames||{})[L.id]||LV_NAMES[L.lv])):'División'],['club','Club']].map(([k,l],i)=>done[k]?`<button class="sst ok" data-a="start-step" data-v="${k}">✓ ${l}</button>`:`<span class="sst${step===k?' on':''}">${i+1} · ${l}</span>`).join('<span class="ssep">›</span>')}</div><span class="spacer"></span><button class="btn sm" data-a="start-go" data-v="title">✕ Salir</button></div>`;
 if(scr==='saves')return `<div class="wrap sflow"><div class="shead">${stadiumSVG()}<div class="shin">${logoSVG()}<h1>Mis partidas</h1></div></div><div class="snav"><button class="btn sm" data-a="start-go" data-v="title">← Portada</button></div>${saved||'<div class="empty">No tienes partidas guardadas.</div>'}${openF}</div>`;
 return `<div class="wrap sflow snew"><div class="sbg">${stadiumSVG()}</div>${bar}
 <h2 class="sq">${step==='c'?'¿En qué país quieres entrenar?':step==='d'?'¿En qué división empiezas?':'Elige tu club'}</h2>
${step==='c'?pickC:step==='d'?pickD:`<div class="sopts"><div><span class="eyebrow">Dificultad</span><div class="seg">${Object.entries(DIFF).map(([k,v])=>`<button data-a="start-diff" data-v="${k}" aria-pressed="${(RT.diff||'normal')===k}" title="${esc(v.d)}">${v.n}</button>`).join('')}</div></div><div><span class="eyebrow">Modo</span><div class="seg">${Object.entries(MODES).map(([k,v])=>`<button data-a="start-mode" data-v="${k}" aria-pressed="${(RT.mode||'profundo')===k}" title="${esc(v.d)}">${v.n}</button>`).join('')}</div></div></div>
 <p class="small muted" style="margin:0 0 10px">${DIFF[RT.diff||'normal'].d} ${MODES[RT.mode||'profundo'].d}</p>
 <div class="teams">${cards}</div>`}
 <details style="margin-top:22px"><summary class="small">Semilla del mundo: <b>${S?S.seed:''}</b></summary>
 <p class="small muted" style="margin:8px 0">Cada mundo sale de una semilla. Con la misma semilla se generan los mismos clubes y jugadores, y si tomas las mismas decisiones, pasan las mismas cosas. Puedes compartirla o repetir un mundo que te gustó.</p>
 <div class="row"><label class="f"><span class="eyebrow">Semilla</span><input type="number" id="seedIn" min="0" value="${S?S.seed:''}"></label><button class="btn" data-a="seed-go" style="align-self:flex-end">Crear este mundo</button><button class="btn" data-a="seed-new" style="align-self:flex-end">Otro mundo al azar</button></div></details>
 <details style="margin-top:12px" ${RT.mod?'open':''}><summary class="small">Empezar con un mod${RT.mod?' · <b>mod cargado</b>':''}</summary>
 <p class="small muted" style="margin:8px 0">Carga un mod (JSON) o un CSV de clubes exportado desde el Editor de otra partida: el mundo nuevo saldrá con sus nombres, colores y jugadores.</p>
 <label class="f"><span class="eyebrow">Archivo del mod</span><input type="file" id="modFile" accept=".json,.csv,.txt"></label>
 ${RT.modMsg?`<div class="negmsg ${RT.modMsg.ok?'ok':'no'}">${esc(RT.modMsg.msg)}</div>`:''}${RT.mod?'<button class="btn sm" data-a="mod-clear" style="margin-top:8px">Quitar el mod</button>':''}</details></div>`;
}
export function jobsView(){
 const J=S.jobless;
 return `<div class="wrap"><section class="hero"><div class="eyebrow">${J.reason==='despido'?'Te han despedido':J.reason==='dimisión'?'Has dimitido':'Se acabó tu contrato'} · Reputación ${Math.round(S.mgr.rep)}/100 · Ahorros ${money(S.mgr.savings)}</div><h1>Sin club</h1>
 <p>Estos clubes quieren contratarte. Elige tu próximo reto.</p></section>
 <div class="teams">${J.offers.map((o,i)=>{const t=T(o.team);return `<button class="tcard" data-a="jobless-take" data-i="${i}">${crest(t,'lg')}<div><div class="tn">${esc(t.name)}</div><div class="muted small">${esc(lgName(t.lg))}</div></div>
 <dl><div><dt>Salario</dt><dd>${money(o.sal)}/s</dd></div><div><dt>Contrato</dt><dd>${o.yrs} años</dd></div><div><dt>Presupuesto</dt><dd>${money(startBudget(t))}</dd></div></dl></button>`;}).join('')}</div>
 <div class="row" style="margin-top:18px"><button class="btn" data-a="jobless-more">Buscar más ofertas</button><button class="btn danger" data-a="new-game">Empezar partida nueva</button></div></div>`;
}
