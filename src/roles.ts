/* El Banquillo · roles.ts — Roles por posición: cómo juega cada hueco del once. */
// @ts-nocheck — usa el estado heredado S.
import {GRP} from './data';
import {rateA} from './players';

/**
 * Para cada posición, sus roles: [clave, nombre, pesos de atributos (suman 1), efectos, descripción].
 * Efectos: own (ataque propio), opp (ocasiones del rival: <1 es mejor), poss (posesión), sc/as (goles/asistencias del jugador).
 * El primer rol de cada lista es el clásico y no cambia nada.
 */
const LAT=[['lde','Lateral defensivo',{def:.55,fis:.3,pas:.15},{own:.99,opp:.985},'Se queda atrás: menos ataque, más seguridad.'],
 ['lof','Lateral ofensivo',{def:.35,pas:.25,reg:.2,fis:.2},{own:1.015,opp:1.01,as:1.25},'Sube a centrar: más ataque, deja espacio a su espalda.'],
 ['car','Carrilero',{reg:.3,pas:.3,fis:.25,def:.15},{own:1.025,opp:1.02,as:1.4},'Hace toda la banda: mucho ataque, necesita físico y regate.']];
const MBA=[['int','Interior',{pas:.4,reg:.25,def:.15,fis:.2},{},'Equilibrado entre ataque y defensa.'],
 ['eba','Extremo de banda',{reg:.4,pas:.3,fis:.3},{own:1.012,as:1.3},'Abre el campo y centra.'],
 ['cdb','Medio defensivo de banda',{def:.35,fis:.3,pas:.35},{own:.99,opp:.99},'Ayuda al lateral.']];
const EXT=[['ext','Extremo',{reg:.45,pas:.25,tir:.15,fis:.15},{as:1.2},'Desborda y centra.'],
 ['epc','Extremo a pierna cambiada',{tir:.4,reg:.4,pas:.2},{own:1.012,sc:1.35,as:.85},'Se mete hacia dentro a buscar el disparo.'],
 ['ede','Extremo defensivo',{reg:.3,def:.3,fis:.25,pas:.15},{own:.99,opp:.99},'Trabaja en defensa.']];
export const PROLES={
 POR:[['por','Portero',{por:.75,fis:.15,pas:.1},{},'Se queda bajo palos.'],['pol','Portero líbero',{por:.6,pas:.25,fis:.15},{poss:.01,opp:1.005},'Sale a jugar con los pies: más posesión, algo más de riesgo.']],
 DFC:[['cen','Central',{def:.55,fis:.25,pas:.15,reg:.05},{},'Defiende y despeja.'],['csa','Central con salida',{def:.45,pas:.3,fis:.2,reg:.05},{poss:.012,opp:1.005},'Saca el balón jugado.'],['sto','Stopper',{def:.55,fis:.4,pas:.05},{opp:.985,own:.995},'Sale a anticipar con dureza.']],
 LD:LAT,LI:LAT,
 MCD:[['piv','Pivote defensivo',{def:.5,fis:.25,pas:.25},{opp:.98,own:.99},'Protege a la defensa.'],['ore','Organizador retrasado',{pas:.55,def:.25,fis:.2},{poss:.02,own:1.01,opp:1.01,as:1.2},'Reparte el juego desde atrás.']],
 MC:[['box','Box to box',{pas:.3,fis:.3,def:.2,tir:.2},{},'Llega a las dos áreas.'],['org','Organizador',{pas:.55,reg:.25,tir:.2},{poss:.02,own:1.01,opp:1.005,as:1.3},'Dirige el juego.'],['mcc','Mediocentro de contención',{def:.45,fis:.3,pas:.25},{opp:.985,own:.99},'Corta y tapa huecos.']],
 MCO:[['mp','Mediapunta',{pas:.4,tir:.3,reg:.3},{},'Juega entre líneas.'],['eng','Enganche',{pas:.6,reg:.3,tir:.1},{own:1.015,poss:.01,opp:1.005,as:1.4,sc:.8},'Todo pasa por él: último pase.'],['lle','Llegador',{tir:.5,reg:.25,fis:.25},{own:1.012,sc:1.35},'Pisa el área para rematar.']],
 MD:MBA,MI:MBA,ED:EXT,EI:EXT,
 DC:[['dar','Delantero de área',{tir:.65,fis:.25,reg:.1},{sc:1.15},'Vive del remate.'],['f9','Falso nueve',{pas:.4,reg:.3,tir:.3},{poss:.02,own:1.005,sc:.8,as:1.5},'Baja a combinar y deja espacio a los de banda.'],['dob','Delantero objetivo',{fis:.5,tir:.4,pas:.1},{own:1.01,as:1.2},'Gana balones por arriba y la baja para los demás.'],['dpr','Delantero presionante',{fis:.4,def:.2,tir:.4},{opp:.985,own:.995},'Presiona la salida del rival.']],
};
export const roleList=slot=>PROLES[slot]||[];
export function roleDef(slot,key){const l=roleList(slot);return l.find(r=>r[0]===key)||l[0];}
export const defaultRoles=slots=>slots.map(s=>roleList(s)[0][0]);
/** Nota de un jugador en un rol (escala de rateA: 1-10). Mitad su nota en la línea, mitad lo que pide el rol. */
export function roleRate(p,slot,key){const base=rateA(p.at,GRP[slot]);if(!key)return base;const w=roleDef(slot,key)[2];let r=0;for(const k in w)r+=w[k]*p.at[k];return .5*base+.5*r;}
/** Efecto conjunto de los roles de un once. */
export function roleEffects(slots,roles){
 const e={own:1,opp:1,poss:0};if(!roles)return e;
 slots.forEach((s,i)=>{const f=roleDef(s,roles[i])[3];if(f.own)e.own*=f.own;if(f.opp)e.opp*=f.opp;if(f.poss)e.poss+=f.poss;});
 return e;
}
/** Multiplicador de goles (sc) o asistencias (as) por el rol del hueco i. */
export const roleMult=(slot,key,k)=>roleDef(slot,key)[3][k]||1;
/** Al cambiar de formación se conservan los roles que siguen teniendo sentido. */
export function remapRoles(oldSlots,oldRoles,newSlots){
 const pool=(oldSlots||[]).map((s,i)=>[s,oldRoles&&oldRoles[i]]);
 return newSlots.map(s=>{const k=pool.findIndex(x=>x[0]===s&&x[1]);if(k>=0){const r=pool.splice(k,1)[0][1];if(roleList(s).some(x=>x[0]===r))return r;}return roleList(s)[0][0];});
}
