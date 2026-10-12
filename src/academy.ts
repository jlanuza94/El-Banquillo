/* El Banquillo · academy.js — Cantera y ojeadores. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {scoutAttrs,youthMult} from './staff';
import {clamp,gauss,money,pick,r2,r3,ri,rnd} from './core';
import {COUNTRIES,NAMES,POS_NAME,W} from './data';
import {LG,S,dirty,seasonLabel,squad,uLg,unit} from './state';
import {assignNum,baseWage,decorate,genAttrs,rateA,setValue,strength,wpick} from './players';
import {news} from './world';
import {toast} from './views/common';
export const REGIONS=[{n:'Península Ibérica',c:[0,5]},{n:'Islas Británicas y Francia',c:[1,4]},{n:'Europa Central',c:[2,3,8]},{n:'Sudamérica',c:[6,7],b:.25},{n:'Norte y Centroamérica',c:[9]}];
export const regionOf=c=>REGIONS.findIndex(R=>R.c.includes(c));
export function makeYouth(nat,potT){
 const pos=pick(['POR','DEF','DEF','MED','MED','MED','DEL','DEL']),age=ri(15,17),pot=r2(clamp(potT,2.5,9.8)),cur=clamp(pot-(3.4-(age-15)*.5)-rnd()*.8,1.5,pot);
 const [F,L]=NAMES[COUNTRIES[nat].lang];
 const p={id:'y'+(S.nextId++),name:pick(F)+' '+pick(L),nat,pos,age,at:genAttrs(pos,cur),pot,team:null,num:0,energy:100,form:0,goals:0,apps:0,yc:0,inj:0,susp:0,pInj:0,pSusp:0,playedWk:false,contract:3,loan:null,sg:0,tf:'auto'};
 decorate(p,null,true);p.wage=baseWage(p);p.role='jo';return p;
}
export function academyIntake(n){const c=LG(uLg()).c,lvl=strength(S.user)/10,fl=S.club?S.club.fac.can:1;n+=Math.floor((fl-1)/2);const got=[];for(let i=0;i<n&&S.academy.length<14;i++){const y=makeYouth(c,lvl+.3+.15*(fl-1)+gauss()*.9);S.academy.push(y);got.push(y.name);}return got;}
export function genScoutPool(){const [F,L]=NAMES[COUNTRIES[LG(uLg()).c].lang];S.scoutPool=[0,1,2,3].map(()=>{const q=clamp(Math.round(1+rnd()*4.4),1,5);return scoutAttrs({id:'s'+(S.nextId++),name:pick(F)+' '+pick(L),q,wage:r3(Math.max(.0005,unit(LG(uLg()).rep)*.012*q))});});}
export function scoutsWeekly(){
 S.prospects=S.prospects.filter(x=>x.until>S.week);
 S.scouts.filter(sc=>sc.job!=='sen').forEach(sc=>{if(S.prospects.length>=12||rnd()>.16+.05*sc.q)return;const R=REGIONS[sc.reg],nat=pick(R.c);
  const pot=clamp(5.6+.35*sc.q+(COUNTRIES[nat].top-68)*.04+(R.b||0)+gauss()*.9,3,9.8),y=makeYouth(nat,pot),err=(6-sc.q)*.35,u=rnd();
  const fee=r3(Math.max(.002,.006*Math.pow(1.7,y.pot-5)*(1+(COUNTRIES[nat].top-60)/40)));
  S.prospects.unshift({p:y,fee,est:[r2(clamp(y.pot-err*u,1,10)),r2(clamp(y.pot+err*(1-u),1,10))],scout:sc.name,reg:sc.reg,until:S.week+8});
  news(`Tu ojeador ${sc.name} recomienda a ${y.name} (${COUNTRIES[nat].n}, ${y.age} años, ${POS_NAME[y.pos].toLowerCase()}).`,'good',{cat:'oje',from:sc.name,subj:`Talento juvenil: ${y.name}`,act:[{l:'Ver informes',a:'view',v:'cantera'}]});});
}
export function academyWeekly(){S.academy.forEach(p=>{if(rnd()<.2*youthMult()&&rateA(p.at,p.pos)<p.pot){const k=wpick(W[p.pos]);if(p.at[k]<10){p.at[k]++;p.ovr=Math.round(rateA(p.at,p.pos)*10);setValue(p);}}});
 if(S.week===30){const old=S.academy.filter(p=>p.age>=18);if(old.length)news(`Cantera: ${old.map(p=>p.name).join(', ')} cumple${old.length>1?'n':''} 19 la próxima temporada. Súbelos al primer equipo o se marcharán.`,'bad');}}
export function promoteYouth(id){
 const i=S.academy.findIndex(p=>p.id===id);if(i<0)return;if(squad(S.user).length>=30)return toast('Tu plantilla ya tiene 30 jugadores.');
 const p=S.academy.splice(i,1)[0];p.id='p'+(S.nextId++);p.team=S.user;p.contract=3;p.wage=baseWage(p);p.energy=100;p.role='jo';p.hap=80;p.home=1;p.ph=[[seasonLabel(),p.ovr]];S.players[p.id]=p;dirty();assignNum(p);
 news(`${p.name} sube de la cantera al primer equipo.`,'good');toast(`${p.name} ya está en el primer equipo.`);
}
export function signProspect(id){
 const i=S.prospects.findIndex(x=>x.p.id===id);if(i<0)return;const x=S.prospects[i];
 if(S.academy.length>=14)return toast('La cantera está llena (14). Sube o libera a alguien antes.');
 if(S.budget<x.fee)return toast('No tienes presupuesto para pagar su incorporación.');
 S.budget=r3(S.budget-x.fee);S.academy.push(x.p);S.prospects.splice(i,1);news(`${x.p.name} se incorpora a tu cantera por ${money(x.fee)}.`,'good');toast(`${x.p.name} se une a la cantera.`);
}
export const scoutWages=()=>S.scouts.reduce((a,x)=>a+x.wage,0);
