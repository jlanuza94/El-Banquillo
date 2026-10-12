/* El Banquillo · living.ts — Mundo vivo: entrenadores con nombre, despidos, fichajes bomba, retirados que entrenan e historia de cada club. */
// @ts-nocheck — usa el estado heredado S.
import {CONTS} from './competitions';
import {clamp,gauss,money,pick,ri,rnd} from './core';
import {COUNTRIES,FORMS,NAMES,TAC0} from './data';
import {LG,S,T,lgName,seasonLabel,squad,uLg} from './state';
import {news} from './world';
import {strength} from './players';
import {table} from './tactics';

/** Estilos de juego de los entrenadores rivales: instrucciones y formaciones favoritas. */
export const STYLES={
 equ:{n:'Equilibrado',tac:{},f:['4-4-2','4-2-3-1','4-3-3']},
 pos:{n:'Posesión',tac:{est:'pos',pre:'alt',lin:'alt'},f:['4-3-3','4-2-3-1','3-4-3']},
 con:{n:'Contragolpe',tac:{est:'con',pre:'baj',lin:'baj'},f:['4-4-2','5-3-2','4-5-1']},
 dir:{n:'Juego directo',tac:{est:'dir',anc:'anc'},f:['4-4-2','4-1-4-1','3-5-2']},
 pre:{n:'Presión alta',tac:{pre:'alt',rit:'rap'},f:['4-3-3','3-4-3','4-2-3-1']},
};
function makeCoach(nat,rep,name){
 const [F,L]=NAMES[COUNTRIES[nat].lang];
 return{name:name||pick(F)+' '+pick(L),nat,age:ri(36,64),rep:clamp(Math.round(rep),5,99),st:pick(Object.keys(STYLES)),since:S.seasonN,w:0,d:0,l:0,tw:0,td:0,tl:0};
}
const levelRep=t=>clamp((LG(t.lg).rep-38)*1.6+(t.rep-LG(t.lg).rep)*2+gauss()*6,5,95);
/** Aplica el estilo del entrenador a su equipo (no al tuyo). */
export function applyStyle(t){const c=S.coaches[t.id];if(!c||t.id===S.user)return;const St=STYLES[c.st];t.tac=Object.assign({},TAC0,St.tac);if(!St.f.includes(t.formation))t.formation=pick(St.f);}
export function initCoaches(){
 if(S.coaches)return;S.coaches={};S.coachPool=[];S.chist=S.chist||{};S.exPlayers=S.exPlayers||[];
 S.teams.forEach(t=>{if(t.id===S.user)return;S.coaches[t.id]=makeCoach(rnd()<.8?LG(t.lg).c:ri(0,COUNTRIES.length-1),levelRep(t));applyStyle(t);});
 for(let i=0;i<20;i++){const c=ri(0,COUNTRIES.length-1);S.coachPool.push(makeCoach(c,ri(10,70)));}
}
export const coachOf=tid=>S.coaches&&S.coaches[tid];
/** Expectativa de cada club en su liga (puesto por fuerza), al empezar la temporada. */
export function setExpectations(){S.exp={};S.leagues.forEach(L=>{S.teams.filter(t=>t.lg===L.id).map(t=>[t.id,strength(t.id)]).sort((a,b)=>b[1]-a[1]).forEach(([id],i)=>S.exp[id]=i+1);});}
/** Resultado de cada partido oficial: suma al historial del entrenador. */
export function coachResult(m){
 if(!S.coaches||m.ref.k==='fr')return;
 ['h','a'].forEach(s=>{const c=S.coaches[m[s]];if(!c)return;const o=s==='h'?'a':'h',d=m.score[s]-m.score[o];if(d>0){c.w++;c.tw++;}else if(d<0){c.l++;c.tl++;}else{c.d++;c.td++;}});
}
function hireFor(t,why){
 const old=S.coaches[t.id],need=levelRep(t);
 let i=S.coachPool.map((c,k)=>[c,k]).filter(([c])=>c.rep<=need+12).sort((a,b)=>b[0].rep-a[0].rep)[0];
 const c=i?S.coachPool.splice(i[1],1)[0]:makeCoach(LG(t.lg).c,need);
 c.since=S.seasonN;c.w=c.d=c.l=0;S.coaches[t.id]=c;if(old){old.rep=clamp(old.rep-6,5,99);S.coachPool.push(old);if(S.coachPool.length>40)S.coachPool.shift();}
 applyStyle(t);
 const loud=t.lg===uLg();
 news(`${t.name} ${why==='sack'?'destituye a '+(old?old.name:'su entrenador'):'cambia de entrenador: se marcha '+(old?old.name:'el anterior')} y ficha a ${c.name} (${STYLES[c.st].n.toLowerCase()}).`,loud?'':'',{cat:'not',from:'Prensa deportiva',subj:`${why==='sack'?'Destitución':'Relevo'} en ${t.name}`,quiet:!loud,act:[{l:'Ver club',a:'club-open',id:t.id}]});
}
/** Cada pocas jornadas, las directivas impacientes despiden a sus entrenadores. */
export function coachesWeekly(){
 if(!S.coaches||S.week<10||S.week%3)return;if(!S.exp)setExpectations();
 S.leagues.forEach(L=>{const tb=table(L.id);tb.forEach((r,i)=>{const t=T(r.id);if(t.id===S.user)return;const c=S.coaches[t.id],pos=i+1,exp=S.exp[t.id]||10;
  if(c&&c.since===S.seasonN&&S.week<20)return;              // margen al recién llegado
  if(pos-exp>=6&&pos>=14&&rnd()<.12)hireFor(t,'sack');});});
}
/** Fin de temporada: historia de cada club, reputación de los entrenadores y algún relevo. */
export function livingSeasonEnd(tabs){
 S.chist=S.chist||{};const sn=seasonLabel();
 S.leagues.forEach((L,i)=>tabs[i].forEach((r,k)=>{const H=S.chist[r.id]=S.chist[r.id]||{t:[],s:[]};H.s.push([sn,L.id,k+1]);if(H.s.length>15)H.s.shift();if(k===0)H.t.push([sn,'Liga · '+lgName(L.id)]);
  const c=S.coaches&&S.coaches[r.id];if(c){const exp=S.exp?S.exp[r.id]||10:10;c.rep=clamp(c.rep+(exp-(k+1))*.6+(k===0?6:0),5,99);c.w=c.d=c.l=0;c.age++;}}));
 (S.cups||[]).forEach((cu,c)=>{if(cu.winner!=null){const H=S.chist[cu.winner]=S.chist[cu.winner]||{t:[],s:[]};H.t.push([sn,'Copa de '+COUNTRIES[c].n]);}});
 (S.conts||[]).forEach((C,i)=>{if(C.winner!=null){const H=S.chist[C.winner]=S.chist[C.winner]||{t:[],s:[]};H.t.push([sn,CONTS[i].n]);}});
 if(S.cwc&&S.cwc.winner!=null){const H=S.chist[S.cwc.winner]=S.chist[S.cwc.winner]||{t:[],s:[]};H.t.push([sn,'Mundial de Clubes']);}
 if(!S.coaches)return;
 // relevos de verano: los clubes que han fallado mucho buscan entrenador; a veces se llevan a uno que ha brillado en un club menor
 S.leagues.forEach((L,i)=>tabs[i].forEach((r,k)=>{const t=T(r.id);if(t.id===S.user)return;const exp=S.exp?S.exp[r.id]||10:10;
  if(k+1-exp>=5&&rnd()<.5){const star=S.teams.filter(x=>x.id!==S.user&&x.id!==t.id&&S.coaches[x.id]&&LG(x.lg).rep<LG(t.lg).rep&&S.coaches[x.id].rep>=levelRep(t)-5).map(x=>[x,S.coaches[x.id]]).sort((a,b)=>b[1].rep-a[1].rep)[0];
   if(star&&rnd()<.4){const [from,c]=star,old=S.coaches[t.id];S.coaches[t.id]=c;c.since=S.seasonN+1;if(old)S.coachPool.push(old);applyStyle(t);hireFor(from,'move');news(`${c.name} deja ${from.name} para entrenar a ${t.name}.`,'',{cat:'not',from:'Prensa deportiva',subj:`${c.name} ficha por ${t.name}`,quiet:t.lg!==uLg()&&from.lg!==uLg()});}
   else hireFor(t,'sack');}}));
 S.coaches[S.user]&&delete S.coaches[S.user];
 // retirados que pasan a entrenar
 (S.exPlayers||[]).splice(0).forEach(x=>{if(rnd()<.6){const c=makeCoach(x.nat,clamp(25+x.fame,10,80),x.name);c.age=x.age+1;c.ex=1;S.coachPool.push(c);}});
}
/** Un jugador importante se retira: puede volver como técnico (en tu cuerpo técnico o en otro banquillo). */
export function onRetire(p){
 if(p.team===null)return;const fame=(p.car?p.car[0]/12+p.car[1]/4:0)+(p.at.lid??5)*2;
 if(fame<25&&(p.at.lid??5)<7)return;
 S.exPlayers=S.exPlayers||[];S.exPlayers.push({name:p.name,nat:p.nat,age:p.age,sp:p.sp,fame:Math.round(fame),at:{lid:p.at.lid??5,dec:p.at.dec??5,vis:p.at.vis??5,con:p.at.con??5,col:p.at.col??5}});
 if(S.exPlayers.length>12)S.exPlayers.shift();
}
/** Fichajes bomba del mundo: llegan a la bandeja como noticia destacada. */
export function bigTransfer(p,from,to,fee){
 const top=.4*20;if(fee<top)return false;
 news(`¡Bombazo! ${T(to).name} paga ${money(fee)} a ${from!=null?T(from).name:'nadie'} por ${p.name} (${(p.ovr/10).toFixed(1)}, ${p.age} años).`,'',{cat:'not',from:'Prensa deportiva',subj:`Fichaje bomba: ${p.name} por ${money(fee)}`,quiet:false,act:[{l:'Ver ficha',a:'ficha',id:p.id}]});
 return true;
}

/** Cuando cambias de club: tu nuevo club deja de tener entrenador y el que dejas contrata uno. */
export function coachHandover(oldId,newId){
 if(!S.coaches)return;delete S.coaches[newId];
 if(oldId!=null&&!S.coaches[oldId]){const t=T(oldId);S.coaches[oldId]=makeCoach(LG(t.lg).c,levelRep(t));applyStyle(t);}
}
/** Ex-jugadores que pueden entrar en tu cuerpo técnico. */
export function takeExPlayers(n){return (S.exPlayers||[]).splice(0,n);}
