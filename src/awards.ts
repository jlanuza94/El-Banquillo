/* El Banquillo · awards.ts — Premios de temporada, once ideal y Balón de Oro. */
// @ts-nocheck — usa el estado heredado S.
import {wcs} from './state';
import {COUNTRIES,GRP} from './data';
import {LG,PL,S,T,findLg,lgName,seasonLabel,squad} from './state';
import {news} from './world';
import {table} from './tactics';

// posiciones en liga, calculadas una vez por cálculo de premios
let PC=null;
const posC=tid=>{if(!PC)PC={};if(PC[tid]==null){table(T(tid).lg).forEach((r,i)=>PC[r.id]=i+1);}return PC[tid];};

const avgR=p=>p.st&&p.st.pj?p.st.rs/p.st.pj:0;
/** Puntuación de una temporada: nota media, goles, asistencias, MVP, posición del equipo y nivel de la liga. */
export function seasonScore(p,world){
 const s=p.st;if(!s||!s.pj)return 0;const L=LG(T(p.team).lg),pos=posC(p.team);
 let v=avgR(p)*10+s.g*.55+s.a*.35+s.mv*.4+(GRP[p.sp]==='POR'||GRP[p.sp]==='DEF'?s.cs*.3:0)+Math.max(0,(21-pos))*.12+(pos===1?2:0);
 if(world)v*=Math.pow(L.rep/75,2);
 return v;
}
/** Mínimo de partidos para optar a premios a estas alturas de temporada. */
export const minPJ=()=>Math.max(3,Math.round((S.tg||S.week||0)*.4));
export function playersOf(lg){return S.teams.filter(t=>t.lg===lg).flatMap(t=>squad(t.id));}
export function ranking(list,world,n=10){PC=null;const m=minPJ();return list.filter(p=>p.team!==null&&p.st&&p.st.pj>=m).map(p=>[p,seasonScore(p,world)]).sort((a,b)=>b[1]-a[1]).slice(0,n);}
/** Once ideal de una liga en 4-3-3, por nota media (con un mínimo de partidos). */
export function bestXI(lg){
 const m=minPJ(),pool=playersOf(lg).filter(p=>p.st&&p.st.pj>=m),used=new Set(),xi=[];
 const need=[['POR',['POR']],['LD',['LD']],['DFC',['DFC']],['DFC',['DFC']],['LI',['LI']],['MC',['MC','MCD']],['MCD',['MCD','MC']],['MCO',['MCO','MC']],['ED',['ED','MD']],['DC',['DC']],['EI',['EI','MI']]];
 need.forEach(([slot,ok])=>{const c=pool.filter(p=>!used.has(p.id)&&(ok.includes(p.sp)||(p.alt||[]).includes(slot))).sort((a,b)=>avgR(b)-avgR(a))[0];if(c){used.add(c.id);xi.push([slot,c]);}else xi.push([slot,null]);});
 return xi;
}
const card=p=>p?{pid:p.id,name:p.name,club:T(p.team).name,c:p.team,nat:p.nat,age:p.age,sp:p.sp,g:p.st.g,a:p.st.a,r:Math.round(avgR(p)*100)/100}:null;
/** Se calcula al terminar la temporada (antes de borrar las estadísticas). */
export function seasonAwards(){
 const all=Object.values(S.players).filter(p=>p.team!==null),m=minPJ();
 const world=ranking(all,true,10);
 const boot=all.filter(p=>p.st&&p.st.g).sort((a,b)=>b.st.g-a.st.g||a.st.pj-b.st.pj)[0];
 const young=ranking(all.filter(p=>p.age<=21),true,1)[0];
 const gk=all.filter(p=>p.sp==='POR'&&p.st&&p.st.pj>=m).sort((a,b)=>seasonScore(b,true)-seasonScore(a,true))[0];
 const leagues={};wcs().forEach(c=>{const L=findLg(c,0),b=ranking(playersOf(L.id),false,1)[0];if(b)leagues[L.id]=card(b[0]);});
 const my=T(S.user).lg;if(!leagues[my]){const b=ranking(playersOf(my),false,1)[0];if(b)leagues[my]=card(b[0]);}
 const xi=bestXI(my).map(([s,p])=>[s,card(p)]);
 const A={season:seasonLabel(),ballon:world.map(([p])=>card(p)),boot:card(boot),young:young?card(young[0]):null,gk:card(gk),leagues,xi,xiLg:my};
 S.awards=(S.awards||[]).concat([A]).slice(-25);
 const mine=[];if(A.ballon[0]&&A.ballon[0].c===S.user)mine.push(`${A.ballon[0].name} gana el Balón de Oro`);
 if(A.boot&&A.boot.c===S.user)mine.push(`${A.boot.name} gana la Bota de Oro con ${A.boot.g} goles`);
 if(A.young&&A.young.c===S.user)mine.push(`${A.young.name} es el mejor joven del mundo`);
 if(leagues[my]&&leagues[my].c===S.user)mine.push(`${leagues[my].name} es el mejor jugador de ${lgName(my)}`);
 const inXI=xi.filter(([,c])=>c&&c.c===S.user).length;if(inXI)mine.push(`${inXI} de los tuyos en el once ideal de la liga`);
 news(`Premios ${A.season}: Balón de Oro para ${A.ballon[0]?A.ballon[0].name+' ('+A.ballon[0].club+')':'—'}. Bota de Oro: ${A.boot?A.boot.name+' ('+A.boot.g+' goles)':'—'}.${mine.length?' '+mine.join('. ')+'.':''}`,mine.length?'good':'',{cat:'com',subj:`Premios de la temporada ${A.season}`,act:[{l:'Ver premios',a:'view',v:'premios'}]});
 return A;
}
