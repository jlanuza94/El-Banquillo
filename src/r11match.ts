/* El Banquillo · r11match.ts — VAR, altitud, entradas duras a un jugador concreto y tu orden en la tanda de penaltis. */
// @ts-nocheck — usa el estado heredado S.
import {rnd} from './core';
import {COUNTRIES} from './data';
import {LG,PL,S,T} from './state';

function h01(s){let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return ((x>>>0)%10000)/10000;}
const cOf=id=>{const t=T(id);return t?COUNTRIES[LG(t.lg).c]:null;};

/* ---------- VAR: solo en las dos primeras categorías y en competiciones grandes ---------- */
export function hasVar(m){if(!m||!m.us)return false;return hasVarFor(m.ref);}
export function hasVarFor(ref){const k=ref.k;if(k==='ct'||k==='cwc'||k==='nt')return true;if(k==='fr')return false;const t=T(S.user);return !!t&&LG(t.lg).lv<=1;}
const VAR_TX=['Fuera de juego milimétrico de {p} en el inicio de la jugada.','Mano previa de {p} antes de marcar.','Falta en ataque de {p} sobre el defensa.'];
/** Revisa un gol: devuelve el texto de la anulación o null si sube al marcador. */
export function varReview(m,id){if(!hasVar(m)||rnd()>=.06)return null;const p=PL(id);return `📺 VAR: el árbitro va al monitor… ¡Gol anulado! ${VAR_TX[Math.floor(rnd()*VAR_TX.length)].replace('{p}',p?p.name:'el delantero')}`;}

/* ---------- Altitud: estadios por encima de 2.000 m ---------- */
const ALT={BOL:[.8,2800,3650],ECU:[.45,2500,2850],COL:[.3,2550,2640],PER:[.2,2300,3400],MEX:[.3,2100,2400]};
/** Metros del estadio de un club (0 si está a nivel del mar o casi). */
const AC=new Map();
export function altOf(id){if(AC.has(id))return AC.get(id);const v=altCalc(id);AC.set(id,v);return v;}
function altCalc(id){const c=cOf(id);if(!c||!ALT[c.code])return 0;const [p,lo,hi]=ALT[c.code],r=h01('alt'+id);if(r>=p)return 0;return Math.round((lo+(hi-lo)*h01('am'+id))/50)*50;}
const NOALT={own:1,drain:1};
/** El visitante que no vive en altura se ahoga: rinde menos y se cansa antes. */
export function altMods(m,s){if(s!=='a')return NOALT;const alt=m&&m.neutral?0:altOf(m.h);if(alt<2400||altOf(m.a)>=2000)return NOALT;const k=Math.min(1,(alt-2400)/1250);return {own:1-.035-.03*k,drain:1.1+.1*k};}

/* ---------- Entradas duras a un jugador concreto del rival ---------- */
/** Al crear el partido: si tu objetivo juega, queda marcado. */
export function setTarget(m){if(!m.us)return;const t=T(m[m.us]),o=m.us==='h'?'a':'h';if(t.oiT&&m.lu[o].includes(t.oiT))m.tgt={s:o,id:t.oiT};}
/** Peso de gol/asistencia del jugador al que se le pega. */
export const tgtMult=(m,s,id)=>m.tgt&&m.tgt.s===s&&m.tgt.id===id?.62:1;
/** Más faltas y tarjetas para el equipo que reparte. */
export const tgtCards=(m,s)=>m.tgt&&m.tgt.s!==s?1.25:1;

/* ---------- Tu orden de penaltis ---------- */
/** Lista de lanzadores elegida en Balón parado (los que estén en el campo, en ese orden). */
export function myPenOrder(onPitch){const t=T(S.user),o=(t.po||[]).filter(Boolean),ids=onPitch.map(p=>p.id);const first=o.filter(id=>ids.includes(id)).map(PL);return [...first,...onPitch.filter(p=>!first.includes(p)).sort((a,b)=>b.at.tir-a.at.tir)];}

