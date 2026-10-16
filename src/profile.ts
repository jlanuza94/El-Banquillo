/* El Banquillo · profile.ts — Tu perfil entre partidas: las licencias e insignias que consigues jugando se quedan
 * guardadas en este móvil, y en una partida nueva puedes empezar con cualquiera de las que ya desbloqueaste. */
// @ts-nocheck — usa el estado heredado S.
import {S} from './state';

const KEY='eb-profile';
export function profile(){try{const o=JSON.parse(localStorage.getItem(KEY)||'{}');return o&&typeof o==='object'?o:{};}catch(e){return {};}}
/** Apunta en el perfil lo conseguido en esta partida (licencias sacadas con cursos e insignias). */
export function profileSync(){
 if(!S||!S.mgr)return;const P=profile(),L=new Set(P.lics||[]),B=new Set(P.badges||[]);
 (S.mgr.lics||[]).forEach(l=>{if(l.earned)L.add(l.k);});Object.keys(S.mgr.badges||{}).forEach(k=>{if(!/^lic_/.test(k)||L.has(k.slice(4)))B.add(k);});
 if(L.size===(P.lics||[]).length&&B.size===(P.badges||[]).length)return;
 P.lics=[...L];P.badges=[...B];try{localStorage.setItem(KEY,JSON.stringify(P));}catch(e){}
}
/** ¿Puedes empezar con esta licencia? Sin titulación y la C, siempre; el resto, si la sacaste en alguna partida. */
export const licUnlocked=k=>k==='none'||k==='C'||(profile().lics||[]).includes(k);
export const profBadges=()=>profile().badges||[];
