/* El Banquillo · views/search.ts — Búsqueda global: jugadores, clubes y ligas a dos toques. */
// @ts-nocheck — usa el estado heredado S.
import {esc,money} from '../core';
import {posChip} from '../data';
import {S,T,crest,lgName} from '../state';
import {search} from '../quick';
import {askPrice} from '../market';
import {pBadgeS} from './common';

export function searchResults(q){
 const r=search(q);
 if(String(q||'').trim().length<2)return '<p class="small muted" style="margin:8px 0">Escribe al menos dos letras: jugadores, clubes o países.</p>';
 if(!r.pl.length&&!r.cl.length&&!r.lg.length)return '<div class="empty">Nada con ese nombre.</div>';
 return `${r.cl.length?`<div class="eyebrow" style="margin:10px 0 4px">Clubes</div>${r.cl.map(t=>`<button class="mrow" data-a="club-open" data-id="${t.id}" style="grid-template-columns:auto minmax(0,1fr)">${crest(t,'sm')}<span class="msubj">${esc(t.name)} <span class="small muted">· ${esc(lgName(t.lg))}</span></span></button>`).join('')}`:''}
 ${r.pl.length?`<div class="eyebrow" style="margin:10px 0 4px">Jugadores</div>${r.pl.map(p=>`<div class="offer" style="padding:6px 0">${posChip(p)}<span class="t"><button class="linkname" data-a="ficha" data-id="${p.id}">${esc(p.name)}</button> <span class="small muted">· ${p.team===null?'Libre':esc(T(p.team).short)} · ${p.age} años${p.team!==S.user?' · '+money(askPrice(p)):''}</span></span>${pBadgeS(p)}${p.team!==S.user?`<button class="btn sm" data-a="neg" data-id="${p.id}">Ofertar</button>`:''}</div>`).join('')}`:''}
 ${r.lg.length?`<div class="eyebrow" style="margin:10px 0 4px">Ligas</div>${r.lg.map(L=>`<button class="mrow" data-a="gs-lg" data-id="${L.id}" style="grid-template-columns:minmax(0,1fr)"><span class="msubj">${esc(lgName(L.id))}</span></button>`).join('')}`:''}`;
}
export function searchModal(){
 return `<h2>Buscar</h2><input type="search" id="gsq" placeholder="Jugador, club o país" autocomplete="off" style="width:100%;margin-top:8px;font-size:16px">
 <div id="gsres">${searchResults('')}</div><div class="acts"><button class="btn" data-a="modal-close">Cerrar</button></div>`;
}
