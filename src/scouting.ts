/* El Banquillo · scouting.ts — Conocimiento de jugadores: rangos de atributos, ojear jugadores e informes. */
// @ts-nocheck — usa el estado heredado S.
import {isAffiliate} from './clubplus';
import {inContacts} from './connected';
import {clamp,money,pick,r2,rnd,shuffle} from './core';
import {ATTRS,COUNTRIES,GRP,POS_NAME,SPN} from './data';
import {LG,PL,S,T,lgName,squad,uLg} from './state';
import {news} from './world';
import {REGIONS,regionOf} from './academy';
import {crew,judge} from './staff';

/** Cuánto conoces a un jugador, de 0 a 100. Con 80 o más ves sus atributos exactos. */
export function knowledge(p){
 if(!p)return 0;if(p.id[0]==='y'||p.team===S.user||(p.team!==null&&(isAffiliate(p.team)||T(p.team).parent===S.user))||(p.loan&&p.loan.from===S.user))return 100;
 let k;const mine=uLg();
 if(p.team===null)k=18;
 else{const L=LG(T(p.team).lg),U=LG(mine);k=L.id===mine?52:L.c===U.c?34:regionOf(L.c)===regionOf(U.c)?20:10;}
 k+=judge()*2+(S.short&&S.short.includes(p.id)?10:0)+(inContacts(p)?15:0)+((S.know&&S.know[p.id])||0);
 return clamp(Math.round(k),0,100);
}
export const EXACT=80;
/** ¿Lo has ojeado (o es tuyo, o lo has visto jugar contra ti)? Si no, no sabes su media ni su potencial: solo ves «?». */
export function scouted(p){if(!p)return false;if(p.id[0]==='y'||p.team===S.user||(p.loan&&p.loan.from===S.user))return true;if(p.team!==null&&(isAffiliate(p.team)||T(p.team).parent===S.user))return true;return ((S.know&&S.know[p.id])||0)>=20||inContacts(p);}
const span=k=>k>=EXACT?0:k>=50?1:2;
/** Número estable entre 0 y 1 para un jugador y una clave: el rango no cambia al repintar. */
function h01(id,key){let x=2166136261;const s=id+':'+key;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return ((x>>>0)%1000)/1000;}
function range(v,w,min,max,id,key){if(!w)return[v,v];const off=Math.floor(h01(id,key)*(w+1));let lo=v-off,hi=lo+w;if(lo<min){hi+=min-lo;lo=min;}if(hi>max){lo-=hi-max;hi=max;}return[Math.max(min,lo),Math.min(max,hi)];}
/** Lo que ves de un jugador: atributos y media como rangos [mín, máx], y el potencial (si lo puedes intuir). */
export function seen(p){
 const k=knowledge(p),w=span(k),at={};
 ATTRS.forEach(a=>at[a]=range(p.at[a],w,1,10,p.id,a));
 const ovr=range(p.ovr,w*5,10,100,p.id,'ovr');
 const pw=k>=90?.5:k>=EXACT?1:k>=60?1.5:k>=35?2.5:3.5;
 const pc=p.pot+(h01(p.id,'pot')-.5)*pw*(k>=EXACT?.6:1);
 const pot=p.age<=23?[clamp(Math.round((pc-pw/2)*2)/2,1,10),clamp(Math.round((pc+pw/2)*2)/2,1,10)]:null;
 return{k,exact:w===0,at,ovr,pot};
}
/** Media estimada (centro del rango), para ordenar y filtrar en el mercado sin desvelar la real. */
export const estOvr=p=>{const r=range(p.ovr,span(knowledge(p))*5,10,100,p.id,'ovr');return (r[0]+r[1])/2;};
export const estAt=(p,a)=>{const r=range(p.at[a],span(knowledge(p)),1,10,p.id,a);return (r[0]+r[1])/2;};
export const estPot=p=>{const r=seen(p).pot;return r?(r[0]+r[1])/2:0;};

