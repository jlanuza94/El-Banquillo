/* El Banquillo · connected.ts — Sistemas conectados: agentes, contactos del director deportivo, cesiones con objetivos y vestuario. */
// @ts-nocheck — usa el estado heredado S.
import {clamp,money,pick,r2,r3,rnd} from './core';
import {COUNTRIES} from './data';
import {LG,PL,S,T,squad,uLg} from './state';
import {news} from './world';
import {crew} from './staff';
import {langOf,leaders} from './tactics';

const h01=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return ((x>>>0)%10000)/10000;};

/* ---------- Agentes ---------- */
/** Tipos de agente: wage (sueldo que piden), fee (comisión), acc (facilidad para cerrar el acuerdo). */
export const AGENTS={
 raz:{n:'Razonable',d:'Negocia con sentido común.',wage:1,fee:1,acc:0},
 dur:{n:'Duro',d:'Pide más sueldo y no regala nada.',wage:1.12,fee:1.15,acc:-.08},
 cod:{n:'Codicioso',d:'Quiere una gran comisión y una buena prima de fichaje.',wage:1.04,fee:1.6,acc:-.03,bonus:true},
 ami:{n:'Amigo del club',d:'Le gusta tu club y facilita los acuerdos.',wage:.93,fee:.8,acc:.08},
};
const AG_NAMES=['Pérez Sports','Global Talent','Rui Mendes','Elite Management','Martin & Asociados','Stellar Group','Nova Agency','Lucas Ferreira','Prime Football','Gestifute Sur','Kick Agency','Bruno Costa','Delta Sports','Javier Ortega','Maxi Gestión','Atlas Players','Frank Müller','Sergio Llamas','First Touch','Goal Partners'];
/** El agente de un jugador (fijo para cada jugador). */
export function agentOf(p){
 if(!p.ag){const r=h01(p.id+'ag');p.ag=r<.45?'raz':r<.7?'dur':r<.9?'cod':'ami';}
 return AGENTS[p.ag];
}
export const agentName=p=>AG_NAMES[Math.floor(h01(p.id+'an')*AG_NAMES.length)];

/* ---------- Contactos del director deportivo ---------- */
/** Países donde el director deportivo tiene contactos. */
export function contacts(){const d=crew('dd')[0];if(!d)return[];if(!d.contacts)d.contacts=genContacts(d);return d.contacts;}
export function genContacts(d){const n=1+((d.at.neg??5)>=7?1:0)+((d.at.jui??5)>=7?1:0),c=[d.nat];while(c.length<n){const x=Math.floor(rnd()*COUNTRIES.length);if(!c.includes(x))c.push(x);}return c;}
export const inContacts=p=>p&&p.team!==null&&contacts().includes(LG(T(p.team).lg).c);
/** De vez en cuando, tu director deportivo te avisa de una oportunidad en los países donde tiene contactos. */
export function contactsWeekly(){
 const C=contacts(),d=crew('dd')[0];if(!C.length||rnd()>.1)return;
 const my=LG(uLg()).rep,budget=Math.max(S.budget,0);
 const cands=Object.values(S.players).filter(p=>p.team!==null&&p.team!==S.user&&!p.loan&&C.includes(LG(T(p.team).lg).c)&&p.ovr>=my-2&&p.age<=29&&p.value*1.1<=budget*1.2&&!(S.short||[]).includes(p.id));
 if(!cands.length)return;const p=cands.sort((a,b)=>b.ovr/Math.sqrt(b.value+.05)-a.ovr/Math.sqrt(a.value+.05))[Math.floor(rnd()*Math.min(5,cands.length))];
 S.know=S.know||{};S.know[p.id]=100;
 news(`${d.name}: «Tengo buena relación con ${T(p.team).name}. ${p.name} (${p.age} años) podría salir por un precio razonable y encajaría con nosotros.»`,'good',{cat:'mer',from:d.name,subj:`Oportunidad: ${p.name}`,act:[{l:'Ver ficha',a:'ficha',id:p.id},{l:'Negociar',a:'neg',id:p.id}]});
}

