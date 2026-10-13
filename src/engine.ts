/* El Banquillo · engine.js — Motor de partido: minuto a minuto, simulación rápida, charlas, penaltis, notas. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {REFS,aiInMatch,duoMult,mgrAt,momentShootout,refFor} from './extras2';
import {forcedAfter,momentInj,momentPen,momentRed,momentsTick,recordCoach,spPrepFor,spPrepMult,weatherFor,weatherMods} from './extras';
import {dateOf,dayOfEvent} from './calendar';
import {laneTip,learnRoles,phaseMods} from './tactics2';
import {posMult,posTeam,userPos} from './positions';
import {injWeight,onRecovered,relapseMult} from './medical';
import {isDerby,recordH2H} from './rivals';
import {retosMatch} from './retos';
import {coachResult} from './living';
import {enforceLoanMinutes,trackLoans,vestMult} from './connected';
import {cornerMult,famMult,learnTactic,spOf} from './plans';
import {matchDetail,recordMatch} from './analysis';
import {diff} from './difficulty';
import {roleEffects,roleMult} from './roles';
import {learnFromMatch} from './scouting';
import {segAt} from './staff';
import {clamp,fill,gauss,pick,r3,ri,rnd} from './core';
import {AT_NAME,GRP,MENT,TAC0,TX,W,WIDE,newSt} from './data';
import {LG,PL,S,T,available,seasonLabel,shortNm,squad,uLg} from './state';
import {rateA,refresh,rollInjury,wpick} from './players';
import {news} from './world';
import {autoLineup,chemMult,eff,famOf,hasTr,slotsOf,subsOf,teamPower,userRoles,xg} from './tactics';
import {getFx} from './competitions';
import {makePress,unlock} from './club';
import {recBonus,trainPlayer} from './squad';
export function createMatch(ref){
 const fx=getFx(ref);
 const m={tac:{},mods:{},ord:{},marked:{},pens:{h:0,a:0},mult:{},xi0:{},talks:{},agg:ref.k==='ct'&&fx.leg===2?(()=>{const l1=S.conts[ref.ct].dates[ref.s-1][ref.i];return[l1.ag,l1.hg];})():null,ref,ko:ref.k==='po'||ref.k==='cup'||(ref.k==='cwc'&&ref.s>=3)||(ref.k==='ct'&&(fx.leg===2||ref.s===12)),neutral:ref.k==='cwc'||(ref.k==='ct'&&ref.s===12),pen:null,label:'',h:fx.h,a:fx.a,us:fx.h===S.user?'h':fx.a===S.user?'a':null,min:0,end:90+ri(1,5),score:{h:0,a:0},f:{},lu:{},ment:{},en:{},hurt:{},played:{},out:[],off:[],ycm:{},inM:{},outM:{},rat:null,mvp:null,subs:{h:0,a:0},
  st:{h:{sh:0,ot:0,yc:0,rc:0,xg:0,co:0,fo:0,pa:0,pc:0},a:{sh:0,ot:0,yc:0,rc:0,xg:0,co:0,fo:0,pa:0,pc:0}},oi:{},adv:null,possSum:0,ev:[],paused:true,half:false,done:false,auto:false,speed:1,flash:-1,subOpen:false,alert:''};
 ['h','a'].forEach(s=>{const t=T(m[s]);m.f[s]=t.formation;m.lu[s]=m.us===s?t.lineup.slice():autoLineup(t.id,t.formation);m.ment[s]=m.us===s?t.ment:'bal';
  m.lu[s].forEach(id=>{if(id){m.en[id]=PL(id).energy;m.played[id]=1;}});m.mult[s]=m.us===s?chemMult(m.f[s]):(S.rivalBoost&&S.rivalBoost.team===m[s]&&m.us?1+S.rivalBoost.v:1)*(m.us?diff().ai:1);if(m.us&&S.rivalBoost&&S.rivalBoost.team===m[s])S.rivalBoost=null;m.xi0[s]=m.lu[s].slice();
  m.tac[s]=Object.assign({},TAC0,t.tac||{});m.ord[s]=m.us===s?Object.assign({},t.orders||{}):{};});
 m.derby=m.ref.k!=='fr'&&isDerby(m.h,m.a);
 m.ro={h:m.us==='h'?userRoles().slice():null,a:m.us==='a'?userRoles().slice():null};
 if(m.us){if(S.prepB&&S.prepB>1&&ref.k!=='fr'){m.mult[m.us]*=S.prepB;S.prepB=1;}m.refr=refFor(ref,m.h);m.mult[m.us]*=duoMult(m.lu[m.us].filter(Boolean))*(1+.004*(mgrAt('tac')-5));}
 if(m.us){const op=m[m.us==='h'?'a':'h'];m.wx=weatherFor(ref,m.h,dateOf(dayOfEvent(S.ci)).getUTCMonth());if(S.pique&&S.pique.opp===op&&S.pique.resp==='r')m.mult[m.us]*=1.02;if(spPrepFor(op))m.spd=spPrepMult();}
 {const ps=m.us?userPos(slotsOf(m.f[m.us])):null;m.du={h:m.us==='h'?ps.du.slice():null,a:m.us==='a'?ps.du.slice():null};m.pi={h:m.us==='h'?ps.pi.map(x=>x.slice()):null,a:m.us==='a'?ps.pi.map(x=>x.slice()):null};}
 if(m.us)m.oi[m.us]=Object.assign({},T(m[m.us]).oi||{});
 m.sp={h:spOf(m.us==='h'?T(m.h):null),a:spOf(m.us==='a'?T(m.a):null)};if(m.us){m.mult[m.us]*=famMult(m.tac[m.us])*vestMult();m.plan=T(m[m.us]).curPlan||null;}
 prepTactics(m);
 // regularidad (días buenos y malos) y partidos grandes
 ['h','a'].forEach(s=>{const xi=m.lu[s].filter(Boolean).map(PL),av=k=>xi.reduce((a,p)=>a+(p.at[k]??5),0)/Math.max(1,xi.length);
  m.mult[s]*=1+gauss()*.035*(1.3-av('con')/10);if(m.ref.k!=='lg'&&m.ref.k!=='fr')m.mult[s]*=1+.012*(av('gra')-5);});
 ['h','a'].forEach(s=>{if(m.us!==s)enforceLoanMinutes(m,s,eff,slotsOf(m.f[s]));});
 ['h','a'].forEach(s=>{if(m.us===s)return;const o=s==='h'?'a':'h';const d=teamPower(m.lu[s],m.f[s]).ovr-teamPower(m.lu[o],m.f[o]).ovr+(s==='h'?1.5:-1.5);m.ment[s]=d>4?'att':d<-4?'def':'bal';});
 return m;
}
export function aiCounter(own,u){const t=Object.assign({},own);if(u.est==='pos'&&rnd()<.6)t.pre='alt';if(u.lin==='alt'&&rnd()<.6)t.est='con';if(u.pre==='alt'&&rnd()<.5)t.est='dir';if(u.est==='con'&&rnd()<.6){t.lin='baj';t.pre='med';}return t;}
export function prepTactics(m){
 ['h','a'].forEach(s=>{const o=s==='h'?'a':'h';
  if(m.us&&m.us!==s&&rnd()<.75)m.tac[s]=aiCounter(m.tac[s],m.tac[m.us]);
  const sl=slotsOf(m.f[s]),wide=[],cen=[];let mid=[],del=[];
  m.lu[s].forEach((id,i)=>{const p=PL(id);if(!p)return;const v=eff(p,sl[i]);if(WIDE.includes(sl[i]))wide.push(v);else if(sl[i]!=='POR'&&sl[i]!=='DFC')cen.push(v);if(GRP[sl[i]]==='MED')mid.push(v);if(GRP[sl[i]]==='DEL')del.push(v);});
  const av=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:50;m.wide=m.wide||{};m.wide[s]=av(wide)-av(cen);m.mq=m.mq||{};m.mq[s]=[av(mid),av(del)];
  // captain, takers
  const t=T(m[s]),lu=m.lu[s].filter(Boolean),best=k=>lu.slice().sort((a,b)=>PL(b).at[k]-PL(a).at[k])[0];
  m.cap=m.cap||{};m.pk=m.pk||{};m.fk=m.fk||{};
  m.cap[s]=m.us===s&&t.cap&&lu.includes(t.cap)?t.cap:lu.slice().sort((a,b)=>(PL(b).per==='lid')-(PL(a).per==='lid')||PL(b).age-PL(a).age)[0];
  m.pk[s]=m.us===s&&t.pk&&lu.includes(t.pk)?t.pk:best('tir');m.fk[s]=m.us===s&&t.fk&&lu.includes(t.fk)?t.fk:best('pas');
  m.ck=m.ck||{};m.ck[s]=m.us===s&&t.ck&&lu.includes(t.ck)?t.ck:best('pas');
 });
 ['h','a'].forEach(s=>{const o=s==='h'?'a':'h';if(Object.values(m.ord[o]).includes('marca')){const st=m.lu[s].filter(Boolean).sort((a,b)=>PL(b).ovr-PL(a).ovr)[0];m.marked[s]=st;}});
}
/** Media de un atributo de los jugadores de una línea (DEF, MED…) del once. */
export function avgAt(m,s,g,k){const sl=slotsOf(m.f[s]),v=[];m.lu[s].forEach((id,i)=>{if(id&&GRP[sl[i]]===g)v.push(PL(id).at[k]);});return v.length?v.reduce((a,b)=>a+b,0)/v.length:5;}
export function tacMods(m,s,log){
 const o=s==='h'?'a':'h',A=m.tac[s],B=m.tac[o];let own=1,opp=1,drain=1,poss=0;
 // cada factor multiplica las ocasiones propias (ow) y las del rival (op); con log se anota para el informe táctico
 const f=(k,ow,op,dr=1,ps=0)=>{own*=ow;opp*=op;drain*=dr;poss+=ps;if(log&&(ow!==1||op!==1||dr!==1)){const e=log[k]||(log[k]=[0,0,0]);e[0]+=Math.log(ow);e[1]+=Math.log(op);e[2]+=Math.log(dr);}};
 if(A.pre==='alt')f('pre',1,.94*(B.est==='con'?1.08:1),1.08,.03);else if(A.pre==='baj')f('pre',1,1.04,.9,-.03);
 if(A.lin==='alt')f('lin',1.04,1.04*(B.est==='con'?1.06:1));else if(A.lin==='baj')f('lin',.96,.93);
 if(A.rit==='rap')f('rit',1.06,1.03,1.06);else if(A.rit==='len')f('rit',.93,.95,.92,.02);
 const w=(m.wide&&m.wide[s])||0;if(A.anc==='anc')f('anc',1+w/150,1);else if(A.anc==='est')f('anc',1-w/150,1);
 const mq=(m.mq&&m.mq[s])||[50,50];
 if(A.est==='pos')f('est',B.pre==='baj'?1.06:B.pre==='alt'?.93:1,1,1,.05);else if(A.est==='dir')f('est',mq[1]>mq[0]?1.05:.98,1,1,-.02);else if(A.est==='con')f('est',((B.lin==='alt'||m.ment[o]==='att')?1.09:.95)*(1+.012*(avgAt(m,s,'DEL','vel')-5)),1,1,-.05);
 const ords=m.lu[s].map(id=>id&&m.ord[s][id]).filter(Boolean);const up=ords.filter(x=>x==='sube').length,back=ords.filter(x=>x==='fija').length;
 f('ord',1+.015*up-.01*back,1+.012*up-.012*back);
 {const re=roleEffects(slotsOf(m.f[s]),m.ro&&m.ro[s]);f('rol',re.own,re.opp,1,re.poss);}
 {const sl=slotsOf(m.f[s]),du=m.du&&m.du[s],pi=m.pi&&m.pi[s];if(du&&du.length===sl.length){const pe=posTeam(sl,du,pi);f('pos',pe.own,pe.opp,pe.drain,pe.poss);}}
 // instrucciones al rival: las que da el otro equipo (o) frenan a este (s); las propias tienen un coste
 const OI=(m.oi&&m.oi[o])||{},MY=(m.oi&&m.oi[s])||{};
 if(OI.ban)f('oiR',1-Math.max(0,w)/220,1);if(MY.ban)f('oi',.992,1);
 if(OI.sal){const dq=avgAt(m,s,'DEF','pas');f('oiR',dq<5?.97:.99,1,1,-.03);}if(MY.sal)f('oi',1,1,1.06);
 if(OI.dur)f('oiR',m.refr?REFS[m.refr.k].dur:.975,1);
 {const ph=phaseMods(A,B,avgAt(m,s,'DEL','vel'),m.ment[o]);f('fase',ph.own,ph.opp,ph.drain,ph.poss);}
 {const w=weatherMods(m.wx,A);f('clima',w.own,w.opp,w.drain,w.poss);const mm=m.mm&&m.mm[s];if(mm)f('mom',mm.own,mm.opp);}
 const cap=m.cap&&m.cap[s]&&m.lu[s].includes(m.cap[s])?PL(m.cap[s]):null;if(cap)f('cap',1+.004*Math.max(0,(cap.at.lid??(cap.per==='lid'?9:5))-4),1);
 return{own,opp,drain,poss};
}
/** Apunta un tiro para el mapa de tiros: [lado 0/1, jugador, xG en centésimas, resultado g/s/p/m, minuto]. */
export function shotLog(m,s,pid,x,res){m.sh=m.sh||[];m.sh.push([s==='h'?0:1,pid||null,Math.round(x*100),res,m.min]);m.st[s].xg=(m.st[s].xg||0)+x;}
export function addEv(m,t,s,tx,pid){const e={min:m.min,t,s,tx,pid:pid||null};
 if(t==='goal'){e.gt=m._gt||(/[Pp]enalti/.test(tx)?'pen':/falta|córner|corner|balón parado/i.test(tx)?'bp':'otro');m._gt=null;if(s)m.mo={s:s==='h'?'a':'h',u:m.min+8};}
 m.ev.push(e);}
