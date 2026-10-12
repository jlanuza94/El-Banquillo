/* El Banquillo · youthplus.ts — Cantera con más vida: director de cantera, Torneo Internacional Sub-19 y generaciones doradas. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,gauss,pick,r2,rnd,shuffle} from './core';
import {COUNTRIES,W} from './data';
import {LG,S,T,seasonLabel,uLg} from './state';
import {news} from './world';
import {crew} from './staff';
import {rateA,setValue,wpick} from './players';
import {poisson} from './engine';

/** Nivel del director de cantera (1-10). Sin director, 3. */
export function dcaLevel(){const m=crew('dca')[0];return m?(m.at.jov+m.at.jpo)/2:3;}
/** Potencial extra de los juveniles que llegan, según el director. */
export const dcaPotBonus=()=>(dcaLevel()-5)*.08;

/* ---------- Generaciones doradas ---------- */
/** Probabilidad de que este verano llegue una generación dorada. */
export const goldenChance=()=>clamp(.04+.015*(dcaLevel()-5)+.01*((S.club&&S.club.fac.can)||1),.02,.16);
/** Al llegar los juveniles del verano: a veces, una generación dorada con varios talentos de golpe. */
export function maybeGolden(makeYouth){
 if(rnd()>goldenChance())return [];const c=LG(uLg()).c,base=Math.max(5.6,LG(uLg()).rep/10+.8),got=[];
 for(let i=0;i<4&&S.academy.length<16;i++){const y=makeYouth(c,base+1+rnd()*1.2);y.gold=1;S.academy.push(y);got.push(y.name);}
 if(got.length){(S.golden=S.golden||[]).push(seasonLabel());news(`¡Generación dorada! Llegan a la cantera ${got.length} chavales con un talento fuera de lo normal: ${got.join(', ')}. Tu director de cantera no recuerda nada igual.`,'good',{cat:'oje',subj:'¡Generación dorada en la cantera!',act:[{l:'Ver la cantera',a:'view',v:'cantera'}]});}
 return got;
}

/* ---------- Torneo Internacional Sub-19 ---------- */
export const YT_WEEK=19;
const ytName='Torneo Internacional Sub-19';
/** Fuerza de una cantera: media de sus 11 mejores (o chavales de relleno si no llega). */
function myYouthStrength(){const v=S.academy.map(p=>p.ovr).sort((a,b)=>b-a).slice(0,11);while(v.length<11)v.push(30);return v.reduce((a,b)=>a+b,0)/11;}
/** En el parón de invierno tu cantera juega un torneo de 8 equipos a eliminatoria. */
export function youthTournament(){
 if(S.week!==YT_WEEK||!S.academy||S.academy.length<6)return;
 const myC=LG(uLg()).c,rivals=shuffle(S.teams.filter(t=>t.id!==S.user&&LG(t.lg).lv===0&&LG(t.lg).c!==myC)).slice(0,7);
 const my=myYouthStrength(),teams=[{id:S.user,n:T(S.user).name,s:my}].concat(rivals.map(t=>({id:t.id,n:t.name,s:clamp(COUNTRIES[LG(t.lg).c].top-18+gauss()*3,30,70)})));
 let round=shuffle(teams.slice()),log=[],names=['Cuartos','Semifinal','Final'],k=0,mine=[];
 while(round.length>1){const next=[];for(let i=0;i<round.length;i+=2){const a=round[i],b=round[i+1],d=(a.s-b.s)/8;let ga=poisson(1.3*Math.exp(d/2)),gb=poisson(1.3*Math.exp(-d/2)),pen='';
   if(ga===gb){pen=rnd()<.5+clamp(d/10,-.2,.2)?' (gana en penaltis)':' (pierde en penaltis)';}
   const aw=ga>gb||(ga===gb&&pen.includes('gana')),w=aw?a:b;next.push(w);
   if(a.id===S.user||b.id===S.user){const me=a.id===S.user,mg=me?ga:gb,og=me?gb:ga,opp=me?b:a,won=w.id===S.user;mine.push(`${names[k]}: ${mg}-${og} ante ${opp.n}${ga===gb?(won?' (penaltis)':' (penaltis)'):''}${won?'':' · eliminados'}`);}}
  round=next;k++;}
 const champ=round[0].id===S.user;
 // los que juegan el torneo crecen
 S.academy.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11).forEach(p=>{p.ypw=1;if(rnd()<(champ?.6:.35)&&rateA(p.at,p.pos)<p.pot){const kk=wpick(W[p.pos]);if(p.at[kk]<10){p.at[kk]++;p.ovr=Math.round(rateA(p.at,p.pos)*10);setValue(p);}}});
 if(champ){S.titles.push({season:seasonLabel(),name:ytName});}
 (S.ytHist=S.ytHist||[]).push({season:seasonLabel(),champ:round[0].n,mine:champ});
 news(`${ytName}: ${mine.join(' · ')}.${champ?' ¡Tu cantera es campeona!':` Campeón: ${round[0].n}.`} Los que jugaron han dado un paso adelante.`,champ?'good':'',{cat:'oje',subj:champ?`¡Tu cantera gana el ${ytName}!`:`${ytName}: ${mine.length?mine[mine.length-1].split(':')[0]:'eliminados'}`});
}
