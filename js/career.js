/* El Banquillo · career.js — Carrera del entrenador: contrato, confianza, despidos y ofertas. */
"use strict";
const clubReq=t=>clamp((LG(t.lg).rep-38)*1.6+(t.rep-LG(t.lg).rep)*2,0,100);
const mgrSalary=t=>r3(Math.max(.001,unit(LG(t.lg).rep)*.1*(.8+clubReq(t)/250)));
const mgrEnd=()=>2025+S.seasonN+S.mgr.yrs;
function jobCandidates(maxReq,minReq,n){return shuffle(S.teams.filter(t=>t.id!==S.user&&clubReq(t)<=maxReq&&clubReq(t)>=minReq)).slice(0,n);}
function makeJobOffer(t){return{team:t.id,sal:r3(mgrSalary(t)*(.9+rnd()*.3)),yrs:ri(2,3)};}
function loseJob(reason){const r=S.mgr.rep;let c=jobCandidates(r,Math.max(0,r-30),5);if(c.length<3)c=c.concat(jobCandidates(r+8,0,5-c.length));S.jobless={reason,offers:c.map(makeJobOffer)};S.jobOffers=[];S.modal=null;}
function takeJob(o){
 const t=T(o.team),old=S.user;if(old!=null)T(old).lineup=[];
 S.user=t.id;Object.assign(S.mgr,{sal:o.sal,yrs:o.yrs,conf:60,warned:0});S.mgr.countries=Array.from(new Set((S.mgr.countries||[]).concat([LG(t.lg).c])));if(S.mgr.countries.length>=3)unlock('nomad');S.press=null;S.breq=null;S.mgr.clubs.push({season:seasonLabel(),club:t.name});
 initClub(t);S.budget=startBudget(t);S.chem=50;S.famil={};S.famil[t.formation]=60;S.lastXI=[];S.staff={pre:1,fis:1};S.scouts=[];S.prospects=[];S.academy=[];genScoutPool();academyIntake(3);
 S.offers={};S.neg={};S.ren={};S.lo={};S.loanTry={};S.fin=[];S.jobOffers=[];S.jobless=null;S.obj=objectiveFor(t.id);S.sel=null;
 t.lineup=autoLineup(t.id,t.formation);S.view='inicio';S.modal=null;S.ligaLg=t.lg;assignRoles(true);squad(S.user).forEach(p=>{p.hap=65;p.req=0;p.prom=null;if(!p.ph)p.ph=[[seasonLabel(),p.ovr]];});S.mgr.joinN=S.seasonN;
 news(`Nuevo reto: firmas por ${t.name} (${lgName(t.lg)}) hasta junio de ${mgrEnd()} por ${money(o.sal)}/semana. Objetivo: ${S.obj.txt.toLowerCase()}.`,'good');
 advance();
}
function mgrWeekly(my,op){
 const M=S.mgr,pos=posOf(S.user);let d=my>op?3:my<op?-3:.5;d+=pos<=S.obj.max?.5:-Math.min(2,(pos-S.obj.max)*.25);if(S.budget<0)d-=1.5;
 M.conf=clamp(M.conf+d,0,100);M.savings=r3(M.savings+M.sal);
 if(M.conf<25&&!M.warned){M.warned=1;news('La directiva está descontenta. Si los resultados no mejoran, peligra tu puesto.','bad');}
 if(M.conf>=35)M.warned=0;
 if(S.club&&S.club.mood<30)M.conf=clamp(M.conf-.5,0,100);
 if(S.week>=8&&M.conf<8){news(`Despedido: la directiva de ${T(S.user).name} prescinde de ti.`,'bad');M.rep=clamp(M.rep-6,0,100);loseJob('despido');return;}
 S.jobOffers=(S.jobOffers||[]).filter(o=>o.until>S.week);
 if(rnd()<.07){const cur=clubReq(T(S.user)),c=jobCandidates(M.rep+6,cur+4,1)[0];if(c&&!S.jobOffers.some(o=>o.team===c.id)){const o=makeJobOffer(c);o.until=S.week+3;S.jobOffers.push(o);news(`${c.name} (${lgName(c.lg)}) quiere ficharte como entrenador. Tienes la oferta en Inicio.`,'good');}}
}
function mgrSeasonEnd(sm){
 const M=S.mgr,lbl=seasonLabel();let d=sm.ok?4:-4;if(sm.up)d+=8;if(sm.champ)d+=sm.L.lv===0?12:6;if(sm.down)d-=8;d+=S.titles.filter(x=>x.season===lbl&&!x.name.startsWith('Liga')).length*6;
 M.rep=clamp(M.rep+d,0,100);M.conf=clamp(M.conf+(sm.ok?15:-15)+(sm.up?15:0),0,100);M.yrs--;
 news(`Tu reputación como entrenador: ${Math.round(M.rep)}/100 (${d>=0?'+':''}${d} esta temporada).`,d>=0?'good':'bad');
 if(M.yrs<=0){if(M.conf>=45){M.yrs=ri(2,3);M.sal=r3(M.sal*1.1);news(`La directiva te renueva ${M.yrs} temporadas más, con un 10% más de salario.`,'good');return false;}
  news(`Se acaba tu contrato y ${T(S.user).name} no te renueva.`,'bad');return true;}
 return false;
}