/* ---------- Instrucciones individuales sin balón (presión, marcaje y entradas de cada jugador) ---------- */
export const DPI={pr:{n:'Presión',o:{'-':'Menos','n':'Normal','+':'Más'}},en:{n:'Entradas',o:{p:'Prudentes',n:'Normales',d:'Duras'}}};
/** Al crear el partido: las órdenes de tus once (y a quién marca cada uno, si su par juega). */
export function dpiSetup(m){if(!m.us)return;const t=T(m[m.us]),D=t.dpi||{},o=m.us==='h'?'a':'h',lu=m.lu[m.us].filter(Boolean);let pp=0,pm=0,ed=0,ep=0;const mk=[];
 lu.forEach(id=>{const x=D[id];if(!x)return;if(x.pr==='+')pp++;else if(x.pr==='-')pm++;if(x.en==='d')ed++;else if(x.en==='p')ep++;if(x.mk&&m.lu[o].includes(x.mk))mk.push(x.mk);});
 m.dpi={s:m.us,pp,pm,ed,ep,mk};}
/** Efecto en el partido: [ataque propio, ocasiones del rival, cansancio]. */
export function dpiMods(m,s){const d=m.dpi;if(!d||d.s!==s)return null;return [1,(1-.004*d.pp+.003*d.pm)*(1-.003*d.ed+.002*d.ep),1+.01*d.pp-.008*d.pm];}
export const dpiCards=(m,s)=>m.dpi&&m.dpi.s===s?1+.08*m.dpi.ed-.06*m.dpi.ep:1;
/** El rival que tiene a alguien encima marca y asiste menos. */
export const dpiMark=(m,s,id)=>m.dpi&&m.dpi.s!==s&&m.dpi.mk.includes(id)?.72:1;

/* ---------- Gritos desde la banda (como en el FMM) ---------- */
export const SHOUTS={exi:'Exigir más',ani:'¡Vamos, se puede!',cal:'Calma',ala:'Alabar',con:'¡Concentración!'};
/** Das una orden a gritos: su efecto depende del marcador y dura unos minutos. Hay que esperar 10 minutos entre gritos. */
export function shout(m,k){if(!m||!m.us||m.done||!SHOUTS[k])return 'No es el momento.';if(m.shCd&&m.min<m.shCd)return `Tus jugadores aún están con el último grito (espera al minuto ${m.shCd}).`;
 const o=m.us==='h'?'a':'h',d=m.score[m.us]-m.score[o],late=m.min>=75;let own=1,opp=1,cards=1,tx='';
 if(k==='exi'){if(d<=0){own=1.05;cards=1.15;tx='El equipo da un paso adelante y aprieta.';}else{own=.99;tx='Los jugadores no entienden la bronca yendo por delante y se tensan.';}}
 else if(k==='ani'){if(d<0){own=d<=-2?1.035:1.03;tx='El equipo se levanta: ¡a por la remontada!';}else{own=1.01;tx='Ánimos recibidos.';}}
 else if(k==='cal'){cards=.65;if(d<0&&m.min>=60){opp=.98;tx='Calma: el equipo deja de precipitarse.';}else{opp=.99;tx='El equipo baja pulsaciones.';}}
 else if(k==='ala'){if(d>0){own=1.03;tx='Tus jugadores se crecen con los elogios.';}else{own=.98;tx='¿Elogios perdiendo? Alguno se relaja.';}}
 else if(k==='con'){if(late&&d>=0){opp=.94;tx='¡Todos atentos! El equipo cierra filas.';}else{opp=.985;tx='El equipo se concentra en lo suyo.';}}
 m.shx={k,until:m.min+12,own,opp,cards};m.shCd=m.min+10;return `📣 ${SHOUTS[k]}: ${tx}`;}
export const shoutMods=(m,s)=>m.shx&&m.us===s&&m.min<=m.shx.until?m.shx:null;
export const shoutCards=(m,s)=>{const x=shoutMods(m,s);return x?x.cards:1;};
