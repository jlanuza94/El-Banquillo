/* El Banquillo · views/start.js — Pantallas de inicio de partida y de entrenador sin club. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {DIFF} from '../difficulty';
import {slots,MAX_SLOTS} from '../persist';
import {esc,money,pick} from '../core';
import {COUNTRIES,LV_NAMES,LV_SH} from '../data';
import {RT,S,T,crest,findLg,lgName,lgTeams,lowest,rt} from '../state';
import {strength} from '../players';
import {startBudget} from '../world';
import {start} from '../boot';
export function startView(){
 const C=COUNTRIES[RT.startC];RT.startLv=Math.min(RT.startLv,C.lv-1);
 const L=findLg(RT.startC,RT.startLv),teams=lgTeams(L.id).sort((a,b)=>b.rep-a.rep);
 const cards=teams.map((t,r)=>{const lowestL=lowest(L);
  const obj=L.lv===0?(r<3?'Pelear el título':r<7?'Parte alta':r<13?'Mitad de tabla':'Evitar el descenso'):(r<3?'Ascender':r<8?'Pelear el ascenso':!lowestL&&r>=14?'Evitar el descenso':'Mitad de tabla');
  return `<button class="tcard" data-a="pick-team" data-i="${t.id}">${crest(t,'lg')}<div><div class="tn">${esc(t.name)}</div><div class="muted small">Objetivo: ${obj}</div></div>
  <dl><div><dt>Nivel</dt><dd>${(strength(t.id)/10).toFixed(1)}</dd></div><div><dt>Presupuesto</dt><dd>${money(startBudget(t))}</dd></div><div><dt>Liga</dt><dd>${LV_SH[L.lv]} ${C.code}</dd></div></dl></button>`;}).join('');
 const saved=slots.length?`<section class="panel" style="margin-bottom:22px"><div class="panel-h"><h2>Tus partidas</h2><span class="eyebrow">${slots.length} de ${MAX_SLOTS}</span></div>
 ${slots.slice().sort((a,b)=>b.updated-a.updated).map(x=>`<div class="offer">${crest({c1:x.c1,c2:x.c2,short:x.short},'')}<span class="t"><b>${esc(x.club)}</b><br><span class="small muted">${esc(x.lg)} · ${esc(x.season)} · jornada ${x.week+1} · ${new Date(x.updated).toLocaleDateString('es')}</span></span>${RT.delConfirm===x.id?`<button class="btn sm danger" data-a="slot-del-ok" data-id="${x.id}">Sí, borrar</button><button class="btn sm" data-a="slot-del-no">No</button>`:`<button class="btn sm" data-a="slot-del" data-id="${x.id}">Borrar</button><button class="btn sm primary" data-a="slot-load" data-id="${x.id}">Continuar</button>`}</div>`).join('')}
 ${slots.length>=MAX_SLOTS?'<p class="small muted" style="margin:8px 0 0">Tienes el máximo de partidas. Borra una para empezar otra.</p>':''}</section>`:'';
 return `<div class="wrap"><section class="hero"><div class="eyebrow">10 países · 43 ligas de 20 equipos · 860 clubes · 3 ascensos y 3 descensos</div><h1>El Banquillo</h1>
 <p>Elige país y división. Coge un club modesto de la última categoría y súbelo hasta Primera, o ve directo a pelear el título. Monta tu formación, rebusca gangas en el mercado de todo el mundo y negocia cada fichaje.</p></section>
 ${saved}<h2 style="margin:0 0 12px">${slots.length?'Nueva partida':'Empieza tu carrera'}</h2>
 <div class="eyebrow" style="margin-bottom:8px">1 · País</div>
 <div class="chips" style="margin-bottom:16px">${COUNTRIES.map((c,i)=>`<button class="btn sm ${RT.startC===i?'dark':''}" data-a="start-c" data-v="${i}">${c.n} <span style="opacity:.6">· ${c.lv} div.</span></button>`).join('')}</div>
 <div class="eyebrow" style="margin-bottom:8px">2 · División</div>
 <div class="startdiv seg" style="max-width:100%;overflow-x:auto">${Array.from({length:C.lv},(_,i)=>`<button data-a="start-lv" data-v="${i}" aria-pressed="${RT.startLv===i}">${LV_NAMES[i]}</button>`).join('')}</div>
 <p class="small muted" style="margin:0 0 12px">${lowest(L)?'Última categoría de '+C.n+': aquí no hay descenso y los tres primeros suben. Ideal para empezar desde abajo.':L.lv===0?'Máxima categoría de '+C.n+'. Los tres últimos bajan.':'Los tres primeros suben y los tres últimos bajan.'}</p>
 <div class="eyebrow" style="margin-bottom:8px">3 · Dificultad</div>
 <div class="seg" style="margin-bottom:6px">${Object.entries(DIFF).map(([k,v])=>`<button data-a="start-diff" data-v="${k}" aria-pressed="${(RT.diff||'normal')===k}">${v.n}</button>`).join('')}</div>
 <p class="small muted" style="margin:0 0 16px">${DIFF[RT.diff||'normal'].d}</p>
 <div class="eyebrow" style="margin-bottom:8px">4 · Club</div>
 <div class="teams">${cards}</div>
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
