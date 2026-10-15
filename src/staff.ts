/* El Banquillo · staff.ts — Cuerpo técnico: segundo entrenador, entrenadores, fisioterapeutas y director deportivo. */
// @ts-nocheck — usa el estado heredado S.
import {mgrAt} from './extras2';
import {takeExPlayers} from './living';
import {genContacts} from './connected';
import {clamp,gauss,money,pick,r3,ri,rnd} from './core';
import {COUNTRIES,NAMES} from './data';
import {LG,S,T,uLg,unit} from './state';
import {news} from './world';

/** Atributos del cuerpo técnico (1 a 10). */
export const ST_AT={tac:'Táctica',mot:'Motivación',ent:'Entrenamiento',jov:'Trabajo con jóvenes',fis:'Fisioterapia',neg:'Negociación',jui:'Juzgar capacidad',jpo:'Juzgar potencial'};
/** Puestos: cuántos puedes tener, qué atributos importan y para qué sirven. */
export const ST_ROLES={
 seg:{n:'Segundo entrenador',pl:'Segundo entrenador',max:1,at:['tac','mot','ent'],d:'Prepara los informes del rival, te aconseja durante el partido y dirige al equipo cuando simulas. Su motivación potencia las charlas.'},
 ent:{n:'Entrenador',pl:'Entrenadores',max:3,at:['ent','jov','tac'],d:'Cuanto mejor entrenan, más rápido mejoran tus jugadores. «Trabajo con jóvenes» acelera a la cantera.'},
 fis:{n:'Fisioterapeuta',pl:'Fisioterapeutas',max:2,at:['fis','ent'],d:'Recuperan la energía antes, acortan las lesiones y evitan las de entrenamiento.'},
 dca:{n:'Director de cantera',pl:'Director de cantera',max:1,at:['jov','jpo'],d:'Mejora el potencial de los juveniles que llegan cada verano, acelera su desarrollo y hace más probable una generación dorada.'},
 dd:{n:'Director deportivo',pl:'Director deportivo',max:1,at:['neg','jui','jpo'],d:'Negocia los traspasos (pagas menos y vendes más caro) y conoce mejor a los jugadores de otros clubes.'},
};
export const crew=role=>(S.crew||[]).filter(x=>x.role===role);
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
/** Media de un atributo en un puesto, contando las plazas vacías como `empty`. */
function slotAvg(role,k,empty){const c=crew(role),n=Math.max(ST_ROLES[role].max,c.length);let s=c.reduce((a,x)=>a+x.at[k],0)+(n-c.length)*empty;return s/n;}

/* ---------- Efectos en el juego ---------- */
/** Multiplicador de la mejora en el entrenamiento (≈1 con entrenadores normales; hasta ×1.5). */
export const trainMult=()=>(.85+.065*slotAvg('ent','ent',1.5))*(1+.015*Math.max(0,crew('ent').length-3));
/** Multiplicador de la mejora de la cantera. */
export const youthMult=()=>.02*(mgrAt('can')-5)+.85+.065*slotAvg('ent','jov',1.5)+(crew('dca')[0]?(crew('dca')[0].at.jov-5)*.025:0);
/** Nivel médico de 0 (sin fisios) a 10. */
export const medLevel=()=>Math.min(10,slotAvg('fis','fis',0)+.35*Math.max(0,crew('fis').length-2)+(S.mgr&&(S.mgr.spec||[]).includes('fis')?.8:0));
// Con un solo fisio normal (nivel médico ≈2) no hay ni bonus ni penalización.
export const recBonusStaff=()=>(medLevel()-2)*.012;
export const injDaysMult=()=>clamp(1-.035*(medLevel()-2),.7,1.08);
export const trainInjMult=()=>clamp(1-.06*(medLevel()-2),.5,1.15);
/** Valores del segundo entrenador (5 si no hay). */
export const segAt=k=>{const s=crew('seg')[0];return s?s.at[k]:3;};
/** Efecto de la negociación del director deportivo: <1 al comprar, >1 al vender. */
export const buyMult=()=>{const d=crew('dd')[0];return (d?1-.012*(d.at.neg-4):1)*(1-.008*(mgrAt('neg')-5));};
export const sellMult=()=>{const d=crew('dd')[0];return d?1+.01*(d.at.neg-4):1;};
/** Calidad para juzgar jugadores: el mejor entre el director deportivo y los ojeadores (1-10). */
export const judge=()=>Math.max(crew('dd')[0]?crew('dd')[0].at.jui:2,...(S.scouts||[]).map(sc=>sc.jui||sc.q*2));

