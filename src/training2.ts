/* El Banquillo · training2.ts — Entrenamiento como en FM: calendario semanal de sesiones (lunes a domingo),
 * que decide el enfoque, la intensidad, la recuperación, la táctica y el balón parado; y nota de entrenamiento de cada jugador. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,rnd} from './core';
import {PL,S,T,squad} from './state';

export const SES={fis:{n:'Físico',i:'🏃',d:'Velocidad, resistencia y fuerza. Cansa y sube algo el riesgo de lesión.'},tec:{n:'Técnico',i:'🎯',d:'Pase, regate y visión.'},tac:{n:'Táctico',i:'🧠',d:'Dominio de la formación y química.'},
 ata:{n:'Ataque',i:'⚽',d:'Remate, regate y cabezazo.'},def:{n:'Defensa',i:'🛡️',d:'Entradas, colocación y cabezazo.'},bp:{n:'Balón parado',i:'🚩',d:'Ensaya córners y faltas.'},
 prep:{n:'Preparar partido',i:'📋',d:'Si es la víspera del partido, el equipo sale mejor preparado.'},rec:{n:'Recuperación',i:'🧊',d:'Recuperan energía tras el partido.'},des:{n:'Descanso',i:'😴',d:'Recuperan mucha energía. No mejoran.'}};
export const DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
export const MATCH_DAY=5;
export const PRESETS_T={normal:{n:'Semana normal',s:['rec','fis','tec','tac','prep','m','des']},intensa:{n:'Intensa',s:['fis','fis','tec','tac','prep','m','rec']},suave:{n:'Suave (muchos partidos)',s:['rec','des','tec','tac','prep','m','des']},tactica:{n:'Táctica',s:['rec','tac','tac','bp','prep','m','des']},fisica:{n:'Física',s:['rec','fis','fis','ata','prep','m','des']},ofensiva:{n:'Ofensiva',s:['rec','ata','ata','tec','prep','m','des']},defensiva:{n:'Defensiva',s:['rec','def','def','tac','prep','m','des']}};
export function sched(){if(!S.sched||S.sched.length!==7)S.sched=PRESETS_T.normal.s.slice();return S.sched;}
/** Del calendario sale el enfoque y la intensidad que usa el resto del juego. */
export function applySched(){
 const s=sched(),c=k=>s.filter(x=>x===k).length,work=['fis','tec','tac','ata','def'].map(k=>[k,c(k)]).sort((a,b)=>b[1]-a[1]);
 const load=c('fis')*1.4+c('tec')+c('tac')+c('ata')+c('def')+c('bp')*.6+c('prep')*.6,rest=c('rec')+c('des');
 S.train=S.train||{};S.train.focus=load<1?'des':work[0][1]===0?'eq':work[0][1]===work[1][1]&&work[0][1]<2?'eq':work[0][0];
 S.train.int=load>=5?'i':load<=2.5?'s':'n';S.train.rest=rest;S.train.load=load;
}
export const schedSummary=()=>{const s=sched(),c=k=>s.filter(x=>x===k).length;return {focus:S.train.focus,int:S.train.int,load:c('fis')*1.4+c('tec')+c('tac')+c('ata')+c('def')+c('bp')*.6+c('prep')*.6,rest:c('rec')+c('des'),tac:c('tac'),bp:c('bp'),prep:s[MATCH_DAY-1]==='prep',fis:c('fis')};};
export function setSession(d,k){const s=sched();if(d===MATCH_DAY||!SES[k])return;s[d]=k;applySched();}
export function setPreset(k){if(!PRESETS_T[k])return;S.sched=PRESETS_T[k].s.slice();applySched();}
/** Efectos extra de la semana: táctica, balón parado, recuperación, preparar el partido y la nota de entrenamiento. */
export function schedWeekly(famOf){
 const X=schedSummary(),t=T(S.user),f=t.formation;
 if(X.tac){S.famil[f]=clamp(famOf(f)+1.2*X.tac,0,100);S.chem=clamp(S.chem+.5*X.tac,20,100);}
 if(X.bp)S.spFam=clamp((S.spFam??40)+2.5*X.bp,0,100);
 S.prepB=X.prep?1.015:1;
 const sq=squad(S.user).filter(p=>!p.loan);
 sq.forEach(p=>{if(X.rest)p.energy=Math.min(100,(p.energy||0)+2*X.rest);
  const r=clamp(5.8+(p.per==='pro'?.8:p.per==='tem'?-.4:p.per==='lid'?.3:0)+((p.hap??70)-60)/40+(p.age<=21?.3:0)-(X.int==='i'&&p.age>=31?.5:0)+(rnd()*2.4-1.2),3,9.6);
  p.trA=Math.round(((p.trA??r)*.6+r*.4)*10)/10;p.trL=Math.round(r*10)/10;
  if(p.trA>=7.2)p.hap=clamp((p.hap??70)+1,0,100);else if(p.trA<5)p.hap=clamp((p.hap??70)-1,0,100);});
}
/** La nota de entrenamiento acelera (o frena) la mejora. */
export const trMult=p=>p&&p.trA!=null?clamp(1+(p.trA-6)*.08,.8,1.3):1;
