/* El Banquillo · players.js — Generación de jugadores, atributos, valor y desarrollo. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {setValueNow} from './economy';
import {injDaysMult} from './staff';
import {clamp,gauss,pick,r2,r3,ri,rnd,shuffle} from './core';
import {AT_PHYS,ATTRS,COUNTRIES,GRP,NAMES,PERS_W,SP_ALT,W,W_OLD,WIDE,newSt,spRandom} from './data';
import {RT,LG,S,T,rt,setTeam,squad} from './state';
export const rateA=(a,pos)=>{const w=W[pos];let s=0;for(const k in w)s+=w[k]*a[k];return s;};
export function wpick(o){const ks=Object.keys(o);let t=ks.reduce((s,k)=>s+o[k],0),r=rnd()*t;for(const k of ks){r-=o[k];if(r<=0)return k;}return ks[0];}
export function genAttrs(pos,tg){
 const a={};
 ATTRS.forEach(k=>{let b;const w=W[pos][k]||0;
  if(k==='lid'||k==='con'||k==='gra')b=3.2+tg*.35;          // mentalidad: poco ligada al nivel
  else if(k==='por')b=pos==='POR'?tg+.3:1.2;
  else if(pos==='POR')b=w?tg-.8:2.2;
  else b=w>=.2?tg+.4:w>=.1?tg:w>0?tg-.5:tg-1.8;
  a[k]=clamp(Math.round(b+gauss()*(k==='lid'||k==='con'||k==='gra'?1.3:1)),1,10);});
 for(let i=0;i<60;i++){const r=rateA(a,pos);if(Math.abs(r-tg)<.25)break;const k=wpick(W[pos]);if(r<tg){if(a[k]<10)a[k]++;}else if(a[k]>1)a[k]--;}
 return a;
}
/** Valor de mercado: media, edad, potencial, forma, liga, contrato… (ver economy.ts). */
export function setValue(p){setValueNow(p);}
export const baseWage=p=>Math.max(.0005,Math.round(p.value*7)/2000);
export const signWage=p=>r3(Math.max(p.wage,baseWage(p))*1.1);
export const endYear=p=>2025+S.seasonN+p.contract;
export function refresh(p){p.ovr=Math.round(rateA(p.at,p.pos)*10);setValue(p);}
export function genPlayer(pos,rep,team,ages,bonus=0,nat,sp){
 if(nat==null)nat=team!=null&&rnd()<.82?LG(T(team).lg).c:ri(0,COUNTRIES.length-1);
 const [F,L]=NAMES[COUNTRIES[nat].lang];
 const age=ages?ri(ages[0],ages[1]):clamp(Math.round(25+gauss()*4),17,35);
 const tg=clamp(rep/10+gauss()*.55+bonus-(age<21?(21-age)*.15:0),2,9.6);
 const pot=r2(clamp(tg+(age<27?(27-age)*(.05+rnd()*.17):0),tg,9.8));
 const p={id:'p'+(S.nextId++),name:pick(F)+' '+pick(L),nat,pos,age,at:genAttrs(pos,tg),pot,team,num:0,energy:100,form:0,goals:0,apps:0,yc:0,inj:0,susp:0,pInj:0,pSusp:0,playedWk:false,contract:ri(1,5),loan:null};
 decorate(p,sp,true);p.wage=baseWage(p);p.cl=r2(p.value*(2+rnd()*3));S.players[p.id]=p;RT.keyCache=null;if(RT.SQ){const k=team===null?'fa':team;(RT.SQ[k]||(RT.SQ[k]=[])).push(p);}return p;
}
export function wkey(o){let t=0;for(const k in o)t+=o[k];let r=rnd()*t;for(const k in o){r-=o[k];if(r<=0)return k;}return Object.keys(o)[0];}
export const INJ=[['Sobrecarga muscular',1,2,.42],['Esguince de tobillo',2,4,.28],['Rotura fibrilar',3,6,.2],['Lesión de rodilla',5,9,.07],['Rotura de ligamentos',12,22,.03]];
export function rollInjury(p){let r=rnd(),t=INJ[0];for(const x of INJ){r-=x[3];if(r<=0){t=x;break;}}let w=ri(t[1],t[2]);if(p.team===S.user&&S.crew)w=Math.max(1,Math.round(w*injDaysMult()));return[t[0],w];}
export function decorate(p,sp,tilt){
 p.sp=sp||p.sp||spRandom(p.pos);
 if(!p.alt){const n=p.sp==='POR'?0:rnd()<.35?0:rnd()<.7?1:2;p.alt=shuffle(SP_ALT[p.sp].slice()).slice(0,n);}
 if(!p.foot){const left=p.sp==='LI'||p.sp==='MI'?.62:p.sp==='EI'?.35:p.sp==='LD'||p.sp==='MD'||p.sp==='ED'?.12:.22;const r=rnd();p.foot=r<.03?'A':r<.03+left?'I':'D';p.wf=p.foot==='A'?5:pick([1,2,2,2,3,3,3,4,4,5]);}
 if(!p.h){const g=GRP[p.sp];p.h=Math.round(clamp((g==='POR'?187:g==='DEF'?183:g==='MED'?177:180)+gauss()*5.5,163,201));}
 if(!p.per)p.per=wkey(PERS_W);
 if(tilt){const a=p.at,up=k=>{if(a[k]<10)a[k]++;},dn=k=>{if(a[k]>1)a[k]--;};if(WIDE.includes(p.sp)){up('reg');up('vel');}if(p.sp==='MCD')up('def');if(p.sp==='MCO')up('vis');if(p.h>=187){up('cab');dn('vel');}if(p.h<=172){dn('cab');up('vel');}if(p.age<21)dn('lid');if(p.per==='lid'){up('lid');up('lid');}if(p.per==='pro')up('con');if(p.per==='tem')dn('con');}
 if(!p.per)p.per=wkey(PERS_W);
 refresh(p);
 if(!p.tr)p.tr=genTraits(p);
 if(p.prone==null)p.prone=rnd()<.12?r2(.6+rnd()*.6):r2(rnd()*.3);if(!p.agc)p.agc=r2(.04+rnd()*.08);
 if(p.hap==null)p.hap=70;if(!p.st)p.st=newSt();if(!p.car)p.car=[0,0,0];if(!p.hist)p.hist=[];if(p.cl==null)p.cl=r2(p.value*(2+rnd()*3));
 return p;
}
export function genTraits(p){const c=[],a=p.at,g=GRP[p.sp];if(a.tir>=7&&g==='DEL')c.push('gol');if(a.tir>=6&&g==='MED')c.push('lej');if((a.cab>=8||p.h>=188)&&g!=='POR')c.push('cab');if(a.reg>=7&&g!=='POR')c.push('reg');if(a.pas>=7&&a.vis>=7&&g!=='POR')c.push('pas');if(a.pas>=6&&a.tir>=6&&g!=='POR')c.push('bal');if(a.def>=7&&g==='DEF')c.push('mur');if(a.vel>=8&&g!=='POR')c.push('vel');if(g==='POR'&&a.por>=7)c.push('par');return shuffle(c).slice(0,rnd()<.4?0:rnd()<.75?1:2);}
/** Jugadores tuyos (y tus canteranos y cedidos): sus atributos llevan decimales y suben poco a poco (71, 72, 74…). Los del resto del mundo, de 10 en 10. */
export const finePl=p=>!!p&&(p.team===S.user||(p.loan&&p.loan.from===S.user)||p.u19===1||(p.id&&p.id[0]==='y'));
const r1=x=>Math.round(x*10)/10;
/** Sube un punto de atributo: entero para la IA; para los tuyos, repartido en pasitos entre ese atributo y otros dos de su puesto. Devuelve el atributo principal. */
export function gainAt(p,k,sign=1){
 const lim=v=>Math.max(1,Math.min(10,v));
 if(!finePl(p)){if(sign>0?p.at[k]<10:p.at[k]>1)p.at[k]+=sign;return k;}
 const parts=[[k,.4],[wpick(W[p.pos]),.3],[wpick(W[p.pos]),.3]];parts.forEach(([a,v])=>{p.at[a]=r1(lim((p.at[a]??5)+sign*v));});return k;
}
export function improve(p,n){for(let i=0;i<n;i++){if(rateA(p.at,p.pos)>=p.pot)break;const k=wpick(W[p.pos]);if(p.at[k]<10)gainAt(p,k);}refresh(p);}
/** Bajada por edad: primero lo físico; la técnica aguanta más. */
export function decline(p,n,physShare=.65){for(let i=0;i<n;i++){const k=rnd()<physShare?pick(AT_PHYS):wpick(W[p.pos]);if(p.at[k]>1){if(finePl(p)){p.at[k]=r1(Math.max(1,p.at[k]-.6));const o=pick(AT_PHYS);p.at[o]=r1(Math.max(1,p.at[o]-.4));}else p.at[k]--;}}refresh(p);}
const PERS_DEV={pro:1.25,amb:1.12,lid:1.05,tra:1.05,lea:1,nor:1,tem:.85};
/**
 * Desarrollo de una temporada. Depende de la edad, de lo lejos que esté de su potencial, de los minutos
 * jugados, del carácter, del entrenamiento (tu cuerpo técnico e instalaciones), del tutelaje y del azar:
 * algunos jóvenes explotan y otros se estancan. Los veteranos pierden antes velocidad y resistencia
 * que técnica, y siguen ganando en lo mental (colocación, decisiones…).
 * Devuelve 'boom', 'stag' o '' para poder avisar.
 */