/** Tipos de gol en jugada: dependen de la táctica de los dos equipos y de las cualidades del goleador. */
export const GOALT={pas:{n:'Combinación',tx:['¡Gol de {p}! Paredes al primer toque y la pone junto al palo.','¡{p} culmina una jugada colectiva preciosa!','¡Gol! Triangulación en la frontal y {p} define con calma.']},
 con:{n:'Contraataque',tx:['¡Gol a la contra! Robo, carrera y {p} define ante el portero.','¡Contragolpe letal! {p} cierra la jugada en tres pases.','¡{p} no perdona en el mano a mano tras una contra!']},
 cab:{n:'De cabeza',tx:['¡Gol de cabeza de {p}! Centro desde la banda y testarazo.','¡{p} se eleva más que nadie y la mete de cabeza!','¡Cabezazo de {p} al segundo palo, gol!']},
 lej:{n:'Desde lejos',tx:['¡Golazo de {p} desde fuera del área, a la escuadra!','¡Zapatazo de {p} desde 25 metros!','¡{p} se la saca de lejos y entra pegada al palo!']},
 ind:{n:'Jugada individual',tx:['¡Golazo de {p}! Se va de dos rivales y la cruza.','¡{p} se inventa el gol él solo, regate y remate!','¡Slalom de {p} y gol!']},
 reb:{n:'Rechace',tx:['¡Gol! El portero rechaza y {p} la empuja a la red.','¡{p} caza el rechace en el área pequeña!','¡Gol de pillo de {p} tras un balón suelto!']},
 bp:{n:'Balón parado',tx:[]},pen:{n:'Penalti',tx:[]},otro:{n:'Otros',tx:[]}};
