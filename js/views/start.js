/* El Banquillo · views/start.js — Pantallas de inicio de partida y de entrenador sin club. */
"use strict";
function startView(){
 const C=COUNTRIES[startC];startLv=Math.min(startLv,C.lv-1);
 const L=findLg(startC,startLv),teams=lgTeams(L.id).sort((a,b)=>b.rep-a.rep);
 const cards=teams.map((t,r)=>{const lowestL=lowest(L);
  const obj=L.lv===0?(r<3?'Pelear el título':r<7?'Parte alta':r<13?'Mitad de tabla':'Evitar el descenso'):(r<3?'Ascender':r<8?'Pelear el ascenso':!lowestL&&r>=14?'Evitar el descenso':'Mitad de tabla');
  return `<button class="tcard" data-a="pick-team" data-i="${t.id}">${crest(t,'lg')}<div><div class="tn">${esc(t.name)}</div><div class="muted small">Objetivo: ${obj}</div></div>
  <dl><div><dt>Nivel</dt><dd>${(strength(t.id)/10).toFixed(1)}</dd></div><div><dt>Presupuesto</dt><dd>${money(startBudget(t))}</dd></div><div><dt>Liga</dt><dd>${LV_SH[L.lv]} ${C.code}</dd></div></dl></button>`;}).join('');
 return `<div class="wrap"><section class="hero"><div class="eyebrow">10 países · 43 ligas de 20 equipos · 860 clubes · 3 ascensos y 3 descensos</div><h1>El Banquillo</h1>
 <p>Elige país y división. Coge un club modesto de la última categoría y súbelo hasta Primera, o ve directo a pelear el título. Monta tu formación, rebusca gangas en el mercado de todo el mundo y negocia cada fichaje.</p></section>
 <div class="eyebrow" style="margin-bottom:8px">1 · País</div>
 <div class="chips" style="margin-bottom:16px">${COUNTRIES.map((c,i)=>`<button class="btn sm ${startC===i?'dark':''}" data-a="start-c" data-v="${i}">${c.n} <span style="opacity:.6">· ${c.lv} div.</span></button>`).join('')}</div>
 <div class="eyebrow" style="margin-bottom:8px">2 · División</div>
 <div class="startdiv seg" style="max-width:100%;overflow-x:auto">${Array.from({length:C.lv},(_,i)=>`<button data-a="start-lv" data-v="${i}" aria-pressed="${startLv===i}">${LV_NAMES[i]}</button>`).join('')}</div>
 <p class="small muted" style="margin:0 0 12px">${lowest(L)?'Última categoría de '+C.n+': aquí no hay descenso y los tres primeros suben. Ideal para empezar desde abajo.':L.lv===0?'Máxima categoría de '+C.n+'. Los tres últimos bajan.':'Los tres primeros suben y los tres últimos bajan.'}</p>
 <div class="eyebrow" style="margin-bottom:8px">3 · Club</div>
 <div class="teams">${cards}</div></div>`;
}
function jobsView(){
 const J=S.jobless;
 return `<div class="wrap"><section class="hero"><div class="eyebrow">${J.reason==='despido'?'Te han despedido':J.reason==='dimisión'?'Has dimitido':'Se acabó tu contrato'} · Reputación ${Math.round(S.mgr.rep)}/100 · Ahorros ${money(S.mgr.savings)}</div><h1>Sin club</h1>
 <p>Estos clubes quieren contratarte. Elige tu próximo reto.</p></section>
 <div class="teams">${J.offers.map((o,i)=>{const t=T(o.team);return `<button class="tcard" data-a="jobless-take" data-i="${i}">${crest(t,'lg')}<div><div class="tn">${esc(t.name)}</div><div class="muted small">${esc(lgName(t.lg))}</div></div>
 <dl><div><dt>Salario</dt><dd>${money(o.sal)}/s</dd></div><div><dt>Contrato</dt><dd>${o.yrs} años</dd></div><div><dt>Presupuesto</dt><dd>${money(startBudget(t))}</dd></div></dl></button>`;}).join('')}</div>
 <div class="row" style="margin-top:18px"><button class="btn" data-a="jobless-more">Buscar más ofertas</button><button class="btn danger" data-a="new-game">Empezar partida nueva</button></div></div>`;
}
