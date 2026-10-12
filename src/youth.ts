/* El Banquillo · youth.ts — Liga sub-19: tu cantera juega contra las de otros nueve clubes de tu país. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,gauss,pick,rnd,shuffle} from './core';
import {GRP} from './data';
import {LG,S,T,seasonLabel,uLg} from './state';
import {news} from './world';
import {makeFixtures} from './world';
import {poisson} from './engine';

const USER='u';
/** Fuerza de tu sub-19: media de los 11 mejores canteranos (los huecos los cubren juveniles de nivel bajo). */
export function userYouthStr(){const o=(S.academy||[]).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,11);while(o.length<11)o.push(28);return o.reduce((a,b)=>a+b,0)/11;}
/** Crea la liga al empezar la temporada con otros nueve clubes del país de tu liga. */
export function setupYouth(){
 const c=LG(uLg()).c,pool=shuffle(S.teams.filter(t=>t.id!==S.user&&LG(t.lg).c===c)).slice(0,9);
 const base=userYouthStr();
 const teams=[{id:USER,tid:S.user},...pool.map(t=>({id:'t'+t.id,tid:t.id,str:clamp(base+(t.rep-T(S.user).rep)*.35+gauss()*3,25,75)}))];
 const ids=teams.map(t=>t.id),fx=makeFixtures(ids).map(rd=>rd.map(f=>({h:f.h,a:f.a,hg:null,ag:null})));
 S.yl={season:seasonLabel(),teams,fx,round:0};
 (S.academy||[]).forEach(p=>{p.yst={pj:0,g:0,a:0,rs:0};});
}
const yname=t=>T(t.tid).name+' Sub-19';
export const ylName=id=>{const t=S.yl.teams.find(x=>x.id===id);return t?yname(t):'';};
const strOf=id=>id===USER?userYouthStr():S.yl.teams.find(t=>t.id===id).str;
function ylGoals(sh,sa,home){return poisson(clamp(1.35*Math.pow(sh/sa,2.4)*(home?1.1:.92),.2,4.5));}
/** Una jornada sub-19 (cada dos jornadas de liga). */
export function youthRound(){
 if(!S.yl||S.yl.season!==seasonLabel())setupYouth();
 const Y=S.yl;if(Y.round>=Y.fx.length)return;
 const rd=Y.fx[Y.round];
 rd.forEach(f=>{f.hg=ylGoals(strOf(f.h),strOf(f.a),true);f.ag=ylGoals(strOf(f.a),strOf(f.h),false);
  if(f.h===USER||f.a===USER)userYouthMatch(f,f.h===USER?'h':'a');});
 Y.round++;
 if(Y.round===Y.fx.length){const tb=ylTable(),me=tb.findIndex(r=>r.id===USER)+1;
  if(me===1){S.titles=S.titles||[];S.titles.push({season:seasonLabel(),name:'Liga Sub-19'});news(`¡Tu sub-19 gana la liga juvenil! Gran señal para la cantera.`,'good',{cat:'oje',subj:'Campeones de la liga sub-19',act:[{l:'Ver cantera',a:'view',v:'cantera'}]});}
  else news(`Tu sub-19 termina ${me}º en la liga juvenil. Campeón: ${ylName(tb[0].id)}.`,me<=3?'good':'',{cat:'oje',subj:`Liga sub-19: ${me}º puesto`});}
}
/** Reparte minutos, goles, asistencias y notas entre tus canteranos. Jugar ayuda a mejorar. */
function userYouthMatch(f,side){
 const ac=(S.academy||[]).slice().sort((a,b)=>b.ovr-a.ovr),xi=ac.slice(0,11);
 // algún suplente entra en lugar de un titular
 ac.slice(11).forEach(p=>{if(rnd()<.35&&xi.length)xi[Math.floor(rnd()*xi.length)]=p;});
 const my=side==='h'?f.hg:f.ag,op=side==='h'?f.ag:f.hg,res=Math.sign(my-op);
 const w={POR:.02,DEF:.6,MED:2,DEL:5},gl={},as={};
 const pickW=(fn)=>{const c=xi.map(p=>[p,fn(p)]),t=c.reduce((a,x)=>a+x[1],0);let r=rnd()*t;for(const [p,v] of c){r-=v;if(r<=0)return p;}return c.length?c[0][0]:null;};
 for(let i=0;i<my;i++){const s=pickW(p=>w[GRP[p.sp]||p.pos]*(p.at.tir+2));if(s){gl[s.id]=(gl[s.id]||0)+1;if(rnd()<.75){const a=pickW(p=>p===s?0:(p.at.pas+1));if(a)as[a.id]=(as[a.id]||0)+1;}}}
 xi.forEach(p=>{const g=GRP[p.sp]||p.pos;let r=6.2+res*.35+(gl[p.id]||0)+(as[p.id]||0)*.6+gauss()*.5;if(g==='POR'||g==='DEF')r+=op===0?.5:-.15*op;r=clamp(Math.round(r*10)/10,3,10);
  const y=p.yst||(p.yst={pj:0,g:0,a:0,rs:0});y.pj++;y.g+=gl[p.id]||0;y.a+=as[p.id]||0;y.rs+=r;p.ypw=1;});
 S.yl.last={h:f.h,a:f.a,hg:f.hg,ag:f.ag,round:S.yl.round};
}
export function ylTable(){
 const t={};S.yl.teams.forEach(x=>t[x.id]={id:x.id,pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0});
 S.yl.fx.forEach(rd=>rd.forEach(f=>{if(f.hg==null)return;const H=t[f.h],A=t[f.a];H.pj++;A.pj++;H.gf+=f.hg;H.gc+=f.ag;A.gf+=f.ag;A.gc+=f.hg;
  if(f.hg>f.ag){H.g++;A.p++;H.pts+=3;}else if(f.hg<f.ag){A.g++;H.p++;A.pts+=3;}else{H.e++;A.e++;H.pts++;A.pts++;}}));
 return Object.values(t).sort((a,b)=>b.pts-a.pts||(b.gf-b.gc)-(a.gf-a.gc)||b.gf-a.gf);
}
export const YOUTH_USER=USER;
