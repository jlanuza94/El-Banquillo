/* El Banquillo · devplus.ts — Hacer crecer a los jugadores: plan de desarrollo (aprender un puesto o un rasgo),
 * informe mensual de los jóvenes y de los cedidos, cancelar cesiones y «lo descubrí yo». */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money} from './core';
import {SPN,TRAITS} from './data';
import {PL,S,T,seasonLabel,setTeam,squad} from './state';
import {news} from './world';
import {loanShare} from './connected';
import {assignNum} from './players';
import {unlock} from './club';
import {trainMult} from './staff';

/** Puestos que puede aprender (los que no domina) y rasgos que aún no tiene. */
export const learnablePos=p=>Object.keys(SPN).filter(s=>s!==p.sp&&!(p.alt||[]).includes(s)&&(s==='POR')===(p.sp==='POR'));
export const learnableTr=p=>Object.keys(TRAITS).filter(k=>!(p.tr||[]).includes(k)&&(k!=='par'||p.sp==='POR')&&(p.sp!=='POR'||k==='par'||k==='pas'));
export function setDev(pid,k,v){const p=PL(pid);if(!p||p.team!==S.user)return;p.dev=p.dev&&typeof p.dev==='object'?p.dev:{};if(!v){delete p.dev[k];delete p.dev[k+'P'];}else if(p.dev[k]!==v){p.dev[k]=v;p.dev[k+'P']=0;}}
/** Avance semanal: más rápido si es joven, profesional y con buen cuerpo técnico. */
export const devRate=p=>(p.age<=20?7:p.age<=23?5.5:p.age<=27?4:2.5)*(p.per==='pro'?1.3:1)*clamp(trainMult?trainMult():1,.7,1.6);
export function devWeekly(){
 squad(S.user).forEach(p=>{const D=p.dev;if(!D||typeof D!=='object')return;const r=devRate(p);
  if(D.pos){D.posP=Math.min(100,(D.posP||0)+r*(p.st&&p.st.pj?1.15:.85));if(D.posP>=100){p.alt=(p.alt||[]).concat([D.pos]);news(`${p.name} ya domina un puesto nuevo: ${SPN[D.pos].toLowerCase()}.`,'good',{cat:'pla',subj:`Nuevo puesto: ${p.name}`,act:[{l:'Ver ficha',a:'ficha',id:p.id}]});delete D.pos;delete D.posP;}}
  if(D.tr){D.trP=Math.min(100,(D.trP||0)+r*.7);if(D.trP>=100){p.tr=(p.tr||[]).concat([D.tr]);news(`${p.name} ha aprendido un rasgo nuevo: «${TRAITS[D.tr]}».`,'good',{cat:'pla',subj:`Nuevo rasgo: ${p.name}`,act:[{l:'Ver ficha',a:'ficha',id:p.id}]});delete D.tr;delete D.trP;}}
 });
 if(S.week%4===3)monthlyReports();
}
/** Cada mes: cómo van los jóvenes y los cedidos. */
export function monthlyReports(){
 const young=squad(S.user).filter(p=>!p.loan&&p.age<=21).map(p=>{const d=p.ovr-(p.og!=null?p.og:p.ovr);p.og=p.ovr;return [p,d];}).filter(x=>x[1]!==0||x[0].dev);
 if(young.length)news(`Informe mensual de los jóvenes: ${young.map(([p,d])=>`${p.name} ${d>0?'+':''}${Math.round(d)}${p.dev&&p.dev.pos?` (aprende ${p.dev.pos}: ${Math.round(p.dev.posP||0)}%)`:''}`).join(' · ')}.`,young.some(x=>x[1]>0)?'good':'',{cat:'pla',subj:'Informe mensual: los jóvenes',act:[{l:'Ver desarrollo',a:'view',v:'entreno'}]});
 const out=Object.values(S.players).filter(p=>p.loan&&p.loan.from===S.user);
 out.forEach(p=>{const d=p.ovr-(p.og!=null?p.og:p.ovr);p.og=p.ovr;const sh=Math.round(loanShare(p)*100),low=p.lmt>=4&&sh<30;
  news(`Cesión de ${p.name} en ${T(p.team).name}: juega el ${sh}% de los partidos (${p.lpj||0} de ${p.lmt||0})${d?`, media ${d>0?'+':''}${Math.round(d)}`:''}.${low?' Apenas cuenta para ellos: puedes cancelar la cesión.':''}`,low?'bad':'',{cat:'pla',subj:`Cesión: ${p.name} (${sh}% de partidos)`,act:low?[{l:'Cancelar cesión',a:'loan-recall',id:p.id}]:[{l:'Ver ficha',a:'ficha',id:p.id}]});});
}
/** Cancelar una cesión: el jugador vuelve ya. */
export function recallLoan(pid){
 const p=PL(pid);if(!p||!p.loan||p.loan.from!==S.user)return 'No está cedido.';if(squad(S.user).length>=30)return 'Tu plantilla ya tiene 30 jugadores.';
 const from=T(p.team);p.loan=null;setTeam(p,S.user);assignNum(p);p.lpj=0;p.lmt=0;p.hap=clamp((p.hap||70)-4,0,100);
 news(`${p.name} vuelve antes de tiempo de su cesión en ${from.name}.`,'',{cat:'pla',subj:`Cesión cancelada: ${p.name}`});return '';
}
/** Al llegar a tu club (fichado o subido de la cantera) se apunta su nivel para «lo descubrí yo». */
export function markArrival(p){if(p&&!p.h0)p.h0=[p.ovr,seasonLabel(),0,p.value];}
/** Fin de temporada: si un jugador que llegó flojo ya es una estrella, es mérito tuyo. */
export function discoveries(){
 squad(S.user).forEach(p=>{const h=p.h0;if(!h||h[2]||p.ovr<70||p.ovr<h[0]+15)return;h[2]=1;
  news(`¡Lo descubriste tú! ${p.name} llegó con ${Math.round(h[0])} de media en ${h[1]} y ahora es un ${Math.round(p.ovr)}.`,'good',{cat:'pla',subj:`Lo descubrí yo: ${p.name}`,act:[{l:'Ver ficha',a:'ficha',id:p.id}]});unlock('desc');});
}
