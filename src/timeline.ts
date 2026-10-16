/* El Banquillo · timeline.ts — La historia de cada jugador en tu club, momento a momento: llegada, debut,
 * primer gol, convocatorias, cesiones, renovaciones, premios, lesiones largas y saltos de nivel. */
// @ts-nocheck — usa el estado heredado S.
import {S,T,seasonLabel} from './state';

const MAX=24;
/** Apunta un momento (k evita repetir los que solo pasan una vez: debut, primer gol…). */
export function tlAdd(p,ico,txt,k){
 if(!p||p.team!==S.user&&!(p.loan&&p.loan.from===S.user))return;
 p.tl=Array.isArray(p.tl)?p.tl:[];if(k&&p.tl.some(x=>x[4]===k))return;
 p.tl.push([seasonLabel(),S.day??0,ico,txt,k||'']);if(p.tl.length>MAX)p.tl.splice(1,1);
}
export const tlHas=(p,k)=>Array.isArray(p.tl)&&p.tl.some(x=>x[4]===k);
/** Tras un partido oficial con tu equipo. */
export function tlMatch(p,opp,goals,rating){
 if(p.team!==S.user)return;const o=T(opp)?T(opp).name:'';
 tlAdd(p,'👟',`Debut oficial con el ${T(S.user).short} ante ${o}${rating?` (nota ${rating.toFixed(1)})`:''}`,'deb');
 if(goals)tlAdd(p,'⚽',`Primer gol oficial, ante ${o}`,'gol');
 const n=p.car?p.car[0]:0;[50,100,200,300].forEach(x=>{if(n===x)tlAdd(p,'🎖️',`${x} partidos como profesional`,'pj'+x);});
}
/** Cuando sube de nivel: cruza 50, 60, 70, 80 o 90 de media. */
export function tlOvr(p,before){if(p.team!==S.user)return;const a=Math.floor(before/10),b=Math.floor(p.ovr/10);if(b>a&&b>=5)tlAdd(p,'📈',`Alcanza ${b*10} de media con ${p.age} años`,'ovr'+b);}
/** Ficha › Historial: su historia en tu club. */
export function tlHTML(p,esc){
 const L=(Array.isArray(p.tl)?p.tl:[]).slice().reverse();if(!L.length)return '';
 return `<h3 style="margin:0 0 6px">Su historia contigo</h3><div class="ptl">${L.map(x=>`<div class="ptlr"><span class="ptli">${x[2]}</span><span class="ptlt"><b>${esc(x[3])}</b><small>${esc(x[0])}</small></span></div>`).join('')}</div>`;
}
