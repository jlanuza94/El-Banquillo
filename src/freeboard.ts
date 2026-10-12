/* El Banquillo · freeboard.ts — Pizarra táctica libre: colocas a cada jugador donde quieras y el puesto sale de la zona del campo.
 * El motor lo trata como una formación más («Libre»): cuenta cuántos defensas, medios y delanteros tienes y la nota de cada uno en su puesto. */
// @ts-nocheck — usa el estado heredado S.
import {FORMS,GRP} from './data';
import {S,T} from './state';

export const FREE='Libre';
/** Puesto según la zona: y es la profundidad (0 = portería rival, 100 = la tuya) y x el ancho (0 = izquierda). */
export function spAt(x,y){
 const w=x<28?'L':x>72?'R':'C';
 if(y>=64)return w==='L'?'LI':w==='R'?'LD':'DFC';
 if(y>=54)return w==='C'?'MCD':w==='L'?'LI':'LD';
 if(w==='C')return y>=38?'MC':y>=25?'MCO':'DC';
 return y>=34?(w==='L'?'MI':'MD'):(w==='L'?'EI':'ED');
}
/** Coordenadas de una formación fija (las mismas que se dibujan en la pizarra normal). */
export function coordsOf(f){
 const out=[];(FORMS[f]||FORMS['4-4-2']).forEach(([list,y0])=>list.forEach((s,k)=>{const n=list.length;let y=y0;
  if(n===5&&GRP[s]==='DEF'&&(k===0||k===4))y-=8;if(n===5&&GRP[s]==='MED'&&(k===0||k===4))y-=5;if(s==='MCD'&&list.some(x=>x!=='MCD'))y+=7;
  out.push({x:Math.round((k+1)/(n+1)*100),y:Math.round(y)});}));
 return out;
}
/** Posiciones libres del equipo (siempre 10 jugadores de campo). */
export function freeOf(t){t=t||T(S.user);if(!t.free||t.free.length!==10)t.free=coordsOf(t.formation&&t.formation!==FREE?t.formation:'4-4-2');return t.free;}
/** Filas de la formación: las fijas de siempre o, para «Libre», una fila por jugador con su puesto según la zona. */
export function formRows(f){if(f!==FREE)return FORMS[f]||FORMS['4-4-2'];return freeOf(T(S.user)).map(c=>[[spAt(c.x,c.y)],c.y]);}
/** Coordenadas de cada hueco (portero incluido) para dibujar el campo. */
export const freeCoords=()=>[{x:50,y:89}].concat(freeOf(T(S.user)));
/** Mueve a un jugador de la pizarra (índice 0-9 sin contar al portero). */
export function moveDot(i,x,y){const F=freeOf(T(S.user));F[i]={x:Math.round(Math.max(6,Math.min(94,x))),y:Math.round(Math.max(12,Math.min(82,y)))};}
/** Aviso si la colocación es arriesgada. */
/** Tras mover a alguien: los roles que ya no encajan en su nuevo puesto vuelven al de por defecto, y la pizarra pierde algo de dominio. */
export function afterMove(slots,roleList){const t=T(S.user);if(t.roles&&t.roles.length===slots.length)t.roles=t.roles.map((r,j)=>roleList(slots[j]).some(x=>x[0]===r)?r:roleList(slots[j])[0][0]);
 S.famil=S.famil||{};S.famil[FREE]=Math.max(30,(S.famil[FREE]??40)-1);}
export function freeWarn(){
 const sp=freeOf(T(S.user)).map(c=>spAt(c.x,c.y)),n=g=>sp.filter(s=>GRP[s]===g).length;
 if(n('DEF')<3)return `Solo ${n('DEF')} defensa${n('DEF')===1?'':'s'}: te van a hacer mucho daño a la contra.`;
 if(n('DEL')===0&&!sp.includes('MCO'))return 'Sin delanteros ni mediapunta: te costará mucho marcar.';
 if(n('MED')<2)return 'Muy pocos centrocampistas: perderás la batalla del medio.';
 return '';
}
