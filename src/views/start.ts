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
 const pickC=`<div class="eyebrow" style="margin-bottom:8px">1 · Elige país</div>
 <div class="cgrid">${COUNTRIES.map((c,i)=>`<button class="ccard" data-a="start-c" data-v="${i}">${flag(c.code)}<span class="cn">${esc(c.n)}</span><span class="small muted">${c.lv} divisiones · ${nT(c)} clubes</span></button>`).join('')}</div>`;
 const pickD=`<div class="row" style="margin-bottom:10px"><button class="btn sm" data-a="start-step" data-v="c">← Países</button><span class="cpick">${flag(C.code,'sm')}<b>${esc(C.n)}</b></span></div>
 <div class="eyebrow" style="margin-bottom:8px">2 · Elige división</div>
 <div class="dlist">${Array.from({length:C.lv},(_,i)=>{const Li=findLg(RT.startC,i),ts=lgTeams(Li.id).map(t=>strength(t.id)/10),lo=Math.min(...ts),hi=Math.max(...ts);
  return `<button class="dcard" data-a="start-lv" data-v="${i}"><span class="dn">${LV_SH[i]}</span><span class="dt"><b>${esc((S.lgNames||{})[Li.id]||LV_NAMES[i])}</b><span class="small muted">${i===0?'La élite: pelea por el título. Bajan los tres últimos.':i===C.lv-1?'Última categoría: sin descenso, suben los tres primeros.':'Suben los tres primeros y bajan los tres últimos.'}</span></span><span class="dl"><span class="eyebrow">Nivel</span><b>${lo.toFixed(1)}–${hi.toFixed(1)}</b></span>${i===C.lv-1?'<span class="dtag">Para empezar desde abajo</span>':i===0?'<span class="dtag top">Máximo reto</span>':''}</button>`;}).join('')}</div>`;
 const chosen=`<div class="row cchosen" style="margin-bottom:14px">${flag(C.code)}<div style="min-width:0;flex:1"><b>${esc(C.n)}</b><div class="small muted">${esc((S.lgNames||{})[L.id]||LV_NAMES[L.lv])}</div></div><button class="btn sm" data-a="start-step" data-v="d">Cambiar división</button><button class="btn sm" data-a="start-step" data-v="c">Cambiar país</button></div>`;
 const bar=`<div class="snav"><button class="btn sm" data-a="start-go" data-v="title">← Portada</button><div class="ssteps">${[['c','País'],['d','División'],['club','Club']].map(([k,l],i)=>`<span class="sst${step===k?' on':''}">${i+1} · ${l}</span>`).join('')}</div></div>`;
 if(scr==='saves')return `<div class="wrap sflow"><div class="shead">${stadiumSVG()}<div class="shin">${logoSVG()}<h1>Mis partidas</h1></div></div><div class="snav"><button class="btn sm" data-a="start-go" data-v="title">← Portada</button></div>${saved||'<div class="empty">No tienes partidas guardadas.</div>'}${openF}</div>`;
 return `<div class="wrap sflow"><div class="shead">${stadiumSVG()}<div class="shin">${logoSVG()}<h1>Nueva partida</h1></div></div>${bar}<section class="hero" style="display:none">${themeBtn('onhero')}<div class="eyebrow">${nC()} países · ${S.leagues.length} ligas de 20 equipos · ${S.teams.length} clubes · 3 ascensos y 3 descensos</div><h1>El Banquillo</h1>
 <p>Elige país y división. Coge un club modesto de la última categoría y súbelo hasta Primera, o ve directo a pelear el título. Monta tu formación, rebusca gangas en el mercado de todo el mundo y negocia cada fichaje.</p></section>
 <h2 id="nuevo" style="margin:0 0 12px;scroll-margin-top:12px">${slots.length?'Nueva partida':'Empieza tu carrera'}</h2>
${step==='c'?pickC:step==='d'?pickD:chosen+`
 <div class="eyebrow" style="margin-bottom:8px">3 · Dificultad</div>
 <div class="seg" style="margin-bottom:6px">${Object.entries(DIFF).map(([k,v])=>`<button data-a="start-diff" data-v="${k}" aria-pressed="${(RT.diff||'normal')===k}">${v.n}</button>`).join('')}</div>
 <p class="small muted" style="margin:0 0 16px">${DIFF[RT.diff||'normal'].d}</p>
 <div class="eyebrow" style="margin-bottom:8px">4 · Modo de juego</div>
 <div class="seg" style="margin-bottom:6px">${Object.entries(MODES).map(([k,v])=>`<button data-a="start-mode" data-v="${k}" aria-pressed="${(RT.mode||'profundo')===k}">${v.n}</button>`).join('')}</div>
 <p class="small muted" style="margin:0 0 16px">${MODES[RT.mode||'profundo'].d} Se puede cambiar cuando quieras.</p>
 <div class="eyebrow" style="margin-bottom:8px">5 · Club</div>
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
