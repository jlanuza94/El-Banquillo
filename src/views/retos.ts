/* El Banquillo · views/retos.ts — Panel de retos con medallas. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {S} from '../state';
import {MAX_ACT,MEDAL,RETOS,medals,progress} from '../retos';

const medal=m=>`<span class="medal" style="--mc:${MEDAL[m][1]}" title="Medalla de ${MEDAL[m][0].toLowerCase()}">${MEDAL[m][0][0]}</span>`;
export function retosPanel(){
 const X=S.retos||{act:[],st:{},done:{}},md=medals();
 const act=X.act.map(id=>{const r=RETOS[id],p=progress(id),pct=Math.round(p/r.goal*100);return `<div class="offer">${medal(r.m)}<span class="t"><b>${esc(r.n)}</b><br><span class="small muted">${esc(r.d)}</span><span class="abar" style="display:block;margin-top:6px"><i style="width:${pct}%;background:var(--accent)"></i></span><span class="small muted">${id==='cohete'?`${p} de ${r.goal} divisiones`:id==='hucha'?`${p} de ${r.goal} M`:`${p} de ${r.goal}`}</span></span><button class="btn sm" data-a="reto-drop" data-v="${id}">Abandonar</button></div>`;}).join('');
 const avail=Object.entries(RETOS).filter(([id])=>!X.act.includes(id)&&!X.done[id]).map(([id,r])=>`<div class="offer">${medal(r.m)}<span class="t"><b>${esc(r.n)}</b><br><span class="small muted">${esc(r.d)}</span></span><button class="btn sm ${X.act.length>=MAX_ACT?'':'primary'}" data-a="reto-start" data-v="${id}" ${X.act.length>=MAX_ACT?'disabled':''}>Aceptar</button></div>`).join('');
 const done=Object.entries(X.done).map(([id,s])=>`<div class="offer">${medal(RETOS[id].m)}<span class="t"><b>${esc(RETOS[id].n)}</b><br><span class="small muted">Conseguido en ${esc(s)}</span></span></div>`).join('');
 return `<section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Retos</h2><span class="eyebrow">${medal('o')} ${md.o} · ${medal('p')} ${md.p} · ${medal('b')} ${md.b}</span></div>
 <p class="small muted" style="margin:0 0 10px">Acepta hasta ${MAX_ACT} retos a la vez. Al conseguirlos ganas una medalla y reputación. Puedes abandonarlos cuando quieras.</p>
 ${act?`<h3 style="margin:0 0 6px">En marcha (${X.act.length}/${MAX_ACT})</h3>${act}`:''}
 ${done?`<h3 style="margin:14px 0 6px">Medallas</h3>${done}`:''}
 ${avail?`<h3 style="margin:14px 0 6px">Disponibles</h3>${avail}`:''}</section>`;
}
