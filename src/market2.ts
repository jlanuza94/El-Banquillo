/* El Banquillo · market2.ts — Mercado avanzado: plazos, porcentaje de futura venta, intercambios, rumores y gangas de cierre. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,r2,r3,rnd} from './core';
import {LG,PL,S,T,lgName,squad,uLg} from './state';
import {news} from './world';
import {askPrice,inWindow,isDeadline,refuses} from './market';
import {knowledge} from './scouting';

export const SON_PCT=.15;
/** Lo que vale para el club vendedor un jugador tuyo incluido en la operación. */
export function swapValue(p,team){if(!p)return 0;const t=T(team);return r2(p.value*(p.ovr>=t.rep-8?.85:.5));}
/**
 * Valor real de una oferta para el club vendedor:
 * los plazos valen algo menos (cobran más tarde), el % de futura venta suma y el jugador incluido también.
 */
export function bidWorth(amt,opt,p){return amt*(1-.05*((opt.inst||1)-1))+(opt.son?amt*.08:0)+(opt.swap&&p.team!==null?swapValue(PL(opt.swap),p.team):0);}
export const firstPay=(amt,opt)=>r3(amt/(opt&&opt.inst||1));

/** Al cerrar un fichaje con condiciones especiales. Devuelve lo que se paga ahora. */
export function applyDeal(p,price,from,deal){
 deal=deal||{};const inst=deal.inst||1,now=r3(price/inst);
 if(inst>1&&from!==null){S.debts=S.debts||[];S.debts.push({to:from,amt:r3(price/inst),left:inst-1,name:p.name});}
 if(deal.son&&from!==null)p.son={team:from,pct:SON_PCT};else p.son=null;
 if(deal.swap&&from!==null){const q=PL(deal.swap);if(q&&q.team===S.user){q.team=from;q.son=null;S.chem=clamp(S.chem-1,20,100);
  const t=T(S.user),i=t.lineup.indexOf(q.id);if(i>=0)t.lineup[i]=null;news(`${q.name} se marcha a ${T(from).name} como parte del fichaje de ${p.name}.`,'',{cat:'mer'});}}
 return now;
}
/** Plazos que vencen al empezar cada temporada. */
export function payDebts(){
 const D=S.debts||[];if(!D.length)return;let tot=0;
 D.forEach(d=>{S.budget=r3(S.budget-d.amt);tot+=d.amt;d.left--;});
 S.debts=D.filter(d=>d.left>0);
 news(`Pagas ${money(tot)} en plazos de fichajes anteriores.${S.debts.length?' Quedan pagos pendientes.':''}`,'bad',{cat:'mer',subj:'Plazos de traspasos pagados'});
}
export const debtTotal=()=>(S.debts||[]).reduce((a,d)=>a+d.amt*d.left,0);
/** Cuando vendes a un jugador con % de futura venta, el club de origen cobra su parte. */
export function sellOnOut(p,fee){if(!p.son||p.son.team===S.user||!fee)return 0;const c=r3(fee*p.son.pct);S.budget=r3(S.budget-c);news(`${T(p.son.team).name} cobra su ${Math.round(p.son.pct*100)}% de la venta de ${p.name}: ${money(c)}.`,'',{cat:'mer'});p.son=null;return c;}
/** Cuando otro club vende a un jugador que vendiste tú con % de futura venta, cobras tu parte. */
export function sellOnIn(p,fee){if(!p.son||p.son.team!==S.user||!fee)return;const c=r3(fee*p.son.pct);S.budget=r3(S.budget+c);news(`¡Cobras ${money(c)}! ${p.name} ha sido traspasado por ${money(fee)} y tenías un ${Math.round(p.son.pct*100)}% de futura venta.`,'good',{cat:'mer',subj:`Futura venta de ${p.name}: +${money(c)}`});p.son=null;}

