/* El Banquillo · season.js — Flujo de jornadas, simulación múltiple, pretemporada y cambio de temporada. */
"use strict";
function playMatch(){
 const nm=nextMatch();if(!nm)return;
 if(S.press){S.press=null;S.mgr.conf=clamp(S.mgr.conf-1,0,100);}
 if(lineupIssues().length){const k=fixLineup();if(k)toast(`Cubrimos ${k} hueco${k>1?'s':''} de la alineación con suplentes.`);}
 S.match=createMatch(nm.ref);S.match.label=nm.label;S.view='partido';save();render();
}
function runTimer(){
 clearInterval(timer);timer=null;const m=S&&S.match;
 if(!m||m.paused||m.done)return;
 timer=setInterval(()=>{const m=S&&S.match;if(!m||m.paused||m.done){clearInterval(timer);timer=null;return;}
  step(m);if(m.min%10===0||m.paused)save();if(S.view==='partido')render();},SPEEDS[m.speed]);
}
function simToEnd(){const m=S.match;m.auto=true;m.subOpen=false;m.alert='';while(!m.done)step(m);m.paused=true;clearInterval(timer);timer=null;save();render();}
function finishCore(){
 const m=S.match,ev=curEvent();applyResult(m);completeEvent(ev);S.match=null;S.ci++;
 if(ev.t==='lg'){S.ligaRound=ev.r;S.ligaLg=uLg();}
 advance();return{m,ev};
}
function finishRound(){
 const m=S.match;
 if(m.ref.k==='fr'){applyResult(m);playerTick(false);S.match=null;S.pre.left--;const inc=r3(unit(LG(uLg()).rep)*.3);S.budget=r3(S.budget+inc);const my=m.score[m.us],op=m.score[m.us==='h'?'a':'h'];
  news(`Amistoso: ${T(m.h).name} ${m.score.h}-${m.score.a} ${T(m.a).name}. Taquilla ${money(inc)}. Química ${Math.round(S.chem)}.`,my>op?'good':my<op?'bad':'');S.view='inicio';saveNow();render();return;}
 const {ev}=finishCore();S.view='inicio';
 S.modal=ev.t==='lg'?{type:'round',round:ev.r}:ev.t==='cup'?{type:'cupres',c:m.ref.c,r:m.ref.r}:ev.t==='ct'?{type:'ctres',ct:m.ref.ct,s:ev.s}:{type:'cwcres',s:ev.s};
 saveNow();render();
}
function playFriendly(tid){
 if(!S.pre||S.pre.left<=0||S.week>0||S.ci>0)return;
 S.fr.push(mkTie(S.user,tid));fixLineup();S.match=createMatch({k:'fr',i:S.fr.length-1});S.match.label='Amistoso de pretemporada';S.view='partido';save();render();
}
function friendlyOpts(){
 if(S.pre.opts)return S.pre.opts;const me=strength(S.user),cs=S.teams.filter(t=>t.id!==S.user);
 const near=d=>cs.filter(t=>Math.abs(t.rep-(me+d))<3);
 return S.pre.opts=[-8,-3,3,8].map(d=>{const l=near(d);return l.length?pick(l).id:pick(cs).id;});
}
let simState=null;
function simRun(mode,stopOnNews){
 if(simState)return;const startW=S.week,startSeason=S.seasonN,res=[];let n=0;
 const max=mode==='next'?1:mode==='5'?5:mode==='win'?999:999;
 simState={n:0,stop:false,txt:'Simulando…'};render();
 const tick=()=>{
  if(!S||!simState)return;
  const done=()=>{simState=null;S.modal={type:'simsum',res,mode};saveNow();render();};
  if(simState.stop||S.jobless||S.seasonN!==startSeason||S.week>=nRounds())return done();
  if(mode==='win'&&!inWindow()&&n>0)return done();
  if(mode==='win'&&!inWindow()&&n===0){/* window closed: run until it opens and closes? just stop */return done();}
  const nm=nextMatch();if(!nm)return done();
  const beforeOffers=Object.values(S.offers).filter(o=>o.incoming).length,beforeJobs=(S.jobOffers||[]).length;
  if(lineupIssues().length)fixLineup();
  const m=quickMatch(nm.ref);m.label=nm.label;S.match=m;
  const us=m.us,my=m.score[us],op=m.score[us==='h'?'a':'h'];
  finishCore();n++;simState.n=n;
  res.push({label:nm.label,h:m.h,a:m.a,hg:m.score.h,ag:m.score.a,pen:m.pen,r:my>op?'G':my<op?'P':'E'});
  simState.txt=`${nm.label}: ${T(m.h).short} ${m.score.h}-${m.score.a} ${T(m.a).short}`;
  const afterOffers=Object.values(S.offers).filter(o=>o.incoming).length,afterJobs=(S.jobOffers||[]).length;
  if(n>=max)return done();
  if(stopOnNews&&(afterOffers>beforeOffers||afterJobs>beforeJobs)){simState.stopReason='Ha llegado una oferta.';return done();}
  render();setTimeout(tick,0);
 };
 setTimeout(tick,0);
}
function seasonSummary(){
 const lg=uLg(),L=LG(lg),tb=table(lg),pos=tb.findIndex(r=>r.id===S.user)+1,e=econ(lg);
 const up=L.lv>0&&pos<=3,down=!lowest(L)&&pos>=18,champ=pos===1;
 const prize=r2(e.prize*(21-pos)*.5+(up?e.promo:0)+(champ?e.champ:0));
 return{lg,L,tb,pos,up,down,champ,prize,ok:pos<=S.obj.max};
}
function newSeason(){
 const sm=seasonSummary(),tabs=S.leagues.map(L=>table(L.id));
 const top=Object.values(S.players).filter(p=>p.team!==null&&T(p.team).lg===sm.lg).sort((a,b)=>b.goals-a.goals)[0];
 const mgrOut=mgrSeasonEnd(sm);achSeason(sm);
 // hall of fame
 {const h={season:seasonLabel(),lg:COUNTRIES.map((C,c)=>{const tb=tabs[findLg(c,0).id];return tb[0].id;}),cup:S.cups?S.cups.map(c=>c.winner):[],ct:S.conts?S.conts.map(c=>c.winner):[],cwc:S.cwc?S.cwc.winner:null};S.halls=(S.halls||[]).concat([h]).slice(-40);}
 {const best=squad(S.user).filter(p=>p.st&&p.st.g).sort((a,b)=>b.st.g-a.st.g)[0];if(best){if(!S.rec)S.rec={};if(!S.rec.goals||best.st.g>S.rec.goals.g)S.rec.goals={name:best.name,g:best.st.g,season:seasonLabel()};}}
 if(S.sponsor&&S.sponsor.type==='obj'&&sm.ok){S.budget=r3(S.budget+S.sponsor.obj);news(`${S.sponsor.name} paga ${money(S.sponsor.obj)} por cumplir el objetivo.`,'good');}
 if(S.club){const C=S.club;C.fans=Math.round(clamp(C.fans*(1+(sm.ok?.05:-.03)+(sm.up?.15:0)+(sm.down?-.12:0)+(sm.champ?.08:0)),300,C.cap*1.6));if(C.build&&C.build.until<=999)finishBuild();}
 S.history.unshift({club:T(S.user).name,season:seasonLabel(),lg:lgName(sm.lg),pos:sm.pos,pts:sm.tb[sm.pos-1].pts,champ:T(sm.tb[0].id).name,top:top?`${top.name} (${top.goals})`:'—',obj:sm.ok,res:sm.L.lv===0&&sm.champ?'Campeón':sm.champ?'Campeón y ascenso':sm.up?'Ascenso':sm.down?'Descenso':''});
 S.budget=r3(S.budget+sm.prize);
 if(sm.champ)S.titles.push({season:seasonLabel(),name:`Liga · ${lgName(sm.lg)}`});
 { const champ=COUNTRIES.map((C,c)=>tabs[findLg(c,0).id]);
   S.cwcQual=[...champ.map(tb=>tb[0].id),...COUNTRIES.map((C,c)=>c).sort((a,b)=>COUNTRIES[b].top-COUNTRIES[a].top).slice(0,6).map(c=>champ[c][1].id)];
   S.ctQual=ctQualify(c=>tabs[findLg(c,0).id].map(r=>r.id)); }
 // loans end
 const back=[],gone=[],ret=[];
 Object.values(S.players).forEach(p=>{if(!p.loan)return;const from=p.loan.from;if(from===S.user)back.push(p.name);else if(p.team===S.user)gone.push(p.name);p.loan=null;p.team=from;ret.push(p);});
 dirty();ret.forEach(assignNum);
 // promotions and relegations inside each country
 const moves=[];
 S.leagues.forEach((L,i)=>{const tb=tabs[i];
  if(L.lv>0){const up=findLg(L.c,L.lv-1);tb.slice(0,3).forEach(r=>moves.push([r.id,up.id]));}
  if(!lowest(L)){const dn=findLg(L.c,L.lv+1);tb.slice(17).forEach(r=>moves.push([r.id,dn.id]));}});
 moves.forEach(([id,lg])=>{T(id).lg=lg;});
 // aging, development, retirements
 const retired=[];
 Object.values(S.players).forEach(p=>{
  p.age++;
  const ovr0=p.ovr;
  if(p.age<=23)improve(p,ri(0,2));else if(p.age<=28){const x=ri(-1,1);x>0?improve(p,x):x<0?decline(p,1):0;}else if(p.age<=31)decline(p,ri(0,2));else decline(p,ri(1,3));
  if(p.st&&p.st.pj&&p.team!==null&&(p.team===S.user||T(p.team).lg===uLg()||(p.hist&&p.hist.length))){p.hist=(p.hist||[]).concat([[seasonLabel(),T(p.team).short,p.st.pj,p.st.g,p.st.a,Math.round(p.st.rs/p.st.pj*10)/10]]).slice(-8);}
  p.st=newSt();
  if(p.team!==null)p.contract--;
  setValue(p);
  if(p.team===S.user||p.home){p.ph=(p.ph||[]).concat([[seasonLabel(S.seasonN+1),p.ovr]]).slice(-12);}
  p.sg=0;p.goals=0;p.apps=0;p.yc=0;p.inj=0;p.susp=0;p.pInj=0;p.pSusp=0;p.energy=100;p.form=0;
  if(p.team===null||(p.age>=34&&rnd()<(p.age-33)*.35)){if(p.team!==null&&p.car&&(p.car[1]>=40||p.car[0]>=320)){S.legends=(S.legends||[]).concat([{name:p.name,nat:p.nat,pos:p.sp,pj:p.car[0],g:p.car[1],a:p.car[2],club:T(p.team).short,end:seasonLabel()}]).sort((a,b)=>b.g-a.g).slice(0,60);}if(p.team===S.user)retired.push(p.name);delete S.players[p.id];}
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
   const sq=squad(t.id).sort((a,b)=>a.ovr-b.ovr);sq.slice(0,Math.max(0,sq.length-18)).forEach(p=>delete S.players[p.id]);if(SQ&&SQ[t.id])SQ[t.id]=SQ[t.id].filter(p=>S.players[p.id]);keyCache=null;
   for(let k=0;k<3;k++){const p=genPlayer(pick(['DEF','MED','DEL','MED']),t.rep,t.id);assignNum(p);}
   t.lineup=[];}
  ensureSquad(t.id);
 });
 const leftAc=S.academy.filter(p=>p.age+1>=19).map(p=>p.name);S.academy=S.academy.filter(p=>p.age+1<19);S.academy.forEach(p=>p.age++);
 const youth=academyIntake(3);genScoutPool();aiTransfers(160);
 genFreeAgents();
 S.short=S.short.filter(id=>PL(id));
 S.seasonN++;setupSeason();fixLineup();cwcWelcome();ctWelcome();S.sponsor=null;genSponsors();if(mgrOut)loseJob('fin de contrato');else advance();
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
