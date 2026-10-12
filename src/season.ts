/* El Banquillo · season.js — Flujo de jornadas, simulación múltiple, pretemporada y cambio de temporada. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {fixFilialMoves,setWageCap} from './clubplus';
import {livingSeasonEnd,onRetire} from './living';
import {loanReview} from './connected';
import {recordRound} from './analysis';
import {markKey} from './inbox';
import {seasonAwards} from './awards';
import {payDebts} from './market2';
import {setupYouth} from './youth';
import {scoutingSeasonEnd} from './scouting';
import {crewSeasonEnd} from './staff';
import {clamp,gauss,money,pick,r2,r3,ri,rnd} from './core';
import {COUNTRIES,SPEEDS,newSt} from './data';
import {RT,LG,PL,S,T,dirty,econ,findLg,lgName,lowest,rt,seasonLabel,setS,squad,uLg,unit} from './state';
import {assignNum,baseWage,decline,devSeason,ensureSquad,genFreeAgents,genPlayer,improve,setValue,strength} from './players';
import {trainMult} from './staff';
import {news,setupSeason} from './world';
import {fixLineup,lineupIssues,nRounds,rotateLineup,table} from './tactics';
import {applyResult,createMatch,playerTick,quickMatch,step} from './engine';
import {advance,completeEvent,ctQualify,ctWelcome,curEvent,cwcWelcome,mkTie,nextMatch} from './competitions';
import {aiTransfers,inWindow} from './market';
import {achSeason,finishBuild,genSponsors,sellAbonos} from './club';
import {loseJob,mgrSeasonEnd} from './career';
import {academyIntake,genScoutPool} from './academy';
import {pack,save,saveNow,unpack} from './persist';
import {render,toast} from './views/common';
export function playMatch(){
 const nm=nextMatch();if(!nm)return;
 if(S.press){S.press=null;markKey('press');S.mgr.conf=clamp(S.mgr.conf-1,0,100);}
 if(lineupIssues().length){const k=fixLineup();if(k)toast(`Cubrimos ${k} hueco${k>1?'s':''} de la alineación con suplentes.`);}
 S.match=createMatch(nm.ref);S.match.label=nm.label;S.view='partido';save();render();
}
export function runTimer(){
 clearInterval(RT.timer);RT.timer=null;const m=S&&S.match;
 if(!m||m.paused||m.done)return;
 RT.timer=setInterval(()=>{const m=S&&S.match;if(!m||m.paused||m.done){clearInterval(RT.timer);RT.timer=null;return;}
  step(m);if(m.min%10===0||m.paused)save();if(S.view==='partido')render();},SPEEDS[m.speed]);
}
export function simToEnd(){const m=S.match;m.auto=true;m.subOpen=false;m.alert='';while(!m.done)step(m);m.paused=true;clearInterval(RT.timer);RT.timer=null;save();render();}
export function finishCore(){
 const m=S.match,ev=curEvent();applyResult(m);completeEvent(ev);S.match=null;S.ci++;
 if(ev.t==='lg')recordRound(m,ev.r);
 if(ev.t==='lg'){S.ligaRound=ev.r;S.ligaLg=uLg();}
 advance();return{m,ev};
}
export function finishRound(){
 const m=S.match;
 if(m.ref.k==='fr'){applyResult(m);playerTick(false);S.match=null;S.pre.left--;const inc=r3(unit(LG(uLg()).rep)*.3);S.budget=r3(S.budget+inc);const my=m.score[m.us],op=m.score[m.us==='h'?'a':'h'];
  news(`Amistoso: ${T(m.h).name} ${m.score.h}-${m.score.a} ${T(m.a).name}. Taquilla ${money(inc)}. Química ${Math.round(S.chem)}.`,my>op?'good':my<op?'bad':'');S.view='inicio';saveNow();render();return;}
 const {ev}=finishCore();S.view='inicio';
 S.modal=ev.t==='lg'?{type:'round',round:ev.r}:ev.t==='cup'?{type:'cupres',c:m.ref.c,r:m.ref.r}:ev.t==='ct'?{type:'ctres',ct:m.ref.ct,s:ev.s}:{type:'cwcres',s:ev.s};
 saveNow();render();
}
export function playFriendly(tid){
 if(!S.pre||S.pre.left<=0||S.week>0||S.ci>0)return;
 S.fr.push(mkTie(S.user,tid));fixLineup();S.match=createMatch({k:'fr',i:S.fr.length-1});S.match.label='Amistoso de pretemporada';S.view='partido';save();render();
}
export function friendlyOpts(){
 if(S.pre.opts)return S.pre.opts;const me=strength(S.user),cs=S.teams.filter(t=>t.id!==S.user);
 const near=d=>cs.filter(t=>Math.abs(t.rep-(me+d))<3);
 return S.pre.opts=[-8,-3,3,8].map(d=>{const l=near(d);return l.length?pick(l).id:pick(cs).id;});
}
export let simState=null;
/**
 * Bucle de simulación de varias fechas. Funciona igual en el hilo principal y en el Web Worker:
 * quien lo llama decide cómo informar del progreso y cuándo parar.
 */