/* ---------- Rumores e interés ---------- */
/** Clubes interesados en tus jugadores y competencia por los que sigues. */
export function rumoursWeekly(){
 S.interest=S.interest||{};S.hot=S.hot||{};
 Object.keys(S.hot).forEach(id=>{if(S.hot[id]<S.week||!PL(id))delete S.hot[id];});
 Object.keys(S.interest).forEach(id=>{const p=PL(id);if(!p||p.team!==S.user)delete S.interest[id];});
 const my=LG(uLg()).rep;
 if(rnd()<.35){const mine=squad(S.user).filter(p=>!p.loan&&p.ovr>=my-6).sort((a,b)=>b.value-a.value).slice(0,8);
  if(mine.length){const p=pick(mine),c=S.teams.filter(t=>t.id!==S.user&&LG(t.lg).rep>=my-3&&t.rep>=p.ovr-5&&t.rep<=p.ovr+12);
   if(c.length){const t=pick(c),L=S.interest[p.id]=(S.interest[p.id]||[]).filter(x=>x!==t.id);L.unshift(t.id);S.interest[p.id]=L.slice(0,3);
    news(`Rumores: ${t.name} (${lgName(t.lg)}) sigue de cerca a ${p.name}. Podría llegar una oferta.`,'',{cat:'not',from:'Prensa deportiva',subj:`${t.name} se fija en ${p.name}`,act:[{l:'Ver ficha',a:'ficha',id:p.id}]});}}}
 (S.short||[]).forEach(id=>{const p=PL(id);if(!p||p.team===null||p.team===S.user||S.hot[id])return;
  if(rnd()<.06){const c=S.teams.filter(t=>t.id!==S.user&&t.id!==p.team&&t.rep>=p.ovr-6);if(!c.length)return;const t=pick(c);S.hot[id]=S.week+4;
   news(`Competencia: ${t.name} también quiere a ${p.name}, al que sigues. Su club pide ahora más dinero.`,'bad',{cat:'mer',subj:`Más interesados en ${p.name}`,act:[{l:'Hacer oferta',a:'neg',id:p.id}]});}});
}
/** Equipos interesados en un jugador tuyo (para las ofertas y la ficha). */
export const interested=pid=>(S.interest&&S.interest[pid]||[]).filter(id=>T(id));
/** Recargo si otro club también lo quiere. */
export const hotMult=p=>S.hot&&S.hot[p.id]>=S.week?1.12:1;

/* ---------- Día de cierre ---------- */
/** El último día de mercado, algunos clubes aceptan vender barato (solo jugadores que conoces algo). */
export function deadlineDeals(){
 S.deals={};if(!isDeadline())return;
 const my=LG(uLg()).rep,budget=Math.max(S.budget,0);
 const cands=Object.values(S.players).filter(p=>p.team!==null&&p.team!==S.user&&!p.loan&&!refuses(p)&&p.age<=31&&p.ovr>=my-4&&knowledge(p)>=40&&askPrice(p)*.6<=budget*1.1&&(squad(p.team).length>=24||p.contract<=1));
 const pickN=[];for(let i=0;i<40&&pickN.length<3&&cands.length;i++){const p=cands.splice(Math.floor(rnd()*cands.length),1)[0];pickN.push(p);}
 pickN.forEach(p=>{const price=r2(Math.max(.005,askPrice(p)*(.55+rnd()*.15)));S.deals[p.id]=price;
  news(`Día de cierre: ${T(p.team).name} quiere sacarse de encima a ${p.name} y lo deja ir por ${money(price)} si cerráis hoy.`,'good',{cat:'mer',from:T(p.team).name,subj:`Ganga de última hora: ${p.name} por ${money(price)}`,act:[{l:'Negociar',a:'neg',id:p.id},{l:'Ver ficha',a:'ficha',id:p.id}]});});
}
export const dealPrice=id=>S.deals&&S.deals[id]!=null&&inWindow()&&isDeadline()?S.deals[id]:null;
