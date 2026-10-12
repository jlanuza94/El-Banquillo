/* El Banquillo · mentor.ts — Tutelaje: un veterano enseña a un joven y le contagia su carácter. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,rnd} from './core';
import {PERS} from './data';
import {PL,S,squad} from './state';
import {news} from './world';

export const MAX_PAIRS=4;
const GOOD=['pro','lid','lea','tra'];
const mine=p=>p&&p.team===S.user&&!p.loan;
export const canMentor=p=>mine(p)&&p.age>=27&&((p.at.lid??5)>=6||p.per==='pro'||p.per==='lid');
export const canLearn=p=>mine(p)&&p.age<=21;
export const pairs=()=>(S.mentors=(S.mentors||[]).filter(x=>canLearn(PL(x.y))&&canMentor(PL(x.m))));
export const mentorOf=id=>(pairs().find(x=>x.y===id)||{}).m;
export function addPair(y,m){
 const Y=PL(y),M=PL(m);if(!canLearn(Y))return 'Solo se pueden tutelar jugadores de 21 años o menos.';
 if(!canMentor(M))return 'El tutor debe tener 27 años o más y ser un líder o un profesional.';
 if(pairs().length>=MAX_PAIRS)return `Ya hay ${MAX_PAIRS} tutelajes en marcha.`;
 if(S.mentors.some(x=>x.y===y))return `${Y.name} ya tiene tutor.`;
 if(S.mentors.filter(x=>x.m===m).length>=2)return `${M.name} ya tutela a dos jugadores.`;
 S.mentors.push({y,m,wk:S.week});return '';
}
export function removePair(y){S.mentors=(S.mentors||[]).filter(x=>x.y!==y);}
/** Cada jornada: el joven gana ánimo y, con el tiempo, adopta el carácter y la mentalidad del tutor. */
export function mentorWeekly(){
 pairs().forEach(x=>{const Y=PL(x.y),M=PL(x.m);
  Y.hap=clamp((Y.hap??70)+.3,0,100);
  if(GOOD.includes(M.per)&&Y.per!==M.per&&rnd()<.03){const old=Y.per;Y.per=M.per;news(`${Y.name} se parece cada vez más a su tutor, ${M.name}: ahora es ${PERS[Y.per].n.toLowerCase()} (antes, ${PERS[old].n.toLowerCase()}).`,'good',{cat:'pla',subj:`${Y.name} cambia de carácter`,act:[{l:'Ver ficha',a:'ficha',id:Y.id}]});}
  for(const k of ['lid','con','gra'])if((M.at[k]??5)>=(Y.at[k]??5)+2&&rnd()<.02&&Y.at[k]<10)Y.at[k]++;
 });
}
