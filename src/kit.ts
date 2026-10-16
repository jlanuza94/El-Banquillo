/* El Banquillo · kit.ts — La equipación de tu club, una por temporada: colores y diseño (lisa, rayas, franjas, banda, mitades).
 * Se ve en la alineación, en el partido en 2D y en «Mi camino». Una vez presentada en la tienda, queda fijada hasta el verano. */
// @ts-nocheck — usa el estado heredado S.
import {S,T,lum} from './state';

export const KIT_PATS=[['lisa','Lisa'],['rayas','Rayas'],['franjas','Franjas'],['banda','Banda'],['mitades','Mitades'],['cuello','Cuello y mangas']];
const SHIRT='M13 2 4 6.5 1 14l6.5 2.2L8 32h24l.5-15.8L39 14l-3-7.5L27 2c-1.6 2.4-4 3.7-7 3.7S14.6 4.4 13 2z';
/** Equipación de tu club esta temporada (o la de una temporada pasada). */
export function myKit(n=S.seasonN){const t=T(S.user);const k=S.kits&&S.kits[n];return k||{c1:t.c1,c2:t.c2,pat:'lisa'};}
/** Equipación de cualquier club: la tuya según la temporada; las demás, sus colores de siempre. */
export const kitOf=tid=>tid===S.user?myKit():{c1:T(tid).c1,c2:T(tid).c2,pat:'lisa'};
export const kitLocked=()=>S.kitS===S.seasonN;
export function setKit(k){if(kitLocked())return 'La equipación de esta temporada ya está presentada: podrás cambiarla el próximo verano.';S.kits=S.kits||{};S.kits[S.seasonN]=Object.assign({},myKit(),k);return '';}
/** Dibujo de la camiseta (SVG) con su diseño. uid evita choques entre recortes de varias camisetas en la misma pantalla. */
let UID=0;
export function kitSVG(k,cls='',label=''){const id='kc'+(++UID),c1=k.c1,c2=k.c2;let fill='';
 if(k.pat==='rayas')fill=[8,16,24,32].map(x=>`<rect x="${x}" y="0" width="4" height="34" fill="${c2}"/>`).join('');
 else if(k.pat==='franjas')fill=[8,16,24].map(y=>`<rect x="0" y="${y}" width="40" height="4" fill="${c2}"/>`).join('');
 else if(k.pat==='banda')fill=`<path d="M6 0h8L36 34h-8z" fill="${c2}"/>`;
 else if(k.pat==='mitades')fill=`<rect x="20" y="0" width="20" height="34" fill="${c2}"/>`;
 else if(k.pat==='cuello')fill=`<path d="M0 0h13l7 6 7-6h13v16H33l-1-10H8L7 16H0z" fill="${c2}"/>`;
 const tc=lum(k.pat==='mitades'?c2:c1)>.55?'#111':'#fff';
 return `<svg class="kit ${cls}" viewBox="0 0 40 34" aria-hidden="true"><defs><clipPath id="${id}"><path d="${SHIRT}"/></clipPath></defs><g clip-path="url(#${id})"><rect width="40" height="34" fill="${c1}"/>${fill}</g><path d="${SHIRT}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>${label?`<text x="20" y="21" text-anchor="middle" font-size="9" font-weight="900" fill="${tc}" font-family="Barlow Condensed,Arial">${label}</text>`:''}</svg>`;}
