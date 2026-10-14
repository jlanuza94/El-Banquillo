/* El Banquillo · monthly.ts — Premios del mes en las ligas de tu país: jugador del mes, el mejor de cada
 * línea, el mejor joven y el entrenador del mes. Se dan tras la última jornada de cada mes. */
// @ts-nocheck — usa el estado heredado S.
import {GRP} from './data';
import {LG,S,T,lgTeams,squad,uLg} from './state';
import {MONTHS_L,dateOf,lgDay} from './calendar';
import {news} from './world';
import {clamp} from './core';
import {giveBadge} from './mgrcareer';

const nR=lg=>(S.fixtures[lg]||[]).length;
const monthKey=r=>{const d=dateOf(lgDay(r));return d.getUTCFullYear()*12+d.getUTCMonth();};
export const monthName=r=>{const d=dateOf(lgDay(r));return `${MONTHS_L[d.getUTCMonth()]} ${d.getUTCFullYear()}`;};
/** Ligas que reparten premios del mes: las de tu país. */
export const monthlyLeagues=()=>{const c=LG(uLg()).c;return S.leagues.filter(L=>L.c===c).map(L=>L.id);};
const snapOf=p=>{const s=p.st||{};return [s.pj||0,s.rs||0,s.g||0,s.a||0];};
/** ¿Es la última jornada de su mes? */
export const endsMonth=(r,lg)=>r>=nR(lg)-1||monthKey(r)!==monthKey(r+1);
/** Tras cada jornada de liga (r): si cierra un mes, entrega los premios y guarda la foto para el mes siguiente. */
export function monthlyAwards(r){
 const lgs=monthlyLeagues();if(!lgs.length||!endsMonth(r,lgs[0]))return;
 const key=monthKey(r),snap=S.monSnap||{};S.monthly=S.monthly||{};
 const rounds=[];for(let k=r;k>=0&&monthKey(k)===key;k--)rounds.push(k);
 lgs.forEach(lg=>{
  const pl=lgTeams(lg).flatMap(t=>squad(t.id)).map(p=>{const a=snapOf(p),b=snap[p.id]||[0,0,0,0],pj=a[0]-b[0];return {p,pj,r:pj?(a[1]-b[1])/pj:0,g:a[2]-b[2],a:a[3]-b[3]};}).filter(x=>x.pj>=Math.min(2,rounds.length));
  const sc=x=>x.r+.18*x.g+.1*x.a+.05*x.pj,best=L=>L.slice().sort((a,b)=>sc(b)-sc(a))[0],rec=x=>x?{pid:x.p.id,name:x.p.name,club:T(x.p.team).short,tid:x.p.team,pj:x.pj,r:Math.round(x.r*100)/100,g:x.g,a:x.a}:null;
  const pom=best(pl),pos={};['POR','DEF','MED','DEL'].forEach(g=>{pos[g]=rec(best(pl.filter(x=>GRP[x.p.sp]===g)));});
  const pts={};rounds.forEach(k=>(S.fixtures[lg][k]||[]).forEach(f=>{if(!f.played)return;pts[f.h]=(pts[f.h]||0)+(f.hg>f.ag?3:f.hg===f.ag?1:0);pts[f.a]=(pts[f.a]||0)+(f.ag>f.hg?3:f.hg===f.ag?1:0);}));
  const ct=Object.entries(pts).sort((a,b)=>b[1]-a[1]||(S.exp?(S.exp[b[0]]||0)-(S.exp[a[0]]||0):0))[0];
  const cid=ct?(T(+ct[0])?+ct[0]:ct[0]):null,coach=ct?{tid:cid,pts:ct[1],of:rounds.length*3,name:cid===S.user?'Tú':((S.coaches&&S.coaches[cid]&&S.coaches[cid].name)||'Su entrenador')}:null;
  const A={m:monthName(r),sn:S.seasonN,pom:rec(pom),pos,young:rec(best(pl.filter(x=>x.p.age<=21))),coach};
  (S.monthly[lg]=S.monthly[lg]||[]).push(A);if(S.monthly[lg].length>24)S.monthly[lg].shift();
  if(lg===uLg()){
   if(A.pom&&A.pom.tid===S.user)news(`🏅 ${A.pom.name} es el jugador del mes de ${A.m.toLowerCase()} en tu liga: ${A.pom.r.toFixed(2)} de nota, ${A.pom.g} goles y ${A.pom.a} asistencias.`,'good',{cat:'pla',subj:`Jugador del mes: ${A.pom.name}`});
   if(coach&&coach.tid===S.user){news(`🏅 Eres el entrenador del mes de ${A.m.toLowerCase()}: ${coach.pts} de ${coach.of} puntos.`,'good',{cat:'dir',subj:'Entrenador del mes'});if(S.mgr)S.mgr.rep=clamp(S.mgr.rep+1,0,100);giveBadge('mes');}
  }
 });
 const ns={};lgs.forEach(lg=>lgTeams(lg).forEach(t=>squad(t.id).forEach(p=>{ns[p.id]=snapOf(p);})));S.monSnap=ns;
}
