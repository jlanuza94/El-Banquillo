/* El Banquillo · biginterest.ts — Los grandes vienen a por tus joyas: cuando un chaval tuyo explota, un club de más arriba
 * pregunta por él. Tú decides: venderlo caro, renovarlo (con cláusula alta) o prometerle minutos para que no se le vaya la cabeza. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,r2,rnd} from './core';
import {LG,S,T,lgName,squad,uLg} from './state';
import {inWindow} from './market';
import {news} from './world';

/** ¿Es una joya que llama la atención? Joven, que ha crecido contigo o que destaca mucho para su categoría. */
export function isHotGem(p){
 if(p.loan||p.age>23)return false;const top=squad(S.user).map(x=>x.ovr).sort((a,b)=>b-a).slice(0,11),avg=top.reduce((a,b)=>a+b,0)/Math.max(1,top.length);
 return (p.h0&&p.ovr-p.h0[0]>=6)||(p.ovr>=avg+4&&p.pot*10>=p.ovr+4);
}
/** Cada mes: como mucho un grande pregunta por una de tus joyas. */
export function bigInterestMonthly(force){
 if(S.user==null||(!force&&(S.week%4!==1||S.bigW===S.week)))return null;S.bigW=S.week;
 const my=LG(uLg()),L=squad(S.user).filter(p=>isHotGem(p)&&(!p.big||S.week-p.big.w>=8||p.big.s!==S.seasonN)).sort((a,b)=>b.ovr-a.ovr);
 if(!L.length||(!force&&rnd()>.65))return null;const p=L[0];
 const cands=S.teams.filter(t=>t.id!==S.user&&!t.parent&&LG(t.lg).lv<my.lv&&(LG(t.lg).c===my.c||LG(t.lg).lv===0)&&t.rep>=p.ovr-2);
 const t=cands.length?pick(cands.sort((a,b)=>LG(a.lg).lv-LG(b.lg).lv).slice(0,12)):null;if(!t)return null;
 p.big={team:t.id,w:S.week,s:S.seasonN};
 const head=!(p.gk===S.seasonN);if(head){p.hap=clamp((p.hap??70)-6,0,100);}
 const acts=[{l:'Renovar (con cláusula alta)',a:'renew',id:p.id},{l:'Prometerle minutos',a:'gem-keep',id:p.id},{l:'Ver ficha',a:'ficha',id:p.id}];
 if(inWindow()&&!S.offers[p.id]){const amount=r2(p.value*(1.4+rnd()*.6));S.offers[p.id]={team:t.id,amount,incoming:true,big:1};
  news(`¡${t.name} (${lgName(t.lg)}) va a por ${p.name}! Ofrece ${money(amount)}, bastante más de lo que vale. ${head?'Al chaval se le ha ido un poco la cabeza con el interés.':''} Puedes venderlo, renovarle con una cláusula alta o prometerle minutos para que se quede tranquilo.`,'good',{cat:'mer',from:t.name,subj:`💰 ${t.name} quiere a ${p.name}`,act:[{l:'Ver oferta',a:'offer-view',id:p.id},...acts]});}
 else news(`${t.name} (${lgName(t.lg)}) ha preguntado por ${p.name}: le siguen de cerca y pujarán cuando abra el mercado. ${head?'El jugador se ha enterado y está algo distraído.':''} Renuévalo con cláusula alta o prométele minutos para que no se le vaya la cabeza.`,'',{cat:'mer',from:t.name,subj:`👀 ${t.name} sigue a ${p.name}`,act:acts});
 return {p,t};
}
/** Prometerle minutos: se queda tranquilo, pero si no juega la mitad de los partidos se enfadará. */
export function gemKeep(id){const p=S.players[id];if(!p||p.team!==S.user)return '';p.gk=S.seasonN;p.gkPj=p.st?p.st.pj||0:0;p.gkW=S.week;p.hap=clamp((p.hap??70)+8,0,100);return `${p.name} se queda tranquilo: le has prometido minutos. Que juegue al menos la mitad de los partidos o se enfadará.`;}
/** Revisión de la promesa a las 8 jornadas. */
export function gemKeepCheck(){squad(S.user).forEach(p=>{if(p.gk!==S.seasonN||p.gkW==null||S.week-p.gkW<8)return;const pj=(p.st?p.st.pj||0:0)-p.gkPj,ok=pj>=4;p.gkW=null;
 if(ok){p.hap=clamp((p.hap??70)+5,0,100);news(`${p.name} está contento: cumpliste tu promesa de darle minutos (${pj} partidos).`,'good',{cat:'pla'});}
 else{p.hap=clamp((p.hap??70)-15,0,100);news(`${p.name} está muy molesto: le prometiste minutos y solo ha jugado ${pj} partido${pj===1?'':'s'}. Ahora escuchará ofertas.`,'bad',{cat:'pla',subj:`${p.name} se siente engañado`});}});}