/* ---------- Cesiones con objetivos ---------- */
export const LOAN_OBJ={'':['Sin objetivo',0],ro:['Rotación (30% de los partidos)',.3],ti:['Titular (60% de los partidos)',.6]};
export const loanShare=p=>p.lmt?p.lpj/p.lmt:0;
/** Tras cada partido de un club con cedidos tuyos: cuenta los partidos que juegan. */
export function trackLoans(m){
 ['h','a'].forEach(s=>{const tid=m[s];if(tid===S.user)return;
  squad(tid).forEach(p=>{if(!p.loan||p.loan.from!==S.user)return;p.lmt=(p.lmt||0)+1;if(m.played[p.id])p.lpj=(p.lpj||0)+1;});});
}
/** El club que tiene a tu cedido con objetivo le hace hueco si va por debajo de lo pactado. */
export function enforceLoanMinutes(m,s,eff,slots){
 const tid=m[s];if(tid===S.user)return;
 squad(tid).forEach(p=>{if(!p.loan||p.loan.from!==S.user||!p.loan.obj||m.lu[s].includes(p.id)||p.inj||p.susp)return;
  if(loanShare(p)>=p.loan.obj)return;
  let worst=-1,wv=1e9;m.lu[s].forEach((id,i)=>{if(!id||i===0&&p.pos!=='POR')return;const q=PL(id),v=eff(q,slots[i]);if(slots[i]&&(q.pos===p.pos)&&v<wv){wv=v;worst=i;}});
  if(worst>=0){m.lu[s][worst]=p.id;m.played[p.id]=1;m.en[p.id]=p.energy;}});
}
/** Al terminar la cesión: ¿se cumplió el objetivo? */
export function loanReview(p){
 if(!p.loan||p.loan.from!==S.user||!p.loan.obj)return;
 const sh=loanShare(p),ok=sh>=p.loan.obj-.05,t=T(p.team);
 if(ok){p.loanOk=1;news(`${p.name} vuelve de su cesión en ${t.name} tras jugar el ${Math.round(sh*100)}% de los partidos, como se pactó. Vuelve más hecho.`,'good',{cat:'pla',subj:`Cesión cumplida: ${p.name}`});}
 else{const c=r2(Math.max(.005,p.value*.06));S.budget=r3(S.budget+c);news(`${t.name} no cumplió lo pactado con ${p.name} (jugó el ${Math.round(sh*100)}% de los partidos). Te pagan ${money(c)} de compensación.`,'bad',{cat:'pla',subj:`Cesión incumplida: ${p.name}`});}
}

/* ---------- Vestuario ---------- */
/** Efecto del ambiente del vestuario en el campo: de -4% (vestuario roto) a +2% (vestuario unido). */
export function vestMult(){
 const sq=squad(S.user).filter(p=>!p.loan);if(!sq.length)return 1;
 const avg=sq.reduce((a,p)=>a+(p.hap??70),0)/sq.length,L=leaders(3),badLead=L.filter(([p])=>(p.hap??70)<40).length,req=sq.filter(p=>p.req).length;
 return clamp(1+(avg-62)/900-badLead*.008-req*.003,.96,1.02);
}
export function vestWeekly(){
 const groups={};squad(S.user).forEach(p=>{const l=langOf(p);(groups[l]=groups[l]||[]).push(p);});
 Object.entries(groups).forEach(([l,ps])=>{if(ps.length<3)return;const avg=ps.reduce((a,p)=>a+(p.hap??70),0)/ps.length;
  if(avg<38){S.chem=clamp(S.chem-1,20,100);if(!S.cliqueWk||S.week-S.cliqueWk>=6){S.cliqueWk=S.week;news(`Se ha formado un grupo descontento en el vestuario (${ps.map(p=>p.name.split(' ').slice(-1)[0]).join(', ')}). La química baja y se nota en el campo.`,'bad',{cat:'pla',subj:'Grupo descontento en el vestuario',act:[{l:'Ver vestuario',a:'pl-open',v:'vest'}]});}}});
}
