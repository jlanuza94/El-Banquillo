/* El Banquillo · marketfm.ts — Mercado al estilo FM Mobile: los clubes responden en uno o dos días,
 * tus jugadores tienen estado (transferible, cedible, intocable) y todas las negociaciones en un sitio. */
// @ts-nocheck — usa el estado heredado S.
import {money,r2,rnd} from './core';
import {LG,PL,S,T,setTeam,unit} from './state';
import {assignNum} from './players';
import {payFee} from './economy';
import {news} from './world';
import {inWindow,makeBid,negState} from './market';
import {firstPay,interested} from './market2';

export const TS={'':'Normal',list:'Transferible',loan:'Cedible',no:'Intocable'};
/** Envías la oferta: el club la estudia y responde en 1 o 2 días (los errores obvios se avisan al momento). */
export function sendBid(id,amt,opt){
 const p=PL(id),n=negState(id);if(!p)return;
 if(n.wait){n.msg=`Ya tienes una oferta por ${p.name} esperando respuesta.`;n.kind='no';return;}
 if(n.closed||!(amt>0)||(p.team!==null&&!inWindow())||firstPay(amt,p.team===null?{}:opt||{})>S.budget){makeBid(id,amt,opt);return;}
 if(p.team===null){makeBid(id,amt,opt);return;} // con los libres negocia su agente al momento
 S.bids=(S.bids||[]).filter(b=>b.id!==id);const due=S.day+(rnd()<.55?1:2);S.bids.push({id,amt,opt,due});
 n.wait={amt,due};n.msg=`Oferta enviada a ${T(p.team).name}: ${money(amt)}. Responderán en ${due-S.day===1?'1 día':'2 días'} (pulsa Continuar).`;n.kind='ok';
}
/** Cada día (o al pasar una jornada entera): llegan las respuestas. */
export function processBids(all){
 aucExpire(all);
 if(!S.bids||!S.bids.length)return;const keep=[];
 S.bids.forEach(b=>{if(!all&&b.due>S.day){keep.push(b);return;}const p=PL(b.id),n=negState(b.id);n.wait=null;if(!p||p.team===S.user)return;const club=p.team!==null?T(p.team).name:'Su agente';
  if(auction(b,p,n,club))return;
  makeBid(b.id,b.amt,b.opt);const ok=n.kind==='ok';if(ok)S.auc=(S.auc||[]).filter(a=>a.id!==b.id);
  news(`${club} responde a tu oferta de ${money(b.amt)} por ${p.name}: ${n.msg}`,ok?'good':'bad',{cat:'mer',subj:`${ok?'Oferta aceptada':'Respuesta'}: ${p.name}`,act:[{l:ok?'Negociar contrato':'Ver negociación',a:'neg',id:b.id}]});});
 S.bids=keep;
}
/** Peso de cada jugador tuyo para recibir ofertas según su estado. */
export const tsWeight=p=>p.ts==='no'?0:p.ts==='list'?4:1;
/** Los cedibles atraen peticiones de cesión. */
export function loanRequests(){if(!inWindow())return;const L=Object.values(S.players).filter(p=>p.team===S.user&&p.ts==='loan'&&!p.loan);if(!L.length||rnd()>.35)return;const p=L[Math.floor(rnd()*L.length)];
 news(`Hay clubes interesados en llevarse cedido a ${p.name}. Puedes cederle desde Mercado › Vender.`,'',{cat:'mer',subj:`Piden la cesión de ${p.name}`,act:[{l:'Ver ventas',a:'pub-sell',id:p.id}]});}

/* ---------- Día de cierre en directo: el último día del mercado avanza por horas ---------- */
export const DL_H=['10:00','13:00','16:00','19:00','22:00','23:59'];
/** Día del cierre del mercado abierto ahora (la víspera de la jornada tras la que se cierra). */
export function dlDay(isDeadline,lgDay){return isDeadline()?lgDay(S.week)-1:-1;}
export const dlActive=(isDeadline,lgDay)=>{const d=dlDay(isDeadline,lgDay);return d>=0&&S.day===d&&S.dlDone!==S.day;};
/** Una hora del día de cierre: fichajes de última hora en el mundo, pujas por los tuyos y respuestas al momento. */
export function dlStep(aiTransfers,incomingOffer){
 S.dlH=(S.dlH&&S.dlD===S.day?S.dlH:0)+1;S.dlD=S.day;const h=DL_H[Math.min(S.dlH,DL_H.length)-1];
 const before=(S.tlog||[]).length;aiTransfers(14);const moves=(S.tlog||[]).slice(0,Math.max(0,(S.tlog||[]).length-before)).slice(0,4);
 incomingOffer();processBids(true);
 S.dlFeed=(S.dlD===S.day&&S.dlFeed?S.dlFeed:[]).concat([{h,t:moves.length?moves.map(x=>`${x.name} → ${T(x.to).name}${x.fee?' ('+money(x.fee)+')':''}`).join(' · '):'Rumores y llamadas, pero ningún cierre todavía.'}]);
 if(S.dlH>=DL_H.length){S.dlDone=S.day;news('¡Se cierra el mercado! Ya no se pueden fichar jugadores con contrato hasta la próxima ventana.','',{cat:'mer',subj:'Cierre del mercado'});}
 else news(`Día de cierre · ${h}: ${S.dlFeed[S.dlFeed.length-1].t}`,'',{cat:'mer',subj:`Día de cierre · ${h}`});
}

