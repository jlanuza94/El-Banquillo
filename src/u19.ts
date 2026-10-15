/* El Banquillo · u19.ts — Tu sub-19 como plantilla de verdad: tres escalones, Cantera (15-17) → Sub-19 (17-19, al menos 25)
 * → Primer equipo (máximo 30). Puedes convocar juveniles al primer equipo cuando te faltan jugadores (lesiones, sanciones)
 * y devolverlos a la sub-19; cuando un lesionado vuelve, te llega un aviso para bajar a uno. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,gauss,ri} from './core';
import {LG,S,T,dirty,seasonLabel,squad,uLg} from './state';
import {assignNum,baseWage,strength} from './players';
import {makeYouth} from './academy';
import {available} from './state';
import {news} from './world';
import {toast} from './views/common';

export const U19_MIN=25,U19_MAX=30,FIRST_MAX=30;
/** Crea la sub-19 (o la completa hasta 25) con juveniles de 17 a 19 años del nivel de tu club. */
export function ensureU19(){
 if(S.user==null)return;S.u19=S.u19||[];
 if(!S.u19v){S.u19v=1;const old=(S.academy||[]).filter(p=>p.age>=17);S.academy=(S.academy||[]).filter(p=>p.age<17);S.u19.push(...old);}
 const c=LG(uLg()).c,lvl=strength(S.user)/10,fl=S.club&&S.club.fac?S.club.fac.can:1;
 while(S.u19.length<U19_MIN){const y=makeYouth(c,lvl-.4+.12*(fl-1)+gauss()*.9);y.age=ri(17,19);y.u19=1;S.u19.push(y);}
}
export const u19List=()=>(ensureU19(),S.u19);
/** De la cantera a la sub-19. */
export function toU19(id){const i=(S.academy||[]).findIndex(p=>p.id===id);if(i<0)return;if(u19List().length>=U19_MAX)return toast(`La sub-19 ya tiene ${U19_MAX} jugadores.`);
 const p=S.academy.splice(i,1)[0];p.u19=1;S.u19.push(p);toast(`${p.name} sube a la sub-19.`);}
/** Convoca a un juvenil al primer equipo (temporal: sigue siendo de la sub-19 y puede volver). */
export function callUp(id){const i=u19List().findIndex(p=>p.id===id);if(i<0)return;if(squad(S.user).length>=FIRST_MAX)return toast(`El primer equipo ya tiene ${FIRST_MAX} jugadores. Baja a alguien antes.`);
 const p=S.u19.splice(i,1)[0];p.yid=p.id;p.id='p'+(S.nextId++);p.team=S.user;p.cu=1;p.contract=1;p.wage=Math.max(.0005,baseWage(p)*.3);p.energy=100;p.role='jo';p.hap=85;p.home=1;p.ph=p.ph||[[seasonLabel(),p.ovr]];p.h0=p.h0||[p.ovr,seasonLabel(),0];
 S.players[p.id]=p;dirty();assignNum(p);news(`${p.name} entra en la convocatoria del primer equipo desde la sub-19.`,'good',{cat:'pla'});toast(`${p.name} sube al primer equipo (convocado).`);}
/** Devuelve a la sub-19 a un convocado (o a un canterano de 19 años o menos). */
export function sendDown(id){const p=S.players[id];if(!p||p.team!==S.user)return;if(!(p.cu||(p.home&&p.age<=19)))return toast('Solo puedes bajar a la sub-19 a convocados o canteranos de 19 años o menos.');
 if(u19List().length>=U19_MAX)return toast(`La sub-19 ya tiene ${U19_MAX} jugadores.`);
 const t=T(S.user);t.lineup=t.lineup.map(x=>x===id?null:x);t.subs=(t.subs||[]).filter(x=>x!==id);
 delete S.players[id];dirty();p.team=null;p.id=p.yid||('y'+(S.nextId++));p.cu=0;p.u19=1;S.u19.push(p);toast(`${p.name} vuelve a la sub-19.`);}
/** Convierte al convocado en jugador del primer equipo con contrato profesional. */
export function makePermanent(id){const p=S.players[id];if(!p||!p.cu)return;p.cu=0;p.contract=3;p.wage=baseWage(p);news(`${p.name} firma su primer contrato profesional: ya es del primer equipo.`,'good',{cat:'pla'});}
export const callUps=()=>squad(S.user).filter(p=>p.cu);
/** Cada semana: crecen los de la sub-19 y, si un lesionado vuelve teniendo convocados, te avisa. Si te faltan jugadores, te sugiere convocar. */
export function u19Weekly(grow){
 ensureU19();S.u19.forEach(p=>grow(p));
 const sq=squad(S.user),cu=sq.filter(p=>p.cu),inj=sq.filter(p=>!available(p)&&!p.cu).map(p=>p.id),prev=S.injPrev||[];
 const back=prev.filter(id=>!inj.includes(id)&&S.players[id]&&S.players[id].team===S.user);
 if(cu.length&&back.length)news(`${back.map(id=>S.players[id].name).join(', ')} ${back.length>1?'vuelven':'vuelve'} a estar disponible${back.length>1?'s':''}. Tienes ${cu.length} juvenil${cu.length>1?'es':''} convocado${cu.length>1?'s':''} de la sub-19: puedes bajar a uno.`,'',{cat:'pla',subj:'Un lesionado vuelve: ¿bajas a un juvenil?',act:[{l:'Ir a la sub-19',a:'view',v:'cantera'}]});
 const av=sq.filter(available).length;if(av<16&&S.u19warn!==S.week&&S.u19.length){S.u19warn=S.week;news(`Solo tienes ${av} jugadores disponibles. Puedes convocar a juveniles de la sub-19 al primer equipo.`,'bad',{cat:'pla',subj:'Faltan jugadores',act:[{l:'Ir a la sub-19',a:'view',v:'cantera'}]});}
 S.injPrev=inj;
}
/** Fin de temporada: los de 19 que cumplen 20 deben subir o se marchan; los convocados vuelven a la sub-19 si no firmaron. */
export function u19SeasonEnd(){
 ensureU19();const out=S.u19.filter(p=>p.age+1>=20).map(p=>p.name);S.u19=S.u19.filter(p=>p.age+1<20);S.u19.forEach(p=>p.age++);
 if(out.length)news(`Sub-19: ${out.join(', ')} ${out.length>1?'dejan':'deja'} el club al cumplir 20 años sin subir al primer equipo.`,'bad',{cat:'oje'});
 callUps().forEach(p=>sendDown(p.id));
 const up=(S.academy||[]).filter(p=>p.age+1>=17);up.forEach(p=>{if(S.u19.length<U19_MAX){S.academy=S.academy.filter(x=>x!==p);p.u19=1;S.u19.push(p);}});
 ensureU19();
}
