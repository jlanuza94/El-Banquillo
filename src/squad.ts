/* El Banquillo · squad.js — Felicidad, vestuario, agentes, cláusulas y entrenamiento. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {careerWeekly} from './mgrcareer';
import {monthlyAwards} from './monthly';
import {winterWeekly} from './preseason';
import {delegWeekly} from './delegate';
import {schedWeekly,trMult} from './training2';
import {loanRequests,processBids,tsWeight} from './marketfm';
import {captainWeekly,publicWeekly,stadiumWeekly} from './extras2';
import {objectivesWeekly,piqueWeekly} from './extras';
import {devWeekly} from './devplus';
import {gemsWeekly,missionsWeekly,shortlistWeekly} from './scoutplus';
import {youthTournament} from './youthplus';
import {weeklyBonuses} from './negotiate';
import {derbyWeekNews,isDerby} from './rivals';
import {midSeasonReleases,payFee,valueWeekly} from './economy';
import {retosWeekly} from './retos';
import {fifaWeek} from './nations';
import {checkProm,meetWeekly} from './talks';
import {quickWeekly} from './quick';
import {bankWeekly,wageBill} from './clubplus';
import {coachesWeekly} from './living';
import {contactsWeekly,vestWeekly} from './connected';
import {learnTactic} from './plans';
import {mentorOf,mentorWeekly} from './mentor';
import {deadlineDeals,interested,rumoursWeekly,sellOnOut} from './market2';
import {youthRound} from './youth';
import {scoutingWeekly} from './scouting';
import {sellMult} from './staff';
import {crewWages,crewWeekly,recBonusStaff,trainInjMult,trainMult} from './staff';
import {clamp,money,pick,r2,r3,ri,rnd} from './core';
import {AT_NAME,FORMS,ROLES,W} from './data';
import {LG,PL,S,T,econ,lgName,rt,seasonLabel,setTeam,squad,uLg,unit} from './state';
import {assignNum,baseWage,rateA,refresh,wpick} from './players';
import {news} from './world';
import {famOf,fixLineup,langOf,leaders,nRounds,nextFixture} from './tactics';
import {playerTick} from './engine';
import {aiTransfers,expRole,inWindow,isDeadline,windowTxt} from './market';
import {winRounds} from './calendar';
import {attendance,clubWeekly,facMaint,shopWeekly,unlock} from './club';
import {mgrWeekly} from './career';
import {academyWeekly,scoutWages,scoutsWeekly} from './academy';
export function hapTag(p){const h=p.hap==null?70:p.hap;return h>=75?'<span class="tag xi">Muy contento</span>':h>=55?'<span class="tag">Contento</span>':h>=40?'<span class="tag">Normal</span>':h>=25?'<span class="tag bad">Descontento</span>':'<span class="tag bad">Enfadado</span>';}
export function minShare(p){const tg=S.tg||0;return tg?((p.st&&p.st.pj)||0)/tg:1;}
export function hapReasons(p){
 const out=[],R=ROLES[p.role||'ro'],sh=minShare(p);
 if((S.tg||0)>=6){if(sh<R.min-.15)out.push([`Juega poco para su rol de ${R.n.toLowerCase()} (${Math.round(sh*100)}% de los partidos).`,'bad']);else if(sh>=R.min)out.push(['Contento con sus minutos.','good']);}
 if(p.wage<baseWage(p)*.7)out.push(['Cree que cobra poco para su nivel.','bad']);
 if(p.contract<=1&&!p.loan)out.push(['Está en su último año de contrato.',S.week>=19?'bad':'']);
 if(p.per==='amb'&&p.ovr>LG(uLg()).rep+12)out.push(['Es ambicioso y quiere jugar en un club más grande.','bad']);
 if(p.req)out.push(['Ha pedido salir del club.','bad']);
 if(p.prom)out.push([p.prom.type==='ren'?`Le prometiste renovarle antes de la jornada ${p.prom.until+1}.`:`Le prometiste más minutos (revisión en la jornada ${p.prom.until+1}).`,'']);
 if(!out.length)out.push(['Nada le preocupa ahora mismo.','good']);
 return out;
}
export function agentsWeekly(){
 if(rnd()>.12)return;const my=LG(uLg()).rep;const c=squad(S.user).filter(p=>!p.loan&&p.hap<70&&p.ovr>=my+3).sort((a,b)=>b.value-a.value).slice(0,3);if(!c.length)return;
 const p=pick(c);p.hap=clamp(p.hap-8,0,100);news(`El agente de ${p.name} dice a la prensa que su cliente «merece un club más grande». Su ánimo baja.`,'bad');
}
export function hapWeekly(res){
 const tg=S.tg||0,lead=leaders(3);
 squad(S.user).forEach(p=>{if(p.hap==null)p.hap=70;if(!p.role)p.role=p.loan?'ro':expRole(p);
  let d=(65-p.hap)*.03+res*.6;const R=ROLES[p.role],sh=minShare(p);
  if(tg>=6){if(sh<R.min-.15)d-=.5+2.2*(R.min-sh)/.3;else if(sh>=R.min)d+=.6;}
  if(p.wage<baseWage(p)*.7)d-=.8;if(p.contract<=1&&!p.loan&&S.week>=19)d-=.4;if(p.per==='amb'&&p.ovr>LG(uLg()).rep+12)d-=.7;
  if(lead.some(([L])=>L!==p&&L.hap<35&&langOf(L)===langOf(p)))d-=.6;
  if(p.adapt>0){p.adapt--;if(!p.adapt)news(`${p.name} ya se ha adaptado al club y al país.`,'good');}
  if(d<0&&p.per==='lea')d*=.5;p.hap=clamp(p.hap+d,0,100);
  checkProm(p);
  if(p.hap<25&&!p.req&&!p.loan){p.req=1;news(`${p.name} está descontento y pide salir del club.`,'bad',{cat:'pla',from:p.name,subj:'Quiero salir del club',act:[{l:'Hablar con él',a:'chat',id:p.id}]});}
  if(p.req&&p.hap>45){p.req=0;news(`${p.name} retira su petición de salir.`,'good');}
 });
}
export function chatOpt(p,v){
 if(p.tw===S.week)return['Ya has hablado con él esta jornada.',''];p.tw=S.week;
 if(v==='min'){const order=['su','jo','ro','ti','cl'],i=order.indexOf(p.role||'ro');p.role=order[Math.min(4,Math.max(i+1,2))];p.hap=clamp(p.hap+10,0,100);p.prom={type:'min',until:S.week+8};return[`Le prometes más minutos: ahora es ${ROLES[p.role].n.toLowerCase()}. Si no juega en las próximas jornadas, se enfadará.`,'ok'];}
 if(v==='elo'){const good=p.form>0||(p.st&&p.st.pj&&p.st.rs/p.st.pj>=6.8);p.hap=clamp(p.hap+(good?6:-3),0,100);return good?['Le sienta bien: sabe que lo está haciendo bien.','ok']:['No se lo cree: sabe que no está en su mejor momento.','no'];}
 if(v==='ren'){p.hap=clamp(p.hap+8,0,100);p.prom={type:'ren',until:S.week+6};return['Le prometes renovar. Tienes 6 jornadas para cumplirlo.','ok'];}
 if(v==='pac'){if(rnd()<.5){p.hap=clamp(p.hap+12,0,100);p.req=0;return['Acepta esperar y retira su petición de salir.','ok'];}p.hap=clamp(p.hap-5,0,100);return['No le convences: sigue queriendo irse.','no'];}
 return['',''];
}
export function clauseWeekly(){
 if(!inWindow()||rnd()>.3)return;const my=LG(uLg()).rep;
 const c=squad(S.user).filter(p=>!p.loan&&p.cl&&p.cl<p.value*1.7&&p.ovr>=my);if(!c.length)return;const p=pick(c);
 const buyers=S.teams.filter(t=>t.id!==S.user&&LG(t.lg).rep>=my&&t.rep>=p.ovr-4);if(!buyers.length||rnd()>.35)return;const t=pick(buyers);
 if(squad(S.user).length<=16)return;
 const paid=p.cl;S.budget=r3(S.budget+paid);payFee(null,t.id,paid);sellOnOut(p,paid);setTeam(p,t.id);assignNum(p);p.cl=r2(p.value*(2+rnd()*2));p.req=0;p.prom=null;const tm=T(S.user),i=tm.lineup.indexOf(p.id);if(i>=0)tm.lineup[i]=null;fixLineup();
 news(`${t.name} paga la cláusula de ${p.name} (${money(paid)}) y se lo lleva.`,'bad');
}
export const FOCUS={eq:{n:'Equilibrado',d:'Mejora lo propio de cada posición.',at:null,g:1},ata:{n:'Ataque',d:'Remate, regate y cabezazo.',at:['tir','reg','cab'],g:1.05},def:{n:'Defensa',d:'Entradas, colocación y cabezazo.',at:['def','col','cab'],g:1.05},tec:{n:'Técnica',d:'Pase, regate y visión.',at:['pas','reg','vis'],g:1.05},fis:{n:'Físico',d:'Velocidad, resistencia y fuerza. Mejor recuperación.',at:['vel','res','fis'],g:1,rec:.05},tac:{n:'Táctica y química',d:'Sube la química y el dominio de la formación. Mejora poco a los jugadores.',at:null,g:.4},des:{n:'Descanso',d:'Recuperan mucha energía. No mejoran.',at:null,g:0,rec:.2}};
export const INTS={s:{n:'Suave',g:.6,rec:.08,inj:.001},n:{n:'Normal',g:1,rec:0,inj:.003},i:{n:'Intensa',g:1.45,rec:-.1,inj:.009}};
export const STAFF_OLD={pre:{n:'Preparadores',d:'Cada nivel acelera la mejora de los jugadores en el entrenamiento.'},fis:{n:'Fisioterapeutas',d:'Cada nivel mejora la recuperación de energía y reduce las lesiones en el entrenamiento.'}};
export const staffCost=(k,l)=>r3((l-1)*unit(LG(uLg()).rep)*.035);
export const staffTotal=()=>crewWages();
export function recBonus(){const F=FOCUS[S.train.focus],I=INTS[S.train.int];return (F.rec||0)+I.rec+recBonusStaff();}
export function growChance(p){
 const F=FOCUS[S.train.focus],I=INTS[S.train.int];
 const age=p.age<=21?.075:p.age<=24?.05:p.age<=28?.025:p.age<=31?.01:0;
 return trMult(p)*age*F.g*I.g*(p.per==='pro'?1.25:1)*(S.club?1+.1*(S.club.fac.ent-1):1)*trainMult()*(mentorOf(p.id)?1.2:1)*(rateA(p.at,p.pos)<p.pot?1:0)*(p.playedWk?1.2:.9)*(p.loan?.8:1);
}
export function trainPlayer(p){
 const F=FOCUS[S.train.focus],I=INTS[S.train.int];
 if(F.g>0&&rnd()<I.inj*(1+(p.prone||0))*trainInjMult()&&!p.inj){p.inj=ri(1,2);p.injT='Sobrecarga muscular';S.trainLog.unshift({wk:S.week+1,txt:`${p.name} se lesiona entrenando (${p.inj} partido${p.inj>1?'s':''}).`,bad:1});news(`${p.name} se lesiona en el entrenamiento: ${p.inj} partido${p.inj>1?'s':''} de baja.`,'bad');}
 const base=p.ph&&p.ph.length?p.ph[p.ph.length-1][1]:null;
 if((base==null||p.ovr-base<7)&&rnd()<growChance(p)){
  const k=p.tf&&p.tf!=='auto'?p.tf:F.at?pick(F.at):wpick(W[p.pos]);
  if(p.at[k]<10){const before=p.ovr;p.at[k]++;refresh(p);p.sg=(p.sg||0)+1;
   if(p.age<=21&&p.boomS!==S.seasonN){const base=p.ph&&p.ph.length?p.ph[p.ph.length-1][1]:before;if(p.ovr-base>=6){p.boomS=S.seasonN;news(`¡${p.name} está explotando! Ya tiene ${rt(p)} de media con ${p.age} años.`,'good');}}S.trainLog.unshift({wk:S.week+1,txt:`${p.name}: ${AT_NAME[k].toLowerCase()} sube a ${p.at[k]}${p.ovr>before?' · media '+rt(p):''}.`});}
 }
 S.trainLog=S.trainLog.slice(0,30);
}
export function weeklyTeamTraining(){
 schedWeekly(famOf);
 if(S.train.focus==='tac'){learnTactic(T(S.user).tac,S.train.int==='i'?4:S.train.int==='s'?1.5:2.5);const g=S.train.int==='i'?4.5:S.train.int==='s'?2:3;S.chem=clamp(S.chem+g,20,100);const f=T(S.user).formation;S.famil[f]=clamp(famOf(f)+g+1,0,100);}
 Object.keys(FORMS).forEach(f=>{if(f!==T(S.user).formation&&famOf(f)>30)S.famil[f]=famOf(f)-1;});
 const n=squad(S.user).length;if(n>26)S.chem=clamp(S.chem-.5,20,100);
 if(S.lastXI.some(id=>PL(id)&&(PL(id).per==='lid'||(PL(id).at.lid??0)>=8)&&PL(id).team===S.user))S.chem=clamp(S.chem+.6,20,100);
}
export function processWeek(){
 const wk=S.week,fx=nextFixture();
 delegWeekly();if(S.week===Math.floor(nRounds()/2))midSeasonReleases();playerTick(true);weeklyTeamTraining();
 const home=fx.h===S.user,wages=wageBill()+bankWeekly()+staffTotal()+scoutWages()+S.mgr.sal+facMaint(),e=econ(uLg()),tv=e.tv,derbyH=home&&isDerby(fx.h,fx.a),tix=home?r3(ticket()*(derbyH?1.25:1)):0,shop=shopWeekly();
 const my=home?fx.hg:fx.ag,op=home?fx.ag:fx.hg;
 if(home){S.club.lastAtt=Math.min(S.club.cap,Math.round(attendance()*(derbyH?1.25:1)));if(S.club.lastAtt>=S.club.cap)S.fullHomes=(S.fullHomes||0)+1;if(!S.rec)S.rec={};if(!S.rec.att||S.club.lastAtt>S.rec.att.v)S.rec.att={v:S.club.lastAtt,season:seasonLabel()};}
 if(!S.sponsor&&S.week>=3&&S.spOffers&&S.spOffers.length){S.sponsor=S.spOffers[0];news(`La directiva firma con ${S.sponsor.name} como patrocinador al no elegir tú.`);}
 const spo=S.sponsor?r3(S.sponsor.weekly+(my>op?S.sponsor.win:0)):0;
 S.budget=r3(S.budget+tv+tix+spo+shop-wages);if(S.budget>=50)unlock('millo');
 {const bon=weeklyBonuses();S.fin.push({wk:wk+1,tv,tix,spo,shop,wages:r3(wages+bon)});}
 clubWeekly(my>op,my<op);
 news(`Jornada ${wk+1}: ${T(fx.h).name} ${fx.hg}-${fx.ag} ${T(fx.a).name}. ${my>op?'Victoria.':my<op?'Derrota.':'Empate.'}`,my>op?'good':my<op?'bad':'');
 scoutsWeekly();scoutingWeekly();processBids(true);loanRequests();missionsWeekly();shortlistWeekly();gemsWeekly();devWeekly();objectivesWeekly();captainWeekly();publicWeekly();stadiumWeekly();if(wk%2===1)youthRound();academyWeekly();crewWeekly();mentorWeekly();contactsWeekly();vestWeekly();coachesWeekly();quickWeekly();hapWeekly(Math.sign(my-op));meetWeekly();fifaWeek();youthTournament();retosWeekly(home);valueWeekly();agentsWeekly();clauseWeekly();mgrWeekly(my,op);
 if(inWindow())aiTransfers(isDeadline()?70:28);
 if(isDeadline())news('Último día de mercado: después de esta jornada se cierra el mercado de fichajes.','bad');
 if(S.budget<0&&S.week%6===0)news('Estás en números rojos. La directiva te pide vender o rebajar sueldos: no podrás fichar hasta recuperar presupuesto.','bad');
 S.week++;S.offers={};S.neg={};S.ren={};S.lo={};S.loanTry={};monthlyAwards(wk);careerWeekly();
 {const nx=S.week<nRounds()?nextFixture():null;if(nx){const opp=nx.h===S.user?nx.a:nx.h;if(isDerby(S.user,opp))derbyWeekNews(opp);piqueWeekly(opp,isDerby(S.user,opp));}}
 rumoursWeekly();deadlineDeals();
 if(S.week===Math.floor(nRounds()/2)){const ex=squad(S.user).filter(p=>!p.loan&&p.contract<=1);if(ex.length)news(`Mitad de temporada: ${ex.length} jugador${ex.length>1?'es acaban':' acaba'} contrato en junio. Renuévalos desde Inicio o su ficha, o se irán libres.`,'bad',{cat:'dir',subj:'Contratos que acaban en junio',act:[{l:'Ver contratos',a:'pl-open',v:'cont'}]});}
 incomingOffer();
 if(S.week>=nRounds())news('Termina la temporada. Mira cómo ha quedado todo en Inicio.','good');
 winterWeekly(winRounds,inWindow,windowTxt);
}
export function ticket(){if(!S.club)return 0;return r3(Math.max(0,attendance()-(S.club.socios||0))*S.club.price/1e6);}
export function incomingOffer(){
 if(S.week>=nRounds()||!inWindow())return;
 const tries=isDeadline()?3:1,myRep=LG(uLg()).rep;
 for(let k=0;k<tries;k++){if(rnd()>(squad(S.user).some(p=>p.ts==='list')?.7:.5))continue;
  const mine=squad(S.user).filter(p=>!p.loan&&p.ts!=='no').sort((a,b)=>b.value-a.value).slice(0,10).concat(squad(S.user).filter(p=>p.ts==='list'&&!p.loan));if(!mine.length)return;
  const pool=mine.flatMap(p=>Array(tsWeight(p)).fill(p)),p=pick(pool),cur=S.offers[p.id];
  const cands=S.teams.filter(t=>t.id!==S.user&&(!cur||t.id!==cur.team)&&LG(t.lg).rep>=myRep-4&&LG(t.lg).rep<=myRep+20&&t.rep>=p.ovr-6&&t.rep<=p.ovr+12);if(!cands.length)continue;
  const intr=interested(p.id).filter(id=>id!==(cur&&cur.team)),t=intr.length&&rnd()<.6?T(pick(intr)):pick(cands);
  if(cur&&cur.incoming){const amount=r2(cur.amount*(1.1+rnd()*.15));news(`¡Puja! ${t.name} supera la oferta de ${T(cur.team).name} por ${p.name}: ${money(amount)}.`,'good',{cat:'mer',subj:`Puja por ${p.name}`,act:[{l:'Ver oferta',a:'offer-view',id:p.id}]});S.offers[p.id]={team:t.id,amount,incoming:true,rival:cur.team};}
  else{const amount=r2(p.value*(.9+rnd()*.45)*(LG(t.lg).rep>myRep?1.15:1)*sellMult());S.offers[p.id]={team:t.id,amount,incoming:true};news(`${t.name} (${lgName(t.lg)}) ofrece ${money(amount)} por ${p.name}. Responde antes de la próxima jornada.`,'',{cat:'mer',from:T(t.id).name,subj:`Oferta por ${p.name}: ${money(amount)}`,act:[{l:'Ver oferta',a:'offer-view',id:p.id}]});}
 }
}