/* ---------- Pujas: otro club también quiere al jugador ---------- */
/** Un club con dinero y nivel parecido o mayor que puja contra ti. */
function rivalClub(p,amt){
 const sel=T(p.team),big=new Set(interested(p.id));
 const C=S.teams.filter(t=>t.id!==S.user&&t.id!==p.team&&!t.parent&&(t.cash||0)>amt*1.25&&LG(t.lg).rep>=LG(sel.lg).rep-4&&t.rep>=p.ovr*10-12);
 if(!C.length)return null;C.sort((a,b)=>(big.has(b.id)-big.has(a.id))||(b.cash-a.cash));return C[0];
}
/** Antes de responder a tu oferta: ¿hay puja? Devuelve true si la respuesta ya está dada. */
function auction(b,p,n,club){
 if(p.team===null||p.team===S.user)return false;
 S.auc=S.auc||[];let A=S.auc.find(a=>a.id===b.id);const R=A&&T(A.team);
 if(A){
  if(b.amt<A.amt*1.02){n.counter=r2(A.amt*1.03);n.msg=`${club} tiene una oferta mejor de ${R.name}: ${money(A.amt)}. Si quieres a ${p.name}, supérala (piden ${money(n.counter)}).`;n.kind='no';
   news(`${club} rechaza tu oferta por ${p.name}: ${R.name} ofrece ${money(A.amt)}.`,'bad',{cat:'mer',subj:`Puja por ${p.name}`,act:[{l:'Subir la oferta',a:'neg',id:b.id}]});return true;}
  if(A.amt*1.08<=A.max&&rnd()<.55){A.amt=r2(Math.min(A.max,b.amt*(1.04+rnd()*.06)));A.until=S.day+2;n.counter=r2(A.amt*1.03);n.msg=`${R.name} sube su oferta por ${p.name} a ${money(A.amt)}. Supérala si lo quieres.`;n.kind='no';
   news(`¡Puja por ${p.name}! ${R.name} sube a ${money(A.amt)}. Tienes 2 días para mejorarla.`,'bad',{cat:'mer',subj:`Puja por ${p.name}`,act:[{l:'Subir la oferta',a:'neg',id:b.id}]});return true;}
  S.auc=S.auc.filter(a=>a!==A);n.counter=null;news(`${R.name} se retira de la puja por ${p.name}.`,'good',{cat:'mer',subj:`Puja por ${p.name}`});return false;
 }
 const hot=interested(p.id).length>0,u=unit(LG(T(p.team).lg).rep);
 if(rnd()>(hot?.4:p.value>=u*4?.18:.07))return false;
 const r=rivalClub(p,b.amt);if(!r)return false;
 const amt=r2(Math.max(b.amt*(1.05+rnd()*.12),p.value*.9)),max=r2(Math.min((r.cash||0)*.7,p.value*(1.5+rnd()*.5)));if(amt>max)return false;
 A={id:b.id,team:r.id,amt,max,until:S.day+2,wk:S.week};S.auc.push(A);n.counter=r2(amt*1.03);
 n.msg=`${club} ha recibido otra oferta por ${p.name}: ${r.name} pone ${money(amt)}. Si lo quieres, tendrás que superarla (piden ${money(n.counter)}).`;n.kind='no';
 news(`¡Puja por ${p.name}! ${r.name} ofrece ${money(amt)} a ${club}. Tienes 2 días para mejorar tu oferta.`,'bad',{cat:'mer',subj:`Puja por ${p.name}`,act:[{l:'Subir la oferta',a:'neg',id:b.id}]});
 return true;
}
/** Si no mejoras a tiempo, el rival se lleva al jugador. */
function aucExpire(all){
 if(!S.auc||!S.auc.length)return;
 S.auc=S.auc.filter(A=>{if(A.until>S.day&&S.week<=(A.wk??S.week)+1)return true;if((S.bids||[]).some(b=>b.id===A.id))return true;
  const p=PL(A.id),R=T(A.team);if(!p||!R||p.team===S.user||p.team===A.team)return false;if(!inWindow())return false;
  const from=p.team;payFee(from,R.id,A.amt);setTeam(p,R.id);assignNum(p);p.contract=Math.max(p.contract,3);
  const n=negState(A.id);n.closed=true;n.msg=`${p.name} ya es jugador de ${R.name}.`;n.kind='no';
  news(`${R.name} gana la puja: ficha a ${p.name} por ${money(A.amt)}.`,'bad',{cat:'mer',subj:`${p.name} ficha por ${R.name}`});return false;});
}