export function devSeason(p,ctx={}){
 const mins=p.st&&p.st.mi||0,share=clamp(mins/2600,0,1),gap=Math.max(0,p.pot-rateA(p.at,p.pos));
 const f=(.55+.85*share)*(PERS_DEV[p.per]||1)*(ctx.train||1)*(ctx.mentor?1.2:1)*(p.stag?.35:1);
 let ev='';
 if(p.age<=23){
  const base=p.age<=19?2.2:p.age<=21?1.7:1.1,n=Math.floor(base*f*Math.min(1.5,.4+gap/2.5)+rnd());improve(p,n);
  if(p.age<=21&&gap>=1.2&&!p.stag&&rnd()<.06*(.5+share)*(PERS_DEV[p.per]||1)){p.pot=r2(clamp(p.pot+.4+rnd()*.7,p.pot,9.8));improve(p,ri(3,5));ev='boom';}
  else if(p.age<=22&&!p.stag&&rnd()<.035*(p.per==='tem'?1.5:1)*(share<.2?1.5:1)){p.stag=1;p.pot=r2(Math.max(rateA(p.at,p.pos)+.2,p.pot-.4-rnd()*.6));ev='stag';}
  else if(p.stag&&share>.6&&rnd()<.3)p.stag=0;
 }else if(p.age<=28){const x=Math.round((rnd()*2-1)+(share>.6?.25:share<.2?-.3:0));x>0?improve(p,x):x<0?decline(p,1,.4):0;}
 else if(p.age<=30)decline(p,ri(0,2),.75);
 else if(p.age<=33)decline(p,ri(1,3),.6);
 else decline(p,ri(2,4),.55);
 // lo mental sigue mejorando con la experiencia
 if(p.age>=24&&p.age<=31&&rnd()<.35){const k=pick(['vis','col','dec','dec','col','lid']);if(p.at[k]<10){finePl(p)?(p.at[k]=Math.round(Math.min(10,p.at[k]+.5)*10)/10):p.at[k]++;refresh(p);}}
 return ev;
}
/** Partidas antiguas (6 atributos): crea los nuevos a partir de los que había, sin cambiar la media del jugador. */
export function deriveAttrs(p){
 const a=p.at,g=GRP[p.sp]||p.pos,old=rateOld(a,p.pos),j=x=>clamp(Math.round(x+gauss()*.8),1,10);
 a.cab=j((p.h-172)/3.5+(g==='DEF'?a.def:g==='DEL'?a.tir:(a.def+a.tir)/2)*.45+1);
 a.vis=j(g==='POR'?a.pas-1:a.pas*.85+1);
 a.col=j(g==='DEF'?a.def:g==='DEL'?a.tir*.9:g==='POR'?a.por:(a.def+a.pas)/2);
 a.dec=j(g==='POR'?a.por*.8+1:(a.pas+(g==='DEF'?a.def:g==='DEL'?a.tir:a.pas))/2);
 a.vel=j(a.reg*.55+a.fis*.25+1.2+(p.age<24?.8:p.age>30?-1:0));
 a.res=j(a.fis*.8+1);
 a.lid=j(p.per==='lid'?7.5:3.5+Math.min(2,(p.age-20)*.2));
 a.con=j(p.per==='pro'?7:p.per==='tem'?4:5.2);
 a.gra=j(5+(p.per==='amb'?1:0));
 for(let i=0;i<80;i++){const r=rateA(a,p.pos);if(Math.abs(r-old)<.12)break;const k=wpick(W[p.pos]);if(r<old){if(a[k]<10)a[k]++;}else if(a[k]>1)a[k]--;}
 refresh(p);return p;
}
export const rateOld=(a,pos)=>{const w=W_OLD[pos];let s=0;for(const k in w)s+=w[k]*a[k];return s;};
export function assignNum(p){
 const used=new Set(squad(p.team).filter(x=>x!==p).map(x=>x.num));
 const pref={POR:[1,13,25],DEF:[2,3,4,5,6,12,15,22],MED:[8,6,10,14,16,18,20,23],DEL:[9,7,11,17,19,21]}[p.pos];
 for(const n of pref){if(!used.has(n)){p.num=n;return;}}
 for(let n=2;n<99;n++){if(!used.has(n)){p.num=n;return;}}
}
/** Bolsa de agentes libres por posición (se rehace una vez por jornada): los clubes que necesitan gente fichan de aquí antes de inventarse jugadores. */
let FAP=null;
function faPool(){const k=S.seasonN+'|'+S.week;if(FAP&&FAP.k===k)return FAP;FAP={k,by:{POR:[],DEF:[],MED:[],DEL:[]}};Object.values(S.players).forEach(p=>{if(p.team===null&&!p.ret&&p.age<=33&&FAP.by[p.pos])FAP.by[p.pos].push(p);});return FAP;}
export function ensureSquad(tid){
 const mins={POR:2,DEF:6,MED:6,DEL:4};const t=T(tid);const made=[];
 for(const pos in mins){let c=squad(tid).filter(p=>p.pos===pos).length;
  while(c<mins[pos]){
   // primero un libre de su nivel (los que no renovaron); si no hay, un chaval nuevo
   const L=tid!==S.user?faPool().by[pos]:[],lo=t.rep-16,hi=t.rep+4;let bi=-1,bv=-1;for(let i=0;i<L.length;i++){const q=L[i];if(q.team!==null||q.ovr<lo||q.ovr>hi)continue;const v=q.ovr-Math.max(0,q.age-29)*2;if(v>bv){bv=v;bi=i;}}
   let p;if(bi>=0){p=L.splice(bi,1)[0];setTeam(p,tid);p.contract=ri(1,3);p.wage=Math.max(p.wage||0,baseWage(p));}else p=genPlayer(pos,t.rep-6,tid,[17,21]);
   assignNum(p);made.push(p);c++;}}
 return made;
}
/** Que la partida no crezca sin fin: plantillas de la IA recortadas y, como mucho, 1.200 libres (se van los peores y más mayores). */
export function pruneFree(CAP=1200){trimSquads();const FA=Object.values(S.players).filter(p=>p.team===null&&!(S.short||[]).includes(p.id));
 if(FA.length>CAP){FA.sort((a,b)=>(a.ovr-a.age*1.5+(a.pot*10-a.ovr)*.3)-(b.ovr-b.age*1.5+(b.pot*10-b.ovr)*.3)).slice(0,FA.length-CAP).forEach(p=>{delete S.players[p.id];});RT.SQ=null;RT.keyCache=null;}}
/** Plantillas de la IA de 27 como mucho: se dejan libres a los que sobran (los peores). */
export function trimSquads(){S.teams.forEach(t=>{if(t.id===S.user)return;const sq=squad(t.id).filter(p=>!p.loan);if(sq.length<=27)return;
 sq.sort((a,b)=>a.ovr-b.ovr).slice(0,sq.length-27).forEach(p=>{if(T(t.id).lineup)T(t.id).lineup=T(t.id).lineup.map(x=>x===p.id?null:x);setTeam(p,null);});});}
export function genFreeAgents(n=120){
 // unos pocos nuevos (jóvenes sin club y veteranos de ligas menores); el resto de la bolsa son los que no renovaron
 for(let k=0;k<n;k++)genPlayer(pick(['POR','DEF','DEF','MED','MED','DEL','DEL']),ri(36,66),null);
 // tope para que la partida no crezca sin fin: se van los peores y más mayores
 pruneFree();
 RT.SQ=null;RT.keyCache=null;
}
export function strength(tid){const o=squad(tid).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,14);return o.reduce((a,b)=>a+b,0)/Math.max(1,o.length);}
