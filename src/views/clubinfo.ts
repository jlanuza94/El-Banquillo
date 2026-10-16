/* El Banquillo · views/clubinfo.ts — Ficha de cualquier club: entrenador, jugadores, palmarés e historia. */
// @ts-nocheck — usa el estado heredado S.
import {aiYouth,hasCantera} from '../youthclubs';
import {clubRecordsHTML} from './worldhist';
import {h2hDots,h2hTxt,rivalsOf} from '../rivals';
import {clubEco} from './economy';
import {nf} from './common';
import {esc} from '../core';
import {COUNTRIES,posChip} from '../data';
import {LG,S,T,crest,lgName,squad} from '../state';
import {posOf} from '../tactics';
import {STYLES} from '../living';
import {nameBtn,pBadgeS} from './common';

export const clubLink=(t,cls='')=>`<button class="linkname ${cls}" data-a="club-open" data-id="${t.id}">${esc(t.name)}</button>`;
export function clubModal(tid){
 const t=T(tid),c=S.coaches&&S.coaches[tid],H=(S.chist&&S.chist[tid])||{t:[],s:[]},me=tid===S.user;
 const top=squad(tid).sort((a,b)=>b.ovr-a.ovr).slice(0,6);
 const titles={};H.t.forEach(([s,n])=>{(titles[n]=titles[n]||[]).push(s);});
 return `<div class="row" style="gap:14px;align-items:center">${crest(t,'lg')}<div><div class="eyebrow">${nf(LG(t.lg).c)} ${esc(COUNTRIES[LG(t.lg).c].n)} · ${esc(lgName(t.lg))}</div><h2 style="margin:4px 0 0">${esc(t.name)}</h2><div class="small muted">${S.week?posOf(tid)+'º en liga · ':''}${squad(tid).length} jugadores</div></div></div>
 <div class="kv"><span>Entrenador</span><b>${me?'Tú':c?`${esc(c.name)}${c.ex?' (ex jugador)':''} · ${STYLES[c.st].n}`:'—'}</b>${c&&!me?`<span>Esta temporada</span><b>${c.w}G ${c.d}E ${c.l}P</b><span>En el club desde</span><b>${2025+c.since}</b><span>Reputación</span><b>${Math.round(c.rep)}/100</b>`:''}<span>Formación</span><b>${t.formation}</b>${rivalsOf(tid).length?`<span>Rivales</span><b>${rivalsOf(tid).map(([r,k])=>`${esc(T(r).name)} (${k==='c'?'clásico':'derbi'})`).join(', ')}</b>`:''}${!me?`<span>Tu historial contra ellos</span><b>${h2hTxt(tid)} ${h2hDots(tid)}</b>`:''}</div>
 ${clubEco(t)}
 <h3 style="margin:14px 0 4px">Mejores jugadores</h3>${top.map(p=>`<div class="offer">${posChip(p)}<span class="t">${nameBtn(p)} <span class="small muted">· ${p.age} años</span></span>${pBadgeS(p)}</div>`).join('')}
 ${youthClubHTML(tid)}
 ${clubRecordsHTML(tid)}
 <h3 style="margin:14px 0 4px">Palmarés</h3>${Object.keys(titles).length?`<div class="kv" style="margin-top:0">${Object.entries(titles).map(([n,ss])=>`<span>${esc(n)}</span><b>${ss.length} · ${ss.slice(-3).join(', ')}</b>`).join('')}</div>`:'<p class="small muted">Sin títulos todavía.</p>'}
 <h3 style="margin:14px 0 4px">Historia</h3>${H.s.length?`<div class="tbl"><table><thead><tr><th>Temporada</th><th>Liga</th><th class="r">Puesto</th></tr></thead><tbody>${H.s.slice().reverse().map(([s,l,p])=>`<tr><td class="num">${s}</td><td>${esc(lgName(l))}</td><td class="n">${p}º</td></tr>`).join('')}</tbody></table></div>`:'<p class="small muted">La historia se escribe al terminar cada temporada.</p>'}
 <div class="acts"><button class="btn primary" data-a="modal-close">Cerrar</button></div>`;
}

/** Cantera y sub-19 de un club: la tuya de verdad; las de la IA, generadas al vuelo. */
export function youthClubHTML(tid){
 const me=tid===S.user,can=hasCantera(tid),y=me?{u19:S.u19||[],cant:S.academy||[]}:aiYouth(tid);
 const st=p=>{const n=Math.max(1,Math.min(5,Math.round((p.pot-3.5)/1.2)));return `<span class="ystar" aria-label="Potencial ${n} de 5">${'★'.repeat(n)}${'☆'.repeat(5-n)}</span>`;};
 const tbl=(a,ttl,sub)=>`<details class="yclub"${me?'':''}><summary><b>${ttl}</b> <span class="small muted">${a.length} jugadores · ${sub}</span></summary>${a.length?`<div class="tbl"><table><thead><tr><th>Pos</th><th>Nombre</th><th class="r">Edad</th><th class="r">Potencial</th></tr></thead><tbody>${a.slice().sort((x,z)=>z.pot-x.pot).slice(0,30).map(p=>`<tr><td>${posChip(p)}</td><td>${nf(p.nat)} ${esc(p.name)}</td><td class="n">${p.age}</td><td class="r">${st(p)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small muted">Vacía.</p>'}</details>`;
 return `<h3 style="margin:14px 0 4px">Cantera y sub-19</h3><p class="small muted" style="margin:0 0 6px">${can?'Club de Primera, Segunda o Tercera: tiene cantera (15-17 años) y sub-19 (17-19).':'Club de Cuarta o Quinta: solo tiene sub-19. Si asciende a Tercera recupera la cantera.'}</p>
 ${tbl(y.u19,'Sub-19','17-19 años')}${can?tbl(y.cant,'Cantera','15-17 años'):'<div class="small muted ycl-no">🔒 Sin cantera en esta categoría</div>'}`;
}
