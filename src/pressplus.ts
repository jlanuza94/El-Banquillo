/* El Banquillo · pressplus.ts — Promesas que importan: lo que prometes en la prensa (ascenso, minutos a la cantera,
 * un fichaje) se vigila y se cobra; y una promesa rota a un jugador influyente puede dividir el vestuario. */
// @ts-nocheck — usa el estado heredado S.
import {clamp} from './core';
import {PL,S,T,squad} from './state';
import {news} from './world';
import {leaders} from './tactics';

export const PPROM={asc:'Conseguir el ascenso (o el título)',can:'Dar minutos a la cantera (2 canteranos con 10 partidos)',fich:'Traer un refuerzo para el once en 8 jornadas'};
/** Pregunta de la prensa con promesas (al empezar la temporada o tras una mala racha). */
export function promiseQuestion(){
 const used=new Set((S.pprom||[]).filter(x=>x.s===S.seasonN).map(x=>x.k));
 const o=[['Prometo pelear por subir',{prom:'asc',fans:6,board:2}],['Prometo minutos para la cantera',{prom:'can',fans:3,team:1}],['Prometo un refuerzo de nivel',{prom:'fich',fans:3,team:2}],['Sin promesas: trabajo y humildad',{board:1}]].filter(x=>!x[1].prom||!used.has(x[1].prom));
 return o.length>1?{q:'¿Qué le promete a la afición esta temporada?',o}:null;
}
export function addPressProm(k){S.pprom=(S.pprom||[]).filter(x=>x.s===S.seasonN||x.k==='fich');S.pprom.push({k,s:S.seasonN,w:S.week,until:k==='fich'?S.week+8:null,ok:null});
 news(`Te has comprometido en público: «${PPROM[k]}». La afición y la directiva lo recordarán.`,'',{cat:'pre',subj:'Promesa en la prensa'});}
function settle(x,ok){x.ok=ok;const sq=squad(S.user);
 if(ok){S.cred=clamp((S.cred??70)+4,0,100);if(S.club)S.club.mood=clamp(S.club.mood+5,0,100);S.mgr.conf=clamp(S.mgr.conf+4,0,100);news(`Cumples lo que prometiste en la prensa («${PPROM[x.k]}»): la afición y la directiva confían más en ti.`,'good',{cat:'pre',subj:'Promesa cumplida'});}
 else{S.cred=clamp((S.cred??70)-8,0,100);if(S.club)S.club.mood=clamp(S.club.mood-6,0,100);S.mgr.conf=clamp(S.mgr.conf-8,0,100);sq.forEach(p=>p.hap=clamp((p.hap??70)-2,0,100));news(`No has cumplido lo que prometiste en la prensa («${PPROM[x.k]}»). La afición te lo recuerda y la directiva toma nota.`,'bad',{cat:'pre',subj:'Promesa incumplida'});}}
/** Fichajes que cuentan como refuerzo: llegan y son de los mejores de su línea. */
export function noteSigning(p){S.signs=(S.signs||[]).concat([[S.seasonN,S.week,p.id]]).slice(-20);}
export function pressPromWeekly(){
 (S.pprom||[]).filter(x=>x.ok==null&&x.k==='fich').forEach(x=>{
  const xi=(T(S.user).lineup||[]).map(PL).filter(Boolean),avg=xi.reduce((a,p)=>a+p.ovr,0)/Math.max(1,xi.length);
  const got=(S.signs||[]).some(([s,w,id])=>s===x.s&&w>=x.w&&PL(id)&&PL(id).team===S.user&&PL(id).ovr>=avg-1);
  if(got)settle(x,true);else if(S.week>=x.until)settle(x,false);});
 splitWeekly();
}
export function pressPromSeason(sm){
 (S.pprom||[]).filter(x=>x.ok==null&&x.s===S.seasonN).forEach(x=>{
  if(x.k==='asc')settle(x,!!(sm.up||sm.champ));
  else if(x.k==='can')settle(x,squad(S.user).filter(p=>p.home&&p.st&&p.st.pj>=10).length>=2);
  else if(x.k==='fich')settle(x,false);});
}
export const pressProms=()=>(S.pprom||[]).filter(x=>x.s===S.seasonN||x.ok==null);
/* ---------- Vestuario dividido ---------- */
/** Si rompes una promesa a un jugador influyente, pide salir y arrastra a parte del vestuario. */
export function brokenPromise(p){
 if(!p||p.team!==S.user)return;
 if((p.hap??70)<45&&!p.req&&!p.loan){p.req=1;news(`${p.name} pide salir del club: no perdona que no cumplieras tu palabra.`,'bad',{cat:'pla',from:p.name,subj:'Quiero salir del club',act:[{l:'Hablar con él',a:'chat',id:p.id},{l:'Ver ficha',a:'ficha',id:p.id}]});}
 const L=leaders(4).map(x=>x[0]);if(!L.includes(p)||S.split)return;
 S.split={by:p.id,until:S.week+6};const fr=squad(S.user).filter(x=>x!==p&&!x.loan&&Math.abs(x.age-p.age)<=5).slice(0,4);fr.forEach(x=>x.hap=clamp((x.hap??70)-4,0,100));
 news(`El vestuario se divide: ${p.name}, uno de los líderes, está dolido y ${fr.length?fr.map(x=>x.name.split(' ').slice(-1)[0]).join(', ')+' se ponen de su parte':'tiene apoyos'}. Habla con él, cumple tus próximas promesas o véndelo.`,'bad',{cat:'pla',subj:'⚠️ Vestuario dividido',act:[{l:'Hablar con él',a:'chat',id:p.id}]});
}
export const splitOn=()=>!!(S.split&&S.week<=S.split.until);
function splitWeekly(){const X=S.split;if(!X)return;const p=PL(X.by);
 if(!p||p.team!==S.user||(p.hap??70)>=55||S.week>X.until){S.split=null;news(p&&p.team===S.user&&(p.hap??70)>=55?`${p.name} hace las paces contigo: el vestuario vuelve a estar unido.`:'El vestuario pasa página: se acabó la división.','good',{cat:'pla',subj:'Vestuario unido otra vez'});return;}
 S.chem=clamp((S.chem??60)-1.5,20,100);}
