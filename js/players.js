/* El Banquillo · players.js — Generación de jugadores, atributos, valor y desarrollo. */
"use strict";
const rateA=(a,pos)=>{const w=W[pos];let s=0;for(const k in w)s+=w[k]*a[k];return s;};
function wpick(o){const ks=Object.keys(o);let t=ks.reduce((s,k)=>s+o[k],0),r=rnd()*t;for(const k of ks){r-=o[k];if(r<=0)return k;}return ks[0];}
function genAttrs(pos,tg){
 const a={};
 ATTRS.forEach(k=>{let b;
  if(pos==='POR')b=k==='por'?tg:(k==='pas'||k==='fis')?tg-1.5:2.2;
  else if(k==='por')b=1.3;
  else b=(W[pos][k]||0)>=.25?tg+.2:(W[pos][k]?tg-.8:tg-2.2);
  a[k]=clamp(Math.round(b+gauss()),1,10);});
 for(let i=0;i<60;i++){const r=rateA(a,pos);if(Math.abs(r-tg)<.25)break;const k=wpick(W[pos]);if(r<tg){if(a[k]<10)a[k]++;}else if(a[k]>1)a[k]--;}
 return a;
}
function setValue(p){let v=.25*Math.pow(1.115,p.ovr-50);if(p.age<=21)v*=1.5;else if(p.age<=24)v*=1.25;else if(p.age>=33)v*=.45;else if(p.age>=30)v*=.7;
 p.value=v>=1?Math.round(v*20)/20:Math.max(.005,Math.round(v*200)/200);}