/* ---------- Generación, sueldos y contratos ---------- */
export const crewLevel=()=>clamp(4+(LG(uLg()).rep-40)/8,3,9);
export function staffWage(m){const a=avg(ST_ROLES[m.role].at.map(k=>m.at[k]));return r3(Math.max(.0005,unit(LG(uLg()).rep)*.006*Math.pow(a,1.5)*(m.role==='seg'||m.role==='dd'?1.3:1)));}
export function makeStaff(role,lvl){
 const c=rnd()<.75?LG(uLg()).c:ri(0,COUNTRIES.length-1),[F,L]=NAMES[COUNTRIES[c].lang];
 const at={};Object.keys(ST_AT).forEach(k=>{const main=ST_ROLES[role].at.indexOf(k);const b=main===0?lvl+.6:main>0?lvl-.4:lvl-2.5;at[k]=clamp(Math.round(b+gauss()*1.3),1,10);});
 const m={id:'c'+(S.nextId++),name:pick(F)+' '+pick(L),nat:c,role,age:ri(31,62),at,yrs:ri(1,3)};m.wage=staffWage(m);if(role==='dd')m.contacts=genContacts(m);return m;
}
export const crewWages=()=>(S.crew||[]).reduce((a,x)=>a+x.wage,0);
/** Equipo inicial de un club: un segundo, un entrenador y un fisio de nivel algo bajo. */
export function defaultCrew(){const l=crewLevel()-.5;S.crew=[makeStaff('seg',l),makeStaff('ent',l),makeStaff('fis',l)];S.crew.forEach(m=>m.yrs=ri(1,2));genStaffPool();}
/** Convierte el sistema antiguo de niveles (S.staff) en miembros reales. */
export function migrateCrew(){
 if(S.crew)return;const old=S.staff||{pre:1,fis:1},l=crewLevel()-.5;
 S.crew=[makeStaff('seg',l)];
 for(let i=0;i<Math.max(1,Math.min(3,old.pre-1));i++)S.crew.push(makeStaff('ent',l+(old.pre-1)*.8));
 for(let i=0;i<Math.max(1,Math.min(2,Math.ceil((old.fis-1)/2)));i++)S.crew.push(makeStaff('fis',l+(old.fis-1)*.8));
 (S.scouts||[]).forEach(scoutAttrs);genStaffPool();
}
/** Los ojeadores antiguos solo tenían estrellas (q); les damos atributos 1-10. */
export function scoutAttrs(sc){if(sc.jui==null){sc.jui=clamp(sc.q*2-1+ri(0,1),1,10);sc.jpo=clamp(sc.q*2-1+ri(0,1),1,10);}if(!sc.job)sc.job='jov';return sc;}
export function genStaffPool(){
 const l=crewLevel();S.staffPool=[];
 ['seg','ent','ent','ent','fis','fis','dd','dd','dca','dca'].forEach(r=>S.staffPool.push(makeStaff(r,l+gauss()*1.1)));
 // ex-jugadores retirados que quieren empezar a entrenar
 takeExPlayers(4).forEach(x=>{const a=x.at,role=a.lid>=7?'seg':a.dec>=7||a.con>=7?'ent':(a.res??5)>=7&&rnd()<.6?'fis':a.vis>=7&&rnd()<.5?'dca':pick(['ent','dd','dca','fis']),m=makeStaff(role,l+.4);m.name=x.name;m.nat=x.nat;m.age=x.age+1;m.ex=1;m.from=x.club||null;
  const b=(v)=>clamp(Math.round(v+gauss()*.8),1,10);m.at.tac=b((a.dec+a.vis)/2);m.at.mot=b(a.lid);m.at.ent=b((a.con+a.dec)/2);m.at.jui=b((a.vis+a.col)/2);m.at.jpo=b((a.vis+a.dec)/2);m.at.jov=b((a.lid+a.con)/2);m.at.fis=b(((a.res??5)+a.con)/2);m.wage=staffWage(m);S.staffPool.push(m);});
 S.staffPoolWk=S.week;
}
/** Países con contactos de un director deportivo (para la pantalla). */
export const contactNames=m=>(m.contacts||[]).map(c=>COUNTRIES[c].n).join(', ');
export function hireStaff(id){
 const i=(S.staffPool||[]).findIndex(x=>x.id===id);if(i<0)return 'Ese candidato ya no está disponible.';
 const m=S.staffPool[i],R=ST_ROLES[m.role];
 if(crew(m.role).length>=staffMax(m.role))return `Tu club solo puede tener ${staffMax(m.role)} ${staffMax(m.role)>1?R.pl.toLowerCase():R.n.toLowerCase()}. Despide a alguno antes.`;
 m.wage=staffWage(m);m.yrs=2;S.staffPool.splice(i,1);S.crew.push(m);
 news(`${m.name} se incorpora como ${R.n.toLowerCase()} (${money(m.wage)}/sem, 2 temporadas).`,'good',{cat:'sta',subj:`Nuevo ${R.n.toLowerCase()}: ${m.name}`,act:[{l:'Ver cuerpo técnico',a:'view',v:'staff'}]});
 return '';
}
export const fireCost=m=>r3(m.wage*12*Math.max(1,m.yrs));
export function fireStaff(id){
 const m=(S.crew||[]).find(x=>x.id===id);if(!m)return;const c=fireCost(m);
 S.budget=r3(S.budget-c);S.crew=S.crew.filter(x=>x!==m);
 news(`Despides a ${m.name} (${ST_ROLES[m.role].n.toLowerCase()}). La indemnización es de ${money(c)}.`,'',{cat:'sta'});
}
export function renewStaff(id){const m=(S.crew||[]).find(x=>x.id===id);if(!m||m.yrs>1)return;m.yrs+=2;m.wage=r3(staffWage(m)*1.1);news(`${m.name} renueva dos temporadas más (${money(m.wage)}/sem).`,'good',{cat:'sta'});}
/** Fin de temporada: cumplen años, se acaban contratos y mejoran un poco los jóvenes. */
export function crewSeasonEnd(){
 const gone=[];
 (S.crew||[]).forEach(m=>{m.age++;m.yrs--;if(m.age<=45&&rnd()<.35){const k=pick(ST_ROLES[m.role].at);if(m.at[k]<10)m.at[k]++;}if(m.age>=58&&rnd()<.25){const k=pick(Object.keys(ST_AT));if(m.at[k]>1)m.at[k]--;}});
 S.crew=(S.crew||[]).filter(m=>{if(m.yrs<=0||m.age>=67){gone.push(m);return false;}return true;});
 if(gone.length)news(`Dejan el cuerpo técnico: ${gone.map(m=>`${m.name} (${ST_ROLES[m.role].n.toLowerCase()})`).join(', ')}.`,'bad',{cat:'sta',subj:'Bajas en el cuerpo técnico',act:[{l:'Buscar sustitutos',a:'view',v:'staff'}]});
 genStaffPool();
}
export function crewWeekly(){
 if(S.week-(S.staffPoolWk||0)>=10)genStaffPool();
 // un segundo con mucha motivación mantiene la química
 const mot=segAt('mot');S.chem=clamp(S.chem+(mot-5)*.08,20,100);
 if(S.week===26){const ex=(S.crew||[]).filter(m=>m.yrs<=1);if(ex.length)news(`Acaban contrato en junio: ${ex.map(m=>m.name).join(', ')}. Renuévalos en Cuerpo técnico si quieres que sigan.`,'bad',{cat:'sta',subj:'Contratos del cuerpo técnico',act:[{l:'Ver cuerpo técnico',a:'view',v:'staff'}]});}
}

