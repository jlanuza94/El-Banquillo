/* El Banquillo · delegate.ts — Profundidad opcional: delega en tu cuerpo técnico el entrenamiento,
 * el ojeo y el once de cada partido. Quien quiera controlarlo todo lo deja apagado. */
// @ts-nocheck — usa el estado heredado S.
import {pick} from './core';
import {COUNTRIES} from './data';
import {LG,S,T,squad,uLg,wcs} from './state';
import {PRESETS_T,setPreset} from './training2';
import {missionScouts,startMission} from './scoutplus';
import {needOf} from './economy';
import {famOf} from './tactics';

export const DELEG={tr:{n:'Entrenamiento',d:'Tu segundo planifica cada semana según el cansancio, las lesiones y lo que le falta al equipo.'},
 oj:{n:'Ojeo',d:'Los ojeadores sin misión salen solos a buscar donde más flojo está tu equipo.'},
 xi:{n:'Once de cada partido',d:'Antes de cada partido tu segundo da descanso a los cansados y alinea a los mejores.'}};
export const deleg=k=>!!(S.deleg&&S.deleg[k]);
export function setDeleg(k,v){S.deleg=S.deleg||{};S.deleg[k]=!!v;}

/** La semana que elegiría tu segundo y por qué. */
export function autoWeek(){
 const sq=squad(S.user).filter(p=>!p.loan),n=Math.max(1,sq.length);
 const en=sq.reduce((a,p)=>a+(p.energy||0),0)/n,inj=sq.filter(p=>p.inj>0).length,f=T(S.user).formation;
 if(en<78||inj>=4)return['suave',`la plantilla está cansada (energía media ${Math.round(en)}%)${inj>=4?` y hay ${inj} lesionados`:''}`];
 if(famOf(f)<60||(S.chem??60)<55)return['tactica','el equipo aún no domina la formación'];
 if(en>=90&&(S.week%4===1))return['intensa','están frescos: semana de carga'];
 const g=needOf(S.user);if(g&&g.weak>6)return[g.g==='DEF'||g.g==='POR'?'defensiva':g.g==='DEL'?'ofensiva':'normal',`hay que reforzar ${g.g==='DEF'||g.g==='POR'?'la defensa':g.g==='DEL'?'el ataque':'el medio campo'}`];
 return['normal','semana equilibrada'];
}
/** Cada semana, antes de entrenar. */
export function delegWeekly(){
 if(S.user==null||S.jobless)return;
 if(deleg('tr')){const [k,why]=autoWeek();if(S.sched&&S.sched.join()===PRESETS_T[k].s.join()&&S.delegWhy===why){}else{setPreset(k);S.delegWhy=why;S.trainLog=(S.trainLog||[]);S.trainLog.unshift({wk:S.week+1,txt:`Tu segundo planifica una semana ${PRESETS_T[k].n.toLowerCase()}: ${why}.`});S.trainLog=S.trainLog.slice(0,30);}}
 if(deleg('oj')){const busy=new Set((S.missions||[]).filter(x=>x.until>S.week).map(x=>x.sc)),g=needOf(S.user),line=g?g.g:'ALL';
  const small=wcs().filter(c=>COUNTRIES[c].lv<=3),home=LG(uLg()).c;
  missionScouts().filter(sc=>!busy.has(sc.id)).forEach((sc,i)=>{const c=i===0?home:pick(small.length?small:wcs());startMission(sc.id,c,line,i===0?0:21,8);});}
}
/** Antes de cada partido tuyo. */
export function delegPreMatch(rotateLineup){if(deleg('xi'))rotateLineup();}