const baseWage=p=>Math.max(.0005,Math.round(p.value*7)/2000);
const signWage=p=>r3(Math.max(p.wage,baseWage(p))*1.1);
const endYear=p=>2025+S.seasonN+p.contract;
function refresh(p){p.ovr=Math.round(rateA(p.at,p.pos)*10);setValue(p);}
function genPlayer(pos,rep,team,ages,bonus=0,nat,sp){
 if(nat==null)nat=team!=null&&rnd()<.82?LG(T(team).lg).c:ri(0,COUNTRIES.length-1);
 const [F,L]=NAMES[COUNTRIES[nat].lang];
 const age=ages?ri(ages[0],ages[1]):clamp(Math.round(25+gauss()*4),17,35);
 const tg=clamp(rep/10+gauss()*.55+bonus-(age<21?(21-age)*.15:0),2,9.6);
 const pot=r2(clamp(tg+(age<27?(27-age)*(.05+rnd()*.17):0),tg,9.8));
 const p={id:'p'+(S.nextId++),name:pick(F)+' '+pick(L),nat,pos,age,at:genAttrs(pos,tg),pot,team,num:0,energy:100,form:0,goals:0,apps:0,yc:0,inj:0,susp:0,pInj:0,pSusp:0,playedWk:false,contract:ri(1,5),loan:null};
 decorate(p,sp,true);p.wage=baseWage(p);p.cl=r2(p.value*(2+rnd()*3));S.players[p.id]=p;keyCache=null;if(SQ){const k=team===null?'fa':team;(SQ[k]||(SQ[k]=[])).push(p);}return p;
}
function wkey(o){let t=0;for(const k in o)t+=o[k];let r=rnd()*t;for(const k in o){r-=o[k];if(r<=0)return k;}return Object.keys(o)[0];}
const INJ=[['Sobrecarga muscular',1,2,.42],['Esguince de tobillo',2,4,.28],['Rotura fibrilar',3,6,.2],['Lesión de rodilla',5,9,.07],['Rotura de ligamentos',12,22,.03]];
function rollInjury(p){let r=rnd(),t=INJ[0];for(const x of INJ){r-=x[3];if(r<=0){t=x;break;}}let w=ri(t[1],t[2]);if(p.team===S.user&&S.staff)w=Math.max(1,Math.round(w*(1-.08*(S.staff.fis-1))));return[t[0],w];}
function decorate(p,sp,tilt){
 p.sp=sp||p.sp||spRandom(p.pos);
 if(!p.alt){const n=p.sp==='POR'?0:rnd()<.35?0:rnd()<.7?1:2;p.alt=shuffle(SP_ALT[p.sp].slice()).slice(0,n);}
 if(!p.foot){const left=p.sp==='LI'||p.sp==='MI'?.62:p.sp==='EI'?.35:p.sp==='LD'||p.sp==='MD'||p.sp==='ED'?.12:.22;const r=rnd();p.foot=r<.03?'A':r<.03+left?'I':'D';p.wf=p.foot==='A'?5:pick([1,2,2,2,3,3,3,4,4,5]);}
 if(!p.h){const g=GRP[p.sp];p.h=Math.round(clamp((g==='POR'?187:g==='DEF'?183:g==='MED'?177:180)+gauss()*5.5,163,201));}
 if(tilt){const a=p.at;if(WIDE.includes(p.sp)&&a.reg<10)a.reg++;if(p.sp==='MCD'&&a.def<10)a.def++;if(p.sp==='MCO'&&a.pas<10)a.pas++;if(p.sp==='DFC'&&p.h>=186&&a.fis<10)a.fis++;}
 if(!p.per)p.per=wkey(PERS_W);
 refresh(p);
 if(!p.tr)p.tr=genTraits(p);
 if(p.prone==null)p.prone=rnd()<.12?r2(.6+rnd()*.6):r2(rnd()*.3);if(!p.agc)p.agc=r2(.04+rnd()*.08);
 if(p.hap==null)p.hap=70;if(!p.st)p.st=newSt();if(!p.car)p.car=[0,0,0];if(!p.hist)p.hist=[];if(p.cl==null)p.cl=r2(p.value*(2+rnd()*3));
 return p;
}
function genTraits(p){const c=[],a=p.at,g=GRP[p.sp];if(a.tir>=7&&g==='DEL')c.push('gol');if(a.tir>=6&&g==='MED')c.push('lej');if(p.h>=187&&g!=='POR')c.push('cab');if(a.reg>=7&&g!=='POR')c.push('reg');if(a.pas>=7&&g!=='POR')c.push('pas');if(a.pas>=6&&a.tir>=6&&g!=='POR')c.push('bal');if(a.def>=7&&g==='DEF')c.push('mur');if(WIDE.includes(p.sp))c.push('vel');if(g==='POR'&&a.por>=7)c.push('par');return shuffle(c).slice(0,rnd()<.4?0:rnd()<.75?1:2);}
function improve(p,n){for(let i=0;i<n;i++){if(rateA(p.at,p.pos)>=p.pot)break;const k=wpick(W[p.pos]);if(p.at[k]<10)p.at[k]++;}refresh(p);}
function decline(p,n){for(let i=0;i<n;i++){const k=rnd()<.5?'fis':wpick(W[p.pos]);if(p.at[k]>1)p.at[k]--;}refresh(p);}
function assignNum(p){
 const used=new Set(squad(p.team).filter(x=>x!==p).map(x=>x.num));
 const pref={POR:[1,13,25],DEF:[2,3,4,5,6,12,15,22],MED:[8,6,10,14,16,18,20,23],DEL:[9,7,11,17,19,21]}[p.pos];
 for(const n of pref){if(!used.has(n)){p.num=n;return;}}
 for(let n=2;n<99;n++){if(!used.has(n)){p.num=n;return;}}
}
function ensureSquad(tid){
 const mins={POR:2,DEF:6,MED:6,DEL:4};const t=T(tid);const made=[];
 for(const pos in mins){let c=squad(tid).filter(p=>p.pos===pos).length;while(c<mins[pos]){const p=genPlayer(pos,t.rep-6,tid,[17,21]);assignNum(p);made.push(p);c++;}}
 return made;
}
function genFreeAgents(){for(let k=0;k<260;k++)genPlayer(pick(['POR','DEF','DEF','MED','MED','DEL','DEL']),ri(36,66),null);}
function strength(tid){const o=squad(tid).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,14);return o.reduce((a,b)=>a+b,0)/Math.max(1,o.length);}
