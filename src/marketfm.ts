/* El Banquillo · marketfm.ts — Mercado al estilo FM Mobile: los clubes responden en uno o dos días,
 * tus jugadores tienen estado (transferible, cedible, intocable) y todas las negociaciones en un sitio. */
// @ts-nocheck — usa el estado heredado S.
import {money,rnd} from './core';
import {PL,S,T} from './state';
import {news} from './world';
import {inWindow,makeBid,negState} from './market';
import {firstPay} from './market2';

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
 if(!S.bids||!S.bids.length)return;const keep=[];
 S.bids.forEach(b=>{if(!all&&b.due>S.day){keep.push(b);return;}const p=PL(b.id),n=negState(b.id);n.wait=null;if(!p||p.team===S.user)return;const club=p.team!==null?T(p.team).name:'Su agente';
  makeBid(b.id,b.amt,b.opt);const ok=n.kind==='ok';
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
