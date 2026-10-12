/* El Banquillo · world.js — Creación del mundo, objetivos, calendario de liga y elección de club. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {setupYouth} from './youth';
import {defaultCrew} from './staff';
import {clamp,gauss,money,pick,plain,r2,rnd,shuffle} from './core';
import {COUNTRIES,FORMS,KITS,LV_STEP,SP_SEQ,TOWNS} from './data';
import {LG,S,T,dirty,lgName,lgTeams,lowest,seasonLabel,squad,uLg,unit,setS} from './state';
import {assignNum,genFreeAgents,genPlayer,strength} from './players';
import {autoLineup} from './tactics';
import {advance,buildCal,ctWelcome,cwcWelcome,setupConts,setupCups} from './competitions';
import {assignRoles} from './market';
import {initClub} from './club';
import {clubReq,mgrSalary} from './career';
import {academyIntake,genScoutPool} from './academy';
import {MAX_SLOTS,freeSlot,saveNow} from './persist';
import {mail} from './inbox';
import {render,toast} from './views/common';
export function townName(tw){const d=TOWNS[tw];const a=pick(d.A),b=pick(d.B);if(a.endsWith('-'))return a+b[0].toUpperCase()+b.slice(1);return (a+d.J+b).replace(/(.)\1\1/g,'$1$1');}
export function buildWorld(){
 setS({v:4,train:{focus:'eq',int:'n'},chem:60,famil:{},lastXI:[],trainLog:[],conts:null,scouts:[],scoutPool:[],academy:[],prospects:[],mgr:null,jobOffers:[],jobless:null,applied:{},nextId:1,seasonN:1,user:null,view:'inicio',leagues:[],teams:[],players:{},fixtures:[],news:[],fin:[],history:[],match:null,modal:null,sel:null,ligaRound:0,ligaLg:0,
  mk:{tab:'buy',pos:'ALL',sort:'ovr',max:'',q:'',c:'ALL',lv:'',age:'',min:'',ok:true,last:false,limit:40},offers:{},neg:{},ren:{},lo:{},loanTry:{},short:[]});
 dirty();
 const used=new Set();
 COUNTRIES.forEach((C,c)=>{
  for(let lv=0;lv<C.lv;lv++){
   const L={id:S.leagues.length,c,lv,rep:C.top-lv*LV_STEP};S.leagues.push(L);
   for(let k=0;k<20;k++){
    let name,town,g=0;do{town=townName(C.tw);name=pick(TOWNS[C.tw].P).replace('{t}',town);g++;}while(used.has(name)&&g<50);used.add(name);
    const kit=pick(KITS),id=S.teams.length,rep=L.rep+4.75-k*.5+gauss()*.5;
    S.teams.push({id,name,short:plain(town).replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase(),c1:kit[0],c2:kit[1],rep,lg:L.id,formation:pick(Object.keys(FORMS)),ment:'bal',lineup:[]});
    [['POR',2],['DEF',7],['MED',7],['DEL',5]].forEach(([pos,n])=>{for(let j=0;j<n;j++){const p=genPlayer(pos,rep-2,id,null,j===0?.6:0,null,SP_SEQ[pos][j%SP_SEQ[pos].length]);assignNum(p);}});
   }
  }
 });
 genFreeAgents();
}
export function startBudget(t){const L=LG(t.lg);return r2(Math.max(unit(L.rep)*4,unit(L.rep)*(12+(t.rep-L.rep)*2)));}
export function objectiveFor(tid){
 const t=T(tid),L=LG(t.lg),r=lgTeams(L.id).sort((a,b)=>strength(b.id)-strength(a.id)).findIndex(x=>x.id===tid)+1;
 if(L.lv===0){if(r<=3)return{txt:'Pelear el título',max:3};if(r<=7)return{txt:'Parte alta',max:7};if(r<=13)return{txt:'Mitad de tabla',max:13};return{txt:'Evitar el descenso',max:17};}
 if(r<=3)return{txt:'Ascender',max:3};if(r<=8)return{txt:'Pelear el ascenso',max:6};if(!lowest(L)&&r>=15)return{txt:'Evitar el descenso',max:17};return{txt:'Mitad de tabla',max:lowest(L)&&r>=15?18:12};
}
export function makeFixtures(ids){
 const n=ids.length,arr=shuffle(ids.slice()),rounds=[];
 for(let r=0;r<n-1;r++){const rd=[];for(let i=0;i<n/2;i++){const a=arr[i],b=arr[n-1-i];rd.push((r+i)%2===0?{h:a,a:b}:{h:b,a:a});}rounds.push(rd);arr.splice(1,0,arr.pop());}
 shuffle(rounds);
 return [...rounds,...rounds.map(rd=>rd.map(f=>({h:f.a,a:f.h})))].map(rd=>rd.map(f=>({h:f.h,a:f.a,hg:null,ag:null,played:false,ev:[]})));
}
export function setupSeason(){
 S.fixtures=S.leagues.map(L=>makeFixtures(lgTeams(L.id).map(t=>t.id)));
 S.week=0;S.fin=[];S.offers={};S.neg={};S.ren={};S.lo={};S.loanTry={};S.ligaRound=0;S.ligaLg=uLg();
 S.obj=objectiveFor(S.user);
 S.teams.forEach(t=>{if(t.id!==S.user&&rnd()<.4)t.formation=pick(Object.keys(FORMS));});
 S.cal=buildCal();S.ci=0;S.tg=0;S.pre={left:3,opts:null};S.fr=[];setupCups();setupConts();S.titles=S.titles||[];S.lastXI=[];if(!S.famil[T(S.user).formation])S.famil[T(S.user).formation]=70;
}
export function pickTeam(ti){
 const slot=freeSlot();if(slot==null){toast('Ya tienes '+MAX_SLOTS+' partidas guardadas. Borra una para empezar otra.');return;}
 S.slot=slot;S.user=ti;const t=T(ti);t.formation='4-4-2';S.budget=startBudget(t);
 setupSeason();t.lineup=autoLineup(ti,t.formation);
 S.mgr={rep:clamp(clubReq(t)+8,5,100),sal:mgrSalary(t),yrs:2,conf:60,savings:0,warned:0,clubs:[{season:seasonLabel(),club:t.name}]};
 initClub(t);defaultCrew();genScoutPool();academyIntake(3);setupYouth();assignRoles(true);squad(ti).forEach(p=>{if(!p.ph)p.ph=[[seasonLabel(),p.ovr]];});S.mgr.joinN=S.seasonN;S.startLow=lowest(LG(t.lg));
 news(`Bienvenido a ${t.name}, de ${lgName(t.lg)}. Firmas hasta junio de ${2025+S.seasonN+S.mgr.yrs} por ${money(S.mgr.sal)} a la semana. La directiva te pide: ${S.obj.txt.toLowerCase()}.`,'good');
 cwcWelcome();ctWelcome();advance();
 saveNow();render();window.scrollTo(0,0);
}
/** Noticia en el inicio y mensaje en la bandeja de entrada. o: opciones de mail() (categoría, asunto, botones…). */
export function news(txt,kind='',o){S.news.unshift({wk:S.week+1,txt,kind});S.news=S.news.slice(0,40);mail(txt,Object.assign({kind},o||{}));}