export function goalType(m,s,id){
 const o=s==='h'?'a':'h',A=m.tac[s]||{},B=m.tac[o]||{},p=PL(id),at=p.at,g=GRP[p.sp]||p.pos;
 const w={pas:3,con:1,cab:1.4,lej:.8,ind:1.1,reb:1};
 if(A.est==='con')w.con+=3;if(A.est==='pos')w.pas+=2;if(A.est==='dir'){w.cab+=1;w.lej+=.4;}if(A.anc==='anc')w.cab+=1.2;if(A.rit==='rap')w.con+=.8;
 if(B.lin==='alt')w.con+=1.5;if(B.lin==='baj')w.lej+=.6,w.reb+=.4;if(m.ment[o]==='att')w.con+=1;
 w.cab*=Math.max(.3,1+(at.cab-5)*.18);w.ind*=Math.max(.3,1+(at.reg-5)*.2);w.lej*=Math.max(.2,1+(at.tir-5)*.15)*(g==='MED'?1.6:g==='DEF'?1.2:1);w.con*=Math.max(.4,1+(at.vel-5)*.12);
 if(hasTr(p,'cab'))w.cab*=2;if(hasTr(p,'lej'))w.lej*=2.2;if(hasTr(p,'reg'))w.ind*=1.8;if(hasTr(p,'vel'))w.con*=1.5;if(hasTr(p,'gol'))w.reb*=1.6;
 let t=Object.values(w).reduce((a,b)=>a+b,0),r=rnd()*t;for(const k in w){r-=w[k];if(r<=0)return k;}return 'pas';
}

