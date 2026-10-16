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
/** Desde la alineación: mueve el hueco i (0 = portero, que no se mueve) a una casilla del campo; si la formación era fija, pasa a «Libre» conservando a todos en su sitio. */
export function moveSlotTo(i,x,y){if(!i)return false;const t=T(S.user);if(t.formation!==FREE){t.free=coordsOf(t.formation);t.formation=FREE;}moveDot(i-1,x,y);return true;}
/** Casillas del campo donde puedes soltar a un jugador (5 de ancho por 5 de fondo). */
export const CELLS=(()=>{const o=[];[18,30,46,58,72].forEach(y=>[12,31,50,69,88].forEach(x=>o.push({x,y,s:spAt(x,y)})));return o;})();
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
/** Coordenadas (en %) de cada puesto de una formación, con el campo de pie: x de banda a banda, y de arriba (ataque) a abajo (portería). */
export function slotCoords(f){
 const rows=[[['POR'],89]].concat(formRows(f)),fc=f===FREE?freeCoords():null,out=[];let si=0;
 rows.forEach(([list,y0])=>list.forEach((s,k)=>{
  const sx=si++,n=list.length;let x=(k+1)/(n+1)*100,y=y0;
  if(n===5&&GRP[s]==='DEF'&&(k===0||k===4))y-=8;
  if(n===5&&GRP[s]==='MED'&&(k===0||k===4))y-=5;
  if(s==='MCD'&&list.some(x=>x!=='MCD'))y+=7;
  if(fc){x=fc[sx].x;y=fc[sx].y;}
  out.push({s,x,y});}));
 return out;
}
/** Numeración de la pizarra libre («4-2-3-1»): si coincide con una formación fija, su nombre; si no, agrupa por líneas de fondo. */
export function shapeOf(t){
 const F=freeOf(t||T(S.user)),same=Object.keys(FORMS).find(f=>{const c=coordsOf(f);return c.every((p,i)=>Math.abs(p.x-F[i].x)<=3&&Math.abs(p.y-F[i].y)<=3);});
 if(same)return same;
 const ys=F.map(c=>c.y).sort((a,b)=>b-a),rows=[];ys.forEach(y=>{const r=rows[rows.length-1];if(r&&r.y-y<6){r.n++;r.y=y;}else rows.push({y,n:1});});
 return rows.map(r=>r.n).join('-');
}
/** Nombre que se enseña de una formación: la libre, con su numeración. */
export const fLabel=(f,t)=>f===FREE?shapeOf(t):f;
