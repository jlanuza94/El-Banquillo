/* El Banquillo · positions.ts — Táctica por posiciones al estilo FM: cometido (defender, apoyar, atacar) e instrucciones de cada puesto.
 * Se guardan por hueco de la formación (t.duty[i], t.pi[i]): quien juegue en ese puesto las cumple, también el que entra desde el banquillo. */
// @ts-nocheck — usa el estado heredado S.
import {S,T} from './state';

export const DUTIES={def:{n:'Defender',d:'Se queda más atrás y ayuda en defensa.',own:.994,opp:.992,sc:.8,as:.85},
 apo:{n:'Apoyar',d:'Equilibrado: ataca y defiende según la jugada.',own:1,opp:1,sc:1,as:1},
 ata:{n:'Atacar',d:'Pisa campo rival y busca el gol o el último pase; deja espacio a su espalda.',own:1.008,opp:1.006,sc:1.2,as:1.12}};
/** Categoría de cada puesto (cada una tiene sus instrucciones). */
export const PCAT={POR:'por',DFC:'cen',LD:'lat',LI:'lat',MCD:'piv',MC:'mc',MD:'ban',MI:'ban',MCO:'mco',ED:'ext',EI:'ext',DC:'del'};
export const DEF_DUTY={POR:'def',DFC:'def',LD:'apo',LI:'apo',MCD:'def',MC:'apo',MD:'apo',MI:'apo',MCO:'ata',ED:'ata',EI:'ata',DC:'ata'};
/** Instrucciones por categoría: [clave, nombre, efectos, explicación]. own/opp/poss/drain son del equipo; sc/as del jugador. */
export const PI={
 por:[['cen','Salir a por los centros',{opp:.996},'Atrapa más balones aéreos; si falla, ocasión clara del rival.'],['rap','Sacar rápido',{own:1.004,poss:-.004},'Lanza contragolpes, pero se pierden más balones.'],['cor','Sacar en corto',{poss:.008,opp:1.002},'Inicia el juego desde atrás.']],
 cen:[['mar','Marcaje más cercano',{opp:.996,drain:1.01},'Encima del delantero: le deja menos espacio.'],['dur','Entradas más fuertes',{opp:.995},'Corta más jugadas (y ve más tarjetas).'],['des','Despejar sin riesgos',{opp:.997,poss:-.006},'Nada de jugar el balón en zona peligrosa.'],['sal','Sacar el balón jugado',{poss:.008,opp:1.003},'Busca el pase al medio en vez del pelotazo.']],
 lat:[['sub','Incorporarse al ataque',{own:1.006,opp:1.005,as:1.15},'Sube por su banda en cada ataque.'],['cen','Centrar más',{own:1.002,as:1.12},'Busca el centro al área cuando llega arriba.'],['cer','Quedarse cerrado',{opp:.996,own:.997},'No sube: forma una línea de tres atrás.'],['den','Jugar por dentro',{poss:.006,as:1.05},'Se mete al medio a combinar.']],
 piv:[['tap','Tapar al mediapunta',{opp:.995},'Persigue al jugador entre líneas del rival.'],['dis','Distribuir rápido',{own:1.004,poss:.003},'Primer pase vertical al recuperar.'],['caj','Bajar entre centrales',{poss:.006,opp:.998},'Forma línea de tres para sacar el balón.']],
 mc:[['pre','Presionar más',{opp:.996,drain:1.012},'Muerde en cuanto pierde el balón el rival.'],['rie','Pases más arriesgados',{own:1.006,poss:-.004,as:1.15},'Busca el pase que rompe líneas.'],['lej','Chutar de lejos',{own:1.002,sc:1.12},'Prueba desde fuera del área.'],['lle','Llegar al área',{own:1.004,opp:1.003,sc:1.2},'Acompaña la jugada hasta el remate.'],['pos','Quedarse en su posición',{opp:.997,own:.997},'No rompe la estructura.']],
 ban:[['cen','Centrar más',{own:1.002,as:1.15},'Llega a línea de fondo y centra.'],['den','Cortar hacia dentro',{sc:1.15,as:.92,poss:.003},'Se mete al centro con el balón.'],['ayu','Ayudar al lateral',{opp:.996,own:.997},'Baja a defender su banda.']],
 ext:[['reg','Regatear más',{own:1.006,poss:-.003,as:1.08},'Encara a su par en cada balón.'],['den','Cortar hacia dentro',{sc:1.2,as:.9},'Busca el disparo con su pierna buena.'],['cen','Centrar más',{own:1.002,as:1.15},'Pone el balón al área.'],['pre','Presionar al lateral',{opp:.996,drain:1.01},'No deja salir al rival por su banda.']],
 mco:[['lib','Moverse libremente',{own:1.004,as:1.1},'Aparece donde haya espacio.'],['lle','Llegar al área',{sc:1.2,own:1.003},'Se suma al delantero.'],['lej','Chutar de lejos',{sc:1.12},'Prueba desde la frontal.'],['pre','Presionar al pivote',{opp:.996,drain:1.01},'Tapa al que organiza al rival.']],
 del:[['esp','Desmarcarse al espacio',{own:1.004,sc:1.12},'Ataca la espalda de los centrales.'],['baj','Bajar a recibir',{poss:.006,sc:.9,as:1.18},'Se ofrece entre líneas para combinar.'],['ban','Caer a banda',{as:1.15,sc:.94},'Abre el campo para los que llegan.'],['pre','Presionar la salida',{opp:.995,drain:1.012},'Persigue a centrales y portero.']],
};
export const piList=slot=>PI[PCAT[slot]]||[];
/** Cometidos e instrucciones del once del usuario (uno por hueco). Se rehacen si cambia el número de huecos. */
export function userPos(slots){
 const t=T(S.user);
 if(!t.duty||t.duty.length!==slots.length)t.duty=slots.map(s=>DEF_DUTY[s]||'apo');
 if(!t.pi||t.pi.length!==slots.length)t.pi=slots.map(()=>[]);
 return {du:t.duty,pi:t.pi};
}
/** Al cambiar de formación se conservan cometido e instrucciones de los puestos que siguen existiendo. */
export function remapPos(oldSlots,du,pi,newSlots){
 const pool=(oldSlots||[]).map((s,i)=>[s,du&&du[i],pi&&pi[i]]);
 const D=[],P=[];newSlots.forEach(s=>{const k=pool.findIndex(x=>x[0]===s);if(k>=0){const x=pool.splice(k,1)[0];D.push(x[1]||DEF_DUTY[s]||'apo');P.push((x[2]||[]).slice());}else{D.push(DEF_DUTY[s]||'apo');P.push([]);}});
 return {du:D,pi:P};
}
const duF=(s,d,k)=>{const D=DUTIES[d]||DUTIES.apo,B=DUTIES[DEF_DUTY[s]||'apo'];return (D[k]||1)/(B[k]||1);};
/** Efecto en el equipo: solo cuenta lo que cambias respecto a lo normal de cada puesto. */
export function posTeam(slots,du,pi){
 const e={own:1,opp:1,poss:0,drain:1};if(!du&&!pi)return e;
 slots.forEach((s,i)=>{if(du&&du[i]){e.own*=duF(s,du[i],'own');e.opp*=duF(s,du[i],'opp');}
  (pi&&pi[i]||[]).forEach(k=>{const x=piList(s).find(y=>y[0]===k);if(!x)return;const f=x[2];if(f.own)e.own*=f.own;if(f.opp)e.opp*=f.opp;if(f.poss)e.poss+=f.poss;if(f.drain)e.drain*=f.drain;});});
 return e;
}
/** Multiplicador de goles (sc) o asistencias (as) del jugador de ese puesto. */
export function posMult(slot,duty,keys,k){
 let m=duty?duF(slot,duty,k):1;(keys||[]).forEach(key=>{const x=piList(slot).find(y=>y[0]===key);if(x&&x[2][k])m*=x[2][k];});return m;
}
/** Resumen legible del efecto de un puesto. */
export function posSummary(slot,duty,keys){
 const e=posTeam([slot],[duty],[keys]),sc=posMult(slot,duty,keys,'sc'),as=posMult(slot,duty,keys,'as'),pc=v=>(v>=0?'+':'')+(v*100).toFixed(1)+'%',out=[];
 if(Math.abs(e.own-1)>.0005)out.push(`ataque del equipo ${pc(e.own-1)}`);if(Math.abs(e.opp-1)>.0005)out.push(`ocasiones del rival ${pc(e.opp-1)}`);
 if(Math.abs(e.poss)>.0005)out.push(`posesión ${pc(e.poss)}`);if(Math.abs(e.drain-1)>.0005)out.push(`cansancio ${pc(e.drain-1)}`);
 if(Math.abs(sc-1)>.005)out.push(`sus goles ${pc(sc-1)}`);if(Math.abs(as-1)>.005)out.push(`sus asistencias ${pc(as-1)}`);
 return out.length?out.join(' · '):'Sin cambios respecto a lo normal en este puesto.';
}