export const scoreStr=m=>`${m.score.h}-${m.score.a}`;
export function pickScorer(m,s){
 const sl=slotsOf(m.f[s]),w={POR:.02,DEF:.85,MED:2.3,DEL:4.6};const c=[];
 m.lu[s].forEach((id,i)=>{if(!id)return;const p=PL(id),g=GRP[sl[i]];let t=1;if(hasTr(p,'gol'))t*=1.35;if(hasTr(p,'lej')&&g==='MED')t*=1.3;if(hasTr(p,'cab'))t*=1.2;if(hasTr(p,'bal'))t*=1.1;
  if(m.ord[s]&&m.ord[s][id]==='libre')t*=1.3;if(m.marked&&m.marked[s]===id)t*=.6;t*=roleMult(sl[i],m.ro&&m.ro[s]&&m.ro[s][i],'sc');if(m.du&&m.du[s]&&m.du[s].length===sl.length)t*=posMult(sl[i],m.du[s][i],m.pi&&m.pi[s]&&m.pi[s][i],'sc');
  c.push([id,w[g]*t*Math.pow((p.at.tir*.6+p.at.reg*.4+2)/7,1.25)*(.88+.03*(p.wf||3))*(m.hurt[id]?.4:1)]);});
 let tot=c.reduce((a,x)=>a+x[1],0),r=rnd()*tot;for(const [id,wt] of c){r-=wt;if(r<=0)return id;}return c.length?c[0][0]:null;
}
export function pickAssist(m,s,scorer){
 if(rnd()<.17)return null;const sl=slotsOf(m.f[s]),w={POR:.05,DEF:1,MED:3,DEL:2.2};const c=[];
 m.lu[s].forEach((id,i)=>{if(!id||id===scorer)return;const p=PL(id);let t=1;if(hasTr(p,'pas'))t*=1.4;if(hasTr(p,'reg'))t*=1.15;if(hasTr(p,'vel'))t*=1.1;if(m.ord[s]&&m.ord[s][id]==='libre')t*=1.3;t*=roleMult(sl[i],m.ro&&m.ro[s]&&m.ro[s][i],'as');if(m.du&&m.du[s]&&m.du[s].length===sl.length)t*=posMult(sl[i],m.du[s][i],m.pi&&m.pi[s]&&m.pi[s][i],'as');c.push([id,w[GRP[sl[i]]]*t*Math.pow((p.at.pas+p.at.reg*.5+2)/8,2)]);});
 let tot=c.reduce((a,x)=>a+x[1],0),r=rnd()*tot;for(const [id,wt] of c){r-=wt;if(r<=0)return id;}return null;
}
export function calcRatings(m){
 const conc={h:m.score.a,a:m.score.h},res={h:Math.sign(m.score.h-m.score.a),a:Math.sign(m.score.a-m.score.h)},gl={},as={};
 m.ev.forEach(e=>{if(e.t==='goal'){gl[e.pid]=(gl[e.pid]||0)+1;if(e.ast)as[e.ast]=(as[e.ast]||0)+1;}});
 const pw={h:teamPower(m.xi0.h,m.f.h).ovr,a:teamPower(m.xi0.a,m.f.a).ovr},rat={};let best=null,bv=-1;
 const D=m.det=matchDetail(m);
 Object.keys(m.played).forEach(id=>{const p=PL(id);if(!p)return;const s=p.team===m.h?'h':'a',o=s==='h'?'a':'h',g=GRP[p.sp]||p.pos;
  const mins=Math.max(1,(m.outM[id]!=null?m.outM[id]:m.min)-(m.inM[id]||0));
  const dt=D[id]||{kp:0,tk:0,dr:0};
  let r=6.07+res[s]*.35+(gl[id]||0)*1+(as[id]||0)*.6+((p.ovr-pw[o])/10)*.25+dt.kp*.08+dt.tk*.03+dt.dr*.04+gauss()*.45;
  if(g==='POR'||g==='DEF')r+=conc[s]===0?.6:-.18*conc[s];
  if(g==='POR')r+=(m.st[o].ot-conc[s])*.1;
  if(m.off.includes(id))r-=1.2;if(mins<20)r=6+(r-6)*.4;
  r=clamp(Math.round(r*10)/10,3,10);rat[id]=r;if(r>bv){bv=r;best=id;}
  if(m.ref.k==='fr')return;const st=p.st||(p.st=newSt());st.pj++;st.mi+=mins;st.g+=gl[id]||0;st.a+=as[id]||0;st.rs+=r;if((g==='POR'||g==='DEF')&&conc[s]===0&&mins>=60)st.cs++;st.xg=(st.xg||0)+(dt.xg||0);st.kp=(st.kp||0)+dt.kp;st.tk=(st.tk||0)+dt.tk;st.dr=(st.dr||0)+dt.dr;st.du=(st.du||0)+(dt.du||0);
  p.car=p.car||[0,0,0];p.car[0]++;p.car[1]+=gl[id]||0;p.car[2]+=as[id]||0;});
 if(best&&m.ref.k!=='fr')PL(best).st.mv++;m.rat=rat;m.mvp=best;
}
export function bench(m,s){const t=T(m[s]),pick=m[s]===S.user&&(t.subs||[]).length?subsOf(t).concat(t.lineup):null;return squad(m[s]).filter(p=>(!pick||pick.includes(p.id))&&available(p)&&!m.lu[s].includes(p.id)&&!m.out.includes(p.id)&&!m.off.includes(p.id));}
export function doSub(m,s,outId,inId){
 const i=m.lu[s].indexOf(outId);if(i<0||m.subs[s]>=5)return false;
 m.lu[s][i]=inId;m.out.push(outId);m.outM[outId]=m.min;m.inM[inId]=m.min;m.en[inId]=PL(inId).energy;m.played[inId]=1;delete m.hurt[outId];m.subs[s]++;
 if(m.us)addEv(m,'sub',s,`Cambio en ${T(m[s]).name}: entra ${PL(inId).name}, se retira ${PL(outId).name}.`);return true;
}
export function autoSub(m,s,outId){const i=m.lu[s].indexOf(outId),slot=slotsOf(m.f[s])[i];const b=bench(m,s).sort((x,y)=>eff(y,slot)-eff(x,slot))[0];if(b)doSub(m,s,outId,b.id);}
export function aiManage(m,s){
 const o=s==='h'?'a':'h',diff=m.score[s]-m.score[o];
 if(m.us!==s){if(m.min>=70&&diff<0&&m.ment[s]!=='att')m.ment[s]='att';else if(m.min>=75&&diff>0&&m.ment[s]!=='def')m.ment[s]='def';}
 if(m.subs[s]>=5)return;
 const hurt=m.lu[s].find(id=>id&&m.hurt[id]);if(hurt){autoSub(m,s,hurt);return;}
 if(m.min>=58&&m.min<=86&&m.subs[s]<4&&rnd()<.09){let worst=null,we=999;m.lu[s].forEach((id,i)=>{if(id&&i>0&&m.en[id]<we){we=m.en[id];worst=id;}});if(worst&&we<80)autoSub(m,s,worst);}
}
export function setPiece(m,live){
 ['h','a'].forEach(s=>{const o=s==='h'?'a':'h',g=m.lu[o][0]?PL(m.lu[o][0]):null;
  if(rnd()<.0021){if(live&&s===m.us&&!m.auto&&!m.mom){momentPen(m,s);return;}const k=m.lu[s].includes(m.pk[s])?m.pk[s]:m.lu[s].filter(Boolean).sort((a,b)=>PL(b).at.tir-PL(a).at.tir)[0];if(!k)return;const P=PL(k);
   const ok=rnd()<clamp(.66+.025*(P.at.tir-5)-(g?.02*(g.at.por-5):0)+(hasTr(P,'bal')?.04:0),.45,.92);m.st[s].sh++;
   shotLog(m,s,k,.76,ok?'g':'s');
   if(ok){m.score[s]++;m.st[s].ot++;if(m.ref.k==='lg')P.goals++;m.flash=m.min;m._gt='pen';addEv(m,'goal',s,live?`¡Penalti y gol! ${P.name} engaña al portero. (${scoreStr(m)})`:'',k);}
   else if(live)addEv(m,'shot',s,`¡Penalti fallado! ${P.name} no puede con ${g?g.name:'el portero'}.`,k);}
  else if(rnd()<.0038){const k=m.lu[s].includes(m.fk[s])?m.fk[s]:m.lu[s].filter(Boolean).sort((a,b)=>PL(b).at.pas-PL(a).at.pas)[0];if(!k)return;const P=PL(k);m.st[s].sh++;const cen=m.sp&&m.sp[s].fk==='cen',hd=cen?m.lu[s].filter(Boolean).map(PL).sort((a,b)=>(b.at.cab??5)-(a.at.cab??5))[0]:null;let fkg=cen?rnd()<.045*(1+.12*((hd.at.cab??5)-6)):rnd()<.05+.012*((P.at.tir+P.at.pas)/2-5)+(hasTr(P,'bal')?.05:0);shotLog(m,s,cen?hd.id:k,cen?.12:.06,fkg?'g':'s');
   if(fkg&&m.spd&&s!==m.us&&Math.random()>m.spd)fkg=false;
   if(fkg&&cen){m.score[s]++;m.st[s].ot++;if(m.ref.k==='lg')hd.goals++;m.flash=m.min;m._gt='bp';addEv(m,'goal',s,live?`¡Gol de falta ensayada! ${P.name} la cuelga y ${hd.name} cabecea a la red. (${scoreStr(m)})`:'',hd.id);m.ev[m.ev.length-1].ast=P.id!==hd.id?P.id:null;}
   else if(fkg){m.score[s]++;m.st[s].ot++;if(m.ref.k==='lg')P.goals++;m.flash=m.min;m._gt='bp';addEv(m,'goal',s,live?`¡Golazo de falta directa de ${P.name}! (${scoreStr(m)})`:'',k);}
   else if(live)addEv(m,'shot',s,`Falta directa de ${P.name}: ${rnd()<.5?'se marcha por encima':'la saca el portero'}.`,k);}
 });
}
export function card(m,s,straight){
 const ids=m.lu[s].filter((id,i)=>id&&i>0);if(!ids.length)return;// los ya amonestados se cortan: es menos probable que vean la segunda
 const pool=ids.flatMap(x=>{const n=(PL(x).per==='tem'?3:1)*(m.ycm[x]?1:6);return Array(n).fill(x);}),id=pick(pool),p=PL(id);p.st=p.st||newSt();
 if(straight||m.ycm[id]){
  m.lu[s][m.lu[s].indexOf(id)]=null;m.off.push(id);m.outM[id]=m.min;m.st[s].rc++;delete m.hurt[id];if(m.ref.k!=='fr'){p.st.rc++;p.pSusp+=straight?2:1;}
  addEv(m,'red',s,straight?`¡Roja directa para ${p.name}! ${T(m[s]).name} se queda con uno menos.`:`Segunda amarilla para ${p.name}. Expulsado.`,id);
  if(m.us===s&&!m.auto){m.paused=true;m.alert=`${p.name} ha sido expulsado. Revisa tu táctica.`;}
  else if(m.us&&m.us!==s&&!m.auto&&!m.mom&&m.min<85)momentRed(m);
 }else{
  m.ycm[id]=1;m.st[s].yc++;if(m.ref.k!=='fr'){p.yc++;p.st.yc++;}let tx='';if(m.us)tx=fill(pick(TX.yellow),{p:p.name});if(m.ref.k!=='fr'&&p.yc%5===0){p.pSusp+=1;tx+=' Cumple ciclo y se perderá el próximo partido.';}
  if(m.us)addEv(m,'yc',s,tx,id);
 }
}
/** Córners (con su lanzador y los rematadores), faltas y pases de cada minuto. */
/** Ajustes del motor (las pruebas los cambian para medir su efecto). */
export const TUNE={corner:.0045,open:.96};
export function extraStats(m,xs,live){
 const poss=clamp(m.possSum/Math.max(1,m.min),.2,.8);
 ['h','a'].forEach(s=>{const o=s==='h'?'a':'h',st=m.st[s];['co','fo','pa','pc'].forEach(k=>{if(st[k]==null)st[k]=0;});
  const share=s==='h'?poss:1-poss;
  if(rnd()<.025+xs[s]*2){st.co++;
   const ck=PL(m.ck&&m.lu[s].includes(m.ck[s])?m.ck[s]:m.lu[s].find(Boolean));const heads=m.lu[s].filter(Boolean).map(PL).filter(p=>(p.at.cab??0)>=7||p.h>=187||hasTr(p,'cab'));
   const sid=heads.length?pick(heads).id:pickScorer(m,s);
   const cm=m.sp?cornerMult(m.lu[s].filter(Boolean),ck,m.lu[o].filter(Boolean),m.sp[s],m.sp[o],s===m.us?S.spFam:50):1;
   if(ck&&sid&&rnd()<TUNE.corner*cm*(m.spd&&s!==m.us?m.spd:1)*(1+.08*(ck.at.pas-5))*(1+.25*heads.length/3)*(hasTr(ck,'bal')?1.2:1)){const id=sid;
    m.score[s]++;st.sh++;st.ot++;shotLog(m,s,id,.3,'g');if(m.ref.k==='lg')PL(id).goals++;m.flash=m.min;m._gt='bp';addEv(m,'goal',s,live?`¡Gol de córner! ${ck.name} la pone y ${PL(id).name} remata de cabeza. (${scoreStr(m)})`:'',id);m.ev[m.ev.length-1].ast=ck.id!==id?ck.id:null;}}
  if(rnd()<.13*(m.oi&&m.oi[s]&&m.oi[s].dur?1.4:1))st.fo++;
  const n=Math.round(share*11+rnd()*2),acc=clamp(.62+.035*(avgAt(m,s,'MED','pas')-5)+.02*(avgAt(m,s,'DEF','pas')-5)+(m.tac[s].est==='pos'?.05:m.tac[s].est==='dir'?-.05:0)-(m.oi&&m.oi[o]&&m.oi[o].sal?.03:0),.45,.93);
  st.pa+=n;st.pc+=Math.round(n*acc);});
}
/** Consejo del segundo entrenador cada 15 minutos. Con poca táctica, a veces no ve nada útil. */
export function assistantTip(m){
 const us=m.us,o=us==='h'?'a':'h',a=m.st[us],b=m.st[o],poss=m.possSum/Math.max(1,m.min),myPoss=us==='h'?poss:1-poss,diff=m.score[us]-m.score[o],tac=segAt('tac');
 const name=(S.crew||[]).find(x=>x.role==='seg');const who=name?name.name.split(' ')[0]:'Tu ayudante';
 if(rnd()>.45+.06*tac){m.adv={min:m.min,tx:`${who}: «Seguimos así, de momento no veo nada que cambiar.»`};return;}
 const tips=[];const live=liveRatings(m);
 const tired=m.lu[us].filter(Boolean).filter(id=>m.en[id]<52).sort((x,y)=>m.en[x]-m.en[y])[0];
 const bad=m.lu[us].filter(Boolean).filter(id=>live[id]!=null&&live[id]<5.6).sort((x,y)=>live[x]-live[y])[0];
 if((b.xg||0)>(a.xg||0)+.6&&b.sh>=a.sh+3)tips.push(`Están llegando mucho más que nosotros (${b.sh} tiros). Bajaría la línea o pasaría a mentalidad defensiva.`);
 if(myPoss<.42)tips.push(`Solo tenemos el ${Math.round(myPoss*100)}% del balón. Con el estilo Posesión o un organizador en el medio lo controlaríamos mejor.`);
 if(myPoss>.6&&a.sh<=b.sh)tips.push('Tenemos el balón pero no hacemos daño. Un juego más directo o un llegador nos daría ocasiones.');
 if(diff<0&&m.min>=60)tips.push('Vamos perdiendo: es momento de arriesgar con mentalidad ofensiva y algún cambio en ataque.');
 if(diff>0&&m.min>=70)tips.push('Vamos ganando: cerremos el partido con mentalidad defensiva y ritmo lento.');
 if(tired)tips.push(`${PL(tired).name} está muy cansado (${Math.round(m.en[tired])}%). Yo lo cambiaría.`);
 if(bad&&m.min>=30)tips.push(`${PL(bad).name} está teniendo un mal día (${live[bad].toFixed(1)}).`);
 {const lt=laneTip(m);if(lt)tips.push(lt);}
 if((m.wide&&m.wide[o]||0)>4&&b.sh>=a.sh&&b.sh>=3&&!(m.oi&&m.oi[us]&&m.oi[us].ban))tips.push('Nos hacen mucho daño por las bandas: la instrucción «Cerrar las bandas» ayudaría.');
 m.adv={min:m.min,tx:`${who}: «${tips.length?pick(tips):'Lo estamos haciendo bien, sigamos así.'}»`};
 addEv(m,'sys',null,m.adv.tx);
}
/** Notas del partido en directo (sin el azar de la nota final). */
export function liveRatings(m){
 const conc={h:m.score.a,a:m.score.h},res={h:Math.sign(m.score.h-m.score.a),a:Math.sign(m.score.a-m.score.h)},gl={},as={},rat={};
 m.ev.forEach(e=>{if(e.t==='goal'){gl[e.pid]=(gl[e.pid]||0)+1;if(e.ast)as[e.ast]=(as[e.ast]||0)+1;}});
 const t=Math.min(1,m.min/90);
 Object.keys(m.played).forEach(id=>{const p=PL(id);if(!p)return;const s=p.team===m.h?'h':'a',g=GRP[p.sp]||p.pos;
  let r=6.3+res[s]*.3*t+(gl[id]||0)+(as[id]||0)*.6;if(g==='POR'||g==='DEF')r+=conc[s]===0?.4*t:-.2*conc[s];if(m.off.includes(id))r-=1.2;
  rat[id]=clamp(Math.round(r*10)/10,3,10);});
 return rat;
}
/** Lo que pasó en este minuto, para que la vista 2D lo dibuje: quién atacó, por qué banda, quién chutó y cómo acabó.
 *  Usa Math.random (no el generador del juego) para no cambiar los resultados de las partidas. */
