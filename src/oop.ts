/* El Banquillo · oop.ts — Forma sin balón (como en el FM de PC): el mismo once se coloca con otra formación
 * cuando defiende. Cada jugador pasa a su puesto más cercano; tú puedes intercambiarlos. */
// @ts-nocheck — usa el estado heredado S.
import {FORMS} from './data';
import {OFREE,slotCoords} from './freeboard';

/** Formación sin balón, si es distinta de la de con balón. */
export const oopForm=t=>t&&t.oop&&t.oop!==t.formation&&(FORMS[t.oop]||t.oop===OFREE)?t.oop:null;
/** Para cada puesto con balón, su puesto sin balón (el más cercano libre; el portero siempre es el portero). */
export function autoMap(fIP,fOOP){
 const A=slotCoords(fIP),B=slotCoords(fOOP),used=new Set([0]),map=[0];
 const order=A.map((c,i)=>i).slice(1).sort((i,j)=>A[i].y-A[j].y);
 const tmp={};order.forEach(i=>{let best=-1,bd=1e9;B.forEach((c,k)=>{if(used.has(k))return;const d=Math.hypot(c.x-A[i].x,(c.y-A[i].y)*1.3);if(d<bd){bd=d;best=k;}});used.add(best);tmp[i]=best;});
 for(let i=1;i<A.length;i++)map[i]=tmp[i];return map;
}
/** Mapa vigente del equipo (el tuyo si lo retocaste y sigue valiendo). */
export function oopMap(t){const f=oopForm(t);if(!f)return null;const key=t.formation+'>'+f;if(t.oopMap&&t.oopKey===key&&t.oopMap.length===slotsLen(f))return t.oopMap;return autoMap(t.formation,f);}
const slotsLen=f=>slotCoords(f).length;
/** Once colocado sin balón: lu[puesto sin balón] = jugador. */
export function oopLineup(lu,map){const out=[];lu.forEach((id,i)=>{out[map[i]]=id;});return out;}
/** Intercambia dos jugadores en la forma sin balón (por sus puestos sin balón a y b). */
export function oopSwap(t,a,b){const m=oopMap(t);if(!m||a===b||a===0||b===0)return;const ia=m.indexOf(a),ib=m.indexOf(b);if(ia<0||ib<0)return;const n=m.slice();n[ia]=b;n[ib]=a;t.oopMap=n;t.oopKey=t.formation+'>'+oopForm(t);}

/** Mover a un jugador sin balón a otra zona del campo: la forma sin balón pasa a ser libre, conservando dónde estaba cada uno.
 * j es el puesto sin balón (1-10; el portero no se mueve). */
export function oopMoveTo(t,j,x,y){if(!j)return false;const f=oopForm(t),cur=slotCoords(f||t.formation),map=f?oopMap(t).slice():cur.map((c,i)=>i);
 if(f!==OFREE){t.oopFree=cur.slice(1).map(c=>({x:Math.round(c.x),y:Math.round(c.y)}));t.oop=OFREE;t.oopMap=map;t.oopKey=t.formation+'>'+OFREE;}
 t.oopFree[j-1]={x:Math.round(Math.max(6,Math.min(94,x))),y:Math.round(Math.max(12,Math.min(82,y)))};return true;}