/* ---------- Ojear un jugador concreto ---------- */
export const MAX_Q=6;
export function scoutWeeks(){const best=Math.max(0,...(S.scouts||[]).filter(sc=>sc.job==='sen').map(sc=>sc.jui||sc.q*2));return best>=8?1:best>=5?2:3;}
export function queueScout(pid){
 const p=PL(pid);if(!p)return 'Ese jugador ya no existe.';S.scoutQ=S.scoutQ||[];
 if(S.scoutQ.some(x=>x.pid===pid))return `${p.name} ya está en la lista de jugadores por ojear.`;
 if(S.scoutQ.length>=MAX_Q)return `Ya hay ${MAX_Q} jugadores pendientes de ojear.`;
 const wk=scoutWeeks();S.scoutQ.push({pid,until:S.week+wk});
 return '';
}
/** Nota del informe: compara con tus titulares en su línea. */
export function grade(p){
 const g=GRP[p.sp]||p.pos,mine=squad(S.user).filter(x=>(GRP[x.sp]||x.pos)===g&&!x.loan).map(x=>x.ovr).sort((a,b)=>b-a);
 const n=g==='POR'?1:g==='DEL'?2:4,lvl=mine.length?mine.slice(0,n).reduce((a,b)=>a+b,0)/Math.min(n,mine.length):0,d=p.ovr-lvl;
 const young=p.age<=21&&p.pot*10-lvl>=6;
 if(d>=5)return{g:'A',txt:'Mejoraría mucho a tu equipo: sería de los mejores en su línea.'};
 if(d>=1)return{g:'B',txt:'Sería titular en tu equipo.'};
 if(young)return{g:'B',txt:'Ahora sería suplente, pero tiene potencial para ser titular pronto.'};
 if(d>=-3)return{g:'C',txt:'Sería un jugador de rotación.'};
 return{g:'D',txt:'No mejora lo que ya tienes.'};
}
export function scoutReport(p,by){
 const gr=grade(p),traits=p.tr&&p.tr.length?' Destaca por: '+p.tr.length+' rasgo'+(p.tr.length>1?'s':'')+' especial'+(p.tr.length>1?'es':'')+'.':'';
 const pot=p.age<=23?` Potencial estimado: ${seen(p).pot.map(x=>x.toFixed(1)).join('–')}.`:'';
 const price=p.team===null?'Es agente libre.':`Su club pediría unos ${money(p.value*1.2)}.`;
 news(`Informe de ${by} sobre ${p.name} (${SPN[p.sp].toLowerCase()}, ${p.age} años${p.team!==null?', '+T(p.team).name:''}). Nota ${gr.g}: ${gr.txt} Media actual ${(p.ovr/10).toFixed(1)}.${pot} ${price}${traits}`,gr.g==='A'||gr.g==='B'?'good':'',
  {cat:'oje',from:by,subj:`Informe: ${p.name} · nota ${gr.g}`,act:[{l:'Ver ficha',a:'ficha',id:p.id},...(p.team!==S.user?[{l:'Hacer oferta',a:'neg',id:p.id},{l:'Seguir',a:'fav',id:p.id}]:[])]});
}
/** Cada jornada: termina los informes pendientes y los ojeadores de primer equipo conocen a jugadores de su región. */
export function scoutingWeekly(){
 S.know=S.know||{};S.scoutQ=S.scoutQ||[];
 const sen=(S.scouts||[]).filter(sc=>sc.job==='sen'),dd=crew('dd')[0];
 const by=sen.length?pick(sen).name:dd?dd.name:'Tu segundo entrenador';
 S.scoutQ=S.scoutQ.filter(x=>{const p=PL(x.pid);if(!p)return false;if(S.week<x.until)return true;S.know[p.id]=100;scoutReport(p,by);return false;});
 S.short.forEach(id=>{if(PL(id))S.know[id]=Math.min(100,(S.know[id]||0)+2);});
 const all=Object.values(S.players);
 chollosMonthly();
 sen.forEach(sc=>{
  const R=REGIONS[sc.reg],pool=all.filter(p=>p.team!==null&&p.team!==S.user&&R.c.includes(LG(T(p.team).lg).c));
  shuffle(pool).slice(0,10+2*(sc.jui||5)).forEach(p=>S.know[p.id]=Math.min(100,(S.know[p.id]||0)+8+(sc.jui||5)*2));
  // de vez en cuando, una recomendación para tu equipo
  if(rnd()<.18+.02*(sc.jui||5)){const budget=Math.max(S.budget,0)*1.3,cands=pool.filter(p=>knowledge(p)>=60&&p.value*1.2<=budget&&p.age<=30&&grade(p).g<='B'&&!S.short.includes(p.id));
   if(cands.length){const p=cands.sort((a,b)=>b.ovr/Math.sqrt(b.value+.05)-a.ovr/Math.sqrt(a.value+.05))[0];S.know[p.id]=100;scoutReport(p,sc.name);}}
 });
}
/* ---------- El ojeador de chollos: cada mes, 2-3 jóvenes desconocidos y baratos con mucho margen ---------- */
/** Nivel de referencia de tu equipo (media de los 11 mejores). */
const myLvl=()=>{const o=squad(S.user).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,11);return o.reduce((a,b)=>a+b,0)/Math.max(1,o.length);};
export function chollosMonthly(force){
 if(S.user==null||(!force&&(S.week%4!==2||S.cholW===S.week)))return [];S.cholW=S.week;S.know=S.know||{};
 const lvl=myLvl(),budget=Math.max(S.budget*.6,.03),seenB=new Set(S.cholSeen||[]),sen=(S.scouts||[]).filter(sc=>sc.job!=='sen'),by=sen.length?pick(sen).name:crew('dd')[0]?crew('dd')[0].name:'Tu ojeador';
 const C=Object.values(S.players).filter(p=>p.team!==null&&p.team!==S.user&&!p.loan&&p.age<=21&&!seenB.has(p.id)&&p.pot*10>=Math.max(lvl+8,p.ovr+12)&&p.value*1.2<=budget&&!(S.short||[]).includes(p.id))
  .map(p=>[p,p.pot*10-p.ovr+(p.pot*10-lvl)*.6-p.value*20+rnd()*6]).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
 if(!C.length)return [];
 C.forEach(p=>{S.know[p.id]=Math.max(S.know[p.id]||0,62);seenB.add(p.id);});
 S.cholSeen=[...seenB].slice(-120);S.chollos=C.map(p=>({id:p.id,w:S.week}));
 const line=p=>{const r=seen(p).pot;return `${p.name} (${SPN[p.sp].toLowerCase()}, ${p.age} años, ${T(p.team).name} · ${lgName(T(p.team).lg)}): ahora ${(p.ovr/10).toFixed(1)}, puede llegar a ${r?r[0].toFixed(1)+'–'+r[1].toFixed(1):'?'}. Costaría unos ${money(p.value*1.2)}.`;};
 news(`Chollos del mes de ${by}: ${C.length} chaval${C.length>1?'es':''} que nadie mira y que pueden crecer mucho. ${C.map(line).join(' ')}`,'good',{cat:'oje',from:by,subj:`💎 Chollos del mes (${C.length})`,act:[...C.map(p=>({l:p.name.split(' ').slice(-1)[0],a:'ficha',id:p.id})),{l:'Ver en el mercado',a:'view',v:'mrec'}]});
 return C;
}
/** Al empezar temporada el conocimiento se queda viejo: baja un poco y se borra el de jugadores que ya no existen. */
export function scoutingSeasonEnd(){const K=S.know||{},o={};Object.keys(K).forEach(id=>{if(S.players[id]){const v=Math.round(K[id]*.7);if(v>=5)o[id]=v;}});S.know=o;S.scoutQ=(S.scoutQ||[]).filter(x=>S.players[x.pid]);}
/** Después de jugar contra un rival conoces mejor a sus jugadores. */
export function learnFromMatch(ids){S.know=S.know||{};ids.forEach(id=>{S.know[id]=Math.min(100,(S.know[id]||0)+12);});}