export function phaseLog(m,pm){
 const sh=(m.sh||[]).filter(x=>x[4]===m.min),gl=m.ev.filter(e=>e.min===m.min&&e.t==='goal');
 let s,out='build',pid=null,ast=null,kind='open';
 const last=sh[sh.length-1];
 if(gl.length){const e=gl[gl.length-1];s=e.s;out='goal';pid=e.pid;ast=e.ast||null;const tx=String(e.tx||'').toLowerCase();kind=/penalti/.test(tx)?'pen':/córner|corner/.test(tx)?'corner':/falta/.test(tx)?'fk':'open';}
 else if(last){s=last[0]?'a':'h';pid=last[1];out=last[3]==='s'?'save':last[3]==='p'?'post':'miss';}
 else{s=Math.random()<pm?'h':'a';out=Math.random()<.45?'lost':'build';}
 let lane='c';const sl=slotsOf(m.f[s]),i=pid?m.lu[s].indexOf(pid):-1,sp=i>=0?sl[i]:null;
 if(sp&&/^(EI|MI|LI)$/.test(sp))lane='l';else if(sp&&/^(ED|MD|LD)$/.test(sp))lane='r';
 else{const w=(m.tac[s]&&m.tac[s].anc)==='anc'?.7:(m.tac[s]&&m.tac[s].anc)==='est'?.35:.55;const r=Math.random();lane=r<w/2?'l':r<w?'r':'c';}
 m.pl=(m.pl||[]).slice(-5).concat([{min:m.min,s,out,pid,ast,kind,lane}]);
 if(out!=='build'){m.lz=m.lz||{h:{l:0,c:0,r:0},a:{l:0,c:0,r:0}};m.lz[s][lane]+=out==='lost'?1:2;}
}
export function step(m){
 if(m.done)return;
 m.min++;
 const Ph=teamPower(m.lu.h,m.f.h,m.en,m.hurt,m.mult.h,m.ro&&m.ro.h),Pa=teamPower(m.lu.a,m.f.a,m.en,m.hurt,m.mult.a,m.ro&&m.ro.a);
 const tl=m.us?(m.tl=m.tl||{n:0,u:{},r:{},m:[0,0],x:[],ch:[]}):null,uo=m.us==='h'?'a':'h';
 const Th=tacMods(m,'h',tl&&(m.us==='h'?tl.u:tl.r)),Ta=tacMods(m,'a',tl&&(m.us==='a'?tl.u:tl.r));
 if(tl){tl.n++;tl.m[0]+=Math.log(MENT[m.ment[m.us]].own);tl.m[1]+=Math.log(MENT[m.ment[m.us]].opp);
  // cambios tuyos en directo: mentalidad, táctica, plan o jugadores
  const sn={me:m.ment[m.us],t:Object.assign({},m.tac[m.us]),lu:m.lu[m.us].slice(),pl:m.plan||null,oi:Object.assign({},(m.oi&&m.oi[m.us])||{})},k=JSON.stringify(sn);
  if(tl.k&&tl.k!==k&&m.min>1)tl.ch.push({min:m.min,a:tl.sn,b:sn});tl.k=k;tl.sn=sn;}
 const xs={h:xg(Ph,Pa,m.neutral?null:true,m.ment.h,m.ment.a)/90*Th.own*Ta.opp*TUNE.open,a:xg(Pa,Ph,m.neutral?null:false,m.ment.a,m.ment.h)/90*Ta.own*Th.opp*TUNE.open}; // el resto llega por los córners
 m.possSum+=clamp(Ph.mid**2/(Ph.mid**2+Pa.mid**2)+Th.poss-Ta.poss,.2,.8);m.drain={h:Th.drain,a:Ta.drain};
 {// ritmo: el partido se abre al final por el cansancio
  const tp=.76+.3*Math.min(m.min,90)/90;xs.h*=tp*(m.neutral?1:1.05);xs.a*=tp*(m.neutral?1:.95);
  // el marcador manda: quien pierde se vuelca y deja huecos; quien gana se encierra (tu equipo reacciona menos: lo decides tú)
  ['h','a'].forEach(s=>{const o=s==='h'?'a':'h',d=m.score[s]-m.score[o];if(d>=0||m.min<55)return;const k=Math.min(1,(m.min-55)/35)*(m.us===s&&!m.auto?.5:1)*(d<=-2?1.2:1);xs[s]*=1+.2*k;xs[o]*=1+.22*k-.1*k*(m.us===o&&!m.auto?.5:1);});
  // reacción tras encajar: unos minutos de empuje
  if(m.mo&&m.min<=m.mo.u)xs[m.mo.s]*=1.15;
  if(tl)tl.x.push([Math.round(xs[m.us]*1e4),Math.round(xs[uo]*1e4)]);
  if(m.min===89&&m.us)addEv(m,'sys',null,`El cuarto árbitro levanta el cartel: ${m.end-90} minuto${m.end-91?'s':''} de descuento.`);}
 ['h','a'].forEach(s=>m.lu[s].forEach(id=>{if(id){const P=PL(id),fis=P.at.fis;m.en[id]=Math.max(10,m.en[id]-(m.ment[s]==='att'?.26:.21)*(1.25-(P.at.res??fis)*.05)*(P.per==='tra'?.8:1)*(m.drain?m.drain[s]:1));}}));
 const live=!!m.us;
 ['h','a'].forEach(s=>{
  const o=s==='h'?'a':'h',x=xs[s],r=rnd();
  const S_=m.st[s];S_.xg=S_.xg||0;
  if(r<x){const id=pickScorer(m,s);if(!id)return;const ast=pickAssist(m,s,id);m.score[s]++;m.st[s].sh++;m.st[s].ot++;shotLog(m,s,id,.18+rnd()*.5,'g');if(m.ref.k==='lg')PL(id).goals++;m.flash=m.min;
   const gt=goalType(m,s,id);m._gt=gt;addEv(m,'goal',s,live?fill(pick(GOALT[gt].tx),{p:PL(id).name})+(ast&&gt!=='ind'&&gt!=='lej'?` Asistencia de ${PL(ast).name}.`:'')+` (${scoreStr(m)})`:'',id);m.ev[m.ev.length-1].ast=ast;}
  else if(r<x*8.5){m.st[s].sh++;const xv=.02+rnd()*.09;if(!live){const id=pickScorer(m,s),on=rnd()<.38;if(on)m.st[s].ot++;shotLog(m,s,id,xv,on?'s':'m');return;}const id=pickScorer(m,s);if(!id){S_.xg+=xv;return;}const g=m.lu[o][0];
   if(rnd()<.38&&g){m.st[s].ot++;shotLog(m,s,id,xv,'s');addEv(m,'shot',s,fill(pick(TX.save),{p:PL(id).name,g:PL(g).name}),id);}
   else{const post=rnd()<.12;shotLog(m,s,id,xv,post?'p':'m');addEv(m,'shot',s,fill(pick(post?TX.post:TX.miss),{p:PL(id).name}),id);}}
 });
 setPiece(m,live);
 extraStats(m,xs,live);
 if(live)momentsTick(m);
 if(live)phaseLog(m,clamp(Ph.mid**2/(Ph.mid**2+Pa.mid**2)+Th.poss-Ta.poss,.2,.8));
 if(live&&m.us&&m.min%15===0&&m.min<90)assistantTip(m);
 {const dh=m.oi&&m.oi.h&&m.oi.h.dur?1.6:1,da=m.oi&&m.oi.a&&m.oi.a.dur?1.6:1,ph=(m.ment.h==='def'?.57:m.ment.a==='def'?.43:.5)*dh,pa=(1-(m.ment.h==='def'?.57:m.ment.a==='def'?.43:.5))*da;
  if(rnd()<.034*(ph+pa)*(m.derby?1.3:1)*(m.refr?REFS[m.refr.k].c:1))card(m,rnd()<ph/(ph+pa)?'h':'a',false);}
 if(rnd()<.0005)card(m,rnd()<.5?'h':'a',true);
 if(rnd()<.0032){const s=rnd()<.5?'h':'a';const ids=m.lu[s].filter(id=>id&&!m.hurt[id]);if(ids.length){const pool=ids.flatMap(x=>{const w=injWeight(PL(x),m.en[x]);return Array(Math.round(w*2)).fill(x);}),id=pick(pool);m.hurt[id]=1;if(m.ref.k!=='fr'||rnd()<.5){const J=rollInjury(PL(id));PL(id).pInj=J[1];PL(id).pInjT=J[0];}
  if(live)addEv(m,'inj',s,`${PL(id).name} se duele de la rodilla y no puede seguir al mismo nivel.`,id);
  if(m.us===s&&!m.auto){if(!m.mom)momentInj(m,id);else{m.paused=true;m.alert=`${PL(id).name} está lesionado. Haz un cambio.`;}}}}
 if(m.min>=58||Object.keys(m.hurt).length)['h','a'].forEach(s=>{if(m.us!==s||m.auto)aiManage(m,s);});
 if(m.us)['h','a'].forEach(s=>aiInMatch(m,s,addEv,live));
 if(m.min===45&&live){addEv(m,'sys',null,`Descanso · ${T(m.h).short} ${scoreStr(m)} ${T(m.a).short}`);m.half=true;if(!m.auto)m.paused=true;}
 if(m.min>=m.end){m.done=true;m.paused=true;calcRatings(m);if(live)addEv(m,'sys',null,`Final · ${T(m.h).short} ${scoreStr(m)} ${T(m.a).short}`);
  if(m.ko&&m.ref.k!=='fr'&&m.score.h+(m.agg?m.agg[0]:0)===m.score.a+(m.agg?m.agg[1]:0)){if(live&&m.us&&!m.auto){momentShootout(m);}else{m.pen=shootout();if(live)addEv(m,'sys',null,`Penaltis: ${T(m.h).short} ${m.pen[0]}-${m.pen[1]} ${T(m.a).short} · pasa ${T(m.pen[0]>m.pen[1]?m.h:m.a).name}`);}}}
}
export function applyResult(m){
 const fx=getFx(m.ref),uc=LG(uLg()).c;recordH2H(m);
 fx.hg=m.score.h;fx.ag=m.score.a;fx.played=true;fx.pen=m.pen;
 {const th=m.score.h+(m.agg?m.agg[0]:0),ta=m.score.a+(m.agg?m.agg[1]:0);fx.w=m.pen?(m.pen[0]>m.pen[1]?m.h:m.a):th>ta?m.h:ta>th?m.a:null;}
 const keepEv=m.ref.k==='cwc'||(m.ref.k==='lg'?LG(m.ref.lg).c:m.ref.c)===uc;
 fx.ev=keepEv?m.ev.filter(e=>e.t==='goal'||e.t==='red').map(e=>({min:e.min,s:e.s,t:e.t,n:shortNm(e.pid),...(e.gt?{gt:e.gt}:{})})):[];
 const res={h:Math.sign(m.score.h-m.score.a),a:Math.sign(m.score.a-m.score.h)};
 const gl={};m.ev.forEach(e=>{if(e.t==='goal')gl[e.pid]=(gl[e.pid]||0)+1;});
 Object.keys(m.played).forEach(id=>{const p=PL(id);if(!p)return;const s=p.team===m.h?'h':'a';
  p.apps++;p.playedWk=true;p.energy=Math.round(clamp(m.en[id]??p.energy,20,100));
  p.form=clamp(Math.round(p.form*.6+res[s]*1.2+(gl[id]||0)*.9+gauss()*.6),-3,3);});
 recordMatch(m);trackLoans(m);coachResult(m);
 if(m.us){recordCoach(m);forcedAfter(m);const op=m[m.us==='h'?'a':'h'];if(S.spPrep&&S.spPrep.opp===op)S.spPrep=null;}
 if(m.us&&m.ref.k!=='fr')learnTactic(m.tac[m.us]);
 if(m.us&&m.ref.k!=='fr')learnRoles(m);
 if(m.us&&m.ref.k!=='fr')S.tg=(S.tg||0)+1;
 retosMatch(m);
 if(m.us&&m.ref.k!=='fr'){const my0=m.score[m.us],op0=m.score[m.us==='h'?'a':'h'];if(my0-op0>=5)unlock('manita');const xi=m.xi0[m.us].filter(Boolean).map(PL).filter(Boolean);if(xi.filter(p=>p.home).length>=5)unlock('casa');if(xi.some(p=>p.age<=17&&p.st&&p.st.pj<=1))unlock('joven');makePress(m);}
 if(m.us&&m.ref.k!=='fr'){const my=m.score[m.us],op=m.score[m.us==='h'?'a':'h'],R0=S.rec||(S.rec={});if(my-op>0&&(!R0.bigWin||my-op>R0.bigWin.d||(my-op===R0.bigWin.d&&my>R0.bigWin.g)))R0.bigWin={d:my-op,g:my,txt:`${T(m.h).name} ${m.score.h}-${m.score.a} ${T(m.a).name}`,season:seasonLabel(),comp:m.label||''};}
 if(m.us)learnFromMatch(Object.keys(m.played).filter(id=>PL(id)&&PL(id).team!==S.user));
 if(m.us){const xi=m.xi0[m.us].filter(Boolean),stable=xi.filter(id=>S.lastXI.includes(id)).length;
  S.chem=clamp(S.chem+(S.lastXI.length?(stable-8)*.7:0)+res[m.us]*.8,20,100);S.lastXI=xi;
  const f=m.f[m.us];S.famil[f]=clamp(famOf(f)+6,0,100);}
}
export function playerTick(full){
 Object.values(S.players).forEach(p=>{
  if(p.inj>0){p.inj--;if(!p.inj){onRecovered(p);p.injT=0;}}else if(p.recov>0&&full)p.recov--;if(p.susp>0)p.susp--;
  if(p.pInj){if(p.team===S.user&&S.club&&S.club.fac&&S.club.fac.med>1)p.pInj=Math.max(1,Math.round(p.pInj*(1-.08*(S.club.fac.med-1))));p.pInj=Math.round(p.pInj*relapseMult(p));p.rplan=null;p.inj+=p.pInj;p.injT=p.pInjT||'Lesión';if(p.team===S.user)news(`${p.name}: ${String(p.injT).toLowerCase()}. Estará ${p.inj} partido${p.inj>1?'s':''} de baja.${p.recov>0?' Es una recaída.':''}`,'bad',{cat:'med',subj:`Lesión: ${p.name} (${p.inj} partido${p.inj>1?'s':''})`,act:[{l:'Plan conservador',a:'rplan',id:p.id,v:'c'},{l:'Plan acelerado',a:'rplan',id:p.id,v:'a'},{l:'Ver ficha',a:'ficha',id:p.id}]});p.pInjT=0;}
  if(p.pSusp){p.susp+=p.pSusp;if(p.team===S.user)news(`${p.name} cumplirá ${p.susp} partido${p.susp>1?'s':''} de sanción.`,'bad');}
  p.pInj=0;p.pSusp=0;
  const mine=p.team===S.user;
  p.energy=Math.round(Math.min(100,p.energy+(100-p.energy)*((full?.45:.25)+(mine?recBonus():0))+(full?4:2)));
  if(!full)return;
  if(mine){trainPlayer(p);if(!p.playedWk)p.form=Math.trunc(p.form*.7);p.playedWk=false;return;}
  if(p.team!==null&&rateA(p.at,p.pos)<p.pot&&rnd()<(p.age<=21?.075:p.age<=24?.05:p.age<=28?.025:p.age<=31?.01:0)*(p.playedWk?1.15:.85)*(p.ph&&p.ph.length&&p.ovr-p.ph[p.ph.length-1][1]>=7?0:1)){const k=wpick(W[p.pos]);if(p.at[k]<10){p.at[k]++;refresh(p);if(p.team===S.user)news(`${p.name} progresa: su ${AT_NAME[k].toLowerCase()} sube a ${p.at[k]}.`,'good');}}
  if(!p.playedWk)p.form=Math.trunc(p.form*.7);
  p.playedWk=false;
 });
}
export const TALKS={pre:{mot:'Motivar: “Hoy podemos con cualquiera”',cal:'Tranquilizar: “Jugad sin presión”',exi:'Exigir: “Quiero ver intensidad”',con:'Confianza: “Creed en el plan”'},half:{ani:'Dar ánimos',bro:'Echar la bronca',cal:'Pedir calma',elo:'Elogiar al equipo'}};
export function talkEffect(m,ph,opt){
 const us=m.us,o=us==='h'?'a':'h',diff=teamPower(m.lu[us],m.f[us]).ovr-teamPower(m.lu[o],m.f[o]).ovr,big=m.ref.k!=='lg';
 const xi=m.lu[us].filter(Boolean).map(PL),form=xi.reduce((a,p)=>a+p.form,0)/Math.max(1,xi.length),sd=m.score[us]-m.score[o];
 let d=0;
 if(ph==='pre'){if(opt==='mot')d=diff<-3?.04:diff<3?.02:(rnd()<.35?-.015:.01);else if(opt==='cal')d=big?.03:diff>3?.025:.01;else if(opt==='exi')d=form>=.5?.04:rnd()<.5?.03:-.03;else d=.045*S.chem/100-.01;}
 else{if(opt==='ani')d=sd<0?.03:.01;else if(opt==='bro')d=sd<0?(rnd()<.55?.055:-.025):sd===0?(rnd()<.5?.03:-.02):-.03;else if(opt==='cal')d=sd>0?.03:sd===0?.015:-.01;else d=sd>0?(rnd()<.3?-.02:.02):-.015;}
 d=r3(d*(.85+.03*segAt('mot'))+gauss()*.006);
 const txt=d>=.03?'los jugadores salen enchufados.':d>0?'el mensaje llega al vestuario.':d>-.01?'la charla no cambia mucho.':'la charla sienta mal y se nota tensión en el vestuario.';
 return{d,txt};
}
export const shootout=()=>{let a=0,b=0;for(let i=0;i<5;i++){if(rnd()<.76)a++;if(rnd()<.76)b++;}while(a===b){a+=rnd()<.76?1:0;b+=rnd()<.76?1:0;}return[a,b];};
export function poisson(l){let L=Math.exp(-l),k=0,p=1;do{k++;p*=rnd();}while(p>L);return k-1;}
export function quickMatch(ref){
 const m=createMatch(ref);m.auto=true;
 const Ph=teamPower(m.lu.h,m.f.h,null,null,m.mult.h,m.ro&&m.ro.h),Pa=teamPower(m.lu.a,m.f.a,null,null,m.mult.a,m.ro&&m.ro.a),Th=tacMods(m,'h'),Ta=tacMods(m,'a');
 if(m.us){const o=m.us==='h'?'a':'h';m.tl={n:1,u:{},r:{},m:[Math.log(MENT[m.ment[m.us]].own),Math.log(MENT[m.ment[m.us]].opp)],x:null,ch:[]};tacMods(m,m.us,m.tl.u);tacMods(m,o,m.tl.r);}
 const xh=xg(Ph,Pa,m.neutral?null:true,m.ment.h,m.ment.a)*Th.own*Ta.opp*1.1,xa=xg(Pa,Ph,m.neutral?null:false,m.ment.a,m.ment.h)*Ta.own*Th.opp*1.1;
 m.min=m.end;const poss=clamp(Ph.mid**2/(Ph.mid**2+Pa.mid**2)+Th.poss-Ta.poss,.2,.8);m.possSum=poss*m.min;
 const goals=[];['h','a'].forEach(s=>{const n=poisson(s==='h'?xh:xa);m.st[s].sh=n+poisson(9.5);m.st[s].ot=n+poisson(2.6);for(let i=0;i<n;i++)goals.push([ri(1,m.end),s]);});
 goals.sort((a,b)=>a[0]-b[0]).forEach(([mn,s])=>{m.min=mn;const id=pickScorer(m,s);if(!id)return;const ast=pickAssist(m,s,id);m.score[s]++;if(m.ref.k==='lg')PL(id).goals++;m._gt=rnd()<.14?(rnd()<.6?'pen':'bp'):goalType(m,s,id);addEv(m,'goal',s,'',id);m.ev[m.ev.length-1].ast=ast;});
 m.min=m.end;
 ['h','a'].forEach(s=>{const n=poisson(1.85*(m.derby?1.25:1));for(let i=0;i<n;i++)card(m,s,false);if(rnd()<.022)card(m,s,true);
  m.lu[s].forEach(id=>{if(id)m.en[id]=Math.max(20,m.en[id]-19*(m.drain?m.drain[s]:1));});
  if(rnd()<.14){const ids=m.lu[s].filter(Boolean);if(ids.length){const id=pick(ids),J=rollInjury(PL(id));PL(id).pInj=J[1];PL(id).pInjT=J[0];}}});
 // tiros con su xG: los goles suelen ser ocasiones claras; el resto reparte lo que falta hasta el xG del equipo
 ['h','a'].forEach(s=>{const st=m.st[s],T=(s==='h'?xh:xa)*(.8+rnd()*.4),gs=m.ev.filter(e=>e.t==='goal'&&e.s===s),rest=Math.max(0,st.sh-gs.length);
  let used=0;gs.forEach(e=>{const v=Math.min(.95,.15+rnd()*.5);used+=v;m.min=e.min;shotLog(m,s,e.pid,v,'g');});
  const each=Math.max(.02,(T-used)/Math.max(1,rest));let on=Math.max(0,st.ot-gs.length);
  for(let i=0;i<rest;i++){m.min=ri(1,m.end);const v=clamp(each*(.4+rnd()*1.2),.01,.6),o=on-->0;shotLog(m,s,pickScorer(m,s),v,o?'s':rnd()<.08?'p':'m');}
  m.min=m.end;st.xg=0;(m.sh||[]).forEach(x=>{if(x[0]===(s==='h'?0:1))st.xg+=x[2]/100;});});
 ['h','a'].forEach(s=>{const st=m.st[s],sh=s==='h'?poss:1-poss;st.co=poisson(4.6*(s==='h'?xh:xa)/1.3+1);st.fo=poisson(12);st.pa=Math.round(sh*1000+rnd()*60);st.pc=Math.round(st.pa*clamp(.62+.035*(avgAt(m,s,'MED','pas')-5),.45,.93));});
 if(m.ko&&m.score.h+(m.agg?m.agg[0]:0)===m.score.a+(m.agg?m.agg[1]:0))m.pen=shootout();
 m.done=true;m.paused=true;calcRatings(m);return m;
}
