/* El Banquillo · views/title.ts — Portada: un estadio de noche con los focos encendidos, el escudo del juego
 * y los botones para continuar, empezar una partida nueva o cargar una guardada. */
// @ts-nocheck — usa el estado heredado S.
import {esc} from '../core';
import {crest} from '../state';
import {slots} from '../persist';

/** Estadio de noche en SVG (sin imágenes): cielo, gradas con público, focos y el césped en perspectiva. */
export function stadiumSVG(){
 let seed=7;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const crowd=[];for(let i=0;i<420;i++){const x=r()*1600,band=r(),y=band<.5?380+r()*120:300+r()*70;const c=r()<.08?'#f4cf5c':r()<.5?'#e8eef0':'#9fb4c4';crowd.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1+r()*1.6).toFixed(1)}" fill="${c}" opacity="${(.25+r()*.5).toFixed(2)}"/>`);}
 const stripes=[];for(let i=0;i<10;i++){const t0=i/10,t1=(i+1)/10,y0=560+340*t0*t0,y1=560+340*t1*t1,l=(t)=>350-350*t,rr=(t)=>1250+350*t;if(i%2)stripes.push(`<polygon points="${l(t0)},${y0} ${rr(t0)},${y0} ${rr(t1)},${y1} ${l(t1)},${y1}" fill="#ffffff" opacity=".045"/>`);}
 const tower=(x,s)=>`<g transform="translate(${x} 0)"><rect x="-4" y="120" width="8" height="${s}" fill="#0b1712"/><rect x="-52" y="92" width="104" height="34" rx="4" fill="#1b2a24"/>${[0,1,2,3,4,5].map(k=>`<circle cx="${-40+k*16}" cy="102" r="5" fill="#fffbe6"/><circle cx="${-40+k*16}" cy="116" r="5" fill="#fffbe6"/>`).join('')}<ellipse cx="0" cy="110" rx="150" ry="70" fill="url(#glow)"/></g>`;
 return `<svg class="stadium" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
 <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040b08"/><stop offset=".55" stop-color="#0b2416"/><stop offset="1" stop-color="#123a24"/></linearGradient>
 <radialGradient id="glow"><stop offset="0" stop-color="#fff6cf" stop-opacity=".95"/><stop offset=".35" stop-color="#fff2b8" stop-opacity=".35"/><stop offset="1" stop-color="#fff2b8" stop-opacity="0"/></radialGradient>
 <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c8a4a"/><stop offset="1" stop-color="#14552b"/></linearGradient>
 <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6cf" stop-opacity=".22"/><stop offset="1" stop-color="#fff6cf" stop-opacity="0"/></linearGradient>
 <radialGradient id="vig" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient></defs>
 <rect width="1600" height="900" fill="url(#sky)"/>
 <g class="beams"><polygon points="250,110 120,560 520,560" fill="url(#beam)"/><polygon points="1350,110 1080,560 1480,560" fill="url(#beam)"/></g>
 <path d="M0 290 Q800 230 1600 290 L1600 560 L0 560 Z" fill="#0a1a12"/><path d="M0 370 Q800 330 1600 370 L1600 560 L0 560 Z" fill="#0e2418"/>
 <g>${crowd.join('')}</g>
 <rect x="0" y="512" width="1600" height="48" fill="#0b1d14"/>${[0,1,2,3,4,5,6,7].map(k=>`<rect x="${40+k*195}" y="520" width="150" height="30" rx="3" fill="${k%2?'#c9a227':'#1f6b3d'}" opacity=".55"/>`).join('')}
 ${tower(250,180)}${tower(1350,180)}
 <polygon points="0,900 1600,900 1250,560 350,560" fill="url(#grass)"/>${stripes.join('')}
 <g fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="3"><polygon points="70,880 1530,880 1215,575 385,575"/><line x1="800" y1="575" x2="800" y2="880"/><ellipse cx="800" cy="700" rx="150" ry="48"/><polyline points="555,575 520,640 1080,640 1045,575"/></g>
 <circle cx="800" cy="700" r="5" fill="#fff" opacity=".8"/>
 <rect width="1600" height="900" fill="url(#vig)"/></svg>`;
}
/** Escudo del juego. */
export const logoSVG=()=>`<svg class="ebcrest" viewBox="0 0 120 140" aria-hidden="true"><defs><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset=".5" stop-color="#e3b23c"/><stop offset="1" stop-color="#a87814"/></linearGradient></defs>
 <path d="M60 4 L112 20 V66 C112 102 88 124 60 136 C32 124 8 102 8 66 V20 Z" fill="#0d2b1b" stroke="url(#gold)" stroke-width="6"/>
 <path d="M60 18 L98 30 V66 C98 92 81 109 60 119 C39 109 22 92 22 66 V30 Z" fill="#14432a"/>
 <text x="60" y="80" text-anchor="middle" font-family="Big Shoulders Display, Arial Black, sans-serif" font-weight="900" font-size="44" fill="url(#gold)">EB</text>
 <path d="M30 96 H90" stroke="url(#gold)" stroke-width="3"/></svg>`;
/** Portada. */
export function titleHTML(stats){
 const last=slots.slice().sort((a,b)=>b.updated-a.updated)[0];
 return `<div class="title">${stadiumSVG()}<div class="tinner">
 <div class="tbrand">${logoSVG()}<div><h1 class="tname">El Banquillo</h1><p class="tag">Tu club. Tu táctica. Tu leyenda.</p><p class="tstats">${esc(stats)}</p></div></div>
 <div class="tmenu">
  ${last?`<button class="tbtn main" data-a="slot-load" data-id="${last.id}">${crest({c1:last.c1,c2:last.c2,short:last.short},'')}<span><b>Continuar</b><small>${esc(last.club)} · ${esc(last.season)} · jornada ${last.week+1}</small></span></button>`:''}
  <button class="tbtn ${last?'':'main'}" data-a="start-go" data-v="new"><span class="ti">＋</span><span><b>Nueva partida</b><small>Elige país, división y club</small></span></button>
  ${slots.length?`<button class="tbtn" data-a="start-go" data-v="saves"><span class="ti">☰</span><span><b>Mis partidas</b><small>${slots.length} guardada${slots.length>1?'s':''}</small></span></button>`:''}
  <label class="tbtn"><span class="ti">⇪</span><span><b>Abrir desde archivo</b><small>Desde otro móvil u ordenador</small></span><input type="file" id="saveFile" accept=".ebsave,.txt,text/plain" hidden></label>
 </div></div></div>`;
}