export async function simLoop(mode,stopOnNews,hooks){
 const startSeason=S.seasonN,res=[];let n=0,stopReason='';
 const max=mode==='next'?1:mode==='5'?5:999;
 while(true){
  if(hooks.stopped()||S.jobless||S.seasonN!==startSeason||S.week>=nRounds())break;
  if(mode==='win'&&!inWindow())break;
  const nm=nextMatch();if(!nm)break;
  const beforeOffers=Object.values(S.offers).filter(o=>o.incoming).length,beforeJobs=(S.jobOffers||[]).length;
  if(S.autoRot!==false)rotateLineup();else if(lineupIssues().length)fixLineup();
  const m=quickMatch(nm.ref);m.label=nm.label;S.match=m;
  const us=m.us,my=m.score[us],op=m.score[us==='h'?'a':'h'];
  finishCore();n++;
  res.push({label:nm.label,h:m.h,a:m.a,hg:m.score.h,ag:m.score.a,pen:m.pen,r:my>op?'G':my<op?'P':'E'});
  hooks.progress(n,`${nm.label}: ${T(m.h).short} ${m.score.h}-${m.score.a} ${T(m.a).short}`);
  const afterOffers=Object.values(S.offers).filter(o=>o.incoming).length,afterJobs=(S.jobOffers||[]).length;
  if(n>=max)break;
  if(stopOnNews&&(afterOffers>beforeOffers||afterJobs>beforeJobs)){stopReason='Ha llegado una oferta.';break;}
  await hooks.yield();
 }
 return{res,stopReason};
}
let worker=null,workerBroken=false;
function getWorker(){
 if(workerBroken||typeof Worker==='undefined')return null;
 if(!worker){try{worker=new Worker(WORKER_URL);}catch(e){workerBroken=true;return null;}}
 return worker;
}
/** URL del worker; la fija main.ts con la versión de la compilación. */
export let WORKER_URL='worker.js';
export function setWorkerUrl(u){WORKER_URL=u;}
/** Simula varias fechas. Usa el Web Worker si existe (no bloquea la pantalla) y si no, el hilo principal. */
export function simRun(mode,stopOnNews){
 if(simState)return;
 simState={n:0,stop:false,txt:'Simulando…'};render();
 const finish=r=>{simState=null;S.modal={type:'simsum',res:r.res,mode,stopReason:r.stopReason};saveNow();render();};
 const local=()=>simLoop(mode,stopOnNews,{stopped:()=>!simState||simState.stop,progress:(n,t)=>{simState.n=n;simState.txt=t;render();},yield:()=>new Promise(r=>setTimeout(r,0))}).then(finish);
 const w=getWorker();
 if(!w){local();return;}
 let started=false;
 w.onmessage=e=>{const d=e.data;started=true;
  if(d.type==='progress'){if(simState){simState.n=d.n;simState.txt=d.txt;render();}}
  else if(d.type==='done'){setS(unpack(d.state));dirty();finish(d);}
  else if(d.type==='error'){simState=null;toast('Error al simular: '+d.msg);render();}};
 w.onerror=ev=>{ev.preventDefault&&ev.preventDefault();if(!started){workerBroken=true;worker=null;local();}else{simState=null;toast('Error al simular.');render();}};
 w.postMessage({cmd:'sim',state:pack(),mode,stopOnNews});
}
export function stopSim(){if(!simState)return;simState.stop=true;if(worker)worker.postMessage({cmd:'stop'});}
export function seasonSummary(){
 const lg=uLg(),L=LG(lg),tb=table(lg),pos=tb.findIndex(r=>r.id===S.user)+1,e=econ(lg);
 const up=L.lv>0&&pos<=3,down=!lowest(L)&&pos>=18,champ=pos===1;
 const prize=r2(e.prize*(21-pos)*.5+(up?e.promo:0)+(champ?e.champ:0));
 return{lg,L,tb,pos,up,down,champ,prize,ok:pos<=S.obj.max};
}
export function newSeason(){
 const sm=seasonSummary(),tabs=S.leagues.map(L=>table(L.id));
 const top=Object.values(S.players).filter(p=>p.team!==null&&T(p.team).lg===sm.lg).sort((a,b)=>b.goals-a.goals)[0];
 const mgrOut=mgrSeasonEnd(sm);achSeason(sm);
 seasonAwards();
 // hall of fame
 {const h={season:seasonLabel(),lg:COUNTRIES.map((C,c)=>{const tb=tabs[findLg(c,0).id];return tb[0].id;}),cup:S.cups?S.cups.map(c=>c.winner):[],ct:S.conts?S.conts.map(c=>c.winner):[],cwc:S.cwc?S.cwc.winner:null};S.halls=(S.halls||[]).concat([h]).slice(-40);}
 {const best=squad(S.user).filter(p=>p.st&&p.st.g).sort((a,b)=>b.st.g-a.st.g)[0];if(best){if(!S.rec)S.rec={};if(!S.rec.goals||best.st.g>S.rec.goals.g)S.rec.goals={name:best.name,g:best.st.g,season:seasonLabel()};}}
 if(S.sponsor&&S.sponsor.type==='obj'&&sm.ok){S.budget=r3(S.budget+S.sponsor.obj);news(`${S.sponsor.name} paga ${money(S.sponsor.obj)} por cumplir el objetivo.`,'good');}
 if(S.club){const C=S.club;C.fans=Math.round(clamp(C.fans*(1+(sm.ok?.05:-.03)+(sm.up?.15:0)+(sm.down?-.12:0)+(sm.champ?.08:0)),300,C.cap*1.6));if(C.build&&C.build.until<=999)finishBuild();}
 S.history.unshift({club:T(S.user).name,season:seasonLabel(),lg:lgName(sm.lg),pos:sm.pos,pts:sm.tb[sm.pos-1].pts,champ:T(sm.tb[0].id).name,top:top?`${top.name} (${top.goals})`:'—',obj:sm.ok,res:sm.L.lv===0&&sm.champ?'Campeón':sm.champ?'Campeón y ascenso':sm.up?'Ascenso':sm.down?'Descenso':''});
 S.budget=r3(S.budget+sm.prize);payDebts();
 if(sm.champ)S.titles.push({season:seasonLabel(),name:`Liga · ${lgName(sm.lg)}`});
 { const champ=COUNTRIES.map((C,c)=>tabs[findLg(c,0).id]);
   S.cwcQual=[...champ.map(tb=>tb[0].id),...COUNTRIES.map((C,c)=>c).sort((a,b)=>COUNTRIES[b].top-COUNTRIES[a].top).slice(0,6).map(c=>champ[c][1].id)];
   S.ctQual=ctQualify(c=>tabs[findLg(c,0).id].map(r=>r.id)); }
 // loans end
 const back=[],gone=[],ret=[];
 Object.values(S.players).forEach(p=>{if(!p.loan)return;loanReview(p);const from=p.loan.from;if(from===S.user)back.push(p.name);else if(p.team===S.user)gone.push(p.name);p.loan=null;p.team=from;ret.push(p);});
 dirty();ret.forEach(assignNum);
 // promotions and relegations inside each country
 const moves=[];
 S.leagues.forEach((L,i)=>{const tb=tabs[i];
  if(L.lv>0){const up=findLg(L.c,L.lv-1);tb.slice(0,3).forEach(r=>moves.push([r.id,up.id]));}
  if(!lowest(L)){const dn=findLg(L.c,L.lv+1);tb.slice(17).forEach(r=>moves.push([r.id,dn.id]));}});
 fixFilialMoves(tabs,moves).forEach(([id,lg])=>{T(id).lg=lg;});
 // aging, development, retirements
 const retired=[],devNews=[];
 Object.values(S.players).forEach(p=>{
  p.age++;
  const ovr0=p.ovr;
  const mine=p.team===S.user,ev=devSeason(p,{train:(mine?trainMult()*(S.club?1+.06*(S.club.fac.ent-1):1):1)*(p.loanOk?1.15:1),mentor:mine&&(S.mentors||[]).some(x=>x.y===p.id)});
  p.loanOk=0;p.lpj=0;p.lmt=0;
  if(ev&&(mine||p.home))devNews.push([p,ev]);
  if(p.st&&p.st.pj&&p.team!==null&&(p.team===S.user||T(p.team).lg===uLg()||(p.hist&&p.hist.length))){p.hist=(p.hist||[]).concat([[seasonLabel(),T(p.team).short,p.st.pj,p.st.g,p.st.a,Math.round(p.st.rs/p.st.pj*10)/10]]).slice(-8);}
  p.st=newSt();
  if(p.team!==null)p.contract--;
  setValue(p);
  if(p.team===S.user||p.home){p.ph=(p.ph||[]).concat([[seasonLabel(S.seasonN+1),p.ovr]]).slice(-12);}
  p.sg=0;p.goals=0;p.apps=0;p.yc=0;p.inj=0;p.susp=0;p.pInj=0;p.pSusp=0;p.energy=100;p.form=0;
  if(p.team===null||(p.age>=34&&rnd()<(p.age-33)*.35)){if(p.team!==null&&p.car&&(p.car[1]>=40||p.car[0]>=320)){S.legends=(S.legends||[]).concat([{name:p.name,nat:p.nat,pos:p.sp,pj:p.car[0],g:p.car[1],a:p.car[2],club:T(p.team).short,end:seasonLabel()}]).sort((a,b)=>b.g-a.g).slice(0,60);}if(p.team===S.user)retired.push(p.name);onRetire(p);delete S.players[p.id];}
 });
 dirty();
 // expired contracts
 const freed=[];
 Object.values(S.players).forEach(p=>{if(p.team===null||p.contract>0)return;
  if(p.team===S.user){freed.push(p.name);p.team=null;p.contract=0;}
  else if(rnd()<.55){p.contract=ri(1,4);p.wage=Math.max(p.wage,baseWage(p));p.cl=r2(p.value*(2+rnd()*3));}
  else{p.team=null;p.contract=0;}});
 dirty();
 // AI clubs renew a few players to stay competitive in their league
 S.teams.forEach(t=>{
  if(t.id!==S.user){t.rep=t.rep*.6+LG(t.lg).rep*.4+gauss();
   const sq=squad(t.id).sort((a,b)=>a.ovr-b.ovr);sq.slice(0,Math.max(0,sq.length-18)).forEach(p=>delete S.players[p.id]);if(RT.SQ&&RT.SQ[t.id])RT.SQ[t.id]=RT.SQ[t.id].filter(p=>S.players[p.id]);RT.keyCache=null;
   for(let k=0;k<3;k++){const p=genPlayer(pick(['DEF','MED','DEL','MED']),t.rep,t.id);assignNum(p);}
   t.lineup=[];}
  ensureSquad(t.id);
 });
 const leftAc=S.academy.filter(p=>p.age+1>=19).map(p=>p.name);S.academy=S.academy.filter(p=>p.age+1<19);S.academy.forEach(p=>p.age++);
 crewSeasonEnd();livingSeasonEnd(tabs);scoutingSeasonEnd();const youth=academyIntake(3);setupYouth();genScoutPool();aiTransfers(160);
 genFreeAgents();
 S.short=S.short.filter(id=>PL(id));
 S.seasonN++;setupSeason();setWageCap();fixLineup();cwcWelcome();ctWelcome();S.sponsor=null;genSponsors();if(S.club&&S.user!=null&&!S.jobless)sellAbonos();if(mgrOut)loseJob('fin de contrato');else advance();
 devNews.forEach(([p,ev])=>{if(!S.players[p.id])return;news(ev==='boom'?`¡${p.name} ha dado un salto enorme este verano! Su media sube a ${(p.ovr/10).toFixed(1)} y su techo ahora parece más alto.`:`${p.name} se ha estancado: no progresa como se esperaba. Darle minutos y un buen tutor puede ayudarle.`,ev==='boom'?'good':'bad',{cat:'pla',subj:ev==='boom'?`${p.name} explota`:`${p.name} se estanca`,act:[{l:'Ver ficha',a:'ficha',id:p.id}]});});
 if(retired.length)news(`Se retiran: ${retired.join(', ')}.`);
 if(freed.length)news(`Acaban contrato y se van libres: ${freed.join(', ')}.`,'bad');
 if(back.length)news(`Vuelven de su cesión: ${back.join(', ')}.`);
 if(gone.length)news(`Terminan su cesión y vuelven a sus clubes: ${gone.join(', ')}.`);
 if(leftAc.length)news(`Dejan la cantera por edad: ${leftAc.join(', ')}.`);
 if(youth.length)news(`Nuevos juveniles en la cantera: ${youth.join(', ')}.`,'good');
 if(sm.up)news(`¡Ascenso! ${T(S.user).name} jugará en ${lgName(uLg())}. Prima de ascenso incluida en el premio de ${money(sm.prize)}.`,'good');
 else if(sm.down)news(`Descenso a ${lgName(uLg())}. Toca reconstruir.`,'bad');
 else news(`Premio por terminar ${sm.pos}º: ${money(sm.prize)}.`,'good');
 news(`Arranca la temporada ${seasonLabel()} en ${lgName(uLg())}. Objetivo: ${S.obj.txt.toLowerCase()}.`,'good');
 S.view='inicio';saveNow();render();
}