/* ---------- Tamaño del cuerpo técnico según el club y nivel de cada técnico ---------- */
/** Tamaño del club (0 modesto … 4 grande): división, reputación y dinero. */
export function clubTier(){const L=LG(uLg()),t=T(S.user),rep=t?t.rep||50:50;return clamp(3-L.lv+(rep>=80?1:0)-(rep<35?1:0)+(S.budget>unit(L.rep)*20?1:0),0,4);}
const MAXES={ent:[2,2,3,4,5],fis:[1,2,2,3,4],sc:[1,2,3,4,5]};
/** Plazas de cada puesto: los clubes grandes tienen más entrenadores, fisios y ojeadores. */
export const staffMax=role=>MAXES[role]?MAXES[role][clubTier()]:ST_ROLES[role]?ST_ROLES[role].max:1;
/** Nivel de un técnico: bronce, plata, oro o élite (según sus atributos de su puesto). */
export function tierOf(m){const ks=ST_ROLES[m.role]?ST_ROLES[m.role].at:['jui','jpo'],a=avg(ks.map(k=>m.at?m.at[k]:m[k]||0));return a>=8?['elite','Élite',4]:a>=6?['oro','Oro',3]:a>=4?['plata','Plata',2]:['bronce','Bronce',1];}
/** Curso de formación: una vez por temporada, sube sus atributos de puesto (y su sueldo). */
export const courseCost=m=>r3(Math.max(.003,m.wage*20));
export function staffCourse(id){const m=(S.crew||[]).find(x=>x.id===id);if(!m)return 'No está en tu cuerpo técnico.';if(m.course===S.seasonN)return 'Ya hizo un curso esta temporada.';const c=courseCost(m);if(S.budget<c)return `No te llega: el curso cuesta ${money(c)}.`;
 const ks=ST_ROLES[m.role].at,t0=tierOf(m)[1];S.budget=r3(S.budget-c);ks.forEach((k,i)=>{if(m.at[k]<10&&(i===0||rnd()<.6))m.at[k]++;});m.course=S.seasonN;m.wage=r3(staffWage(m));
 const t1=tierOf(m)[1];news(`${m.name} termina un curso de formación${t1!==t0?` y sube a nivel ${t1.toLowerCase()}`:''} (${money(c)}).`,'good',{cat:'sta'});return '';}
